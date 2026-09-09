import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import {
  CreateVehiculoDto,
} from "./dto/create-vehiculo.dto";

import {
  UpdateVehiculoDto,
} from "./dto/update-vehiculo.dto";

import {
  VehiculosService,
} from "./vehiculos.service";

@Controller("vehiculos")
export class VehiculosController {
  constructor(
    private readonly vehiculosService:
      VehiculosService,
  ) {}

  @Post()
  crear(
    @Body()
    createVehiculoDto:
      CreateVehiculoDto,
  ) {
    return this.vehiculosService.crear(
      createVehiculoDto,
    );
  }

  @Get()
  listarTodos() {
    return this.vehiculosService
      .listarTodos();
  }

  @Get("disponibles")
  listarDisponibles() {
    return this.vehiculosService
      .listarDisponibles();
  }

  /**
   * Lista únicamente las flotas activas
   * disponibles para viajes programados.
   */
  @Get("flotas/disponibles")
  listarFlotasDisponibles() {
    return this.vehiculosService
      .listarFlotasDisponibles();
  }

  /**
   * Lista Noah y Hiace activos disponibles
   * para las salidas rápidas.
   */
  @Get("sector-rapido")
  listarSectorRapido() {
    return this.vehiculosService
      .listarSectorRapido();
  }

  /**
   * Esta ruta debe permanecer después
   * de todas las rutas específicas.
   */
  @Get(":id")
  buscarPorId(
    @Param(
      "id",
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.vehiculosService
      .buscarPorId(id);
  }

  @Patch(":id")
  actualizar(
    @Param(
      "id",
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    updateVehiculoDto:
      UpdateVehiculoDto,
  ) {
    return this.vehiculosService
      .actualizar(
        id,
        updateVehiculoDto,
      );
  }

  @Delete(":id")
  eliminar(
    @Param(
      "id",
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.vehiculosService
      .eliminar(id);
  }
}