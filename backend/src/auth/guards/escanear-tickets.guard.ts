
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
   USUARIO AUTENTICADO MEDIANTE JWT
========================================= */

interface UsuarioAutenticado {
  id: string;
  rol: RolUsuario;
  estado: boolean;
  puedeEscanearTickets: boolean;
}

type SolicitudAutenticada = Request & {
  user?: UsuarioAutenticado;
};

/* =========================================
   GUARD PARA VALIDACIÓN DE TICKETS QR
========================================= */

@Injectable()
export class EscanearTicketsGuard extends AuthGuard('jwt') {
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    /* =====================================
       1. VERIFICAR AUTENTICACIÓN JWT
    ===================================== */

    const autenticado =
      await super.canActivate(context);

    if (!autenticado) {
      throw new UnauthorizedException(
        'Debes iniciar sesión para validar tickets QR.',
      );
    }

    /* =====================================
       2. OBTENER USUARIO AUTENTICADO
    ===================================== */

    const solicitud = context
      .switchToHttp()
      .getRequest<SolicitudAutenticada>();

    const usuario = solicitud.user;

    if (!usuario?.id || !usuario.rol) {
      throw new UnauthorizedException(
        'No se pudo verificar tu sesión. Inicia sesión nuevamente.',
      );
    }

    /* =====================================
       3. COMPROBAR CUENTA ACTIVA
    ===================================== */

    if (usuario.estado !== true) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Contacta al administrador.',
      );
    }

    /* =====================================
       4. AUTORIZAR ADMINISTRADOR
    ===================================== */

    if (
      usuario.rol ===
      RolUsuario.ADMINISTRADOR
    ) {
      return true;
    }

    /* =====================================
       5. VERIFICAR ROL CHOFER
    ===================================== */

    if (
      usuario.rol !==
      RolUsuario.CHOFER
    ) {
      throw new ForbiddenException(
        'Solo los administradores y choferes autorizados pueden validar el abordaje.',
      );
    }

    /* =====================================
       6. VERIFICAR PERMISO DEL CHOFER
    ===================================== */

    if (
      usuario.puedeEscanearTickets !==
      true
    ) {
      throw new ForbiddenException(
        'Tu cuenta de chofer no tiene habilitado el escaneo de tickets. Solicita autorización al administrador.',
      );
    }

    /* =====================================
       7. AUTORIZAR VALIDACIÓN DEL QR
    ===================================== */

    return true;
  }
}
