import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { EscanearTicketsGuard } from '../auth/guards/escanear-tickets.guard';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
  ) {}

  /**
   * Genera un único ticket para una reserva confirmada.
   */
  @Post('generar/:reservaId')
  generarTicket(
    @Param('reservaId') reservaId: string,
  ) {
    return this.ticketsService.generarTicket(reservaId);
  }

  /**
   * Obtiene los tickets pertenecientes a un usuario.
   */
  @Get('usuario/:usuarioId')
  obtenerPorUsuario(
    @Param('usuarioId') usuarioId: string,
  ) {
    return this.ticketsService.obtenerPorUsuario(usuarioId);
  }

  /**
   * Obtiene el ticket generado para una reserva aprobada.
   */
  @Get('reserva/:reservaId')
  obtenerPorReserva(
    @Param('reservaId') reservaId: string,
  ) {
    return this.ticketsService.obtenerPorReserva(reservaId);
  }

  /**
   * Consulta el ticket sin marcarlo como utilizado.
   */
  @Get('token/:token')
  obtenerPorToken(
    @Param('token') token: string,
  ) {
    return this.ticketsService.obtenerPorToken(token);
  }

  /**
   * Autoriza el abordaje y marca el ticket como utilizado.
   * Requiere una sesión válida y permiso de escaneo.
   */
  @Patch('validar/:token')
  @UseGuards(EscanearTicketsGuard)
  validarTicket(
    @Param('token') token: string,
  ) {
    return this.ticketsService.validarTicket(token);
  }
}