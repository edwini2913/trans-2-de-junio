import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import {
  DataSource,
  EntityManager,
  FindOptionsRelations,
} from 'typeorm';

import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  ResultadoAuditoria,
  TipoAccionAuditoria,
} from '../auditoria/entities/auditoria.entity';

import {
  EstadoReserva,
  Reserva,
} from '../reservas/entities/reserva.entity';
import {
  EstadoTicket,
  Ticket,
} from './entities/ticket.entity';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class TicketsService {
  private readonly ticketRelations: FindOptionsRelations<Ticket> = {
    reserva: {
      usuario: true,
      viaje: {
        ruta: true,
        vehiculo: true,
      },
      detalles: {
        asientoViaje: true,
      },
    },
  };

  private readonly reservaRelations: FindOptionsRelations<Reserva> = {
    usuario: true,
    viaje: {
      ruta: true,
      vehiculo: true,
    },
    detalles: {
      asientoViaje: true,
    },
  };

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly configService: ConfigService,

    private readonly blockchainService: BlockchainService,

    private readonly auditoriaService: AuditoriaService,
  ) {}

  async generarTicket(reservaId: string) {
    const idReserva = this.validarTextoObligatorio(
      reservaId,
      'El identificador de la reserva es obligatorio.',
    );

    try {
      const resultado = await this.dataSource.transaction(
        async (manager) => {
        const ticketExistente =
          await manager.findOne(Ticket, {
            where: {
              reserva: {
                id: idReserva,
              },
            },
            relations: this.ticketRelations,
          });

        if (ticketExistente) {
          const bloque = await this.blockchainService.registrarTicket(
            manager,
            ticketExistente,
          );
          return {
            ...this.normalizarTicket(ticketExistente),
            blockchain: {
              registrado: true,
              indice: bloque.indice,
              hashBloque: bloque.hashBloque,
            },
          };
        }

        const reserva = await manager
          .getRepository(Reserva)
          .createQueryBuilder('reserva')
          .setLock(
            'pessimistic_write',
            undefined,
            ['reserva'],
          )
          .leftJoinAndSelect(
            'reserva.usuario',
            'usuario',
          )
          .leftJoinAndSelect(
            'reserva.viaje',
            'viaje',
          )
          .leftJoinAndSelect(
            'viaje.ruta',
            'ruta',
          )
          .leftJoinAndSelect(
            'viaje.vehiculo',
            'vehiculo',
          )
          .leftJoinAndSelect(
            'reserva.detalles',
            'detalle',
          )
          .leftJoinAndSelect(
            'detalle.asientoViaje',
            'asientoViaje',
          )
          .where('reserva.id = :reservaId', {
            reservaId: idReserva,
          })
          .getOne();

        if (!reserva) {
          throw new NotFoundException(
            'La reserva seleccionada no existe.',
          );
        }

        if (
          reserva.estado !==
          EstadoReserva.CONFIRMADA
        ) {
          throw new BadRequestException(
            'La reserva debe estar confirmada para generar el ticket.',
          );
        }

        const asientos =
          this.obtenerAsientosReserva(reserva);

        if (asientos.length === 0) {
          throw new BadRequestException(
            'La reserva no tiene asientos asociados.',
          );
        }

        const numeroTicket =
          await this.obtenerSiguienteNumeroTicket(
            manager,
          );

        const codigoTicket = `T-${String(
          numeroTicket,
        ).padStart(6, '0')}`;

        const tokenValidacion = randomUUID();

        const frontendUrl =
          this.configService.get<string>(
            'FRONTEND_URL',
          ) ?? 'http://localhost:5173';

        const urlValidacion =
          `${frontendUrl.replace(/\/$/, '')}` +
          `/validar-ticket/${tokenValidacion}`;

        const imagenQr =
          await QRCode.toDataURL(
            urlValidacion,
            {
              width: 700,
              margin: 1,
              errorCorrectionLevel: 'H',
            },
          );

        const ticket = manager.create(Ticket, {
          reserva,
          numeroTicket: String(numeroTicket),
          codigoTicket,
          tokenValidacion,
          imagenQr,
          estado: EstadoTicket.VALIDO,
          fechaUso: null,
        });

        const ticketGuardado =
          await manager.save(Ticket, ticket);

        const ticketCompleto =
          await manager.findOne(Ticket, {
            where: {
              id: ticketGuardado.id,
            },
            relations: this.ticketRelations,
          });

        if (!ticketCompleto) {
          throw new NotFoundException(
            'No se pudo recuperar el ticket generado.',
          );
        }

        await this.blockchainService.registrarTicket(
          manager,
          ticketCompleto,
        );

          return this.normalizarTicket(
            ticketCompleto,
          );
        },
      );

      const reserva = resultado.reserva;

      await this.registrarAuditoriaSegura({
        usuarioId: reserva?.usuario?.id ?? null,
        usuarioNombre: this.obtenerNombreUsuario(reserva),
        usuarioEmail: reserva?.usuario?.email ?? null,
        usuarioRol: reserva?.usuario?.rol ?? null,
        accion: TipoAccionAuditoria.GENERAR_TICKET,
        modulo: 'TICKETS',
        descripcion: 'Ticket generado y registrado correctamente.',
        entidad: 'Ticket',
        entidadId: resultado.id,
        resultado: ResultadoAuditoria.EXITOSO,
        datosNuevos: {
          codigoTicket: resultado.codigoTicket,
          numeroTicket: resultado.numeroTicket,
          estado: resultado.estado,
          reservaId: reserva?.id ?? idReserva,
          codigoReserva: reserva?.codigoReserva ?? null,
          cantidadAsientos: resultado.cantidadAsientos,
          montoTotal: resultado.montoTotal,
        },
      });

      return resultado;
    } catch (error: unknown) {
      await this.registrarAuditoriaSegura({
        accion: TipoAccionAuditoria.GENERAR_TICKET,
        modulo: 'TICKETS',
        descripcion: 'Falló la generación del ticket.',
        entidad: 'Reserva',
        entidadId: idReserva,
        resultado: ResultadoAuditoria.FALLIDO,
        informacionAdicional: {
          reservaId: idReserva,
        },
        mensajeError: this.obtenerMensajeError(error),
      });

      throw error;
    }
  }

  async obtenerPorUsuario(
    usuarioId: string,
  ) {
    const idUsuario =
      this.validarTextoObligatorio(
        usuarioId,
        'El identificador del usuario es obligatorio.',
      );

    const tickets = await this.dataSource
      .getRepository(Ticket)
      .find({
        where: {
          reserva: {
            usuario: {
              id: idUsuario,
            },
          },
        },
        relations: this.ticketRelations,
        order: {
          fechaCreacion: 'DESC',
        },
      });

    return tickets.map((ticket) =>
      this.normalizarTicket(ticket),
    );
  }

  /*
   * Devuelve el único ticket relacionado
   * con una reserva aprobada.
   *
   * Este método permite que el frontend
   * consulte el ticket real después de que
   * la administradora apruebe el pago.
   */
  async obtenerPorReserva(
    reservaId: string,
  ) {
    const idReserva =
      this.validarTextoObligatorio(
        reservaId,
        'El identificador de la reserva es obligatorio.',
      );

    const ticket = await this.dataSource
      .getRepository(Ticket)
      .findOne({
        where: {
          reserva: {
            id: idReserva,
          },
        },
        relations:
          this.ticketRelations,
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket de la reserva todavía no está disponible.',
      );
    }

    return this.normalizarTicket(
      ticket,
    );
  }

  async obtenerPorToken(token: string) {
    const ticket =
      await this.buscarTicketPorToken(token);
    const blockchain =
      await this.blockchainService.verificarTicket(ticket);

    return {
      ...this.normalizarTicket(ticket),
      blockchain,
    };
  }

  async validarTicket(token: string) {
    const tokenLimpio =
      this.validarTextoObligatorio(
        token,
        'El token de validación es obligatorio.',
      );

    try {
      const resultado = await this.dataSource.transaction(
        async (manager) => {
        const ticket = await manager
          .getRepository(Ticket)
          .createQueryBuilder('ticket')
          .setLock(
            'pessimistic_write',
            undefined,
            ['ticket'],
          )
          .leftJoinAndSelect(
            'ticket.reserva',
            'reserva',
          )
          .leftJoinAndSelect(
            'reserva.usuario',
            'usuario',
          )
          .leftJoinAndSelect(
            'reserva.viaje',
            'viaje',
          )
          .leftJoinAndSelect(
            'viaje.ruta',
            'ruta',
          )
          .leftJoinAndSelect(
            'viaje.vehiculo',
            'vehiculo',
          )
          .leftJoinAndSelect(
            'reserva.detalles',
            'detalle',
          )
          .leftJoinAndSelect(
            'detalle.asientoViaje',
            'asientoViaje',
          )
          .where(
            'ticket.tokenValidacion = :token',
            {
              token: tokenLimpio,
            },
          )
          .getOne();

        if (!ticket) {
          throw new NotFoundException(
            'Ticket no encontrado.',
          );
        }

        const blockchain =
          await this.blockchainService.verificarTicket(
            ticket,
            manager,
          );

        if (!blockchain.autentico) {
          throw new BadRequestException(
            blockchain.mensaje,
          );
        }

        if (
          ticket.estado ===
          EstadoTicket.UTILIZADO
        ) {
          throw new ConflictException(
            'Este ticket ya fue utilizado.',
          );
        }

        if (
          ticket.estado ===
          EstadoTicket.CANCELADO
        ) {
          throw new BadRequestException(
            'Este ticket está cancelado.',
          );
        }

        if (
          ticket.estado !== EstadoTicket.VALIDO
        ) {
          throw new BadRequestException(
            `El ticket tiene estado ${ticket.estado} y no puede ser utilizado.`,
          );
        }

        if (
          ticket.reserva.estado !==
          EstadoReserva.CONFIRMADA
        ) {
          throw new BadRequestException(
            'La reserva asociada al ticket no está confirmada.',
          );
        }

        ticket.estado =
          EstadoTicket.UTILIZADO;
        ticket.fechaUso = new Date();

        const ticketGuardado =
          await manager.save(Ticket, ticket);

          return {
            ok: true,
            mensaje:
              'Ticket validado correctamente.',
            ticket: {
              ...this.normalizarTicket(ticketGuardado),
              blockchain,
            },
          };
        },
      );

      const reserva = resultado.ticket.reserva;

      await this.registrarAuditoriaSegura({
        usuarioId: reserva?.usuario?.id ?? null,
        usuarioNombre: this.obtenerNombreUsuario(reserva),
        usuarioEmail: reserva?.usuario?.email ?? null,
        usuarioRol: reserva?.usuario?.rol ?? null,
        accion: TipoAccionAuditoria.VALIDAR_TICKET,
        modulo: 'TICKETS',
        descripcion: 'Ticket validado y marcado como utilizado.',
        entidad: 'Ticket',
        entidadId: resultado.ticket.id,
        resultado: ResultadoAuditoria.EXITOSO,
        datosNuevos: {
          codigoTicket: resultado.ticket.codigoTicket,
          estado: resultado.ticket.estado,
          fechaUso: resultado.ticket.fechaUso,
          reservaId: reserva?.id ?? null,
          blockchainAutentico:
            resultado.ticket.blockchain?.autentico ?? false,
        },
      });

      return resultado;
    } catch (error: unknown) {
      await this.registrarAuditoriaSegura({
        accion: TipoAccionAuditoria.VALIDAR_TICKET,
        modulo: 'TICKETS',
        descripcion: 'Falló la validación de un ticket.',
        entidad: 'Ticket',
        resultado: ResultadoAuditoria.FALLIDO,
        informacionAdicional: {
          token: tokenLimpio,
        },
        mensajeError: this.obtenerMensajeError(error),
      });

      throw error;
    }
  }

  private async buscarTicketPorToken(
    token: string,
  ): Promise<Ticket> {
    const tokenLimpio =
      this.validarTextoObligatorio(
        token,
        'El token de validación es obligatorio.',
      );

    const ticket = await this.dataSource
      .getRepository(Ticket)
      .findOne({
        where: {
          tokenValidacion: tokenLimpio,
        },
        relations: this.ticketRelations,
      });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket no encontrado.',
      );
    }

    return ticket;
  }

  private async obtenerSiguienteNumeroTicket(
    manager: EntityManager,
  ): Promise<number> {
    /*
     * Bloquea la numeración durante esta
     * transacción. Así dos compras aprobadas
     * al mismo tiempo no reciben el mismo
     * número de ticket.
     *
     * No depende de una secuencia creada
     * manualmente en PostgreSQL.
     */
    await manager.query(`
      SELECT pg_advisory_xact_lock(
        hashtext(
          'sistema.tickets.numero_ticket'
        )
      )
    `);

    const resultado: Array<{
      numero?: string | number;
    }> = await manager.query(`
      SELECT
        COALESCE(
          MAX(numero_ticket),
          0
        ) + 1 AS numero
      FROM sistema.tickets
    `);

    const numeroTicket = Number(
      resultado?.[0]?.numero,
    );

    if (
      !Number.isFinite(numeroTicket) ||
      numeroTicket <= 0
    ) {
      throw new BadRequestException(
        'No se pudo generar el número del ticket.',
      );
    }

    return numeroTicket;
  }

  private obtenerAsientosReserva(
    reserva: Reserva,
  ) {
    if (!Array.isArray(reserva.detalles)) {
      return [];
    }

    return reserva.detalles
      .map(
        (detalle) =>
          detalle.asientoViaje,
      )
      .filter(Boolean)
      .sort(
        (asientoA, asientoB) =>
          Number(asientoA.numero) -
          Number(asientoB.numero),
      );
  }

  private normalizarTicket(
    ticket: Ticket,
  ) {
    const reserva = ticket.reserva;

    const asientos = reserva
      ? this.obtenerAsientosReserva(reserva)
      : [];

    const asientosNormalizados =
      asientos.map((asiento) => ({
        id: asiento.id,
        numero: asiento.numero,
        estado: asiento.estado,
      }));

    const precioUnitario =
      reserva?.detalles?.length
        ? Number(
            reserva.detalles[0].precio,
          )
        : Number(
            reserva?.viaje?.precio ?? 0,
          );

    const montoTotal =
      reserva?.detalles?.reduce(
        (total, detalle) =>
          total + Number(detalle.precio),
        0,
      ) ?? 0;

    const viaje =
      reserva?.viaje;

    const ruta =
      viaje?.ruta;

    return {
      ...ticket,
      cantidadAsientos:
        asientosNormalizados.length,
      precioUnitario,
      montoTotal,
      total: montoTotal,
      origen:
        ruta?.origen ?? null,
      destino:
        ruta?.destino ?? null,
      fecha:
        viaje?.fecha ?? null,
      hora:
        viaje?.horaSalida ?? null,
      asientoNumeros:
        asientosNormalizados.map(
          (asiento) =>
            asiento.numero,
        ),
      asientos: asientosNormalizados,
      reserva: reserva
        ? {
            ...reserva,
            asientos:
              asientosNormalizados,
          }
        : null,
    };
  }

  private async registrarAuditoriaSegura(
    datos: Parameters<AuditoriaService['registrar']>[0],
  ): Promise<void> {
    try {
      await this.auditoriaService.registrar(datos);
    } catch (error: unknown) {
      console.error(
        'No se pudo registrar la auditoría de tickets:',
        this.obtenerMensajeError(error),
      );
    }
  }

  private obtenerNombreUsuario(
    reserva: Reserva | null | undefined,
  ): string {
    const usuario = reserva?.usuario;

    if (!usuario) {
      return 'Pasajero';
    }

    const nombreCompleto =
      `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim();

    return nombreCompleto || usuario.email || 'Pasajero';
  }

  private obtenerMensajeError(
    error: unknown,
  ): string {
    if (
      error instanceof Error &&
      error.message.trim()
    ) {
      return error.message;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    ) {
      const mensaje = (
        error as {
          message?: unknown;
        }
      ).message;

      if (
        typeof mensaje === 'string' &&
        mensaje.trim()
      ) {
        return mensaje;
      }

      if (Array.isArray(mensaje)) {
        return mensaje.map(String).join(', ');
      }
    }

    return 'Error desconocido.';
  }

  private validarTextoObligatorio(
    valor: string,
    mensaje: string,
  ): string {
    const valorLimpio = valor?.trim();

    if (!valorLimpio) {
      throw new BadRequestException(
        mensaje,
      );
    }

    return valorLimpio;
  }
}
