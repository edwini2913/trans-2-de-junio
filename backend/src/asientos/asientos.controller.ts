import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { AsientosService } from './asientos.service';

interface UsuarioAsientoDto {
  usuarioId: string;
}

@Controller('asientos')
export class AsientosController {
  constructor(
    private readonly asientosService: AsientosService,
  ) {}

  /**
   * Genera automáticamente los asientos de un viaje
   * según la capacidad del vehículo asignado.
   */
  @Post('viaje/:viajeId/generar')
  @HttpCode(HttpStatus.CREATED)
  generarAsientos(
    @Param('viajeId', ParseUUIDPipe)
    viajeId: string,
  ) {
    return this.asientosService.generarAsientos(viajeId);
  }

  /**
   * Lista todos los asientos pertenecientes a un viaje.
   */
  @Get('viaje/:viajeId')
  listarPorViaje(
    @Param('viajeId', ParseUUIDPipe)
    viajeId: string,
  ) {
    return this.asientosService.listarPorViaje(viajeId);
  }

  /**
   * Busca un asiento por su identificador.
   */
  @Get(':asientoId')
  buscarPorId(
    @Param('asientoId', ParseUUIDPipe)
    asientoId: string,
  ) {
    return this.asientosService.buscarPorId(asientoId);
  }

  /**
   * Bloquea temporalmente un asiento para un usuario.
   */
  @Patch(':asientoId/bloquear')
  bloquearAsiento(
    @Param('asientoId', ParseUUIDPipe)
    asientoId: string,

    @Body()
    body: UsuarioAsientoDto,
  ) {
    return this.asientosService.bloquearAsiento(
      asientoId,
      body.usuarioId,
    );
  }

  /**
   * Libera un asiento bloqueado por el mismo usuario.
   */
  @Patch(':asientoId/liberar')
  liberarAsiento(
    @Param('asientoId', ParseUUIDPipe)
    asientoId: string,

    @Body()
    body: UsuarioAsientoDto,
  ) {
    return this.asientosService.liberarAsiento(
      asientoId,
      body.usuarioId,
    );
  }

  /**
   * Convierte un asiento bloqueado en reservado.
   */
  @Patch(':asientoId/reservar')
  marcarReservado(
    @Param('asientoId', ParseUUIDPipe)
    asientoId: string,

    @Body()
    body: UsuarioAsientoDto,
  ) {
    return this.asientosService.marcarReservado(
      asientoId,
      body.usuarioId,
    );
  }

  /**
   * Convierte un asiento bloqueado en vendido.
   */
  @Patch(':asientoId/vender')
  marcarVendido(
    @Param('asientoId', ParseUUIDPipe)
    asientoId: string,

    @Body()
    body: UsuarioAsientoDto,
  ) {
    return this.asientosService.marcarVendido(
      asientoId,
      body.usuarioId,
    );
  }
}