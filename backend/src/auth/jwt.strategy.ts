
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';

import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { isUUID } from 'class-validator';

import { UsersService } from '../users/users.service';

import {
  RolUsuario,
} from '../users/entities/usuario.entity';

/* =========================================
   INTERFAZ DEL PAYLOAD JWT
========================================= */

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

/* =========================================
   INTERFAZ DEL USUARIO AUTENTICADO
========================================= */

export interface UsuarioJwt {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  estado: boolean;
  puedeEscanearTickets: boolean;
}

/* =========================================
   ESTRATEGIA DE AUTENTICACIÓN JWT
========================================= */

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    /* =====================================
       1. OBTENER CLAVE JWT
    ===================================== */

    const secret =
      configService.get<string>('JWT_SECRET');

    if (!secret?.trim()) {
      throw new Error(
        'La variable JWT_SECRET no está configurada.',
      );
    }

    /* =====================================
       2. CONFIGURAR PASSPORT
    ===================================== */

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: secret,

      algorithms: ['HS256'],
    });
  }

  /* =====================================
     3. VALIDAR SESIÓN
  ===================================== */

  async validate(
    payload: JwtPayload,
  ): Promise<UsuarioJwt> {
    /* Verificar identificador */

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !isUUID(payload.sub)
    ) {
      throw new UnauthorizedException(
        'La sesión no es válida. Inicia sesión nuevamente.',
      );
    }

    /* =====================================
       4. CONSULTAR USUARIO EN POSTGRESQL
    ===================================== */

    const usuario =
      await this.usersService.buscarPorId(
        payload.sub,
      );

    if (!usuario) {
      throw new UnauthorizedException(
        'La cuenta del usuario no existe.',
      );
    }

    /* =====================================
       5. VERIFICAR CUENTA ACTIVA
    ===================================== */

    if (usuario.estado !== true) {
      throw new UnauthorizedException(
        'La cuenta está desactivada. Contacta al administrador.',
      );
    }

    /* =====================================
       6. VERIFICAR ROL
    ===================================== */

    const rolesValidos: RolUsuario[] = [
      RolUsuario.ADMINISTRADOR,
      RolUsuario.SECRETARIA,
      RolUsuario.CHOFER,
      RolUsuario.PASAJERO,
    ];

    if (!rolesValidos.includes(usuario.rol)) {
      throw new UnauthorizedException(
        'El usuario no tiene un rol válido.',
      );
    }

    /* =====================================
       7. CONSULTAR PERMISO DE ESCANEO
    ===================================== */

    const puedeEscanearTickets =
      usuario.rol === RolUsuario.CHOFER &&
      usuario.puedeEscanearTickets === true;

    /* =====================================
       8. DEVOLVER USUARIO AUTENTICADO
    ===================================== */

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
      puedeEscanearTickets,
    };
  }
}
