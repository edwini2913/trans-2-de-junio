import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  CreateRutaDto,
} from "./dto/create-ruta.dto";

import {
  UpdateRutaDto,
} from "./dto/update-ruta.dto";

import {
  RutasService,
} from "./rutas.service";

@Controller("rutas")
export class RutasController {
  constructor(
    private readonly rutasService:
      RutasService,
  ) {}

  /**
   * GET /rutas
   *
   * Por defecto devuelve solamente
   * las rutas activas.
   *
   * Para listar todas:
   * GET /rutas?incluirInactivas=true
   */
  @Get()
  obtenerRutas(
    @Query(
      "incluirInactivas",
      new ParseBoolPipe({
        optional: true,
      }),
    )
    incluirInactivas?: boolean,
  ) {
    if (incluirInactivas) {
      return this.rutasService
        .obtenerTodasLasRutas();
    }

    return this.rutasService
      .obtenerRutas();
  }

  /**
   * GET /rutas/:id
   */
  @Get(":id")
  obtenerRutaPorId(
    @Param("id")
    id: string,
  ) {
    return this.rutasService
      .obtenerRutaPorId(id);
  }

  /**
   * POST /rutas
   */
  @Post()
  crearRuta(
    @Body()
    createRutaDto:
      CreateRutaDto,
  ) {
    return this.rutasService
      .crearRuta(createRutaDto);
  }

  /**
   * PATCH /rutas/:id
   */
  @Patch(":id")
  actualizarRuta(
    @Param("id")
    id: string,

    @Body()
    updateRutaDto:
      UpdateRutaDto,
  ) {
    return this.rutasService
      .actualizarRuta(
        id,
        updateRutaDto,
      );
  }

  /**
   * PATCH /rutas/:id/estado
   *
   * Body:
   * {
   *   "estado": true
   * }
   */
  @Patch(":id/estado")
  cambiarEstadoRuta(
    @Param("id")
    id: string,

    @Body(
      "estado",
      ParseBoolPipe,
    )
    estado: boolean,
  ) {
    return this.rutasService
      .cambiarEstadoRuta(
        id,
        estado,
      );
  }

  /**
   * DELETE /rutas/:id
   */
  @Delete(":id")
  eliminarRuta(
    @Param("id")
    id: string,
  ) {
    return this.rutasService
      .eliminarRuta(id);
  }
}