
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { ResultadoAuditoria, TipoAccionAuditoria,} from '../auditoria/entities/auditoria.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { BloqueTicket } from './entities/bloque-ticket.entity';
const HASH_GENESIS = '0'.repeat(64);
export interface ResultadoVerificacionBlockchain {
  autentico: boolean;
  cadenaValida: boolean;
  registrado: boolean;
  mensaje: string;

  bloque: {
    indice: string;
    hashDatos: string;
    hashBloque: string;
    hashAnterior: string;
    fechaBloque: Date;
  } | null;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger =
    new Logger(BlockchainService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly auditoriaService: AuditoriaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.crearTablaSiNoExiste();

    await this.registrarTicketsAnteriores();
  }

  async registrarTicket(
    manager: EntityManager,
    ticket: Ticket,
  ): Promise<BloqueTicket> {
    if (
      !ticket?.id ||
      !ticket?.reserva
    ) {
      throw new BadRequestException(
        'No se puede registrar un ticket incompleto en blockchain.',
      );
    }

    await manager.query(
      "SELECT pg_advisory_xact_lock(hashtext('sistema.blockchain_tickets'))",
    );

    const repositorio =
      manager.getRepository(
        BloqueTicket,
      );

    const existente =
      await repositorio.findOne({
        where: {
          ticketId:
            ticket.id,
        },
      });

    if (existente) {
      return existente;
    }

    try {
      const ultimo =
        await repositorio.findOne({
          where: {},

          order: {
            indice:
              'DESC',
          },
        });

      const indice =
        String(
          Number(
            ultimo?.indice ??
              0,
          ) + 1,
        );

      const datosTicket =
        this.serializarTicket(
          ticket,
        );

      const hashDatos =
        this.calcularHash(
          datosTicket,
        );

      const hashAnterior =
        ultimo?.hashBloque ??
        HASH_GENESIS;

      const fechaBloque =
        new Date();
//Creación del hash completo del bloque//
      const hashBloque =
        this.calcularHash(
          this.construirContenidoBloque(
            indice,
            ticket.id,
            hashDatos,
            hashAnterior,
            fechaBloque,
          ),
        );

      const bloque =
        await repositorio.save(
          repositorio.create({
            indice,

            ticketId:
              ticket.id,

            codigoTicket:
              ticket.codigoTicket,

            datosTicket,

            hashDatos,

            hashAnterior,

            hashBloque,

            fechaBloque,
          }),
        );

      // El timestamp sin TZ puede guardarse distinto en el VPS.
      // Se calcula el hash definitivo con la FECHA EFECTIVAMENTE GUARDADA.
      // Todo ocurre dentro de la misma transacción del ticket.
      const fechaGuardada = await this.obtenerFechaBloqueLiteral(manager, ticket.id);
      const fechaISO = new Date(`${fechaGuardada}-04:00`).toISOString();
      bloque.hashBloque = this.calcularHash(
        [bloque.indice, bloque.ticketId, bloque.hashDatos,
          bloque.hashAnterior, fechaISO].join('|'),
      );
      await repositorio.save(bloque);

      await this.registrarAuditoriaSegura({
        usuarioId:
          ticket.reserva.usuario?.id ??
          null,

        usuarioNombre:
          this.obtenerNombreUsuario(
            ticket,
          ),

        usuarioEmail:
          ticket.reserva.usuario?.email ??
          null,

        usuarioRol:
          ticket.reserva.usuario?.rol ??
          null,

        accion:
          TipoAccionAuditoria.REGISTRAR_BLOCKCHAIN,

        modulo:
          'BLOCKCHAIN',

        descripcion:
          'Ticket registrado correctamente en blockchain.',

        entidad:
          'Ticket',

        entidadId:
          ticket.id,

        resultado:
          ResultadoAuditoria.EXITOSO,

        datosNuevos: {
          codigoTicket:
            ticket.codigoTicket,

          indice:
            bloque.indice,

          hashDatos:
            bloque.hashDatos,

          hashAnterior:
            bloque.hashAnterior,

          hashBloque:
            bloque.hashBloque,

          fechaBloque:
            bloque.fechaBloque,
        },
      });

      return bloque;
    } catch (
      error: unknown
    ) {
      await this.registrarAuditoriaSegura({
        usuarioId:
          ticket.reserva.usuario?.id ??
          null,

        usuarioNombre:
          this.obtenerNombreUsuario(
            ticket,
          ),

        usuarioEmail:
          ticket.reserva.usuario?.email ??
          null,

        usuarioRol:
          ticket.reserva.usuario?.rol ??
          null,

        accion:
          TipoAccionAuditoria.REGISTRAR_BLOCKCHAIN,

        modulo:
          'BLOCKCHAIN',

        descripcion:
          'Falló el registro del ticket en blockchain.',

        entidad:
          'Ticket',

        entidadId:
          ticket.id,

        resultado:
          ResultadoAuditoria.FALLIDO,

        informacionAdicional: {
          codigoTicket:
            ticket.codigoTicket,
        },

        mensajeError:
          this.obtenerMensajeError(
            error,
          ),
      });

      throw error;
    }
  }
// Verificación del ticket//
  async verificarTicket(
    ticket: Ticket,
    manager?: EntityManager,
  ): Promise<ResultadoVerificacionBlockchain> {
    const repositorio =
      (
        manager ??
        this.dataSource.manager
      ).getRepository(
        BloqueTicket,
      );

    const bloque =
      await repositorio.findOne({
        where: {
          ticketId:
            ticket.id,
        },
      });

    if (!bloque) {
      const resultado: ResultadoVerificacionBlockchain =
        {
          autentico:
            false,

          cadenaValida:
            false,

          registrado:
            false,

          mensaje:
            'El ticket no está registrado en blockchain.',

          bloque:
            null,
        };

      await this.registrarAuditoriaSegura({
        usuarioId:
          ticket.reserva?.usuario?.id ??
          null,

        usuarioNombre:
          this.obtenerNombreUsuario(
            ticket,
          ),

        usuarioEmail:
          ticket.reserva?.usuario?.email ??
          null,

        usuarioRol:
          ticket.reserva?.usuario?.rol ??
          null,

        accion:
          TipoAccionAuditoria.VALIDAR_TICKET,

        modulo:
          'BLOCKCHAIN',

        descripcion:
          'El ticket no está registrado en blockchain.',

        entidad:
          'Ticket',

        entidadId:
          ticket.id,

        resultado:
          ResultadoAuditoria.FALLIDO,

        informacionAdicional: {
          codigoTicket:
            ticket.codigoTicket,

          registrado:
            false,
        },

        mensajeError:
          resultado.mensaje,
      });

      return resultado;
    }

    try {
      const hashActual =
        this.calcularHash(
          this.serializarTicket(
            ticket,
          ),
        );

      const datosCoinciden =
        hashActual ===
        bloque.hashDatos;

      const fechaOriginal = await this.obtenerFechaBloqueLiteral(
        manager ?? this.dataSource.manager,
        bloque.ticketId,
      );
      const bloqueIntegro = this.hashBloqueCoincide(bloque, fechaOriginal);

      const cadenaValida =
        await this.verificarCadena(
          manager,
        );

      const autentico =
        datosCoinciden &&
        bloqueIntegro &&
        cadenaValida;

      const resultado: ResultadoVerificacionBlockchain =
        {
          autentico,

          cadenaValida,

          registrado:
            true,

          mensaje:
            autentico
              ? 'Ticket auténtico. La información coincide con blockchain.'
              : !datosCoinciden
                ? 'Los datos actuales del ticket no coinciden con el registro original.'
                : !bloqueIntegro
                  ? 'El hash del bloque de este ticket no coincide con el registro.'
                  : 'La cadena blockchain tiene un problema de integridad. Requiere revisión; no se puede autorizar el abordaje.',

          bloque: {
            indice:
              bloque.indice,

            hashDatos:
              bloque.hashDatos,

            hashBloque:
              bloque.hashBloque,

            hashAnterior:
              bloque.hashAnterior,

            fechaBloque:
              bloque.fechaBloque,
          },
        };

      await this.registrarAuditoriaSegura({
        usuarioId:
          ticket.reserva?.usuario?.id ??
          null,

        usuarioNombre:
          this.obtenerNombreUsuario(
            ticket,
          ),

        usuarioEmail:
          ticket.reserva?.usuario?.email ??
          null,

        usuarioRol:
          ticket.reserva?.usuario?.rol ??
          null,

        accion:
          TipoAccionAuditoria.VALIDAR_TICKET,

        modulo:
          'BLOCKCHAIN',

        descripcion:
          autentico
            ? 'Ticket verificado correctamente en blockchain.'
            : 'La verificación blockchain detectó información alterada.',

        entidad:
          'Ticket',

        entidadId:
          ticket.id,

        resultado:
          autentico
            ? ResultadoAuditoria.EXITOSO
            : ResultadoAuditoria.FALLIDO,

        informacionAdicional: {
          codigoTicket:
            ticket.codigoTicket,

          autentico,

          cadenaValida,

          datosCoinciden,

          bloqueIntegro,

          indice:
            bloque.indice,

          hashBloque:
            bloque.hashBloque,
        },

        mensajeError:
          autentico
            ? null
            : resultado.mensaje,
      });

      return resultado;
    } catch (
      error: unknown
    ) {
      await this.registrarAuditoriaSegura({
        usuarioId:
          ticket.reserva?.usuario?.id ??
          null,

        usuarioNombre:
          this.obtenerNombreUsuario(
            ticket,
          ),

        usuarioEmail:
          ticket.reserva?.usuario?.email ??
          null,

        usuarioRol:
          ticket.reserva?.usuario?.rol ??
          null,

        accion:
          TipoAccionAuditoria.VALIDAR_TICKET,

        modulo:
          'BLOCKCHAIN',

        descripcion:
          'Falló la verificación del ticket en blockchain.',

        entidad:
          'Ticket',

        entidadId:
          ticket.id,

        resultado:
          ResultadoAuditoria.FALLIDO,

        informacionAdicional: {
          codigoTicket:
            ticket.codigoTicket,
        },

        mensajeError:
          this.obtenerMensajeError(
            error,
          ),
      });

      throw error;
    }
  }

  /**
   * Diagnóstico de solo lectura: identifica el primer bloque defectuoso.
   * Nunca modifica hashes ni registros existentes.
   */
  async diagnosticarCadena(
    manager?: EntityManager,
  ): Promise<{
    cadenaValida: boolean;
    totalBloques: number;
    primerBloqueFallido: string | null;
    codigoTicket: string | null;
    motivo: string | null;
  }> {
    const bloques = await (
      manager ?? this.dataSource.manager
    ).getRepository(BloqueTicket).find({
      order: { indice: 'ASC' },
    });

    let hashAnteriorEsperado = HASH_GENESIS;
    let indiceEsperado = 1n;

    const fallar = (
      bloque: BloqueTicket,
      motivo: string,
    ) => ({
      cadenaValida: false,
      totalBloques: bloques.length,
      primerBloqueFallido: String(bloque.indice),
      codigoTicket: bloque.codigoTicket,
      motivo,
    });

    for (const bloque of bloques) {
      // Los índices deben estar consecutivos desde el bloque génesis.
      if (BigInt(bloque.indice) !== indiceEsperado) {
        return fallar(bloque, 'INDICE_NO_CONSECUTIVO');
      }

      if (bloque.hashAnterior !== hashAnteriorEsperado) {
        return fallar(bloque, 'ENLACE_ANTERIOR_INCORRECTO');
      }

      if (this.calcularHash(bloque.datosTicket) !== bloque.hashDatos) {
        return fallar(bloque, 'CONTENIDO_NO_COINCIDE_CON_HASH_DATOS');
      }

      let fechaOriginal: string;
      try {
        fechaOriginal = await this.obtenerFechaBloqueLiteral(
          manager ?? this.dataSource.manager,
          bloque.ticketId,
        );
      } catch {
        return fallar(bloque, 'FECHA_BLOQUE_INVALIDA');
      }

      if (!this.hashBloqueCoincide(bloque, fechaOriginal)) {
        return fallar(bloque, 'HASH_BLOQUE_NO_COINCIDE_CON_FECHA_ORIGINAL');
      }

      hashAnteriorEsperado = bloque.hashBloque;
      indiceEsperado += 1n;
    }

    return {
      cadenaValida: true,
      totalBloques: bloques.length,
      primerBloqueFallido: null,
      codigoTicket: null,
      motivo: null,
    };
  }

  async verificarCadena(manager?: EntityManager): Promise<boolean> {
    const diagnostico = await this.diagnosticarCadena(manager);

    if (!diagnostico.cadenaValida) {
      this.logger.warn(
        `Blockchain inconsistente: bloque=${diagnostico.primerBloqueFallido}, ` +
        `ticket=${diagnostico.codigoTicket}, motivo=${diagnostico.motivo}`,
      );
    }

    return diagnostico.cadenaValida;
  }

  async obtenerResumen() {
    const repositorio =
      this.dataSource.getRepository(
        BloqueTicket,
      );

    const [
      bloques,
      total,
    ] =
      await repositorio.findAndCount(
        {
          order: {
            indice:
              'DESC',
          },

          take:
            100,
        },
      );

    const diagnostico = await this.diagnosticarCadena();
    const cadenaValida = diagnostico.cadenaValida;

    return {
      ok:
        true,

      cadenaValida,

      diagnostico: {
        primerBloqueFallido: diagnostico.primerBloqueFallido,
        codigoTicket: diagnostico.codigoTicket,
        motivo: diagnostico.motivo,
      },

      totalBloques:
        total,

      algoritmo:
        'SHA-256',

      tipo:
        'Blockchain privada de tickets',

      ultimoHash:
        bloques[0]?.hashBloque ??
        null,

      bloques:
        bloques.map(
          (
            bloque,
          ) => ({
            id:
              bloque.id,

            indice:
              bloque.indice,

            ticketId:
              bloque.ticketId,

            codigoTicket:
              bloque.codigoTicket,

            hashDatos:
              bloque.hashDatos,

            hashAnterior:
              bloque.hashAnterior,

            hashBloque:
              bloque.hashBloque,

            fechaBloque:
              bloque.fechaBloque,
          }),
        ),
    };
  }

  private serializarTicket(
    ticket: Ticket,
  ): string {
    const reserva =
      ticket.reserva;

    const viaje =
      reserva?.viaje;

    const ruta =
      viaje?.ruta;

    const asientos =
      Array.isArray(
        reserva?.detalles,
      )
        ? reserva.detalles
            .map(
              (
                detalle,
              ) =>
                String(
                  detalle
                    .asientoViaje
                    ?.numero ??
                    '',
                ),
            )
            .filter(
              Boolean,
            )
            .sort(
              (
                asientoA,
                asientoB,
              ) =>
                Number(
                  asientoA,
                ) -
                Number(
                  asientoB,
                ),
            )
        : [];

    return JSON.stringify({
      ticketId:
        ticket.id,

      numeroTicket:
        String(
          ticket.numeroTicket,
        ),

      codigoTicket:
        ticket.codigoTicket,

      tokenValidacion:
        ticket.tokenValidacion,

      reservaId:
        reserva?.id ??
        null,

      codigoReserva:
        reserva?.codigoReserva ??
        null,

      viajeId:
        viaje?.id ??
        null,

      origen:
        ruta?.origen ??
        null,

      destino:
        ruta?.destino ??
        null,

      fecha:
        viaje?.fecha ??
        null,

      horaSalida:
        viaje?.horaSalida ??
        null,

      asientos,
    });
  }

  /**
   * Recupera la fecha literal guardada en TIMESTAMP WITHOUT TIME ZONE.
   * No depende de Europe/Berlin ni de la TZ del proceso Node.
   */
  private async obtenerFechaBloqueLiteral(
    manager: EntityManager,
    ticketId: string,
  ): Promise<string> {
    const filas: Array<{ fecha: string }> = await manager.query(
      `SELECT to_char(fecha_bloque, 'YYYY-MM-DD"T"HH24:MI:SS.MS') AS fecha
         FROM sistema.blockchain_tickets
        WHERE ticket_id = $1`,
      [ticketId],
    );
    const fecha = filas[0]?.fecha;
    if (!fecha || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/.test(fecha)) {
      throw new Error('Fecha original del bloque inexistente o inválida.');
    }
    return fecha;
  }

  /**
   * Compatibilidad estricta con hashes históricos creados usando
   * las interpretaciones Bolivia, UTC o zona local antigua de Node.
   * Un bloque solo pasa si SHA-256 coincide EXACTAMENTE con el almacenado.
   */
  private hashBloqueCoincide(
    bloque: BloqueTicket,
    fechaLiteral: string,
  ): boolean {
    const fechasISO = new Set<string>();
    const agregar = (fecha: Date): void => {
      if (!Number.isNaN(fecha.getTime())) {
        fechasISO.add(fecha.toISOString());
      }
    };
    agregar(new Date(`${fechaLiteral}-04:00`));
    agregar(new Date(`${fechaLiteral}Z`));
    agregar(new Date(bloque.fechaBloque));

    return [...fechasISO].some((fechaISO) => {
      const contenido = [
        bloque.indice,
        bloque.ticketId,
        bloque.hashDatos,
        bloque.hashAnterior,
        fechaISO,
      ].join('|');
      return this.calcularHash(contenido) === bloque.hashBloque;
    });
  }

  private construirContenidoBloque(
    indice: string,
    ticketId: string,
    hashDatos: string,
    hashAnterior: string,
    fechaBloque: Date,
  ): string {
    return [
      indice,
      ticketId,
      hashDatos,
      hashAnterior,
      new Date(
        fechaBloque,
      ).toISOString(),
    ].join(
      '|',
    );
  }
// Genera un hash SHA-256 del contenido para verificar la integridad de los datos.
  private calcularHash(
    contenido: string,
  ): string {
    return createHash(
      'sha256',
    )
      .update(
        contenido,
        'utf8',
      )
      .digest(
        'hex',
      );
  }

  private async crearTablaSiNoExiste():
    Promise<void> {
    try {
      await this.dataSource.query(
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
      );

      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS sistema.blockchain_tickets (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          indice bigint NOT NULL UNIQUE,
          ticket_id uuid NOT NULL UNIQUE,
          codigo_ticket varchar(40) NOT NULL,
          datos_ticket text NOT NULL,
          hash_datos varchar(64) NOT NULL,
          hash_anterior varchar(64) NOT NULL,
          hash_bloque varchar(64) NOT NULL UNIQUE,
          fecha_bloque timestamp NOT NULL,
          fecha_registro timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_blockchain_ticket
            FOREIGN KEY (ticket_id) REFERENCES sistema.tickets(id)
            ON DELETE RESTRICT
        )
      `);

      await this.dataSource.query(
        'CREATE INDEX IF NOT EXISTS idx_blockchain_codigo ON sistema.blockchain_tickets(codigo_ticket)',
      );
    } catch (
      error: unknown
    ) {
      this.logger.error(
        'No se pudo preparar la tabla blockchain.',
        error instanceof Error
          ? error.stack
          : String(
              error,
            ),
      );

      throw error;
    }
  }

  private async registrarTicketsAnteriores():
    Promise<void> {
    const tickets =
      await this.dataSource
        .getRepository(
          Ticket,
        )
        .find({
          relations: {
            reserva: {
              usuario:
                true,

              viaje: {
                ruta:
                  true,

                vehiculo:
                  true,
              },

              detalles: {
                asientoViaje:
                  true,
              },
            },
          },

          order: {
            fechaCreacion:
              'ASC',
          },
        });

    for (
      const ticket of tickets
    ) {
      const existe =
        await this.dataSource
          .getRepository(
            BloqueTicket,
          )
          .exists({
            where: {
              ticketId:
                ticket.id,
            },
          });

      if (!existe) {
        await this.dataSource.transaction(
          (
            manager,
          ) =>
            this.registrarTicket(
              manager,
              ticket,
            ),
        );
      }
    }

    if (
      tickets.length >
      0
    ) {
      this.logger.log(
        `Blockchain preparada para ${tickets.length} ticket(s).`,
      );
    }
  }

  private async registrarAuditoriaSegura(
    datos: Parameters<
      AuditoriaService['registrar']
    >[0],
  ): Promise<void> {
    try {
      await this.auditoriaService.registrar(
        datos,
      );
    } catch (
      error: unknown
    ) {
      this.logger.error(
        'No se pudo registrar la auditoría de blockchain.',
        this.obtenerMensajeError(
          error,
        ),
      );
    }
  }

  private obtenerNombreUsuario(
    ticket: Ticket,
  ): string {
    const usuario =
      ticket.reserva
        ?.usuario;

    if (!usuario) {
      return 'Pasajero';
    }

    const nombreCompleto =
      `${usuario.nombre ?? ''} ${
        usuario.apellido ?? ''
      }`.trim();

    return (
      nombreCompleto ||
      usuario.email ||
      'Pasajero'
    );
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
      typeof error ===
        'object' &&
      error !== null &&
      'message' in error
    ) {
      const mensaje =
        (
          error as {
            message?: unknown;
          }
        ).message;

      if (
        typeof mensaje ===
          'string' &&
        mensaje.trim()
      ) {
        return mensaje;
      }

      if (
        Array.isArray(
          mensaje,
        )
      ) {
        return mensaje
          .map(
            String,
          )
          .join(
            ', ',
          );
      }
    }

    return 'Error desconocido.';
  }
}