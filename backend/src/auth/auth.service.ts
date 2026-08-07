import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  createHash,
  randomBytes,
} from 'crypto';

import * as bcrypt from 'bcrypt';

import {
  AuditoriaService,
} from '../auditoria/auditoria.service';

import {
  ResultadoAuditoria,
  TipoAccionAuditoria,
} from '../auditoria/entities/auditoria.entity';

import {
  RolUsuario,
  Usuario,
} from '../users/entities/usuario.entity';

import {
  UsersService,
} from '../users/users.service';

import {
  CorreoService,
} from './correo.service';

import {
  LoginDto,
} from './dto/login.dto';

import {
  RegisterDto,
} from './dto/register.dto';

import {
  RestablecerPasswordDto,
} from './dto/restablecer-password.dto';

import {
  SolicitarRecuperacionDto,
} from './dto/solicitar-recuperacion.dto';

@Injectable()
export class AuthService {
  private readonly minutosExpiracionRecuperacion =
    15;

  constructor(
    private readonly usersService:
      UsersService,

    private readonly jwtService:
      JwtService,

    private readonly auditoriaService:
      AuditoriaService,

    private readonly correoService:
      CorreoService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ) {
    if (!registerDto.password) {
      throw new BadRequestException(
        'La contraseña es obligatoria',
      );
    }

    try {
      const passwordHash =
        await bcrypt.hash(
          registerDto.password,
          10,
        );

      const usuario =
        await this.usersService.crearUsuario({
          ...registerDto,

          password:
            passwordHash,

          rol:
            RolUsuario.PASAJERO,
        });

      await this.registrarAuditoriaSegura({
        usuarioId:
          usuario.id,

        usuarioNombre:
          this.obtenerNombreCompleto(
            usuario,
          ),

        usuarioEmail:
          usuario.email,

        usuarioRol:
          usuario.rol,

        accion:
          TipoAccionAuditoria.CREAR,

        modulo:
          'AUTENTICACION',

        descripcion:
          'Registro exitoso de un nuevo pasajero.',

        entidad:
          'Usuario',

        entidadId:
          usuario.id,

        resultado:
          ResultadoAuditoria.EXITOSO,

        datosNuevos: {
          id:
            usuario.id,

          nombre:
            usuario.nombre,

          apellido:
            usuario.apellido,

          email:
            usuario.email,

          rol:
            usuario.rol,
        },
      });

      return this.generarToken(
        usuario,
      );
    } catch (error: unknown) {
      await this.registrarAuditoriaSegura({
        usuarioEmail:
          registerDto.email ??
          null,

        accion:
          TipoAccionAuditoria.CREAR,

        modulo:
          'AUTENTICACION',

        descripcion:
          'Falló el registro de un nuevo pasajero.',

        entidad:
          'Usuario',

        resultado:
          ResultadoAuditoria.FALLIDO,

        informacionAdicional: {
          email:
            registerDto.email ??
            null,
        },

        mensajeError:
          this.obtenerMensajeError(
            error,
          ),
      });

      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
  ) {
    if (!loginDto.email) {
      throw new BadRequestException(
        'El correo es obligatorio',
      );
    }

    if (!loginDto.password) {
      throw new BadRequestException(
        'La contraseña es obligatoria',
      );
    }

    const emailNormalizado =
      loginDto.email
        .trim()
        .toLowerCase();

    const usuario =
      await this.usersService.buscarPorEmailConPassword(
        emailNormalizado,
      );

    if (
      !usuario ||
      !usuario.password
    ) {
      await this.registrarLoginFallido(
        emailNormalizado,
        'El usuario no existe o no tiene contraseña registrada.',
      );

      throw new UnauthorizedException(
        'Correo o contraseña incorrectos',
      );
    }

    const passwordValida =
      await bcrypt.compare(
        String(
          loginDto.password,
        ),

        String(
          usuario.password,
        ),
      );

    if (!passwordValida) {
      await this.registrarAuditoriaSegura({
        usuarioId:
          usuario.id,

        usuarioNombre:
          this.obtenerNombreCompleto(
            usuario,
          ),

        usuarioEmail:
          usuario.email,

        usuarioRol:
          usuario.rol,

        accion:
          TipoAccionAuditoria.INICIO_SESION,

        modulo:
          'AUTENTICACION',

        descripcion:
          'Intento de inicio de sesión con contraseña incorrecta.',

        entidad:
          'Usuario',

        entidadId:
          usuario.id,

        resultado:
          ResultadoAuditoria.FALLIDO,

        mensajeError:
          'Contraseña incorrecta.',
      });

      throw new UnauthorizedException(
        'Correo o contraseña incorrectos',
      );
    }

    await this.registrarAuditoriaSegura({
      usuarioId:
        usuario.id,

      usuarioNombre:
        this.obtenerNombreCompleto(
          usuario,
        ),

      usuarioEmail:
        usuario.email,

      usuarioRol:
        usuario.rol,

      accion:
        TipoAccionAuditoria.INICIO_SESION,

      modulo:
        'AUTENTICACION',

      descripcion:
        'Inicio de sesión exitoso.',

      entidad:
        'Usuario',

      entidadId:
        usuario.id,

      resultado:
        ResultadoAuditoria.EXITOSO,

      informacionAdicional: {
        rol:
          usuario.rol,
      },
    });

    return this.generarToken(
      usuario,
    );
  }

  async solicitarRecuperacionPassword(
    dto: SolicitarRecuperacionDto,
  ): Promise<{
    mensaje: string;
  }> {
    const respuestaSegura = {
      mensaje:
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    };

    const emailNormalizado =
      dto.email
        .trim()
        .toLowerCase();

    const usuario =
      await this.usersService.buscarPorEmail(
        emailNormalizado,
      );

    if (
      !usuario ||
      !usuario.estado
    ) {
      return respuestaSegura;
    }

    const tokenPlano =
      randomBytes(
        32,
      ).toString(
        'hex',
      );

    const tokenHash =
      this.generarHashToken(
        tokenPlano,
      );

    const fechaExpiracion =
      new Date(
        Date.now() +
          this.minutosExpiracionRecuperacion *
            60 *
            1000,
      );

    await this.usersService.guardarTokenRecuperacion(
      usuario.id,
      tokenHash,
      fechaExpiracion,
    );

    try {
      await this.correoService.enviarRecuperacionPassword({
        destinatario:
          usuario.email,

        nombreUsuario:
          this.obtenerNombreCompleto(
            usuario,
          ) ||
          usuario.nombre ||
          'Usuario',

        token:
          tokenPlano,
      });
    } catch (error: unknown) {
      await this.usersService.limpiarTokenRecuperacion(
        usuario.id,
      );

      throw error;
    }

    return respuestaSegura;
  }

  async restablecerPassword(
    dto: RestablecerPasswordDto,
  ): Promise<{
    mensaje: string;
  }> {
    const tokenPlano =
      dto.token.trim();

    const nuevaPassword =
      dto.nuevaPassword;

    const confirmarPassword =
      dto.confirmarPassword;

    if (!tokenPlano) {
      throw new BadRequestException(
        'El token de recuperación es obligatorio.',
      );
    }

    if (
      nuevaPassword !==
      confirmarPassword
    ) {
      throw new BadRequestException(
        'Las contraseñas no coinciden.',
      );
    }

    if (
      nuevaPassword.length < 8
    ) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 8 caracteres.',
      );
    }

    const tokenHash =
      this.generarHashToken(
        tokenPlano,
      );

    const usuario =
      await this.usersService.buscarPorTokenRecuperacion(
        tokenHash,
      );

    if (!usuario) {
      throw new BadRequestException(
        'El enlace de recuperación no es válido o ya expiró.',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        nuevaPassword,
        10,
      );

    await this.usersService.actualizarPasswordYLimpiarToken(
      usuario.id,
      passwordHash,
    );

    return {
      mensaje:
        'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
    };
  }

  private generarToken(
    usuario: Usuario,
  ) {
    const payload = {
      sub:
        usuario.id,

      email:
        usuario.email,

      rol:
        usuario.rol,
    };

    const token =
      this.jwtService.sign(
        payload,
      );

    return {
      mensaje:
        'Autenticación exitosa',

      access_token:
        token,

      usuario: {
        id:
          usuario.id,

        nombre:
          usuario.nombre,

        apellido:
          usuario.apellido,

        email:
          usuario.email,

        rol:
          usuario.rol,
      },
    };
  }

  private generarHashToken(
    token: string,
  ): string {
    return createHash(
      'sha256',
    )
      .update(
        token,
      )
      .digest(
        'hex',
      );
  }

  private async registrarLoginFallido(
    email: string,
    mensajeError: string,
  ): Promise<void> {
    await this.registrarAuditoriaSegura({
      usuarioEmail:
        email,

      accion:
        TipoAccionAuditoria.INICIO_SESION,

      modulo:
        'AUTENTICACION',

      descripcion:
        'Intento fallido de inicio de sesión.',

      entidad:
        'Usuario',

      resultado:
        ResultadoAuditoria.FALLIDO,

      informacionAdicional: {
        email,
      },

      mensajeError,
    });
  }

  private async registrarAuditoriaSegura(
    datos: Parameters<
      AuditoriaService['registrar']
    >[0],
  ): Promise<void> {
    try {
      await this.auditoriaService.registrar(
        datos,
      );
    } catch (error: unknown) {
      /*
       * Una falla en la auditoría no debe
       * impedir el registro, el inicio de
       * sesión o la recuperación.
       */
      console.error(
        'No se pudo registrar la auditoría de autenticación:',
        this.obtenerMensajeError(
          error,
        ),
      );
    }
  }

  private obtenerNombreCompleto(
    usuario: Pick<
      Usuario,
      'nombre' | 'apellido'
    >,
  ): string {
    return `${usuario.nombre || ''} ${
      usuario.apellido || ''
    }`.trim();
  }

  private obtenerMensajeError(
    error: unknown,
  ): string {
    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (
      typeof error ===
        'object' &&
      error !== null &&
      'message' in error
    ) {
      const mensaje = (
        error as {
          message?: unknown;
        }
      ).message;

      if (
        typeof mensaje ===
          'string' &&
        mensaje.trim()
      ) {
        return mensaje;
      }
    }

    return 'Error desconocido.';
  }
}
