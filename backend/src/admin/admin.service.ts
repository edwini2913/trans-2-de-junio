import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Between,
  Repository,
} from 'typeorm';

import {
  AsientoViaje,
  EstadoAsiento,
} from '../asientos/entities/asiento-viaje.entity';

import { BloqueTicket } from '../blockchain/entities/bloque-ticket.entity';

import {
  EstadoPago,
  Pago,
} from '../pagos/entities/pago.entity';

import { Reclamo } from '../reclamos/entities/reclamo.entity';

import {
  EstadoReclamo,
} from '../reclamos/enums/reclamo.enums';

import { Reserva } from '../reservas/entities/reserva.entity';

import { Ruta } from '../rutas/entities/ruta.entity';

import {
  EstadoTicket,
  Ticket,
} from '../tickets/entities/ticket.entity';

import { Usuario } from '../users/entities/usuario.entity';

import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';

import { Viaje } from '../viajes/entities/viaje.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepo:
      Repository<Usuario>,

    @InjectRepository(Ruta)
    private readonly rutasRepo:
      Repository<Ruta>,

    @InjectRepository(Vehiculo)
    private readonly vehiculosRepo:
      Repository<Vehiculo>,

    @InjectRepository(Viaje)
    private readonly viajesRepo:
      Repository<Viaje>,

    @InjectRepository(Reserva)
    private readonly reservasRepo:
      Repository<Reserva>,

    @InjectRepository(AsientoViaje)
    private readonly asientosRepo:
      Repository<AsientoViaje>,

    @InjectRepository(Pago)
    private readonly pagosRepo:
      Repository<Pago>,

    @InjectRepository(Ticket)
    private readonly ticketsRepo:
      Repository<Ticket>,

    @InjectRepository(BloqueTicket)
    private readonly blockchainRepo:
      Repository<BloqueTicket>,

    @InjectRepository(Reclamo)
    private readonly reclamosRepo:
      Repository<Reclamo>,
  ) {}

  async resumen() {
    const ahora = new Date();

    const inicioDia =
      this.obtenerInicioDia(
        ahora,
      );

    const finDia =
      this.obtenerFinDia(
        ahora,
      );

    const inicioMes =
      new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

    const finMes =
      new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

    const [
      usuarios,
      rutas,
      vehiculos,
      viajes,
      reservas,
      asientosDisponibles,
      asientosOcupados,

      pagosPendientes,
      pagosEnRevision,
      pagosAprobados,
      pagosRechazados,

      tickets,
      ticketsValidos,
      ticketsUtilizados,
      ticketsCancelados,
      ticketsHoy,

      blockchainProtegidos,
      bloquesHoy,

      reclamosPendientes,
      reclamosTotal,

      ingresosHoy,
      ingresosMes,
      ingresosTotales,
    ] = await Promise.all([
      this.usuariosRepo.count(),

      this.rutasRepo.count(),

      this.vehiculosRepo.count(),

      this.viajesRepo.count(),

      this.reservasRepo.count(),

      this.asientosRepo.count({
        where: {
          estado:
            EstadoAsiento.DISPONIBLE,
        },
      }),

      this.asientosRepo.count({
        where: {
          estado:
            EstadoAsiento.RESERVADO,
        },
      }),

      this.pagosRepo.count({
        where: {
          estado:
            EstadoPago.PENDIENTE,
        },
      }),

      this.pagosRepo.count({
        where: {
          estado:
            EstadoPago.EN_REVISION,
        },
      }),

      this.pagosRepo.count({
        where: {
          estado:
            EstadoPago.APROBADO,
        },
      }),

      this.pagosRepo.count({
        where: {
          estado:
            EstadoPago.RECHAZADO,
        },
      }),

      this.ticketsRepo.count(),

      this.ticketsRepo.count({
        where: {
          estado:
            EstadoTicket.VALIDO,
        },
      }),

      this.ticketsRepo.count({
        where: {
          estado:
            EstadoTicket.UTILIZADO,
        },
      }),

      this.ticketsRepo.count({
        where: {
          estado:
            EstadoTicket.CANCELADO,
        },
      }),

      this.ticketsRepo.count({
        where: {
          fechaCreacion:
            Between(
              inicioDia,
              finDia,
            ),
        },
      }),

      this.blockchainRepo.count(),

      this.blockchainRepo.count({
        where: {
          fechaBloque:
            Between(
              inicioDia,
              finDia,
            ),
        },
      }),

      this.reclamosRepo.count({
        where: {
          estado:
            EstadoReclamo.PENDIENTE,
        },
      }),

      this.reclamosRepo.count(),

      this.sumarPagosAprobados(
        inicioDia,
        finDia,
      ),

      this.sumarPagosAprobados(
        inicioMes,
        finMes,
      ),

      this.sumarPagosAprobados(),
    ]);

    const totalAsientos =
      asientosDisponibles +
      asientosOcupados;

    const porcentajeOcupacion =
      totalAsientos > 0
        ? Number(
            (
              (
                asientosOcupados /
                totalAsientos
              ) * 100
            ).toFixed(2),
          )
        : 0;

    return {
      /*
       * Indicadores anteriores.
       */
      usuarios,
      rutas,
      vehiculos,
      viajes,
      reservas,
      asientosDisponibles,
      asientosOcupados,

      /*
       * Indicadores de asientos.
       */
      totalAsientos,
      porcentajeOcupacion,

      /*
       * Indicadores de pagos QR.
       */
      pagosPendientes,
      pagosEnRevision,
      pagosAprobados,
      pagosRechazados,

      /*
       * Ingresos confirmados mediante
       * pagos QR aprobados.
       */
      ingresosHoy,
      ingresosMes,
      ingresosTotales,

      /*
       * Indicadores de tickets.
       */
      tickets,
      ticketsValidos,
      ticketsUtilizados,
      ticketsCancelados,
      ticketsHoy,

      /*
       * Indicadores blockchain.
       */
      blockchainProtegidos,
      bloquesHoy,

      /*
       * Indicadores de reclamos.
       */
      reclamosPendientes,
      reclamosTotal,

      fechaActualizacion:
        ahora.toISOString(),
    };
  }

  async ultimasReservas() {
    return this.reservasRepo.find({
      relations: {
        usuario: true,

        viaje: {
          ruta: true,
          vehiculo: true,
        },

        detalles: {
          asientoViaje: true,
        },
      },

      order: {
        fechaReserva:
          'DESC',
      },

      take:
        10,
    });
  }

  async usuarios() {
    return this.usuariosRepo.find({
      order: {
        fechaRegistro:
          'DESC',
      },
    });
  }

  async reservas() {
    return this.reservasRepo.find({
      relations: {
        usuario: true,

        viaje: {
          ruta: true,
          vehiculo: true,
        },

        detalles: {
          asientoViaje: true,
        },
      },

      order: {
        fechaReserva:
          'DESC',
      },
    });
  }

  async viajes() {
    return this.viajesRepo.find({
      relations: {
        ruta:
          true,

        vehiculo:
          true,
      },

      order: {
        fecha:
          'ASC',

        horaSalida:
          'ASC',
      },
    });
  }

  private async sumarPagosAprobados(
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<number> {
    const consulta =
      this.pagosRepo
        .createQueryBuilder(
          'pago',
        )
        .select(
          'COALESCE(SUM(pago.monto), 0)',
          'total',
        )
        .where(
          'pago.estado = :estado',
          {
            estado:
              EstadoPago.APROBADO,
          },
        );

    if (
      fechaDesde &&
      fechaHasta
    ) {
      consulta.andWhere(
        'pago.fechaRevision BETWEEN :fechaDesde AND :fechaHasta',
        {
          fechaDesde,
          fechaHasta,
        },
      );
    }

    const resultado =
      await consulta.getRawOne<{
        total:
          string | number;
      }>();

    return Number(
      resultado?.total ??
        0,
    );
  }

  private obtenerInicioDia(
    fecha: Date,
  ): Date {
    return new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private obtenerFinDia(
    fecha: Date,
  ): Date {
    return new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate(),
      23,
      59,
      59,
      999,
    );
  }
}