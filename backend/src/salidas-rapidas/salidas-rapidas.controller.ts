import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { ActualizarEstadoRecojoDto } from "./dto/actualizar-estado-recojo.dto";
import { ActualizarRecojoDto } from "./dto/actualizar-recojo.dto";
import { AgregarVehiculoFilaDto } from "./dto/agregar-vehiculo-fila.dto";
import { AutorizarSalidaDto } from "./dto/autorizar-salida.dto";
import { CrearFilaSalidaDto } from "./dto/crear-fila-salida.dto";
import { PublicarAvisoSalidaDto } from "./dto/publicar-aviso-salida.dto";
import { RetirarAvisoSalidaDto } from "./dto/retirar-aviso-salida.dto";
import { SolicitarRecojoDto } from "./dto/solicitar-recojo.dto";
import { EstadoSolicitudRecojo } from "./entities/solicitud-recojo.entity";
import { SalidasRapidasService } from "./salidas-rapidas.service";

type RolSesion = "ADMINISTRADOR" | "SECRETARIA" | "CHOFER" | "PASAJERO";

interface SolicitudAutenticada {
  user: {
    id: string;
    rol: RolSesion;
  };
}

@Controller("salidas-rapidas")
export class SalidasRapidasController {
  constructor(
    private readonly salidasRapidasService: SalidasRapidasService,
  ) {}

  // FILAS RÁPIDAS
  @Post("fila")
  crearFila(@Body() dto: CrearFilaSalidaDto) {
    return this.salidasRapidasService.crearFila(dto);
  }

  @Post("fila/vehiculos")
  agregarVehiculoFila(@Body() dto: AgregarVehiculoFilaDto) {
    return this.salidasRapidasService.agregarVehiculoFila(dto);
  }

  @Get("fila")
  listarFila(@Query("rutaId") rutaId: string, @Query("fecha") fecha: string) {
    return this.salidasRapidasService.listarFila(rutaId, fecha);
  }

  @Get("actual")
  obtenerSalidaActual(@Query("rutaId") rutaId: string, @Query("fecha") fecha: string) {
    return this.salidasRapidasService.obtenerSalidaActual(rutaId, fecha);
  }

  @Patch("turnos/:turnoId/autorizar-salida")
  autorizarSalida(
    @Param("turnoId", ParseUUIDPipe) turnoId: string,
    @Body() dto: AutorizarSalidaDto,
  ) {
    return this.salidasRapidasService.autorizarSalida(turnoId, dto.administradorId);
  }

  // AVISOS
  @Post("avisos")
  publicarAviso(@Body() dto: PublicarAvisoSalidaDto) {
    return this.salidasRapidasService.publicarAviso(dto);
  }

  @Get("avisos/activo")
  obtenerAvisoActivo(
    @Query("rutaId") rutaId: string,
    @Query("fecha") fecha: string,
  ) {
    return this.salidasRapidasService.obtenerAvisoActivo(rutaId, fecha);
  }

  @Patch("avisos/:avisoId/retirar")
  retirarAviso(
    @Param("avisoId", ParseUUIDPipe) avisoId: string,
    @Body() dto: RetirarAvisoSalidaDto,
  ) {
    return this.salidasRapidasService.retirarAviso(avisoId, dto.administradorId);
  }

  // RECOJOS DEL PASAJERO
  @UseGuards(AuthGuard("jwt"))
  @Post("recojos")
  solicitarRecojo(@Req() req: SolicitudAutenticada, @Body() dto: SolicitarRecojoDto) {
    this.exigirPasajero(req);
    return this.salidasRapidasService.solicitarRecojo({ ...dto, usuarioId: req.user.id });
  }

  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Get("recojos/mio/:viajeId")
  obtenerMiRecojo(
    @Req() req: SolicitudAutenticada,
    @Param("viajeId", ParseUUIDPipe) viajeId: string,
  ) {
    this.exigirPasajero(req);
    return this.salidasRapidasService.obtenerMiSolicitudRecojo(req.user.id, viajeId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Patch("recojos/mio/:solicitudId")
  actualizarMiRecojo(
    @Req() req: SolicitudAutenticada,
    @Param("solicitudId", ParseUUIDPipe) solicitudId: string,
    @Body() dto: ActualizarRecojoDto,
  ) {
    this.exigirPasajero(req);
    return this.salidasRapidasService.actualizarMiRecojo(req.user.id, solicitudId, dto);
  }

  // RECOJOS DE ADMINISTRACIÓN
  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Get("recojos/viaje/:viajeId")
  listarSolicitudesPorViaje(
    @Req() req: SolicitudAutenticada,
    @Param("viajeId", ParseUUIDPipe) viajeId: string,
  ) {
    this.exigirAdministracion(req);
    return this.salidasRapidasService.listarSolicitudesPorViaje(viajeId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Patch("recojos/:solicitudId/estado")
  actualizarEstadoRecojo(
    @Req() req: SolicitudAutenticada,
    @Param("solicitudId", ParseUUIDPipe) solicitudId: string,
    @Body() dto: ActualizarEstadoRecojoDto,
  ) {
    this.exigirAdministracion(req);
    return this.salidasRapidasService.actualizarEstadoRecojo(solicitudId, {
      ...dto,
      administradorId: req.user.id,
    });
  }

  // RECOJOS DEL CHOFER
  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Get("recojos/chofer/mis-turnos")
  obtenerMisTurnosRecojoChofer(@Req() req: SolicitudAutenticada) {
    this.exigirChofer(req);
    return this.salidasRapidasService.obtenerMisTurnosRecojoChofer(req.user.id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Get("recojos/chofer/viaje/:viajeId")
  obtenerRecojosDeMiViajeChofer(
    @Req() req: SolicitudAutenticada,
    @Param("viajeId", ParseUUIDPipe) viajeId: string,
  ) {
    this.exigirChofer(req);
    return this.salidasRapidasService.obtenerRecojosDeMiViajeChofer(req.user.id, viajeId);
  }

  @UseGuards(AuthGuard("jwt"))
  @Header("Cache-Control", "no-store")
  @Patch("recojos/chofer/:solicitudId/estado")
  actualizarResultadoRecojoChofer(
    @Req() req: SolicitudAutenticada,
    @Param("solicitudId", ParseUUIDPipe) solicitudId: string,
    @Body() dto: { estado: EstadoSolicitudRecojo },
  ) {
    this.exigirChofer(req);
    if (
      !dto ||
      (dto.estado !== EstadoSolicitudRecojo.RECOGIDO &&
       dto.estado !== EstadoSolicitudRecojo.NO_ENCONTRADO)
    ) {
      throw new ForbiddenException("El chofer solo puede marcar RECOGIDO o NO_ENCONTRADO.");
    }
    return this.salidasRapidasService.actualizarResultadoRecojoChofer(
      req.user.id,
      solicitudId,
      dto.estado,
    );
  }

  private exigirPasajero(req: SolicitudAutenticada): void {
    if (req.user.rol !== "PASAJERO") {
      throw new ForbiddenException("Solo el pasajero puede gestionar su recojo.");
    }
  }

  private exigirAdministracion(req: SolicitudAutenticada): void {
    if (req.user.rol !== "ADMINISTRADOR" && req.user.rol !== "SECRETARIA") {
      throw new ForbiddenException("Solo administración o secretaría puede gestionar estas solicitudes.");
    }
  }

  private exigirChofer(req: SolicitudAutenticada): void {
    if (req.user.rol !== "CHOFER") {
      throw new ForbiddenException("Solo el chofer puede consultar y actualizar sus recojos.");
    }
  }
}
