import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import {
  ActualizarEstadoRecojoDto,
} from "./dto/actualizar-estado-recojo.dto";

import {
  AgregarVehiculoFilaDto,
} from "./dto/agregar-vehiculo-fila.dto";

import {
  AutorizarSalidaDto,
} from "./dto/autorizar-salida.dto";

import {
  CrearFilaSalidaDto,
} from "./dto/crear-fila-salida.dto";

import {
  PublicarAvisoSalidaDto,
} from "./dto/publicar-aviso-salida.dto";

import {
  RetirarAvisoSalidaDto,
} from "./dto/retirar-aviso-salida.dto";

import {
  SolicitarRecojoDto,
} from "./dto/solicitar-recojo.dto";

import {
  SalidasRapidasService,
} from "./salidas-rapidas.service";

@Controller("salidas-rapidas")
export class SalidasRapidasController {
  constructor(
    private readonly salidasRapidasService:
      SalidasRapidasService,
  ) {}

  /**
   * Crea una fila con todos los Noah
   * o Hiace seleccionados.
   *
   * Ya no existe un límite máximo
   * de cinco vehículos.
   */
  @Post("fila")
  crearFila(
    @Body()
    dto: CrearFilaSalidaDto,
  ) {
    return this.salidasRapidasService
      .crearFila(dto);
  }

  /**
   * Agrega un Noah o Hiace al final
   * de una fila que ya existe.
   */
  @Post("fila/vehiculos")
  agregarVehiculoFila(
    @Body()
    dto: AgregarVehiculoFilaDto,
  ) {
    return this.salidasRapidasService
      .agregarVehiculoFila(dto);
  }

  /**
   * Lista todos los vehículos de
   * una fila con su ocupación.
   *
   * Ejemplo:
   * /salidas-rapidas/fila?rutaId=UUID&fecha=2026-08-23
   */
  @Get("fila")
  listarFila(
    @Query("rutaId")
    rutaId: string,

    @Query("fecha")
    fecha: string,
  ) {
    return this.salidasRapidasService
      .listarFila(
        rutaId,
        fecha,
      );
  }

  /**
   * Obtiene el vehículo actual,
   * el siguiente y la fila completa.
   */
  @Get("actual")
  obtenerSalidaActual(
    @Query("rutaId")
    rutaId: string,

    @Query("fecha")
    fecha: string,
  ) {
    return this.salidasRapidasService
      .obtenerSalidaActual(
        rutaId,
        fecha,
      );
  }

  /**
   * Autoriza la salida del vehículo
   * y habilita automáticamente al siguiente.
   */
  @Patch(
    "turnos/:turnoId/autorizar-salida",
  )
  autorizarSalida(
    @Param(
      "turnoId",
      new ParseUUIDPipe(),
    )
    turnoId: string,

    @Body()
    dto: AutorizarSalidaDto,
  ) {
    return this.salidasRapidasService
      .autorizarSalida(
        turnoId,
        dto.administradorId,
      );
  }

  /**
   * Publica un aviso para los pasajeros.
   *
   * Ejemplos:
   * - No hay movilidades.
   * - Bloqueo en la carretera.
   * - Derrumbe.
   * - Mal tiempo.
   */
  @Post("avisos")
  publicarAviso(
    @Body()
    dto: PublicarAvisoSalidaDto,
  ) {
    return this.salidasRapidasService
      .publicarAviso(dto);
  }

  /**
   * Consulta el aviso activo de una
   * ruta y fecha.
   *
   * Este endpoint será consultado por
   * la pantalla del pasajero.
   */
  @Get("avisos/activo")
  obtenerAvisoActivo(
    @Query("rutaId")
    rutaId: string,

    @Query("fecha")
    fecha: string,
  ) {
    return this.salidasRapidasService
      .obtenerAvisoActivo(
        rutaId,
        fecha,
      );
  }

  /**
   * Retira un aviso cuando el servicio
   * vuelve a funcionar normalmente.
   */
  @Patch(
    "avisos/:avisoId/retirar",
  )
  retirarAviso(
    @Param(
      "avisoId",
      new ParseUUIDPipe(),
    )
    avisoId: string,

    @Body()
    dto: RetirarAvisoSalidaDto,
  ) {
    return this.salidasRapidasService
      .retirarAviso(
        avisoId,
        dto.administradorId,
      );
  }

  /**
   * Registra que un pasajero desea
   * ser recogido durante el recorrido.
   */
  @Post("recojos")
  solicitarRecojo(
    @Body()
    dto: SolicitarRecojoDto,
  ) {
    return this.salidasRapidasService
      .solicitarRecojo(dto);
  }

  /**
   * Permite a administración ver
   * las solicitudes de un viaje.
   */
  @Get(
    "recojos/viaje/:viajeId",
  )
  listarSolicitudesPorViaje(
    @Param(
      "viajeId",
      new ParseUUIDPipe(),
    )
    viajeId: string,
  ) {
    return this.salidasRapidasService
      .listarSolicitudesPorViaje(
        viajeId,
      );
  }

  /**
   * Confirma, cancela o completa
   * una solicitud de recojo.
   */
  @Patch(
    "recojos/:solicitudId/estado",
  )
  actualizarEstadoRecojo(
    @Param(
      "solicitudId",
      new ParseUUIDPipe(),
    )
    solicitudId: string,

    @Body()
    dto: ActualizarEstadoRecojoDto,
  ) {
    return this.salidasRapidasService
      .actualizarEstadoRecojo(
        solicitudId,
        dto,
      );
  }
}