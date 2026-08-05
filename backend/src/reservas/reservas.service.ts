import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { InjectDataSource } from "@nestjs/typeorm";

import { DataSource, EntityManager, LessThan } from "typeorm";

import {
  AsientoViaje,
  EstadoAsiento,
} from "../asientos/entities/asiento-viaje.entity";

import {
  DestinatarioNotificacion,
  PrioridadNotificacion,
  TipoNotificacion,
} from "../notificaciones/enums/notificacion.enums";

import { NotificacionesService } from "../notificaciones/notificaciones.service";

import { TicketsService } from "../tickets/tickets.service";

import { AuditoriaService } from "../auditoria/auditoria.service";

import {
  ResultadoAuditoria,
  TipoAccionAuditoria,
} from "../auditoria/entities/auditoria.entity";

import { Usuario } from "../users/entities/usuario.entity";

import { EstadoViaje, Viaje } from "../viajes/entities/viaje.entity";

import { CrearReservaDto } from "./dto/crear-reserva.dto";

import { DetalleReserva } from "./entities/detalle-reserva.entity";

import { EstadoReserva, Reserva } from "./entities/reserva.entity";

interface ResultadoReserva {
  reserva: Reserva;
  cantidadAsientos: number;
  precioUnitario: number;
  montoTotal: number;
}

@Injectable()
export class ReservasService {
constructor(
  @InjectDataSource()
  private readonly dataSource: DataSource,

  private readonly ticketsService: TicketsService,

  private readonly notificacionesService: NotificacionesService,

  private readonly auditoriaService: AuditoriaService,
) {}
  /**
   * Crea una reserva del pasajero,
   * genera un único ticket para todos
   * los asientos y notifica al administrador.
   */
  async crearReserva(dto: CrearReservaDto) {
    this.validarCrearReservaDto(dto);

    const asientoIds = [...new Set(dto.asientoIds)];

    const resultado = await this.dataSource.transaction(
      async (manager): Promise<ResultadoReserva> => {
        const usuario = await manager.findOne(Usuario, {
          where: {
            id: dto.usuarioId,
          },
        });

        if (!usuario) {
          throw new NotFoundException("El usuario seleccionado no existe.");
        }

        if (!usuario.estado) {
          throw new BadRequestException("El usuario se encuentra inactivo.");
        }

        const viaje = await this.buscarViajeBloqueado(manager, dto.viajeId);

        if (viaje.estado !== EstadoViaje.PROGRAMADO) {
          throw new BadRequestException(
            "El viaje no está disponible para realizar reservas.",
          );
        }

        const asientos = await this.buscarAsientosBloqueados(
          manager,
          asientoIds,
        );

        this.validarAsientos(asientos, dto.viajeId, dto.usuarioId);

        const precioUnitario = Number(viaje.precio);

        if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
          throw new BadRequestException("El precio del viaje no es válido.");
        }

        const disponibles = Number(viaje.asientosDisponibles ?? 0);

        if (disponibles < asientos.length) {
          throw new ConflictException(
            "No existen suficientes asientos disponibles.",
          );
        }

        const codigoReserva = await this.generarCodigoReserva(manager);

        const reserva = manager.create(Reserva, {
          usuario,
          viaje,
          codigoReserva,

          estado: EstadoReserva.CONFIRMADA,

          fechaVencimiento: null,
        });

        const reservaGuardada = await manager.save(Reserva, reserva);

        for (const asiento of asientos) {
          asiento.estado = EstadoAsiento.RESERVADO;

          asiento.bloqueadoPor = null;

          asiento.bloqueadoHasta = null;
        }

        await manager.save(AsientoViaje, asientos);

        const detalles = asientos.map((asiento) =>
          manager.create(DetalleReserva, {
            reserva: reservaGuardada,

            asientoViaje: asiento,

            precio: precioUnitario,
          }),
        );

        await manager.save(DetalleReserva, detalles);

        viaje.asientosDisponibles = Math.max(0, disponibles - asientos.length);

        await manager.save(Viaje, viaje);

        const reservaCompleta = await this.buscarReservaCompleta(
          manager,
          reservaGuardada.id,
        );

        return {
          reserva: reservaCompleta,

          cantidadAsientos: asientos.length,

          precioUnitario,

          montoTotal: precioUnitario * asientos.length,
        };
      },
    );

    let ticket;

    try {
      ticket = await this.ticketsService.generarTicket(resultado.reserva.id);
    } catch (error) {
      await this.revertirReservaPorErrorDeTicket(resultado.reserva.id);

      throw new InternalServerErrorException(
        "No se pudo generar el ticket. La reserva fue revertida.",
        {
          cause: error,
        },
      );
    }

    const numerosAsientos = resultado.reserva.detalles.map(
      (detalle) => detalle.asientoViaje.numero,
    );

    const usuario = resultado.reserva.usuario;

    const nombreUsuario =
      `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim() ||
      usuario?.email ||
      "Pasajero";

    const ruta = resultado.reserva.viaje.ruta;

    const descripcionRuta = `${ruta.origen} → ${ruta.destino}`;

    const textoAsientos = numerosAsientos.join(", ");

    /**
     * La notificación se crea después
     * de generar correctamente el ticket.
     *
     * Si la notificación falla, la compra
     * permanece registrada y el error queda
     * guardado en la consola del backend.
     */
    try {
      await this.notificacionesService.crear({
        rolDestinatario: DestinatarioNotificacion.ADMINISTRADOR,

        tipo: TipoNotificacion.NUEVA_COMPRA,

        prioridad: PrioridadNotificacion.NORMAL,

        titulo: `Nueva compra ${resultado.reserva.codigoReserva}`,

        mensaje: `${nombreUsuario} compró ${resultado.cantidadAsientos} ${
          resultado.cantidadAsientos === 1 ? "pasaje" : "pasajes"
        } para ${descripcionRuta}. Asientos: ${textoAsientos}. Total: Bs ${resultado.montoTotal.toFixed(
          2,
        )}.`,

        referenciaTipo: "RESERVA",

        referenciaId: resultado.reserva.id,

        rutaDestino: `/admin/reservas/${resultado.reserva.id}`,
      });
    } catch (errorNotificacion) {
      console.error(
        "La reserva se creó, pero no se pudo generar la notificación administrativa:",
        errorNotificacion,
      );
    }

    try {
      await this.auditoriaService.registrar({
        usuarioId:
          usuario?.id ??
          dto.usuarioId,

        usuarioNombre:
          nombreUsuario,

        usuarioEmail:
          usuario?.email ??
          null,

        usuarioRol:
          usuario?.rol ??
          null,

        accion:
          TipoAccionAuditoria.COMPRAR,

        modulo:
          "RESERVAS",

        descripcion:
          "Compra y reserva confirmada correctamente.",

        entidad:
          "Reserva",

        entidadId:
          resultado.reserva.id,

        resultado:
          ResultadoAuditoria.EXITOSO,

        datosNuevos: {
          codigoReserva:
            resultado.reserva.codigoReserva,

          cantidadAsientos:
            resultado.cantidadAsientos,

          numerosAsientos,

          precioUnitario:
            resultado.precioUnitario,

          montoTotal:
            resultado.montoTotal,

          viajeId:
            resultado.reserva.viaje.id,

          ruta:
            descripcionRuta,
        },
      });
    } catch (errorAuditoria) {
      /*
       * Una falla en la auditoría no debe
       * cancelar una compra ya registrada.
       */
      console.error(
        "La compra se completó, pero no se pudo registrar la auditoría:",
        errorAuditoria,
      );
    }

    return {
      ok: true,

      mensaje: "Reserva realizada correctamente.",

      codigoReserva: resultado.reserva.codigoReserva,

      cantidadAsientos: resultado.cantidadAsientos,

      precioUnitario: resultado.precioUnitario,

      montoTotal: resultado.montoTotal,

      asientos: resultado.reserva.detalles.map((detalle) => ({
        id: detalle.asientoViaje.id,

        numero: detalle.asientoViaje.numero,

        estado: detalle.asientoViaje.estado,

        precio: Number(detalle.precio),
      })),

      reserva: resultado.reserva,

      ticket,
    };
  }

  /**
   * Aparta uno o varios asientos durante dos horas.
   * No genera ticket ni registra un pago.
   */
  async crearReservaPendiente(dto: CrearReservaDto) {
    this.validarCrearReservaDto(dto);
    await this.vencerReservasExpiradas();

    const asientoIds = [...new Set(dto.asientoIds)];

    const resultado = await this.dataSource.transaction(async (manager) => {
      const usuario = await manager.findOne(Usuario, {
        where: {
          id: dto.usuarioId,
        },
      });

      if (!usuario) {
        throw new NotFoundException("El usuario seleccionado no existe.");
      }

      if (!usuario.estado) {
        throw new BadRequestException("El usuario se encuentra inactivo.");
      }

      const viaje = await this.buscarViajeBloqueado(manager, dto.viajeId);

      if (viaje.estado !== EstadoViaje.PROGRAMADO) {
        throw new BadRequestException(
          "El viaje no está disponible para reservar.",
        );
      }

      const asientos = await this.buscarAsientosBloqueados(manager, asientoIds);

      this.validarAsientos(asientos, dto.viajeId, dto.usuarioId);

      const precioUnitario = Number(viaje.precio);

      if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
        throw new BadRequestException("El precio del viaje no es válido.");
      }

      const disponibles = Number(viaje.asientosDisponibles ?? 0);

      if (disponibles < asientos.length) {
        throw new ConflictException(
          "No existen suficientes asientos disponibles.",
        );
      }

      const fechaVencimiento = new Date(Date.now() + 2 * 60 * 60 * 1000);

      const reserva = await manager.save(
        Reserva,
        manager.create(Reserva, {
          usuario,
          viaje,
          codigoReserva: await this.generarCodigoReserva(manager),
          estado: EstadoReserva.PENDIENTE,
          fechaVencimiento,
        }),
      );

      for (const asiento of asientos) {
        asiento.estado = EstadoAsiento.BLOQUEADO;
        asiento.bloqueadoPor = usuario.id;
        asiento.bloqueadoHasta = fechaVencimiento;
      }

      await manager.save(AsientoViaje, asientos);

      await manager.save(
        DetalleReserva,
        asientos.map((asiento) =>
          manager.create(DetalleReserva, {
            reserva,
            asientoViaje: asiento,
            precio: precioUnitario,
          }),
        ),
      );

      viaje.asientosDisponibles = Math.max(0, disponibles - asientos.length);

      await manager.save(Viaje, viaje);

      return {
        reserva: await this.buscarReservaCompleta(manager, reserva.id),
        precioUnitario,
        montoTotal: precioUnitario * asientos.length,
      };
    });

    try {
      await this.notificacionesService.crear({
        rolDestinatario: DestinatarioNotificacion.ADMINISTRADOR,
        tipo: TipoNotificacion.NUEVA_RESERVA,
        prioridad: PrioridadNotificacion.NORMAL,
        titulo: `Nueva reserva ${resultado.reserva.codigoReserva}`,
        mensaje: `${resultado.reserva.usuario?.nombre ?? "Un pasajero"} reservó ${resultado.reserva.detalles.length} asiento(s). La reserva vence en dos horas.`,
        referenciaTipo: "RESERVA",
        referenciaId: resultado.reserva.id,
        rutaDestino: `/admin/reservas/${resultado.reserva.id}`,
      });
    } catch {
      // La reserva no se revierte si falla una notificación.
    }

    return {
      ok: true,
      mensaje: "Reserva creada. Tienes dos horas para realizar el pago.",
      reserva: resultado.reserva,
      precioUnitario: resultado.precioUnitario,
      montoTotal: resultado.montoTotal,
      ticket: null,
    };
  }

  /**
   * Convierte una reserva pendiente en confirmada y genera su ticket.
   * Es el método que utiliza PagosService cuando la administradora aprueba.
   */
  async confirmarReservaPendiente(reservaId: string) {
    this.validarId(reservaId, "El identificador de la reserva es obligatorio.");

    const resultado = await this.dataSource.transaction(async (manager) => {
      const reserva = await this.buscarReservaBloqueada(manager, reservaId);

      if (reserva.estado !== EstadoReserva.PENDIENTE) {
        throw new ConflictException("La reserva ya no está pendiente.");
      }

      if (!reserva.fechaVencimiento || reserva.fechaVencimiento <= new Date()) {
        throw new ConflictException(
          "La reserva venció. Selecciona nuevamente tus asientos.",
        );
      }

      for (const detalle of reserva.detalles) {
        const asiento = detalle.asientoViaje;

        if (
          asiento.estado !== EstadoAsiento.BLOQUEADO ||
          asiento.bloqueadoPor !== reserva.usuario?.id
        ) {
          throw new ConflictException(
            `El asiento ${asiento.numero} ya no pertenece a esta reserva.`,
          );
        }

        asiento.estado = EstadoAsiento.RESERVADO;
        asiento.bloqueadoPor = null;
        asiento.bloqueadoHasta = null;
      }

      await manager.save(
        AsientoViaje,
        reserva.detalles.map(({ asientoViaje }) => asientoViaje),
      );

      reserva.estado = EstadoReserva.CONFIRMADA;
      reserva.fechaVencimiento = null;

      await manager.save(Reserva, reserva);

      return this.buscarReservaCompleta(manager, reserva.id);
    });

    const ticket = await this.ticketsService.generarTicket(resultado.id);

    return {
      ok: true,
      mensaje: "Reserva pagada y confirmada correctamente.",
      reserva: resultado,
      ticket,
    };
  }

  async obtenerPorId(reservaId: string): Promise<Reserva> {
    await this.vencerReservasExpiradas();

    const reserva = await this.dataSource.getRepository(Reserva).findOne({
      where: {
        id: reservaId,
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

    if (!reserva) {
      throw new NotFoundException("La reserva seleccionada no existe.");
    }

    return reserva;
  }

  /** Libera reservas vencidas de manera idempotente. */
  async vencerReservasExpiradas(): Promise<void> {
    const vencidas = await this.dataSource.getRepository(Reserva).find({
      where: {
        estado: EstadoReserva.PENDIENTE,
        fechaVencimiento: LessThan(new Date()),
      },
      select: {
        id: true,
      },
    });

    for (const item of vencidas) {
      await this.dataSource.transaction(async (manager) => {
        const reserva = await this.buscarReservaBloqueada(manager, item.id);

        if (
          reserva.estado !== EstadoReserva.PENDIENTE ||
          !reserva.fechaVencimiento ||
          reserva.fechaVencimiento > new Date()
        ) {
          return;
        }

        const asientos = reserva.detalles.map(
          ({ asientoViaje }) => asientoViaje,
        );

        for (const asiento of asientos) {
          if (asiento.estado === EstadoAsiento.BLOQUEADO) {
            asiento.estado = EstadoAsiento.DISPONIBLE;
            asiento.bloqueadoPor = null;
            asiento.bloqueadoHasta = null;
          }
        }

        await manager.save(AsientoViaje, asientos);

        reserva.viaje.asientosDisponibles =
          Number(reserva.viaje.asientosDisponibles ?? 0) + asientos.length;

        await manager.save(Viaje, reserva.viaje);

        reserva.estado = EstadoReserva.VENCIDA;
        await manager.save(Reserva, reserva);
      });
    }
  }

  /**
   * Obtiene las reservas realizadas
   * por un pasajero.
   */
  async obtenerPorUsuario(usuarioId: string): Promise<Reserva[]> {
    await this.vencerReservasExpiradas();
    this.validarId(usuarioId, "El identificador del usuario es obligatorio.");

    const usuarioExiste = await this.dataSource.getRepository(Usuario).exists({
      where: {
        id: usuarioId,
      },
    });

    if (!usuarioExiste) {
      throw new NotFoundException("El usuario seleccionado no existe.");
    }

    return this.dataSource.getRepository(Reserva).find({
      where: {
        usuario: {
          id: usuarioId,
        },
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

      order: {
        fechaReserva: "DESC",
      },
    });
  }

  /**
   * Cancela una reserva y libera
   * todos sus asientos.
   */
  async cancelarReservaUsuario(id: string, usuarioId: string) {
    this.validarId(id, "El identificador de la reserva es obligatorio.");
    this.validarId(
      usuarioId,
      "El identificador del usuario es obligatorio.",
    );

    return this.eliminarReserva(id, usuarioId, true);
  }

  async eliminarReserva(
    id: string,
    usuarioId?: string,
    soloPendiente = false,
  ) {
    this.validarId(id, "El identificador de la reserva es obligatorio.");

    return this.dataSource.transaction(async (manager) => {
      const reserva = await this.buscarReservaBloqueada(manager, id);

      if (usuarioId && reserva.usuario?.id !== usuarioId) {
        throw new NotFoundException(
          "La reserva seleccionada no pertenece al usuario conectado.",
        );
      }

      if (reserva.estado === EstadoReserva.CANCELADA) {
        throw new ConflictException("La reserva ya se encuentra cancelada.");
      }

      if (soloPendiente && reserva.estado !== EstadoReserva.PENDIENTE) {
        throw new ConflictException(
          "Solamente puedes cancelar reservas pendientes de pago.",
        );
      }

      const asientos = reserva.detalles.map((detalle) => detalle.asientoViaje);

      for (const asiento of asientos) {
        asiento.estado = EstadoAsiento.DISPONIBLE;

        asiento.bloqueadoPor = null;

        asiento.bloqueadoHasta = null;
      }

      if (asientos.length > 0) {
        await manager.save(AsientoViaje, asientos);
      }

      reserva.viaje.asientosDisponibles =
        Number(reserva.viaje.asientosDisponibles ?? 0) + asientos.length;

      await manager.save(Viaje, reserva.viaje);

      reserva.estado = EstadoReserva.CANCELADA;

      await manager.save(Reserva, reserva);

      return {
        ok: true,

        mensaje: "Reserva cancelada correctamente.",

        codigoReserva: reserva.codigoReserva,

        asientosLiberados: asientos.map((asiento) => asiento.numero),
      };
    });
  }
  /**
   * Busca y bloquea el viaje para evitar
   * compras simultáneas inconsistentes.
   */
  private async buscarViajeBloqueado(
    manager: EntityManager,
    viajeId: string,
  ): Promise<Viaje> {
    const viaje = await manager
      .getRepository(Viaje)
      .createQueryBuilder("viaje")
      .setLock("pessimistic_write")
      .where("viaje.id = :viajeId", {
        viajeId,
      })
      .getOne();

    if (!viaje) {
      throw new NotFoundException("El viaje seleccionado no existe.");
    }

    return viaje;
  }

  /**
   * Busca y bloquea los asientos
   * seleccionados.
   */
  private async buscarAsientosBloqueados(
    manager: EntityManager,
    asientoIds: string[],
  ): Promise<AsientoViaje[]> {
    const asientos = await manager
      .getRepository(AsientoViaje)
      .createQueryBuilder("asiento")
      .innerJoinAndSelect("asiento.viaje", "viaje")
      .where("asiento.id IN (:...asientoIds)", {
        asientoIds,
      })
      .orderBy("asiento.numero", "ASC")
      .setLock("pessimistic_write", undefined, ["asiento"])
      .getMany();

    if (asientos.length !== asientoIds.length) {
      throw new NotFoundException(
        "Uno o más asientos seleccionados no existen.",
      );
    }

    return asientos;
  }

  /**
   * Verifica que todos los asientos
   * estén disponibles y pertenezcan
   * al viaje seleccionado.
   */
  private validarAsientos(
    asientos: AsientoViaje[],
    viajeId: string,
    usuarioId: string,
  ): void {
    const ahora = new Date();

    for (const asiento of asientos) {
      if (asiento.viaje.id !== viajeId) {
        throw new BadRequestException(
          `El asiento ${asiento.numero} no pertenece al viaje seleccionado.`,
        );
      }

      if (asiento.estado === EstadoAsiento.RESERVADO) {
        throw new ConflictException(
          `El asiento ${asiento.numero} ya está reservado.`,
        );
      }

      if (asiento.estado === EstadoAsiento.VENDIDO) {
        throw new ConflictException(
          `El asiento ${asiento.numero} ya fue vendido.`,
        );
      }

      if (asiento.estado === EstadoAsiento.BLOQUEADO) {
        const bloqueoVigente =
          Boolean(asiento.bloqueadoHasta) &&
          Boolean(asiento.bloqueadoHasta && asiento.bloqueadoHasta > ahora);

        if (bloqueoVigente && asiento.bloqueadoPor !== usuarioId) {
          throw new ConflictException(
            `El asiento ${asiento.numero} está siendo seleccionado por otro usuario.`,
          );
        }

        if (bloqueoVigente && asiento.bloqueadoPor === usuarioId) {
          continue;
        }

        asiento.estado = EstadoAsiento.DISPONIBLE;

        asiento.bloqueadoPor = null;

        asiento.bloqueadoHasta = null;
      }

      if (asiento.estado !== EstadoAsiento.DISPONIBLE) {
        throw new ConflictException(
          `El asiento ${asiento.numero} no está disponible.`,
        );
      }
    }
  }

  /**
   * Genera un código único
   * para la reserva.
   */
  private async generarCodigoReserva(manager: EntityManager): Promise<string> {
    for (let intento = 0; intento < 5; intento += 1) {
      const codigo = `RES-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      const existe = await manager.exists(Reserva, {
        where: {
          codigoReserva: codigo,
        },
      });

      if (!existe) {
        return codigo;
      }
    }

    throw new InternalServerErrorException(
      "No se pudo generar un código único para la reserva.",
    );
  }

  /**
   * Recupera la reserva con usuario,
   * ruta, vehículo y asientos.
   */
  private async buscarReservaCompleta(
    manager: EntityManager,
    reservaId: string,
  ): Promise<Reserva> {
    const reserva = await manager.findOne(Reserva, {
      where: {
        id: reservaId,
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

    if (!reserva) {
      throw new NotFoundException("No se pudo recuperar la reserva creada.");
    }

    return reserva;
  }

/**
 * Recupera una reserva completa y bloquea
 * únicamente la fila principal de la reserva.
 *
 * Las relaciones se consultan mediante LEFT JOIN,
 * pero no se incluyen dentro del FOR UPDATE.
 */
private async buscarReservaBloqueada(
  manager: EntityManager,
  reservaId: string,
): Promise<Reserva> {
  const reserva = await manager
    .getRepository(Reserva)
    .createQueryBuilder("reserva")
    .leftJoinAndSelect(
      "reserva.viaje",
      "viaje",
    )
    .leftJoinAndSelect(
      "viaje.ruta",
      "ruta",
    )
    .leftJoinAndSelect(
      "viaje.vehiculo",
      "vehiculo",
    )
    .leftJoinAndSelect(
      "reserva.usuario",
      "usuario",
    )
    .leftJoinAndSelect(
      "reserva.detalles",
      "detalle",
    )
    .leftJoinAndSelect(
      "detalle.asientoViaje",
      "asientoViaje",
    )
    .where(
      "reserva.id = :reservaId",
      {
        reservaId,
      },
    )
    .setLock(
      "pessimistic_write",
      undefined,
      ["reserva"],
    )
    .getOne();

  if (!reserva) {
    throw new NotFoundException(
      "La reserva seleccionada no existe.",
    );
  }

  return reserva;
}

  /**
   * Revierte la reserva cuando no se
   * puede generar el ticket.
   */
  private async revertirReservaPorErrorDeTicket(
    reservaId: string,
  ): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const reserva = await this.buscarReservaBloqueada(manager, reservaId);

        const asientos = reserva.detalles.map(
          (detalle) => detalle.asientoViaje,
        );

        for (const asiento of asientos) {
          asiento.estado = EstadoAsiento.DISPONIBLE;

          asiento.bloqueadoPor = null;

          asiento.bloqueadoHasta = null;
        }

        if (asientos.length > 0) {
          await manager.save(AsientoViaje, asientos);
        }

        reserva.viaje.asientosDisponibles =
          Number(reserva.viaje.asientosDisponibles ?? 0) + asientos.length;

        await manager.save(Viaje, reserva.viaje);

        await manager.delete(DetalleReserva, {
          reserva: {
            id: reserva.id,
          },
        });

        await manager.delete(Reserva, reserva.id);
      });
    } catch (error) {
      console.error(
        "No se pudo revertir la reserva después del error del ticket:",
        error,
      );
    }
  }

  /**
   * Validación adicional del DTO.
   */
  private validarCrearReservaDto(dto: CrearReservaDto): void {
    this.validarId(
      dto.usuarioId,
      "El identificador del usuario es obligatorio.",
    );

    this.validarId(dto.viajeId, "El identificador del viaje es obligatorio.");

    if (!Array.isArray(dto.asientoIds) || dto.asientoIds.length === 0) {
      throw new BadRequestException("Debes seleccionar al menos un asiento.");
    }

    if (new Set(dto.asientoIds).size !== dto.asientoIds.length) {
      throw new BadRequestException(
        "No puedes seleccionar el mismo asiento más de una vez.",
      );
    }
  }

  /**
   * Verifica que un identificador
   * tenga contenido.
   */
  private validarId(id: string, mensaje: string): void {
    if (!id?.trim()) {
      throw new BadRequestException(mensaje);
    }
  }
}
