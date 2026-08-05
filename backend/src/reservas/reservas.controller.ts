import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";

import { CrearReservaDto } from "./dto/crear-reserva.dto";
import { ReservasService } from "./reservas.service";

@Controller("reservas")
export class ReservasController {
  constructor(
    private readonly reservasService: ReservasService,
  ) {}

  /**
   * Crea una nueva reserva con uno o varios asientos.
   */
  @Post()
  crearReserva(@Body() dto: CrearReservaDto) {
    return this.reservasService.crearReserva(dto);
  }

  /**
   * Aparta los asientos durante dos horas sin generar ticket.
   */
  @Post("pendiente")
  crearReservaPendiente(@Body() dto: CrearReservaDto) {
    return this.reservasService.crearReservaPendiente(dto);
  }

  /**
   * Obtiene todas las reservas pertenecientes a un usuario.
   */
  @Get("usuario/:usuarioId")
  obtenerPorUsuario(
    @Param("usuarioId") usuarioId: string,
  ) {
    return this.reservasService.obtenerPorUsuario(usuarioId);
  }

  /**
   * Obtiene una reserva mediante su identificador.
   */
  @Get(":id")
  obtenerUna(@Param("id") id: string) {
    return this.reservasService.obtenerPorId(id);
  }

  /**
   * Permite que el pasajero cancele únicamente
   * una reserva propia pendiente de pago.
   */
  @Delete(":id/usuario/:usuarioId")
  cancelarReservaUsuario(
    @Param("id") id: string,
    @Param("usuarioId") usuarioId: string,
  ) {
    return this.reservasService.cancelarReservaUsuario(
      id,
      usuarioId,
    );
  }

  /**
   * Cancelación administrativa conservada para
   * las pantallas anteriores del sistema.
   */
  @Delete(":id")
  eliminarReserva(@Param("id") id: string) {
    return this.reservasService.eliminarReserva(id);
  }
}