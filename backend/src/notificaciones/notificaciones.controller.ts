import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';

import {
  NotificacionesService,
} from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService:
      NotificacionesService,
  ) {}

  /**
   * Lista las notificaciones destinadas
   * al panel administrativo.
   *
   * GET /notificaciones/administrador
   * GET /notificaciones/administrador?limite=20
   */
  @Get('administrador')
  obtenerAdministrador(
    @Query(
      'limite',
      new ParseIntPipe({
        optional: true,
      }),
    )
    limite?: number,
  ) {
    return this.notificacionesService
      .obtenerParaAdministrador(
        limite,
      );
  }

  /**
   * Devuelve la cantidad de notificaciones
   * administrativas que no fueron leídas.
   *
   * GET /notificaciones/administrador/no-leidas
   */
  @Get('administrador/no-leidas')
  contarNoLeidasAdministrador() {
    return this.notificacionesService
      .contarNoLeidasAdministrador();
  }

  /**
   * Lista las notificaciones de un pasajero.
   *
   * GET /notificaciones/usuario/:usuarioId
   */
  @Get('usuario/:usuarioId')
  obtenerUsuario(
    @Param('usuarioId')
    usuarioId: string,

    @Query(
      'limite',
      new ParseIntPipe({
        optional: true,
      }),
    )
    limite?: number,
  ) {
    return this.notificacionesService
      .obtenerParaUsuario(
        usuarioId,
        limite,
      );
  }

  /**
   * Devuelve la cantidad de notificaciones
   * no leídas del pasajero.
   *
   * GET /notificaciones/usuario/:usuarioId/no-leidas
   */
  @Get(
    'usuario/:usuarioId/no-leidas',
  )
  contarNoLeidasUsuario(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.notificacionesService
      .contarNoLeidasUsuario(
        usuarioId,
      );
  }

  /**
   * Marca una notificación como leída.
   *
   * PATCH /notificaciones/:notificacionId/leida/:usuarioId
   */
  @Patch(
    ':notificacionId/leida/:usuarioId',
  )
  marcarComoLeida(
    @Param('notificacionId')
    notificacionId: string,

    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.notificacionesService
      .marcarComoLeida(
        notificacionId,
        usuarioId,
      );
  }

  /**
   * Marca todas las notificaciones visibles
   * para el usuario como leídas.
   *
   * PATCH /notificaciones/todas/leidas/:usuarioId
   */
  @Patch(
    'todas/leidas/:usuarioId',
  )
  marcarTodasComoLeidas(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.notificacionesService
      .marcarTodasComoLeidas(
        usuarioId,
      );
  }
}