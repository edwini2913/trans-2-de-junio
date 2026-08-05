import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ViajesService } from './viajes.service';
import { CreateViajeDto } from './dto/create-viaje.dto';
import { UpdateViajeDto } from './dto/update-viaje.dto';

import { EstadoViaje } from './entities/viaje.entity';

@Controller('viajes')
export class ViajesController {
  constructor(
    private readonly viajesService: ViajesService,
  ) {}

  @Post()
  crear(
    @Body()
    createViajeDto: CreateViajeDto,
  ) {
    return this.viajesService.crear({
      rutaId: createViajeDto.rutaId,
      vehiculoId: createViajeDto.vehiculoId,
      fecha: createViajeDto.fecha,
      horaSalida: createViajeDto.horaSalida,
      precio: Number(createViajeDto.precio),

      estado: createViajeDto.estado
        ? (createViajeDto.estado as EstadoViaje)
        : undefined,
    });
  }

  @Get()
  listarTodos() {
    return this.viajesService.listarTodos();
  }

  /**
   * Viajes publicados que puede visualizar el pasajero.
   * Solo devuelve viajes programados, vigentes y disponibles.
   */
  @Get('publicados')
  listarPublicados() {
    return this.viajesService.listarPublicados();
  }

  @Get('fechas-disponibles')
  obtenerFechasDisponibles(
    @Query(
      'rutaId',
      new ParseUUIDPipe(),
    )
    rutaId: string,
  ) {
    return this.viajesService
      .obtenerFechasDisponibles(rutaId);
  }

  @Get('disponibles')
  obtenerDisponibles(
    @Query(
      'rutaId',
      new ParseUUIDPipe(),
    )
    rutaId: string,

    @Query('fecha')
    fecha: string,
  ) {
    return this.viajesService
      .obtenerDisponibles(
        rutaId,
        fecha,
      );
  }

  @Get('opciones')
  obtenerOpcionesAgrupadas(
    @Query(
      'rutaId',
      new ParseUUIDPipe(),
    )
    rutaId: string,

    @Query('fecha')
    fecha: string,
  ) {
    return this.viajesService
      .obtenerOpcionesAgrupadas(
        rutaId,
        fecha,
      );
  }

  @Get(':id')
  buscarPorId(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.viajesService
      .buscarPorId(id);
  }

  @Patch(':id')
  actualizar(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    updateViajeDto: UpdateViajeDto,
  ) {
    return this.viajesService.actualizar(
      id,
      {
        rutaId:
          updateViajeDto.rutaId,

        vehiculoId:
          updateViajeDto.vehiculoId,

        fecha:
          updateViajeDto.fecha,

        horaSalida:
          updateViajeDto.horaSalida,

        precio:
          updateViajeDto.precio !==
          undefined
            ? Number(
                updateViajeDto.precio,
              )
            : undefined,

        estado:
          updateViajeDto.estado !==
          undefined
            ? (updateViajeDto.estado as EstadoViaje)
            : undefined,
      },
    );
  }

  @Patch(':id/disponibilidad')
  actualizarDisponibilidad(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.viajesService
      .actualizarDisponibilidad(id);
  }

  @Delete(':id')
  eliminar(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.viajesService.eliminar(
      id,
    );
  }
}
