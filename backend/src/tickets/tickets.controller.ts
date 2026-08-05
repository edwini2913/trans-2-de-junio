import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  TicketsService,
} from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService:
      TicketsService,
  ) {}

  /**
   * Genera un único ticket para una
   * reserva confirmada.
   */
  @Post('generar/:reservaId')
  generarTicket(
    @Param('reservaId')
    reservaId: string,
  ) {
    return this.ticketsService
      .generarTicket(
        reservaId,
      );
  }

  /**
   * Obtiene todos los tickets
   * pertenecientes a un usuario.
   */
  @Get('usuario/:usuarioId')
  obtenerPorUsuario(
    @Param('usuarioId')
    usuarioId: string,
  ) {
    return this.ticketsService
      .obtenerPorUsuario(
        usuarioId,
      );
  }

  /**
   * Obtiene el ticket real generado
   * para una reserva aprobada.
   *
   * GET /tickets/reserva/:reservaId
   */
  @Get('reserva/:reservaId')
  obtenerPorReserva(
    @Param('reservaId')
    reservaId: string,
  ) {
    return this.ticketsService
      .obtenerPorReserva(
        reservaId,
      );
  }

  /**
   * Consulta un ticket mediante
   * el token incluido en su QR.
   */
  @Get('token/:token')
  obtenerPorToken(
    @Param('token')
    token: string,
  ) {
    return this.ticketsService
      .obtenerPorToken(
        token,
      );
  }

  /**
   * Valida el ticket cuando el
   * código QR es escaneado.
   */
  @Patch('validar/:token')
  validarTicket(
    @Param('token')
    token: string,
  ) {
    return this.ticketsService
      .validarTicket(
        token,
      );
  }
}