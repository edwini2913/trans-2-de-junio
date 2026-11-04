
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import {
  GestionarChoferesGuard,
} from "../auth/guards/gestionar-choferes.guard";

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

  /**
   * Registrar vehículo.
   * ADMINISTRADOR / SECRETARIA
   */
  @Post()
  @UseGuards(GestionarChoferesGuard)
  crear(
    @Body()
    createVehiculoDto: CreateVehiculoDto,
  ) {
    return this.vehiculosService.crear(
      createVehiculoDto,
    );
  }

  /**
   * Listar todos los vehículos.
   * ADMINISTRADOR / SECRETARIA
   */
  @Get()
  @UseGuards(GestionarChoferesGuard)
  listarTodos() {
    return this.vehiculosService.listarTodos();
  }

  /**
   * Listar vehículos activos.
   */
  @Get("disponibles")
  listarDisponibles() {
    return this.vehiculosService.listarDisponibles();
  }

  /**
   * Listar flotas disponibles.
   */
  @Get("flotas/disponibles")
  listarFlotasDisponibles() {
    return this.vehiculosService
      .listarFlotasDisponibles();
  }

  /**
   * Listar Noah y Hiace disponibles.
   */
  @Get("sector-rapido")
  listarSectorRapido() {
    return this.vehiculosService
      .listarSectorRapido();
  }

  /**
   * NUEVO:
   * Buscar vehículo por placa.
   *
   * Devuelve el vehículo y su chofer habitual
   * cuando tiene uno asignado.
   *
   * ADMINISTRADOR / SECRETARIA
   *
   * IMPORTANTE:
   * Debe estar antes de @Get(":id").
   */
  @Get("placa/:placa")
  @UseGuards(GestionarChoferesGuard)
  buscarPorPlaca(
    @Param("placa")
    placa: string,
  ) {
    return this.vehiculosService
      .buscarPorPlaca(placa);
  }

  /**
   * Buscar vehículo por ID.
   */
  @Get(":id")
  buscarPorId(
    @Param("id", ParseUUIDPipe)
    id: string,
  ) {
    return this.vehiculosService.buscarPorId(id);
  }

  /**
   * Modificar vehículo o chofer habitual.
   * ADMINISTRADOR / SECRETARIA
   */
  @Patch(":id")
  @UseGuards(GestionarChoferesGuard)
  actualizar(
    @Param("id", ParseUUIDPipe)
    id: string,

    @Body()
    updateVehiculoDto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.actualizar(
      id,
      updateVehiculoDto,
    );
  }

  /**
   * Eliminar vehículo.
   * ADMINISTRADOR / SECRETARIA
   */
  @Delete(":id")
  @UseGuards(GestionarChoferesGuard)
  eliminar(
    @Param("id", ParseUUIDPipe)
    id: string,
  ) {
    return this.vehiculosService.eliminar(id);
  }
}
