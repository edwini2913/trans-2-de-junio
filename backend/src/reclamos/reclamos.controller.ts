import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ReclamosService } from './reclamos.service';

import { CrearReclamoDto } from './dto/crear-reclamo.dto';
import { ResponderReclamoDto } from './dto/responder-reclamo.dto';
import { ActualizarEstadoReclamoDto } from './dto/actualizar-estado-reclamo.dto';

import { EstadoReclamo } from './enums/reclamo.enums';

@Controller('reclamos')
export class ReclamosController {
  constructor(
    private readonly reclamosService: ReclamosService,
  ) {}

  /**
   * Crear un nuevo reclamo.
   *
   * Nota:
   * Temporalmente el usuarioId llega por parámetro.
   * Más adelante lo reemplazaremos por JWT.
   */
  @Post(':usuarioId')
  crear(
    @Param('usuarioId')
    usuarioId: string,

    @Body()
    dto: CrearReclamoDto,
  ) {
    return this.reclamosService.crearReclamo(
      usuarioId,
      dto,
    );
  }

  /**
   * Reclamos del usuario.
   */
  @Get('usuario/:usuarioId')
  obtenerUsuario(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.reclamosService.obtenerReclamosUsuario(
      usuarioId,
    );
  }

  /**
   * Todos los reclamos.
   * (Administrador)
   */
  @Get()
  obtenerTodos(
    @Query('estado')
    estado?: EstadoReclamo,
  ) {
    return this.reclamosService.obtenerTodos(
      estado,
    );
  }

  /**
   * Buscar por ID.
   */
  @Get(':reclamoId/:usuarioId')
  obtenerUno(
    @Param('reclamoId')
    reclamoId: string,

    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.reclamosService.obtenerPorId(
      reclamoId,
      usuarioId,
    );
  }

  /**
   * Buscar por código.
   */
  @Get('codigo/:codigo/:usuarioId')
  obtenerCodigo(
    @Param('codigo')
    codigo: string,

    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.reclamosService.obtenerPorCodigo(
      codigo,
      usuarioId,
    );
  }

  /**
   * Responder un reclamo.
   */
  @Post(':reclamoId/responder/:usuarioId')
  responder(
    @Param('reclamoId')
    reclamoId: string,

    @Param('usuarioId')
    usuarioId: string,

    @Body()
    dto: ResponderReclamoDto,
  ) {
    return this.reclamosService.responderReclamo(
      reclamoId,
      usuarioId,
      dto,
    );
  }

  /**
   * Cambiar estado.
   */
  @Patch(':reclamoId/estado/:usuarioId')
  actualizarEstado(
    @Param('reclamoId')
    reclamoId: string,

    @Param('usuarioId')
    usuarioId: string,

    @Body()
    dto: ActualizarEstadoReclamoDto,
  ) {
    return this.reclamosService.actualizarEstado(
      reclamoId,
      usuarioId,
      dto,
    );
  }

  /**
   * Marcar mensajes como leídos.
   */
  @Patch(':reclamoId/leidos/:usuarioId')
  marcarLeidos(
    @Param('reclamoId')
    reclamoId: string,

    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.reclamosService.marcarMensajesComoLeidos(
      reclamoId,
      usuarioId,
    );
  }

  /**
   * Dashboard.
   */
  @Get('dashboard/resumen')
  resumen() {
    return this.reclamosService.obtenerResumen();
  }
}