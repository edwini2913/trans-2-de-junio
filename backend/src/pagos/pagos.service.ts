import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import { InjectDataSource } from "@nestjs/typeorm";

import { access, unlink } from "node:fs/promises";

import { relative, resolve, sep } from "node:path";

import { DataSource, EntityManager, In } from "typeorm";

import { AuditoriaService } from "../auditoria/auditoria.service";

import {
  ResultadoAuditoria,
  TipoAccionAuditoria,
} from "../auditoria/entities/auditoria.entity";

import {
  AsientoViaje,
  EstadoAsiento,
} from "../asientos/entities/asiento-viaje.entity";

import { Notificacion } from "../notificaciones/entities/notificacion.entity";

import {
  DestinatarioNotificacion,
  PrioridadNotificacion,
  TipoNotificacion,
} from "../notificaciones/enums/notificacion.enums";

import { EstadoReserva, Reserva } from "../reservas/entities/reserva.entity";

import { ReservasService } from "../reservas/reservas.service";

import { RolUsuario, Usuario } from "../users/entities/usuario.entity";

import { EstadoViaje, Viaje } from "../viajes/entities/viaje.entity";

import { RegistrarComprobanteDto } from "./dto/registrar-comprobante.dto";

import { DecisionPago, RevisarPagoDto } from "./dto/revisar-pago.dto";

import { EstadoPago, Pago } from "./entities/pago.entity";

interface ArchivoComprobante {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}

interface ResultadoPrepararRevision {
  pagoId: string;
  reservaId: string | null;
  usuarioId: string;
  viajeId: string;
  asientoIds: string[];
  administradorId: string;
}

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  private readonly horasBloqueoPago = 24;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly reservasService: ReservasService,

    private readonly auditoriaService: AuditoriaService,
  ) {}

  /*
   * Registra el comprobante y bloquea
   * temporalmente los asientos.
   *
   * Todavía no crea la reserva ni el
   * ticket. Eso ocurre cuando la
   * administradora aprueba el pago.
   */
  async registrarComprobante(
    dto: RegistrarComprobanteDto,
    archivo?: ArchivoComprobante,
  ) {
    if (!archivo) {
      throw new BadRequestException("Debes adjuntar el comprobante de pago.");
    }

    const referencia = dto.referencia.trim().toUpperCase();

    try {
      const pago = await this.dataSource.transaction(async (manager) => {
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

        /*
         * Cuando reservaId está presente, el pago
         * corresponde a una reserva temporal que
         * ya bloqueó y descontó los asientos.
         */
        let reservaPendiente: Reserva | null = null;

        if (dto.reservaId) {
          reservaPendiente = await manager.findOne(Reserva, {
            where: {
              id: dto.reservaId,
            },
            relations: {
              usuario: true,
              viaje: true,
              detalles: {
                asientoViaje: true,
              },
            },
          });

          if (!reservaPendiente) {
            throw new NotFoundException("La reserva seleccionada no existe.");
          }

          if (reservaPendiente.usuario?.id !== usuario.id) {
            throw new ForbiddenException(
              "La reserva no pertenece al usuario conectado.",
            );
          }

          if (reservaPendiente.estado !== EstadoReserva.PENDIENTE) {
            throw new ConflictException(
              "La reserva ya no se encuentra pendiente de pago.",
            );
          }

          if (
            !reservaPendiente.fechaVencimiento ||
            reservaPendiente.fechaVencimiento <= new Date()
          ) {
            throw new ConflictException(
              "La reserva venció. Selecciona nuevamente tus asientos.",
            );
          }
        }

        const referenciaExistente = await manager.findOne(Pago, {
          where: {
            referencia,
          },
        });

        if (referenciaExistente) {
          throw new ConflictException(
            "La referencia de pago ya fue registrada.",
          );
        }

        const viaje = await this.buscarViajeBloqueado(manager, dto.viajeId);

        if (viaje.estado !== EstadoViaje.PROGRAMADO) {
          throw new BadRequestException(
            "El viaje no está disponible para realizar la compra.",
          );
        }

        const asientoIds = [...new Set(dto.asientoIds)];

        if (reservaPendiente) {
          const idsReserva = reservaPendiente.detalles
            .map(({ asientoViaje }) => asientoViaje.id)
            .sort();

          const idsEnviados = [...asientoIds].sort();

          if (
            reservaPendiente.viaje.id !== dto.viajeId ||
            idsReserva.join(",") !== idsEnviados.join(",")
          ) {
            throw new BadRequestException(
              "El viaje o los asientos no coinciden con la reserva pendiente.",
            );
          }
        }

        const asientos = await this.buscarAsientosBloqueados(
          manager,
          asientoIds,
        );

        this.validarAsientos(asientos, viaje.id, usuario.id);

        await this.validarSinPagoPendienteDuplicado(
          manager,
          usuario.id,
          viaje.id,
          asientoIds,
        );

        const precioUnitario = Number(viaje.precio);

        if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
          throw new BadRequestException("El precio del viaje no es válido.");
        }

        const montoEsperado = this.redondearMonto(
          precioUnitario * asientoIds.length,
        );

        const montoRecibido = this.redondearMonto(Number(dto.monto));

        if (montoEsperado !== montoRecibido) {
          throw new BadRequestException(
            `El monto correcto para los asientos seleccionados es Bs. ${montoEsperado.toFixed(
              2,
            )}.`,
          );
        }

        const bloqueadoHasta = new Date(
          Date.now() + this.horasBloqueoPago * 60 * 60 * 1000,
        );

        /*
         * El comprobante ya fue enviado. Se amplía
         * el vencimiento para que la administradora
         * tenga tiempo de revisar el pago.
         */
        if (reservaPendiente) {
          reservaPendiente.fechaVencimiento = bloqueadoHasta;

          await manager.save(Reserva, reservaPendiente);
        }

        for (const asiento of asientos) {
          asiento.estado = EstadoAsiento.BLOQUEADO;

          asiento.bloqueadoPor = usuario.id;

          asiento.bloqueadoHasta = bloqueadoHasta;
        }

        await manager.save(AsientoViaje, asientos);

        const rutaRelativa = relative(process.cwd(), archivo.path).replace(
          /\\/g,
          "/",
        );

        const nuevoPago = manager.create(Pago, {
          usuario,
          viaje,
          reserva: reservaPendiente,
          asientoIds,
          referencia,
          monto: montoEsperado,
          comprobanteRuta: rutaRelativa,
          comprobanteNombre: archivo.originalname,
          comprobanteTipo: archivo.mimetype,
          comprobanteTamanio: archivo.size,
          estado: EstadoPago.PENDIENTE,
          observacionAdministrador: null,
          revisadoPor: null,
          fechaRevision: null,
        });

        const pagoGuardado = await manager.save(Pago, nuevoPago);

        return pagoGuardado;
      });

      /*
       * La notificación se crea después
       * de confirmar la transacción del
       * pago. Si la notificación presenta
       * un problema, el comprobante no se
       * pierde ni se revierte.
       */
      try {
        await this.crearNotificacionNuevoComprobante(pago);
      } catch (error) {
        this.logger.error(
          `El pago ${pago.id} fue registrado, pero no se pudo crear la notificación administrativa.`,
          error instanceof Error ? error.stack : String(error),
        );
      }

      await this.registrarAuditoriaSegura({
        usuarioId: pago.usuario?.id ?? dto.usuarioId,
        usuarioNombre: this.obtenerNombreUsuario(pago.usuario),
        usuarioEmail: pago.usuario?.email ?? null,
        usuarioRol: pago.usuario?.rol ?? null,
        accion: TipoAccionAuditoria.PAGAR,
        modulo: "PAGOS",
        descripcion: "Comprobante de pago enviado correctamente.",
        entidad: "Pago",
        entidadId: pago.id,
        resultado: ResultadoAuditoria.EXITOSO,
        datosNuevos: {
          referencia: pago.referencia,
          monto: Number(pago.monto),
          estado: pago.estado,
          viajeId: pago.viaje?.id ?? dto.viajeId,
          reservaId: pago.reserva?.id ?? dto.reservaId ?? null,
          asientoIds: pago.asientoIds,
          comprobanteNombre: pago.comprobanteNombre,
        },
      });

      return {
        ok: true,
        mensaje:
          "Comprobante enviado correctamente. La compra está pendiente de revisión.",
        pago,
      };
    } catch (error) {
      this.logger.error(
        "No se pudo registrar el comprobante de pago.",
        error instanceof Error ? error.stack : String(error),
      );

      await this.eliminarArchivoSeguro(archivo.path);

      await this.registrarAuditoriaSegura({
        usuarioId: dto.usuarioId,
        accion: TipoAccionAuditoria.PAGAR,
        modulo: "PAGOS",
        descripcion: "Falló el registro del comprobante de pago.",
        entidad: "Pago",
        resultado: ResultadoAuditoria.FALLIDO,
        informacionAdicional: {
          referencia,
          monto: Number(dto.monto),
          viajeId: dto.viajeId,
          reservaId: dto.reservaId ?? null,
          asientoIds: dto.asientoIds,
        },
        mensajeError: this.obtenerMensajeError(error),
      });

      if (this.esErrorReferenciaDuplicada(error)) {
        throw new ConflictException("La referencia de pago ya fue registrada.");
      }

      throw error;
    }
  }

  /*
   * Se ejecuta fuera de la transacción
   * principal para impedir que un fallo
   * de notificaciones elimine el pago.
   */
  private async crearNotificacionNuevoComprobante(pago: Pago): Promise<void> {
    const nombreUsuario =
      `${pago.usuario.nombre ?? ""} ${pago.usuario.apellido ?? ""}`.trim() ||
      pago.usuario.email;

    const cantidadAsientos = pago.asientoIds.length;

    const repositorio = this.dataSource.getRepository(Notificacion);

    const notificacion = repositorio.create({
      destinatario: null,
      rolDestinatario: DestinatarioNotificacion.ADMINISTRADOR,
      tipo: TipoNotificacion.NUEVO_COMPROBANTE_PAGO,
      prioridad: PrioridadNotificacion.ALTA,
      titulo: `Nuevo comprobante ${pago.referencia}`,
      mensaje: `${nombreUsuario} envió un comprobante por Bs. ${Number(
        pago.monto,
      ).toFixed(2)}. Cantidad de asientos: ${cantidadAsientos}.`,
      referenciaTipo: "PAGO",
      referenciaId: pago.id,
      rutaDestino: `/admin/pagos/${pago.id}`,
      leida: false,
      fechaLectura: null,
    });

    await repositorio.save(notificacion);
  }

  /*
   * Lista administrativa.
   */
  async obtenerTodos(estado?: EstadoPago): Promise<Pago[]> {
    if (estado && !Object.values(EstadoPago).includes(estado)) {
      throw new BadRequestException("El estado de pago no es válido.");
    }

    return this.dataSource.getRepository(Pago).find({
      where: estado
        ? {
            estado,
          }
        : undefined,
      relations: {
        usuario: true,
        viaje: {
          ruta: true,
          vehiculo: true,
        },
        reserva: true,
        revisadoPor: true,
      },
      order: {
        fechaRegistro: "DESC",
      },
    });
  }

  /*
   * Pagos enviados por un pasajero.
   */
  async obtenerPorUsuario(usuarioId: string): Promise<Pago[]> {
    this.validarId(usuarioId, "El identificador del usuario es obligatorio.");

    const usuario = await this.dataSource.getRepository(Usuario).findOne({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException("El usuario seleccionado no existe.");
    }

    return this.dataSource.getRepository(Pago).find({
      where: {
        usuario: {
          id: usuarioId,
        },
      },
      relations: {
        viaje: {
          ruta: true,
          vehiculo: true,
        },
        reserva: true,
      },
      order: {
        fechaRegistro: "DESC",
      },
    });
  }

  async obtenerPagoPorId(pagoId: string): Promise<Pago> {
    this.validarId(pagoId, "El identificador del pago es obligatorio.");

    const pago = await this.dataSource.getRepository(Pago).findOne({
      where: {
        id: pagoId,
      },
      relations: {
        usuario: true,
        viaje: {
          ruta: true,
          vehiculo: true,
        },
        reserva: true,
        revisadoPor: true,
      },
    });

    if (!pago) {
      throw new NotFoundException("El pago seleccionado no existe.");
    }

    return pago;
  }

  /*
   * Devuelve los datos necesarios para
   * mostrar o descargar el comprobante.
   */
  async obtenerArchivoComprobante(pagoId: string) {
    const pago = await this.obtenerPagoPorId(pagoId);

    const carpetaPermitida = resolve(process.cwd(), "uploads", "comprobantes");

    const rutaAbsoluta = resolve(process.cwd(), pago.comprobanteRuta);

    if (
      rutaAbsoluta !== carpetaPermitida &&
      !rutaAbsoluta.startsWith(`${carpetaPermitida}${sep}`)
    ) {
      throw new ForbiddenException("La ruta del comprobante no es válida.");
    }

    try {
      await access(rutaAbsoluta);
    } catch {
      throw new NotFoundException("El archivo del comprobante no existe.");
    }

    return {
      rutaAbsoluta,
      nombre: pago.comprobanteNombre,
      tipo: pago.comprobanteTipo,
    };
  }

  /*
   * La administradora aprueba o rechaza
   * el comprobante.
   */
  async revisarPago(
    pagoId: string,
    administradorId: string,
    dto: RevisarPagoDto,
  ) {
    this.validarId(pagoId, "El identificador del pago es obligatorio.");

    this.validarId(
      administradorId,
      "El identificador del administrador es obligatorio.",
    );

    if (dto.decision === DecisionPago.RECHAZAR) {
      return this.rechazarPago(pagoId, administradorId, dto.observacion);
    }

    return this.aprobarPago(pagoId, administradorId, dto.observacion);
  }

  private async aprobarPago(
    pagoId: string,
    administradorId: string,
    observacion?: string,
  ) {
    const datos = await this.prepararAprobacion(
      pagoId,
      administradorId,
      observacion,
    );

    let resultadoReserva: {
      reserva: Reserva;
      ticket: unknown;
    };

    try {
      resultadoReserva = datos.reservaId
        ? await this.reservasService.confirmarReservaPendiente(datos.reservaId)
        : await this.reservasService.crearReserva({
            usuarioId: datos.usuarioId,
            viajeId: datos.viajeId,
            asientoIds: datos.asientoIds,
          });
    } catch (error) {
      await this.restaurarPagoPendiente(datos.pagoId);

      throw error;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const pago = await this.buscarPagoBloqueado(manager, datos.pagoId);

        const administrador = await this.buscarAdministrador(
          manager,
          datos.administradorId,
        );

        if (pago.estado !== EstadoPago.EN_REVISION) {
          throw new ConflictException(
            "El pago cambió de estado durante la revisión.",
          );
        }

        pago.estado = EstadoPago.APROBADO;

        pago.reserva = resultadoReserva.reserva;

        pago.revisadoPor = administrador;

        pago.fechaRevision = new Date();

        await manager.save(Pago, pago);
      });
    } catch (error) {
      this.logger.error(
        `No se pudo finalizar la aprobación del pago ${pagoId}.`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        "La reserva fue creada, pero no se pudo finalizar el estado del pago. Revisa el registro antes de intentar nuevamente.",
        {
          cause: error,
        },
      );
    }

    const pagoAprobado = await this.obtenerPagoPorId(pagoId);

    /*
     * La notificación se registra después
     * de confirmar el pago. De esta forma,
     * una falla temporal de notificaciones
     * no revierte la reserva, el ticket ni
     * el estado APROBADO.
     */
    try {
      await this.notificarPagoAprobado(pagoAprobado);
    } catch (error) {
      this.logger.error(
        `El pago ${pagoId} fue aprobado, pero no se pudo notificar al pasajero.`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    await this.registrarAuditoriaSegura({
      usuarioId: pagoAprobado.revisadoPor?.id ?? administradorId,
      usuarioNombre: this.obtenerNombreUsuario(pagoAprobado.revisadoPor),
      usuarioEmail: pagoAprobado.revisadoPor?.email ?? null,
      usuarioRol: pagoAprobado.revisadoPor?.rol ?? null,
      accion: TipoAccionAuditoria.APROBAR,
      modulo: "PAGOS",
      descripcion: "Pago aprobado correctamente.",
      entidad: "Pago",
      entidadId: pagoAprobado.id,
      resultado: ResultadoAuditoria.EXITOSO,
      datosAnteriores: {
        estado: EstadoPago.EN_REVISION,
      },
      datosNuevos: {
        estado: pagoAprobado.estado,
        referencia: pagoAprobado.referencia,
        monto: Number(pagoAprobado.monto),
        pasajeroId: pagoAprobado.usuario?.id ?? null,
        reservaId: resultadoReserva.reserva?.id ?? null,
        observacion: pagoAprobado.observacionAdministrador ?? null,
      },
    });

    return {
      ok: true,
      mensaje:
        "Pago aprobado. La reserva y el ticket fueron generados correctamente.",
      pago: pagoAprobado,
      reserva: resultadoReserva.reserva,
      ticket: resultadoReserva.ticket,
    };
  }

  private async notificarPagoAprobado(pago: Pago): Promise<void> {
    if (!pago.usuario?.id) {
      this.logger.warn(
        `El pago ${pago.id} no tiene un pasajero asociado para enviar la notificación.`,
      );

      return;
    }

    const repositorio = this.dataSource.getRepository(Notificacion);

    const notificacion = repositorio.create({
      destinatario: pago.usuario,
      rolDestinatario: DestinatarioNotificacion.PASAJERO,
      tipo: TipoNotificacion.PAGO_APROBADO,
      prioridad: PrioridadNotificacion.ALTA,
      titulo: "Pago aprobado",
      mensaje: `Tu pago ${pago.referencia} fue aprobado. Tu ticket ya está disponible.`,
      referenciaTipo: "PAGO",
      referenciaId: pago.id,
      rutaDestino: "/pasajero/comprar-reservar",
      leida: false,
      fechaLectura: null,
    });

    await repositorio.save(notificacion);
  }

  private async prepararAprobacion(
    pagoId: string,
    administradorId: string,
    observacion?: string,
  ): Promise<ResultadoPrepararRevision> {
    return this.dataSource.transaction(async (manager) => {
      const administrador = await this.buscarAdministrador(
        manager,
        administradorId,
      );

      const pago = await this.buscarPagoBloqueado(manager, pagoId);

      this.validarPagoPendiente(pago);

      pago.estado = EstadoPago.EN_REVISION;

      pago.revisadoPor = administrador;

      pago.observacionAdministrador = observacion?.trim() || null;

      pago.fechaRevision = new Date();

      await manager.save(Pago, pago);

      return {
        pagoId: pago.id,
        reservaId: pago.reserva?.id ?? null,
        usuarioId: pago.usuario.id,
        viajeId: pago.viaje.id,
        asientoIds: [...pago.asientoIds],
        administradorId: administrador.id,
      };
    });
  }

  private async rechazarPago(
    pagoId: string,
    administradorId: string,
    observacion?: string,
  ) {
    const motivo = observacion?.trim();

    if (!motivo) {
      throw new BadRequestException("Debes escribir el motivo del rechazo.");
    }

    await this.dataSource.transaction(async (manager) => {
      const administrador = await this.buscarAdministrador(
        manager,
        administradorId,
      );

      const pago = await this.buscarPagoBloqueado(manager, pagoId);

      this.validarPagoPendiente(pago);

      const asientos = await this.buscarAsientosBloqueados(
        manager,
        pago.asientoIds,
      );

      for (const asiento of asientos) {
        if (
          asiento.estado === EstadoAsiento.BLOQUEADO &&
          asiento.bloqueadoPor === pago.usuario.id
        ) {
          asiento.estado = EstadoAsiento.DISPONIBLE;

          asiento.bloqueadoPor = null;

          asiento.bloqueadoHasta = null;
        }
      }

      await manager.save(AsientoViaje, asientos);

      /*
       * Una reserva pendiente ya había descontado
       * sus asientos disponibles. Al rechazarla se
       * cancela y se devuelve esa disponibilidad.
       */
      if (pago.reserva?.estado === EstadoReserva.PENDIENTE) {
        pago.reserva.estado = EstadoReserva.CANCELADA;

        pago.reserva.fechaVencimiento = null;

        await manager.save(Reserva, pago.reserva);

        pago.viaje.asientosDisponibles =
          Number(pago.viaje.asientosDisponibles ?? 0) + asientos.length;

        await manager.save(Viaje, pago.viaje);
      }

      pago.estado = EstadoPago.RECHAZADO;

      pago.observacionAdministrador = motivo;

      pago.revisadoPor = administrador;

      pago.fechaRevision = new Date();

      await manager.save(Pago, pago);

      const notificacion = manager.create(Notificacion, {
        destinatario: pago.usuario,
        rolDestinatario: DestinatarioNotificacion.PASAJERO,
        tipo: TipoNotificacion.PAGO_RECHAZADO,
        prioridad: PrioridadNotificacion.ALTA,
        titulo: "Pago rechazado",
        mensaje: `Tu pago ${pago.referencia} fue rechazado. Motivo: ${motivo}`,
        referenciaTipo: "PAGO",
        referenciaId: pago.id,
        rutaDestino: "/pasajero/comprar-reservar",
        leida: false,
        fechaLectura: null,
      });

      await manager.save(Notificacion, notificacion);
    });

    const pagoRechazado = await this.obtenerPagoPorId(pagoId);

    await this.registrarAuditoriaSegura({
      usuarioId: pagoRechazado.revisadoPor?.id ?? administradorId,
      usuarioNombre: this.obtenerNombreUsuario(pagoRechazado.revisadoPor),
      usuarioEmail: pagoRechazado.revisadoPor?.email ?? null,
      usuarioRol: pagoRechazado.revisadoPor?.rol ?? null,
      accion: TipoAccionAuditoria.RECHAZAR,
      modulo: "PAGOS",
      descripcion: "Pago rechazado y asientos liberados correctamente.",
      entidad: "Pago",
      entidadId: pagoRechazado.id,
      resultado: ResultadoAuditoria.EXITOSO,
      datosAnteriores: {
        estado: EstadoPago.PENDIENTE,
      },
      datosNuevos: {
        estado: pagoRechazado.estado,
        referencia: pagoRechazado.referencia,
        monto: Number(pagoRechazado.monto),
        pasajeroId: pagoRechazado.usuario?.id ?? null,
        motivo,
      },
    });

    return {
      ok: true,
      mensaje: "El pago fue rechazado y los asientos fueron liberados.",
      pago: pagoRechazado,
    };
  }

  private async buscarAdministrador(
    manager: EntityManager,
    administradorId: string,
  ): Promise<Usuario> {
    const administrador = await manager.findOne(Usuario, {
      where: {
        id: administradorId,
      },
    });

    if (!administrador) {
      throw new NotFoundException("El administrador seleccionado no existe.");
    }

    if (administrador.rol !== RolUsuario.ADMINISTRADOR) {
      throw new ForbiddenException(
        "Solo un administrador puede revisar pagos.",
      );
    }

    if (!administrador.estado) {
      throw new ForbiddenException(
        "La cuenta del administrador está inactiva.",
      );
    }

    return administrador;
  }

  private async buscarPagoBloqueado(
    manager: EntityManager,
    pagoId: string,
  ): Promise<Pago> {
    const pago = await manager
      .getRepository(Pago)
      .createQueryBuilder("pago")
      .setLock("pessimistic_write", undefined, ["pago"])
      .leftJoinAndSelect("pago.usuario", "usuario")
      .leftJoinAndSelect("pago.viaje", "viaje")
      .leftJoinAndSelect("pago.reserva", "reserva")
      .where("pago.id = :pagoId", {
        pagoId,
      })
      .getOne();

    if (!pago) {
      throw new NotFoundException("El pago seleccionado no existe.");
    }

    return pago;
  }

  private validarPagoPendiente(pago: Pago): void {
    if (pago.estado === EstadoPago.APROBADO) {
      throw new ConflictException("El pago ya fue aprobado.");
    }

    if (pago.estado === EstadoPago.RECHAZADO) {
      throw new ConflictException("El pago ya fue rechazado.");
    }

    if (pago.estado === EstadoPago.EN_REVISION) {
      throw new ConflictException(
        "El pago está siendo revisado por otro administrador.",
      );
    }
  }

  private async restaurarPagoPendiente(pagoId: string): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const pago = await this.buscarPagoBloqueado(manager, pagoId);

        if (pago.estado === EstadoPago.EN_REVISION && !pago.reserva) {
          pago.estado = EstadoPago.PENDIENTE;

          pago.fechaRevision = null;

          await manager.save(Pago, pago);
        }
      });
    } catch (error) {
      console.error("No se pudo restaurar el pago pendiente:", error);
    }
  }

  private async buscarViajeBloqueado(
    manager: EntityManager,
    viajeId: string,
  ): Promise<Viaje> {
    const viaje = await manager
      .getRepository(Viaje)
      .createQueryBuilder("viaje")
      .setLock("pessimistic_write", undefined, ["viaje"])
      .leftJoinAndSelect("viaje.ruta", "ruta")
      .leftJoinAndSelect("viaje.vehiculo", "vehiculo")
      .where("viaje.id = :viajeId", {
        viajeId,
      })
      .getOne();

    if (!viaje) {
      throw new NotFoundException("El viaje seleccionado no existe.");
    }

    return viaje;
  }

  private async buscarAsientosBloqueados(
    manager: EntityManager,
    asientoIds: string[],
  ): Promise<AsientoViaje[]> {
    const asientos = await manager
      .getRepository(AsientoViaje)
      .createQueryBuilder("asiento")
      .setLock("pessimistic_write", undefined, ["asiento"])
      .leftJoinAndSelect("asiento.viaje", "viaje")
      .where("asiento.id IN (:...asientoIds)", {
        asientoIds,
      })
      .orderBy("asiento.numero", "ASC")
      .getMany();

    if (asientos.length !== asientoIds.length) {
      throw new NotFoundException(
        "Uno o más asientos seleccionados no existen.",
      );
    }

    return asientos;
  }

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

      if (
        asiento.estado === EstadoAsiento.RESERVADO ||
        asiento.estado === EstadoAsiento.VENDIDO
      ) {
        throw new ConflictException(
          `El asiento ${asiento.numero} ya no está disponible.`,
        );
      }

      if (asiento.estado === EstadoAsiento.BLOQUEADO) {
        const bloqueoVigente = Boolean(
          asiento.bloqueadoHasta && asiento.bloqueadoHasta > ahora,
        );

        if (bloqueoVigente && asiento.bloqueadoPor !== usuarioId) {
          throw new ConflictException(
            `El asiento ${asiento.numero} está siendo seleccionado por otro usuario.`,
          );
        }

        if (!bloqueoVigente) {
          asiento.estado = EstadoAsiento.DISPONIBLE;

          asiento.bloqueadoPor = null;

          asiento.bloqueadoHasta = null;
        }
      }

      if (
        asiento.estado !== EstadoAsiento.DISPONIBLE &&
        !(
          asiento.estado === EstadoAsiento.BLOQUEADO &&
          asiento.bloqueadoPor === usuarioId
        )
      ) {
        throw new ConflictException(
          `El asiento ${asiento.numero} no está disponible.`,
        );
      }
    }
  }

  private async validarSinPagoPendienteDuplicado(
    manager: EntityManager,
    usuarioId: string,
    viajeId: string,
    asientoIds: string[],
  ): Promise<void> {
    const pagosPendientes = await manager.find(Pago, {
      where: {
        usuario: {
          id: usuarioId,
        },
        viaje: {
          id: viajeId,
        },
        estado: In([EstadoPago.PENDIENTE, EstadoPago.EN_REVISION]),
      },
    });

    const asientosNuevos = new Set(asientoIds);

    const existeCruce = pagosPendientes.some((pago) =>
      pago.asientoIds.some((asientoId) => asientosNuevos.has(asientoId)),
    );

    if (existeCruce) {
      throw new ConflictException(
        "Ya existe un comprobante pendiente para uno o más asientos seleccionados.",
      );
    }
  }

  private redondearMonto(monto: number): number {
    return Math.round((monto + Number.EPSILON) * 100) / 100;
  }

  private validarId(id: string, mensaje: string): void {
    if (!id?.trim()) {
      throw new BadRequestException(mensaje);
    }
  }

  private async eliminarArchivoSeguro(ruta: string): Promise<void> {
    try {
      await unlink(ruta);
    } catch {
      /*
       * El archivo puede no haberse
       * creado o ya estar eliminado.
       */
    }
  }

  private async registrarAuditoriaSegura(
    datos: Parameters<AuditoriaService["registrar"]>[0],
  ): Promise<void> {
    try {
      await this.auditoriaService.registrar(datos);
    } catch (error: unknown) {
      this.logger.error(
        "No se pudo registrar la auditoría de pagos.",
        this.obtenerMensajeError(error),
      );
    }
  }

  private obtenerNombreUsuario(
    usuario: Usuario | null | undefined,
  ): string {
    if (!usuario) {
      return "Usuario";
    }

    return (
      `${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim() ||
      usuario.email ||
      "Usuario"
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === "object" && error !== null && "message" in error) {
      const mensaje = (error as { message?: unknown }).message;

      if (typeof mensaje === "string" && mensaje.trim()) {
        return mensaje;
      }

      if (Array.isArray(mensaje)) {
        return mensaje.map(String).join(", ");
      }
    }

    return "Error desconocido.";
  }

  private esErrorReferenciaDuplicada(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false;
    }

    const datos = error as {
      code?: string;
      driverError?: {
        code?: string;
      };
    };

    return datos.code === "23505" || datos.driverError?.code === "23505";
  }
}
