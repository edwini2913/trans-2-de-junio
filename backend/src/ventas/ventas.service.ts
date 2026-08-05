import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectDataSource,
  InjectRepository,
} from '@nestjs/typeorm';

import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

import {
  DataSource,
  EntityManager,
  In,
  Repository,
} from 'typeorm';

import * as QRCode from 'qrcode';

import { Venta } from './entities/venta.entity';

import { CrearVentaOficinaDto } from './dto/crear-venta-oficina.dto';

import { Usuario } from '../users/entities/usuario.entity';

import { Viaje } from '../viajes/entities/viaje.entity';

import {
  AsientoViaje,
  EstadoAsientoViaje,
} from '../asientos/entities/asiento-viaje.entity';

import {
  EstadoReserva,
  Reserva,
} from '../reservas/entities/reserva.entity';

import { DetalleReserva } from '../reservas/entities/detalle-reserva.entity';

import {
  EstadoPago,
  Pago,
} from '../pagos/entities/pago.entity';

import {
  EstadoTicket,
  Ticket,
} from '../tickets/entities/ticket.entity';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventasRepository: Repository<Venta>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly configService: ConfigService,

    private readonly blockchainService: BlockchainService,
  ) {}

  async crearVentaOficina(
    dto: CrearVentaOficinaDto,
  ) {
    this.validarDatosVenta(dto);

    const asientoIds = [
      ...new Set(dto.asientoIds),
    ];

    return this.dataSource.transaction(
      async (manager) => {
        const usuario =
          await this.obtenerUsuarioOpcional(
            manager,
            dto.usuarioId,
          );

        const viaje =
          await this.obtenerViajeBloqueado(
            manager,
            dto.viajeId,
          );

        const asientos =
          await this.obtenerAsientosBloqueados(
            manager,
            asientoIds,
            viaje,
          );

        this.validarDisponibilidadViaje(
          viaje,
          asientos.length,
        );

        const precioUnitario =
          this.obtenerPrecioValido(
            viaje,
          );

        const cantidadPasajes =
          asientos.length;

        const montoTotal =
          precioUnitario *
          cantidadPasajes;

        const codigoOperacion =
          this.generarCodigoOperacion();

        /*
         * UNA SOLA VENTA.
         *
         * La entidad Venta actualmente tiene una relación
         * directa con un asiento. Se guarda el primer asiento
         * como referencia principal de la operación.
         *
         * La lista completa de asientos se guarda en los
         * detalles de la única reserva.
         */
        const asientoPrincipal =
          asientos[0];

        const venta =
          await this.crearVenta(
            manager,
            dto,
            usuario,
            viaje,
            asientoPrincipal,
            montoTotal,
            codigoOperacion,
          );

        /*
         * UNA SOLA RESERVA PARA TODOS LOS ASIENTOS.
         */
        const reserva =
          await this.crearReserva(
            manager,
            usuario,
            viaje,
          );

        /*
         * UN DETALLE POR CADA ASIENTO.
         */
        const detalles: DetalleReserva[] =
          [];

        for (const asiento of asientos) {
          const detalle =
            await this.crearDetalleReserva(
              manager,
              reserva,
              asiento,
              precioUnitario,
            );

          detalles.push(detalle);

          asiento.estado =
            EstadoAsientoViaje.VENDIDO;

          asiento.bloqueadoPor = null;
          asiento.bloqueadoHasta = null;
        }

        await manager.save(
          AsientoViaje,
          asientos,
        );

        viaje.asientosDisponibles =
          Math.max(
            0,
            Number(
              viaje.asientosDisponibles ||
                0,
            ) - cantidadPasajes,
          );

        await manager.save(
          Viaje,
          viaje,
        );

        /*
         * UN SOLO TICKET QR PARA LA RESERVA COMPLETA.
         */
        const ticket =
          await this.crearTicket(
            manager,
            reserva,
          );

        const ticketCompleto = await manager.findOne(Ticket, {
          where: { id: ticket.id },
          relations: {
            reserva: {
              viaje: { ruta: true, vehiculo: true },
              usuario: true,
              detalles: { asientoViaje: true },
            },
          },
        });

        if (!ticketCompleto) {
          throw new NotFoundException('No se pudo recuperar el ticket generado');
        }

        const bloque = await this.blockchainService.registrarTicket(
          manager,
          ticketCompleto,
        );

        return this.construirRespuestaVenta(
          {
            dto,
            viaje,
            asientos,
            venta,
            reserva,
            detalles,
            ticket: ticketCompleto,
            bloque,
            codigoOperacion,
            precioUnitario,
            montoTotal,
          },
        );
      },
    );
  }

  async obtenerReporte() {
    const [
      ventas,
      pagosQrAprobados,
      reservasPendientes,
      viajes,
    ] = await Promise.all([
      this.buscarTodasLasVentas(),
      this.buscarPagosQrAprobados(),
      this.buscarReservasPendientesVigentes(),
      this.buscarViajesParaReporte(),
    ]);

    const liquidaciones = viajes
      .map((viaje) =>
        this.construirLiquidacionViaje(
          viaje,
          ventas,
          pagosQrAprobados,
          reservasPendientes,
        ),
      )
      .sort((a, b) => {
        const fechaA = new Date(
          `${a.fecha}T${a.horaSalida}`,
        ).getTime();

        const fechaB = new Date(
          `${b.fecha}T${b.horaSalida}`,
        ).getTime();

        return fechaB - fechaA;
      });

    const resumen = liquidaciones.reduce(
      (acumulado, item) => {
        acumulado.totalPasajes +=
          item.totalVendido;

        acumulado.totalRecaudado +=
          item.totalRecaudado;

        acumulado.totalEfectivo +=
          item.efectivo.monto;

        acumulado.totalQr +=
          item.qr.monto;

        return acumulado;
      },
      {
        totalPasajes: 0,
        totalRecaudado: 0,
        totalEfectivo: 0,
        totalQr: 0,
      },
    );

    return {
      resumen: {
        totalVentas:
          resumen.totalPasajes,

        totalPasajes:
          resumen.totalPasajes,

        totalRecaudado:
          resumen.totalRecaudado,

        totalEfectivo:
          resumen.totalEfectivo,

        totalQr:
          resumen.totalQr,
      },

      liquidaciones,

      ventasPorVehiculo:
        this.agruparVentasPorVehiculo(
          ventas,
        ),

      ventasPorRuta:
        this.agruparVentasPorRuta(
          ventas,
        ),

      ventas,
    };
  }

  private async buscarPagosQrAprobados(): Promise<Pago[]> {
    return this.dataSource.getRepository(Pago).find({
      where: {
        estado: EstadoPago.APROBADO,
      },

      relations: {
        usuario: true,
        viaje: {
          ruta: true,
          vehiculo: true,
        },
        reserva: true,
      },

      order: {
        fechaRevision: 'DESC',
      },
    });
  }

  private async buscarReservasPendientesVigentes(): Promise<Reserva[]> {
    const ahora = new Date();

    const reservas = await this.dataSource
      .getRepository(Reserva)
      .find({
        where: {
          estado: EstadoReserva.PENDIENTE,
        },

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
      });

    return reservas.filter(
      (reserva) =>
        Boolean(reserva.fechaVencimiento) &&
        Boolean(
          reserva.fechaVencimiento &&
            reserva.fechaVencimiento > ahora,
        ),
    );
  }

  private async buscarViajesParaReporte(): Promise<Viaje[]> {
    const viajes = await this.dataSource.getRepository(Viaje).find({
      relations: {
        ruta: true,
        vehiculo: true,
        asientos: true,
      },

      order: {
        fecha: 'DESC',
        horaSalida: 'DESC',
      },
    });

    return viajes.filter(
      (viaje) =>
        String(viaje.estado || '').toUpperCase() !==
        'CANCELADO',
    );
  }

  private construirLiquidacionViaje(
    viaje: Viaje,
    ventas: Venta[],
    pagosQrAprobados: Pago[],
    reservasPendientes: Reserva[],
  ) {
    const ventasViaje = ventas.filter(
      (venta) => venta.viaje?.id === viaje.id,
    );

    const ventasEfectivo = ventasViaje.filter(
      (venta) =>
        String(venta.metodoPago).toUpperCase() ===
        'EFECTIVO',
    );

    const ventasQrOficina = ventasViaje.filter(
      (venta) =>
        String(venta.metodoPago).toUpperCase() === 'QR',
    );

    const pagosQrViaje = pagosQrAprobados.filter(
      (pago) => pago.viaje?.id === viaje.id,
    );

    const reservasPendientesViaje =
      reservasPendientes.filter(
        (reserva) => reserva.viaje?.id === viaje.id,
      );

    const precioUnitario = Number(viaje.precio || 0);

    const contarAsientosVenta = (venta: Venta) => {
      const monto = Number(venta.monto || 0);

      if (precioUnitario <= 0 || monto <= 0) {
        return 1;
      }

      return Math.max(
        1,
        Math.round(monto / precioUnitario),
      );
    };

    const asientosEfectivo = ventasEfectivo.reduce(
      (total, venta) => total + contarAsientosVenta(venta),
      0,
    );

    const asientosQrOficina = ventasQrOficina.reduce(
      (total, venta) => total + contarAsientosVenta(venta),
      0,
    );

    const asientosQrPasajero = pagosQrViaje.reduce(
      (total, pago) =>
        total +
        (Array.isArray(pago.asientoIds)
          ? pago.asientoIds.length
          : 0),
      0,
    );

    const montoEfectivo = ventasEfectivo.reduce(
      (total, venta) =>
        total + Number(venta.monto || 0),
      0,
    );

    const montoQrOficina = ventasQrOficina.reduce(
      (total, venta) =>
        total + Number(venta.monto || 0),
      0,
    );

    const montoQrPasajero = pagosQrViaje.reduce(
      (total, pago) =>
        total + Number(pago.monto || 0),
      0,
    );

    const pendientes = reservasPendientesViaje.reduce(
      (total, reserva) =>
        total +
        (Array.isArray(reserva.detalles)
          ? reserva.detalles.length
          : 0),
      0,
    );

    const asientosViaje = Array.isArray(viaje.asientos)
      ? viaje.asientos
      : [];

    const capacidad = Math.max(
      Number(viaje.vehiculo?.capacidad || 0),
      asientosViaje.length,
    );

    const disponiblesRegistrados = asientosViaje.filter(
      (asiento) =>
        asiento.estado === EstadoAsientoViaje.DISPONIBLE,
    ).length;

    const disponibles =
      asientosViaje.length > 0
        ? disponiblesRegistrados
        : Math.max(
            0,
            Number(
              viaje.asientosDisponibles ?? capacidad,
            ),
          );

    const cantidadQr =
      asientosQrOficina + asientosQrPasajero;

    const montoQr = montoQrOficina + montoQrPasajero;

    const totalVendido = asientosEfectivo + cantidadQr;
    const totalRecaudado = montoEfectivo + montoQr;
    const asientosContabilizados =
      totalVendido + pendientes + disponibles;

    const detallesPasajeros = [
      ...ventasEfectivo.map((venta) => ({
        id: venta.id,
        codigo: venta.codigoVenta,
        pasajero:
          venta.pasajeroNombre ||
          `${venta.usuario?.nombre || ''} ${
            venta.usuario?.apellido || ''
          }`.trim() ||
          'Pasajero',
        ci: venta.pasajeroCi || '---',
        asientos: venta.asiento?.numero
          ? [venta.asiento.numero]
          : [],
        cantidad: contarAsientosVenta(venta),
        metodoPago: 'EFECTIVO',
        referencia: null,
        monto: Number(venta.monto || 0),
        fecha: venta.fechaVenta,
      })),
      ...ventasQrOficina.map((venta) => ({
        id: venta.id,
        codigo: venta.codigoVenta,
        pasajero:
          venta.pasajeroNombre ||
          `${venta.usuario?.nombre || ''} ${
            venta.usuario?.apellido || ''
          }`.trim() ||
          'Pasajero',
        ci: venta.pasajeroCi || '---',
        asientos: venta.asiento?.numero
          ? [venta.asiento.numero]
          : [],
        cantidad: contarAsientosVenta(venta),
        metodoPago: 'QR',
        referencia: null,
        monto: Number(venta.monto || 0),
        fecha: venta.fechaVenta,
      })),
      ...pagosQrViaje.map((pago) => {
        const ids = new Set(
          Array.isArray(pago.asientoIds)
            ? pago.asientoIds
            : [],
        );

        return {
          id: pago.id,
          codigo: pago.referencia,
          pasajero:
            `${pago.usuario?.nombre || ''} ${
              pago.usuario?.apellido || ''
            }`.trim() || 'Pasajero',
          ci: pago.usuario?.ci || '---',
          asientos: asientosViaje
            .filter((asiento) => ids.has(asiento.id))
            .map((asiento) => asiento.numero)
            .sort((a, b) => Number(a) - Number(b)),
          cantidad: ids.size,
          metodoPago: 'QR',
          referencia: pago.referencia,
          monto: Number(pago.monto || 0),
          fecha:
            pago.fechaRevision || pago.fechaRegistro,
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime(),
    );

    return {
      viajeId: viaje.id,
      numeroFlota:
        viaje.vehiculo?.numeroFlota || null,
      placa: viaje.vehiculo?.placa || 'Sin placa',
      vehiculo:
        `${viaje.vehiculo?.marca || ''} ${
          viaje.vehiculo?.modelo || ''
        }`.trim() || 'Sin vehículo',
      rutaId: viaje.ruta?.id || null,
      origen: viaje.ruta?.origen || 'Sin origen',
      destino: viaje.ruta?.destino || 'Sin destino',
      fecha: viaje.fecha,
      horaSalida: viaje.horaSalida,
      precioUnitario,
      capacidad,
      efectivo: {
        cantidad: asientosEfectivo,
        monto: montoEfectivo,
      },
      qr: {
        cantidad: cantidadQr,
        monto: montoQr,
      },
      pendientes,
      disponibles,
      totalVendido,
      totalRecaudado,
      asientosContabilizados,
      diferenciaCapacidad:
        capacidad - asientosContabilizados,
      cuadreCorrecto:
        capacidad === asientosContabilizados,
      detallesPasajeros,
    };
  }

  async obtenerTodas() {
    return this.buscarTodasLasVentas();
  }

  private validarDatosVenta(
    dto: CrearVentaOficinaDto,
  ): void {
    if (
      !dto.pasajeroNombre?.trim()
    ) {
      throw new BadRequestException(
        'El nombre del pasajero es obligatorio',
      );
    }

    if (!dto.pasajeroCi?.trim()) {
      throw new BadRequestException(
        'El CI del pasajero es obligatorio',
      );
    }

    if (
      !dto.pasajeroTelefono?.trim()
    ) {
      throw new BadRequestException(
        'El teléfono del pasajero es obligatorio',
      );
    }

    if (!dto.viajeId?.trim()) {
      throw new BadRequestException(
        'El viaje es obligatorio',
      );
    }

    if (
      !Array.isArray(
        dto.asientoIds,
      ) ||
      dto.asientoIds.length === 0
    ) {
      throw new BadRequestException(
        'Selecciona al menos un asiento',
      );
    }

    const idsValidos =
      dto.asientoIds.every(
        (id) =>
          typeof id === 'string' &&
          id.trim().length > 0,
      );

    if (!idsValidos) {
      throw new BadRequestException(
        'Uno o más identificadores de asiento no son válidos',
      );
    }

    if (
      new Set(dto.asientoIds)
        .size !==
      dto.asientoIds.length
    ) {
      throw new BadRequestException(
        'Existen asientos repetidos en la solicitud',
      );
    }
  }

  private validarDisponibilidadViaje(
    viaje: Viaje,
    cantidadAsientos: number,
  ): void {
    if (cantidadAsientos <= 0) {
      throw new BadRequestException(
        'La cantidad de asientos no es válida',
      );
    }

    if (
      Number(
        viaje.asientosDisponibles,
      ) < cantidadAsientos
    ) {
      throw new BadRequestException(
        'No existen suficientes asientos disponibles',
      );
    }
  }

  private obtenerPrecioValido(
    viaje: Viaje,
  ): number {
    const precio = Number(
      viaje.precio || 0,
    );

    if (
      !Number.isFinite(precio) ||
      precio <= 0
    ) {
      throw new BadRequestException(
        'El precio del viaje no es válido',
      );
    }

    return precio;
  }

  private async obtenerUsuarioOpcional(
    manager: EntityManager,
    usuarioId?: string,
  ): Promise<Usuario | null> {
    if (!usuarioId?.trim()) {
      return null;
    }

    const usuario =
      await manager.findOne(
        Usuario,
        {
          where: {
            id: usuarioId,
          },
        },
      );

    if (!usuario) {
      throw new NotFoundException(
        'El usuario seleccionado no existe',
      );
    }

    return usuario;
  }

  private async obtenerViajeBloqueado(
    manager: EntityManager,
    viajeId: string,
  ): Promise<Viaje> {
    const viaje =
      await manager.findOne(
        Viaje,
        {
          where: {
            id: viajeId,
          },

          relations: {
            ruta: true,
            vehiculo: true,
          },

          lock: {
            mode:
              'pessimistic_write',
          },
        },
      );

    if (!viaje) {
      throw new NotFoundException(
        'El viaje no existe',
      );
    }

    return viaje;
  }

  private async obtenerAsientosBloqueados(
    manager: EntityManager,
    asientoIds: string[],
    viaje: Viaje,
  ): Promise<AsientoViaje[]> {
    const asientos =
      await manager.find(
        AsientoViaje,
        {
          where: {
            id: In(asientoIds),
          },

          relations: {
            viaje: true,
          },

          order: {
            numero: 'ASC',
          },

          lock: {
            mode:
              'pessimistic_write',
          },
        },
      );

    if (
      asientos.length !==
      asientoIds.length
    ) {
      throw new NotFoundException(
        'Uno o más asientos no existen',
      );
    }

    for (const asiento of asientos) {
      if (
        asiento.viaje?.id !==
        viaje.id
      ) {
        throw new BadRequestException(
          `El asiento ${asiento.numero} no pertenece al viaje seleccionado`,
        );
      }

      if (
        asiento.estado !==
        EstadoAsientoViaje.DISPONIBLE
      ) {
        throw new BadRequestException(
          `El asiento ${asiento.numero} no está disponible`,
        );
      }
    }

    return asientos;
  }

  private async crearVenta(
    manager: EntityManager,
    dto: CrearVentaOficinaDto,
    usuario: Usuario | null,
    viaje: Viaje,
    asientoPrincipal: AsientoViaje,
    montoTotal: number,
    codigoVenta: string,
  ): Promise<Venta> {
    const venta = manager.create(
      Venta,
      {
        codigoVenta,

        usuario: usuario
          ? ({
              id: usuario.id,
            } as Usuario)
          : null,

        pasajeroNombre:
          dto.pasajeroNombre.trim(),

        pasajeroCi:
          dto.pasajeroCi.trim(),

        pasajeroTelefono:
          dto.pasajeroTelefono.trim(),

        pasajeroEmail:
          dto.pasajeroEmail?.trim() ||
          null,

        viaje: {
          id: viaje.id,
        } as Viaje,

        asiento: {
          id: asientoPrincipal.id,
        } as AsientoViaje,

        monto: montoTotal,

        metodoPago:
          dto.metodoPago,

        estado: 'PAGADA',

        origenVenta: 'OFICINA',
      },
    );

    return manager.save(
      Venta,
      venta,
    );
  }

  private async crearReserva(
    manager: EntityManager,
    usuario: Usuario | null,
    viaje: Viaje,
  ): Promise<Reserva> {
    const codigoReserva =
      `RES-${Date.now()}-${randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;

    const reserva = manager.create(
      Reserva,
      {
        usuario: usuario
          ? ({
              id: usuario.id,
            } as Usuario)
          : null,

        viaje: {
          id: viaje.id,
        } as Viaje,

        codigoReserva,

        estado:
          EstadoReserva.CONFIRMADA,
      },
    );

    return manager.save(
      Reserva,
      reserva,
    );
  }

  private async crearDetalleReserva(
    manager: EntityManager,
    reserva: Reserva,
    asiento: AsientoViaje,
    precio: number,
  ): Promise<DetalleReserva> {
    const detalle = manager.create(
      DetalleReserva,
      {
        reserva: {
          id: reserva.id,
        } as Reserva,

        asientoViaje: {
          id: asiento.id,
        } as AsientoViaje,

        precio,
      },
    );

    return manager.save(
      DetalleReserva,
      detalle,
    );
  }

  private async crearTicket(
    manager: EntityManager,
    reserva: Reserva,
  ): Promise<Ticket> {
    const numeroTicket =
      await this.obtenerSiguienteNumeroTicket(
        manager,
      );

    const codigoTicket =
      `T-${String(numeroTicket).padStart(
        6,
        '0',
      )}`;

    const tokenValidacion =
      randomUUID();

    const frontendUrl =
      this.configService.get<string>(
        'FRONTEND_URL',
      ) ??
      'http://localhost:5173';

    const urlValidacion =
      `${frontendUrl.replace(
        /\/$/,
        '',
      )}` +
      `/validar-ticket/${tokenValidacion}`;

    const imagenQr =
      await QRCode.toDataURL(
        urlValidacion,
        {
          width: 700,
          margin: 1,
          errorCorrectionLevel:
            'H',
        },
      );

    const ticket = manager.create(
      Ticket,
      {
        reserva: {
          id: reserva.id,
        } as Reserva,

        numeroTicket:
          String(numeroTicket),

        codigoTicket,
        tokenValidacion,
        imagenQr,

        estado:
          EstadoTicket.VALIDO,

        fechaUso: null,
      },
    );

    return manager.save(
      Ticket,
      ticket,
    );
  }
    private async obtenerSiguienteNumeroTicket(
    manager: EntityManager,
  ): Promise<number> {
    const resultado: Array<{
      numero?: string | number;
    }> = await manager.query(`
      SELECT nextval(
        'sistema.tickets_numero_seq'
      ) AS numero
    `);

    const numero = Number(
      resultado?.[0]?.numero,
    );

    if (
      !Number.isFinite(numero) ||
      numero <= 0
    ) {
      throw new BadRequestException(
        'No se pudo generar el número del ticket',
      );
    }

    return numero;
  }

  private construirRespuestaVenta({
    dto,
    viaje,
    asientos,
    venta,
    reserva,
    detalles,
    ticket,
    bloque,
    codigoOperacion,
    precioUnitario,
    montoTotal,
  }: {
    dto: CrearVentaOficinaDto;
    viaje: Viaje;
    asientos: AsientoViaje[];
    venta: Venta;
    reserva: Reserva;
    detalles: DetalleReserva[];
    ticket: Ticket;
    bloque: { indice: string; hashBloque: string };
    codigoOperacion: string;
    precioUnitario: number;
    montoTotal: number;
  }) {
    const asientosRespuesta =
      asientos.map((asiento) => ({
        id: asiento.id,
        numero: asiento.numero,
        estado: asiento.estado,
      }));

    const numerosAsientos =
      asientos.map(
        (asiento) => asiento.numero,
      );

    const ventaRespuesta = {
      id: venta.id,

      codigoVenta:
        venta.codigoVenta,

      monto: Number(
        venta.monto,
      ),

      total: montoTotal,

      cantidadPasajes:
        asientos.length,

      precioUnitario,

      metodoPago:
        venta.metodoPago,

      estado: venta.estado,

      fechaVenta:
        venta.fechaVenta,

      asientoPrincipalId:
        asientos[0]?.id,

      asientos:
        asientosRespuesta,
    };

    const reservaRespuesta = {
      id: reserva.id,

      codigoReserva:
        reserva.codigoReserva,

      estado: reserva.estado,

      asientos:
        asientosRespuesta,
    };

    const ticketRespuesta = {
      id: ticket.id,

      numeroTicket:
        ticket.numeroTicket,

      codigoTicket:
        ticket.codigoTicket,

      tokenValidacion:
        ticket.tokenValidacion,

      imagenQr:
        ticket.imagenQr,

      estado:
        ticket.estado,

      fechaUso:
        ticket.fechaUso,

      blockchain: {
        registrado: true,
        indice: bloque.indice,
        hashBloque: bloque.hashBloque,
      },

      cantidadPasajes:
        asientos.length,

      precioUnitario,

      montoTotal,

      asientos:
        asientosRespuesta,

      numerosAsientos,

      reserva:
        reservaRespuesta,
    };

    return {
      ok: true,

      mensaje:
        asientos.length === 1
          ? 'Venta registrada y ticket generado correctamente'
          : `Venta de ${asientos.length} pasajes registrada con un único ticket`,

      codigoOperacion,

      cantidadPasajes:
        asientos.length,

      precioUnitario,

      montoTotal,

      total: montoTotal,

      metodoPago:
        dto.metodoPago,

      pasajero: {
        nombre:
          dto.pasajeroNombre.trim(),

        ci:
          dto.pasajeroCi.trim(),

        telefono:
          dto.pasajeroTelefono.trim(),

        email:
          dto.pasajeroEmail?.trim() ||
          null,
      },

      viaje: {
        id: viaje.id,

        ruta: {
          id: viaje.ruta?.id,

          origen:
            viaje.ruta?.origen,

          destino:
            viaje.ruta?.destino,
        },

        fecha: viaje.fecha,

        horaSalida:
          viaje.horaSalida,

        precio:
          precioUnitario,

        vehiculo: {
          id:
            viaje.vehiculo?.id,

          marca:
            viaje.vehiculo?.marca,

          modelo:
            viaje.vehiculo?.modelo,

          tipo:
            viaje.vehiculo?.tipo,

          placa:
            viaje.vehiculo?.placa,

          capacidad:
            viaje.vehiculo?.capacidad,
        },
      },

      asientos:
        asientosRespuesta,

      numerosAsientos,

      detalles: detalles.map(
        (detalle, indice) => ({
          id: detalle.id,

          precio: Number(
            detalle.precio,
          ),

          asientoViajeId:
            asientos[indice]?.id,

          numeroAsiento:
            asientos[indice]
              ?.numero,
        }),
      ),

      /*
       * RESPUESTA PRINCIPAL:
       * UNA VENTA, UNA RESERVA Y UN TICKET.
       */
      venta:
        ventaRespuesta,

      reserva:
        reservaRespuesta,

      ticket:
        ticketRespuesta,

      /*
       * Se conservan también los arreglos para mantener
       * compatibilidad con otros componentes anteriores.
       * Cada arreglo contiene solamente un registro.
       */
      ventas: [
        ventaRespuesta,
      ],

      reservas: [
        reservaRespuesta,
      ],

      tickets: [
        ticketRespuesta,
      ],
    };
  }

  private buscarTodasLasVentas() {
    return this.ventasRepository.find({
      relations: {
        usuario: true,

        viaje: {
          ruta: true,
          vehiculo: true,
        },

        asiento: true,
      },

      order: {
        fechaVenta: 'DESC',
      },
    });
  }

  private agruparVentasPorVehiculo(
    ventas: Venta[],
  ) {
    const resultado: Record<
      string,
      {
        vehiculo: string;
        placa: string;
        cantidad: number;
        total: number;
      }
    > = {};

    for (const venta of ventas) {
      const vehiculo =
        venta.viaje?.vehiculo;

      const nombre =
        `${vehiculo?.marca || ''} ${
          vehiculo?.modelo || ''
        }`.trim() ||
        'Sin vehículo';

      const clave =
        vehiculo?.id || nombre;

      if (!resultado[clave]) {
        resultado[clave] = {
          vehiculo: nombre,

          placa:
            vehiculo?.placa ||
            'Sin placa',

          cantidad: 0,

          total: 0,
        };
      }

      resultado[clave].cantidad += 1;

      resultado[clave].total +=
        Number(
          venta.monto || 0,
        );
    }

    return Object.values(
      resultado,
    ).sort(
      (a, b) =>
        b.total - a.total,
    );
  }

  private agruparVentasPorRuta(
    ventas: Venta[],
  ) {
    const resultado: Record<
      string,
      {
        ruta: string;
        cantidad: number;
        total: number;
      }
    > = {};

    for (const venta of ventas) {
      const ruta =
        venta.viaje?.ruta;

      const nombre =
        `${
          ruta?.origen ||
          'Sin origen'
        } → ${
          ruta?.destino ||
          'Sin destino'
        }`;

      const clave =
        ruta?.id || nombre;

      if (!resultado[clave]) {
        resultado[clave] = {
          ruta: nombre,

          cantidad: 0,

          total: 0,
        };
      }

      resultado[clave].cantidad += 1;

      resultado[clave].total +=
        Number(
          venta.monto || 0,
        );
    }

    return Object.values(
      resultado,
    ).sort(
      (a, b) =>
        b.total - a.total,
    );
  }

  private generarCodigoOperacion(): string {
    return `VO-${Date.now()}-${randomUUID()
      .slice(0, 6)
      .toUpperCase()}`;
  }
}
