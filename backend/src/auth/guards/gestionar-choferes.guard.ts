
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import type { Request } from 'express';

import {
  RolUsuario,
} from '../../users/entities/usuario.entity';

/* =========================================
   INTERFAZ DEL USUARIO AUTENTICADO
========================================= */

interface UsuarioAutenticado {
  id: string;
  rol: RolUsuario;
}

type SolicitudAutenticada = Request & {
  user?: UsuarioAutenticado;
};

/* =========================================
   GUARD PARA GESTIONAR CHOFERES
========================================= */

@Injectable()
export class GestionarChoferesGuard extends AuthGuard('jwt') {
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    /* =====================================
       1. VALIDAR TOKEN JWT
    ===================================== */

    const autenticado =
      await super.canActivate(context);

    if (!autenticado) {
      throw new UnauthorizedException(
        'Debes iniciar sesión para gestionar choferes.',
      );
    }

    /* =====================================
       2. OBTENER USUARIO AUTENTICADO
    ===================================== */

    const solicitud = context
      .switchToHttp()
      .getRequest<SolicitudAutenticada>();

    const usuario = solicitud.user;

    if (
      !usuario ||
      !usuario.id ||
      !usuario.rol
    ) {
      throw new UnauthorizedException(
        'No se pudo verificar tu sesión.',
      );
    }

    /* =====================================
       3. VALIDAR ROLES AUTORIZADOS
    ===================================== */

    const tienePermiso =
      usuario.rol === RolUsuario.ADMINISTRADOR ||
      usuario.rol === RolUsuario.SECRETARIA;

    if (!tienePermiso) {
      throw new ForbiddenException(
        'Solo el administrador o la secretaria pueden gestionar el acceso de los choferes.',
      );
    }

    /* =====================================
       4. AUTORIZAR OPERACIÓN
    ===================================== */

    return true;
  }
}
