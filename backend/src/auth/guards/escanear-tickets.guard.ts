
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
   USUARIO AUTENTICADO
========================================= */

interface UsuarioAutenticado {
  id: string;
  rol: RolUsuario;
  estado?: boolean;
  puedeEscanearTickets: boolean;
}

type SolicitudAutenticada = Request & {
  user?: UsuarioAutenticado;
};

/* =========================================
   GUARD DE ESCANEO DE TICKETS
========================================= */

@Injectable()
export class EscanearTicketsGuard extends AuthGuard('jwt') {
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
        'Debes iniciar sesión para escanear tickets.',
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
        'No se pudo verificar tu sesión.',
      );
    }

    /* =====================================
       3. PERMITIR SOLAMENTE CHOFERES
    ===================================== */

    if (usuario.rol !== RolUsuario.CHOFER) {
      throw new ForbiddenException(
        'Esta función es exclusiva para choferes autorizados.',
      );
    }

    /* =====================================
       4. VERIFICAR CUENTA ACTIVA
    ===================================== */

    if (usuario.estado !== true) {
      throw new ForbiddenException(
        'Tu cuenta está desactivada. Contacta al administrador.',
      );
    }

    /* =====================================
       5. VERIFICAR PERMISO DE ESCANEO
    ===================================== */

    if (usuario.puedeEscanearTickets !== true) {
      throw new ForbiddenException(
        'No tienes autorización para escanear tickets. Solicita la habilitación al administrador.',
      );
    }

    /* =====================================
       6. AUTORIZAR ESCANEO
    ===================================== */

    return true;
  }
}
