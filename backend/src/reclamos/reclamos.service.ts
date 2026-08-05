import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectDataSource,
  InjectRepository,
} from '@nestjs/typeorm';

import {
  DataSource,
  Repository,
} from 'typeorm';

import {
  DestinatarioNotificacion,
  PrioridadNotificacion,
  TipoNotificacion,
} from '../notificaciones/enums/notificacion.enums';

import {
  NotificacionesService,
} from '../notificaciones/notificaciones.service';

import {
  Ticket,
} from '../tickets/entities/ticket.entity';

import {
  RolUsuario,
  Usuario,
} from '../users/entities/usuario.entity';

import {
  ActualizarEstadoReclamoDto,
} from './dto/actualizar-estado-reclamo.dto';

import {
  CrearReclamoDto,
} from './dto/crear-reclamo.dto';

import {
  ResponderReclamoDto,
} from './dto/responder-reclamo.dto';

import {
  MensajeReclamo,
} from './entities/mensaje-reclamo.entity';

import {
  Reclamo,
} from './entities/reclamo.entity';

import {
  EstadoReclamo,
  TipoAutorMensaje,
} from './enums/reclamo.enums';

@Injectable()
export class ReclamosService {
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepository:
      Repository<Reclamo>,

    @InjectRepository(MensajeReclamo)
    private readonly mensajeRepository:
      Repository<MensajeReclamo>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository:
      Repository<Usuario>,

    @InjectRepository(Ticket)
    private readonly ticketRepository:
      Repository<Ticket>,

    @InjectDataSource()
    private readonly dataSource:
      DataSource,

    private readonly notificacionesService:
      NotificacionesService,
  ) {}

  /**
   * Crea un nuevo reclamo, consulta
   * o sugerencia y notifica al administrador.
   */
    async crearReclamo(
    usuarioId: string,
    dto: CrearReclamoDto,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    let ticket: Ticket | null = null;

    if (dto.ticketId) {
      ticket =
        await this.buscarTicketOError(
          dto.ticketId,
        );

      await this.validarTicketDelUsuario(
        ticket.id,
        usuario.id,
      );
    }

    const resultadoTransaccion =
      await this.dataSource.transaction(
        async (manager) => {
          const codigo =
            await this.generarCodigoReclamo(
              manager,
            );

          const reclamo =
            manager.create(
              Reclamo,
              {
                codigo,
                usuario,
                ticket,
                tipo: dto.tipo,
                categoria:
                  dto.categoria,
                prioridad:
                  dto.prioridad,
                estado:
                  EstadoReclamo.PENDIENTE,
                asunto:
                  dto.asunto.trim(),
                descripcion:
                  dto.descripcion.trim(),
                respuestaFinal: null,
                cerradoPorId: null,
                fechaCierre: null,
              },
            );

          const reclamoGuardado =
            await manager.save(
              Reclamo,
              reclamo,
            );

          const mensajeInicial =
            manager.create(
              MensajeReclamo,
              {
                reclamo:
                  reclamoGuardado,
                usuario,
                tipoAutor:
                  TipoAutorMensaje.USUARIO,
                mensaje:
                  dto.descripcion.trim(),
                archivoUrl: null,
                nombreArchivo: null,
                tipoArchivo: null,
                leido: false,
              },
            );

          await manager.save(
            MensajeReclamo,
            mensajeInicial,
          );

          return {
            reclamoId:
              reclamoGuardado.id,

            codigo:
              reclamoGuardado.codigo,
          };
        },
      );

    /*
     * La consulta se realiza después de confirmar
     * la transacción. Ahora PostgreSQL ya puede
     * encontrar el reclamo registrado.
     */
    const reclamoCompleto =
      await this.obtenerPorIdInterno(
        resultadoTransaccion.reclamoId,
      );

    const nombreUsuario =
      this.obtenerNombreUsuario(
        usuario,
      );

    await this.notificacionesService.crear({
      rolDestinatario:
        DestinatarioNotificacion.ADMINISTRADOR,

      tipo:
        TipoNotificacion.NUEVO_RECLAMO,

      prioridad:
        this.convertirPrioridad(
          dto.prioridad,
        ),

      titulo:
        `Nuevo reclamo ${reclamoCompleto.codigo}`,

      mensaje:
        `${nombreUsuario} registró un reclamo: ${reclamoCompleto.asunto}`,

      referenciaTipo:
        'RECLAMO',

      referenciaId:
        reclamoCompleto.id,

      rutaDestino:
        `/admin/reclamos/${reclamoCompleto.id}`,
    });

    return {
      mensaje:
        'Reclamo registrado correctamente',

      reclamo:
        reclamoCompleto,
    };
  }

  /**
   * Obtiene únicamente los reclamos
   * pertenecientes al usuario autenticado.
   */
  async obtenerReclamosUsuario(
    usuarioId: string,
  ) {
    await this.buscarUsuarioOError(
      usuarioId,
    );

    return this.reclamoRepository
      .createQueryBuilder(
        'reclamo',
      )
      .leftJoinAndSelect(
        'reclamo.ticket',
        'ticket',
      )
      .leftJoinAndSelect(
        'ticket.reserva',
        'reserva',
      )
      .leftJoinAndSelect(
        'reclamo.mensajes',
        'mensajes',
      )
      .leftJoinAndSelect(
        'mensajes.usuario',
        'autorMensaje',
      )
      .where(
        'reclamo.usuario_id = :usuarioId',
        {
          usuarioId,
        },
      )
      .orderBy(
        'reclamo.fechaRegistro',
        'DESC',
      )
      .addOrderBy(
        'mensajes.fechaRegistro',
        'ASC',
      )
      .getMany();
  }

  /**
   * Obtiene todos los reclamos.
   * Diseñado para administrador
   * o secretaria.
   */
  async obtenerTodos(
    estado?: EstadoReclamo,
  ) {
    const consulta =
      this.reclamoRepository
        .createQueryBuilder(
          'reclamo',
        )
        .leftJoinAndSelect(
          'reclamo.usuario',
          'usuario',
        )
        .leftJoinAndSelect(
          'reclamo.ticket',
          'ticket',
        )
        .leftJoinAndSelect(
          'ticket.reserva',
          'reserva',
        )
        .leftJoinAndSelect(
          'reclamo.mensajes',
          'mensajes',
        )
        .orderBy(
          'reclamo.fechaRegistro',
          'DESC',
        )
        .addOrderBy(
          'mensajes.fechaRegistro',
          'ASC',
        );

    if (estado) {
      consulta.andWhere(
        'reclamo.estado = :estado',
        {
          estado,
        },
      );
    }

    const reclamos =
      await consulta.getMany();

    return reclamos.map(
      (reclamo) => ({
        ...reclamo,

        cantidadMensajes:
          reclamo.mensajes?.length ??
          0,
      }),
    );
  }

  /**
   * Obtiene un reclamo específico.
   */
  async obtenerPorId(
    reclamoId: string,
    usuarioId: string,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    const reclamo =
      await this.obtenerPorIdInterno(
        reclamoId,
      );

    this.validarAccesoAlReclamo(
      reclamo,
      usuario,
    );

    return reclamo;
  }

  /**
   * Busca un reclamo por su código.
   */
  async obtenerPorCodigo(
    codigo: string,
    usuarioId: string,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    const reclamo =
      await this.reclamoRepository
        .createQueryBuilder(
          'reclamo',
        )
        .leftJoinAndSelect(
          'reclamo.usuario',
          'usuario',
        )
        .leftJoinAndSelect(
          'reclamo.ticket',
          'ticket',
        )
        .leftJoinAndSelect(
          'ticket.reserva',
          'reserva',
        )
        .leftJoinAndSelect(
          'reclamo.mensajes',
          'mensajes',
        )
        .leftJoinAndSelect(
          'mensajes.usuario',
          'autorMensaje',
        )
        .where(
          'UPPER(reclamo.codigo) = UPPER(:codigo)',
          {
            codigo: codigo.trim(),
          },
        )
        .orderBy(
          'mensajes.fechaRegistro',
          'ASC',
        )
        .getOne();

    if (!reclamo) {
      throw new NotFoundException(
        'Reclamo no encontrado',
      );
    }

    this.validarAccesoAlReclamo(
      reclamo,
      usuario,
    );

    return reclamo;
  }
    /**
   * Agrega una respuesta al historial
   * del reclamo y notifica al destinatario.
   */
  async responderReclamo(
    reclamoId: string,
    usuarioId: string,
    dto: ResponderReclamoDto,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    const reclamo =
      await this.obtenerPorIdInterno(
        reclamoId,
      );

    this.validarAccesoAlReclamo(
      reclamo,
      usuario,
    );

    if (
      String(reclamo.estado) ===
      'CERRADO'
    ) {
      throw new BadRequestException(
        'No se puede responder un reclamo cerrado',
      );
    }

    const esPasajero =
      usuario.rol ===
      RolUsuario.PASAJERO;

    const tipoAutor = esPasajero
      ? TipoAutorMensaje.USUARIO
      : TipoAutorMensaje.ADMINISTRADOR;

    const mensaje =
      this.mensajeRepository.create({
        reclamo,
        usuario,
        tipoAutor,

        mensaje:
          dto.mensaje.trim(),

        archivoUrl:
          dto.archivoUrl?.trim() ||
          null,

        nombreArchivo:
          dto.nombreArchivo?.trim() ||
          null,

        tipoArchivo:
          dto.tipoArchivo?.trim() ||
          null,

        leido: false,
      });

    await this.mensajeRepository.save(
      mensaje,
    );

    if (esPasajero) {
      await this.notificacionesService.crear({
        rolDestinatario:
          DestinatarioNotificacion.ADMINISTRADOR,

        tipo:
          TipoNotificacion.MENSAJE_RECLAMO,

        prioridad:
          this.convertirPrioridad(
            reclamo.prioridad,
          ),

        titulo:
          `Nuevo mensaje en ${reclamo.codigo}`,

        mensaje:
          `${this.obtenerNombreUsuario(
            usuario,
          )} respondió el reclamo: ${reclamo.asunto}`,

        referenciaTipo:
          'RECLAMO',

        referenciaId:
          reclamo.id,

        rutaDestino:
          `/admin/reclamos/${reclamo.id}`,
      });
    } else {
      await this.notificacionesService.crear({
        destinatarioId:
          reclamo.usuario.id,

        rolDestinatario:
          DestinatarioNotificacion.PASAJERO,

        tipo:
          TipoNotificacion.RECLAMO_RESPONDIDO,

        prioridad:
          PrioridadNotificacion.NORMAL,

        titulo:
          `Respuesta a ${reclamo.codigo}`,

        mensaje:
          `La administración respondió tu reclamo: ${reclamo.asunto}`,

        referenciaTipo:
          'RECLAMO',

        referenciaId:
          reclamo.id,

        rutaDestino:
          `/pasajero/reclamos/${reclamo.id}`,
      });
    }

    return {
      mensaje:
        'Respuesta registrada correctamente',

      reclamo:
        await this.obtenerPorIdInterno(
          reclamoId,
        ),
    };
  }

  /**
   * Cambia el estado del reclamo.
   * Solo administrador o secretaria.
   */
  async actualizarEstado(
    reclamoId: string,
    usuarioId: string,
    dto: ActualizarEstadoReclamoDto,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    this.validarRolAdministrativo(
      usuario,
    );

    const reclamo =
      await this.obtenerPorIdInterno(
        reclamoId,
      );

    reclamo.estado = dto.estado;

    if (
      dto.respuestaFinal !== undefined
    ) {
      reclamo.respuestaFinal =
        dto.respuestaFinal.trim() ||
        null;
    }

    if (
      String(dto.estado) ===
      'CERRADO'
    ) {
      reclamo.fechaCierre =
        new Date();

      reclamo.cerradoPorId =
        usuario.id;
    } else {
      reclamo.fechaCierre = null;
      reclamo.cerradoPorId =
        null;
    }

    const reclamoActualizado =
      await this.reclamoRepository.save(
        reclamo,
      );

    if (
      dto.respuestaFinal?.trim()
    ) {
      const mensajeFinal =
        this.mensajeRepository.create({
          reclamo:
            reclamoActualizado,

          usuario,

          tipoAutor:
            TipoAutorMensaje.ADMINISTRADOR,

          mensaje:
            dto.respuestaFinal.trim(),

          archivoUrl: null,
          nombreArchivo: null,
          tipoArchivo: null,
          leido: false,
        });

      await this.mensajeRepository.save(
        mensajeFinal,
      );
    }

    const estadoTexto =
      String(dto.estado)
        .replaceAll('_', ' ')
        .toLowerCase();

    await this.notificacionesService.crear({
      destinatarioId:
        reclamo.usuario.id,

      rolDestinatario:
        DestinatarioNotificacion.PASAJERO,

      tipo:
        TipoNotificacion.RECLAMO_RESPONDIDO,

      prioridad:
        String(dto.estado) ===
        'CERRADO'
          ? PrioridadNotificacion.NORMAL
          : this.convertirPrioridad(
              reclamo.prioridad,
            ),

      titulo:
        `Reclamo ${reclamo.codigo} actualizado`,

      mensaje:
        dto.respuestaFinal?.trim()
          ? `La administración respondió tu reclamo y cambió su estado a ${estadoTexto}.`
          : `El estado de tu reclamo cambió a ${estadoTexto}.`,

      referenciaTipo:
        'RECLAMO',

      referenciaId:
        reclamo.id,

      rutaDestino:
        `/pasajero/reclamos/${reclamo.id}`,
    });

    return {
      mensaje:
        String(dto.estado) ===
        'CERRADO'
          ? 'Reclamo cerrado correctamente'
          : 'Estado del reclamo actualizado correctamente',

      reclamo:
        await this.obtenerPorIdInterno(
          reclamoId,
        ),
    };
  }

  /**
   * Marca como leídos los mensajes
   * dirigidos al usuario que abre
   * el reclamo.
   */
  async marcarMensajesComoLeidos(
    reclamoId: string,
    usuarioId: string,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    const reclamo =
      await this.obtenerPorIdInterno(
        reclamoId,
      );

    this.validarAccesoAlReclamo(
      reclamo,
      usuario,
    );

    const tipoAutorPropio =
      usuario.rol ===
      RolUsuario.PASAJERO
        ? TipoAutorMensaje.USUARIO
        : TipoAutorMensaje.ADMINISTRADOR;

    await this.mensajeRepository
      .createQueryBuilder()
      .update(MensajeReclamo)
      .set({
        leido: true,
      })
      .where(
        'reclamo_id = :reclamoId',
        {
          reclamoId,
        },
      )
      .andWhere(
        'tipo_autor != :tipoAutorPropio',
        {
          tipoAutorPropio,
        },
      )
      .execute();

    return {
      mensaje:
        'Mensajes marcados como leídos',
    };
  }

  /**
   * Resumen estadístico para
   * el panel administrativo.
   */
  async obtenerResumen() {
    const resultado: Array<{
      total: string;
      pendientes: string;
      en_revision: string;
      respondidos: string;
      cerrados: string;
    }> =
      await this.reclamoRepository.query(`
        SELECT
          COUNT(*) AS total,

          COUNT(*) FILTER (
            WHERE estado::TEXT = 'PENDIENTE'
          ) AS pendientes,

          COUNT(*) FILTER (
            WHERE estado::TEXT = 'EN_REVISION'
          ) AS en_revision,

          COUNT(*) FILTER (
            WHERE estado::TEXT = 'RESPONDIDO'
          ) AS respondidos,

          COUNT(*) FILTER (
            WHERE estado::TEXT = 'CERRADO'
          ) AS cerrados

        FROM sistema.reclamos
      `);

    const resumen = resultado[0];

    return {
      total:
        Number(
          resumen?.total || 0,
        ),

      pendientes:
        Number(
          resumen?.pendientes || 0,
        ),

      enRevision:
        Number(
          resumen?.en_revision || 0,
        ),

      respondidos:
        Number(
          resumen?.respondidos || 0,
        ),

      cerrados:
        Number(
          resumen?.cerrados || 0,
        ),
    };
  }
    /**
   * Busca internamente un reclamo
   * con todas sus relaciones.
   */
  private async obtenerPorIdInterno(
    reclamoId: string,
  ) {
    const reclamo =
      await this.reclamoRepository
        .createQueryBuilder(
          'reclamo',
        )
        .leftJoinAndSelect(
          'reclamo.usuario',
          'usuario',
        )
        .leftJoinAndSelect(
          'reclamo.ticket',
          'ticket',
        )
        .leftJoinAndSelect(
          'ticket.reserva',
          'reserva',
        )
        .leftJoinAndSelect(
          'reclamo.mensajes',
          'mensajes',
        )
        .leftJoinAndSelect(
          'mensajes.usuario',
          'autorMensaje',
        )
        .where(
          'reclamo.id = :reclamoId',
          {
            reclamoId,
          },
        )
        .orderBy(
          'mensajes.fechaRegistro',
          'ASC',
        )
        .getOne();

    if (!reclamo) {
      throw new NotFoundException(
        'Reclamo no encontrado',
      );
    }

    return reclamo;
  }

  /**
   * Busca al usuario o genera
   * una excepción.
   */
  private async buscarUsuarioOError(
    usuarioId: string,
  ) {
    const usuario =
      await this.usuarioRepository.findOne({
        where: {
          id: usuarioId,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (!usuario.estado) {
      throw new BadRequestException(
        'El usuario se encuentra inactivo',
      );
    }

    return usuario;
  }

  /**
   * Busca el ticket relacionado.
   */
  private async buscarTicketOError(
    ticketId: string,
  ) {
    const ticket =
      await this.ticketRepository
        .createQueryBuilder(
          'ticket',
        )
        .leftJoinAndSelect(
          'ticket.reserva',
          'reserva',
        )
        .where(
          'ticket.id = :ticketId',
          {
            ticketId,
          },
        )
        .getOne();

    if (!ticket) {
      throw new NotFoundException(
        'Ticket no encontrado',
      );
    }

    return ticket;
  }

  /**
   * Comprueba que el ticket
   * pertenezca al pasajero.
   */
  private async validarTicketDelUsuario(
    ticketId: string,
    usuarioId: string,
  ) {
    const resultado =
      await this.ticketRepository
        .createQueryBuilder(
          'ticket',
        )
        .innerJoin(
          'ticket.reserva',
          'reserva',
        )
        .innerJoin(
          'reserva.usuario',
          'usuario',
        )
        .where(
          'ticket.id = :ticketId',
          {
            ticketId,
          },
        )
        .andWhere(
          'usuario.id = :usuarioId',
          {
            usuarioId,
          },
        )
        .getOne();

    if (!resultado) {
      throw new ForbiddenException(
        'El ticket seleccionado no pertenece al usuario',
      );
    }
  }

  /**
   * Controla el acceso de acuerdo
   * con el rol del usuario.
   */
  private validarAccesoAlReclamo(
    reclamo: Reclamo,
    usuario: Usuario,
  ) {
    if (
      usuario.rol ===
        RolUsuario.ADMINISTRADOR ||
      usuario.rol ===
        RolUsuario.SECRETARIA
    ) {
      return;
    }

    if (
      reclamo.usuario.id !==
      usuario.id
    ) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este reclamo',
      );
    }
  }

  /**
   * Permite acciones administrativas
   * solamente al administrador
   * o secretaria.
   */
  private validarRolAdministrativo(
    usuario: Usuario,
  ) {
    const tienePermiso =
      usuario.rol ===
        RolUsuario.ADMINISTRADOR ||
      usuario.rol ===
        RolUsuario.SECRETARIA;

    if (!tienePermiso) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }
  }

  /**
   * Obtiene un nombre presentable
   * para mostrar en la notificación.
   */
  private obtenerNombreUsuario(
    usuario: Usuario,
  ): string {
    const nombreCompleto =
      `${usuario.nombre ?? ''} ${
        usuario.apellido ?? ''
      }`.trim();

    return (
      nombreCompleto ||
      usuario.email ||
      'Usuario'
    );
  }

  /**
   * Convierte la prioridad del reclamo
   * a la prioridad de notificación.
   */
  private convertirPrioridad(
    prioridad: unknown,
  ): PrioridadNotificacion {
    const valor =
      String(prioridad).toUpperCase();

    if (valor === 'URGENTE') {
      return PrioridadNotificacion.URGENTE;
    }

    if (valor === 'ALTA') {
      return PrioridadNotificacion.ALTA;
    }

    if (valor === 'BAJA') {
      return PrioridadNotificacion.BAJA;
    }

    return PrioridadNotificacion.NORMAL;
  }

  /**
   * Genera códigos como:
   * REC-2026-000001
   */
  private async generarCodigoReclamo(
    manager:
      DataSource['manager'],
  ) {
    const resultado: Array<{
      numero: string;
    }> = await manager.query(`
      SELECT nextval(
        'sistema.reclamo_codigo_seq'
      )::TEXT AS numero
    `);

    const numero =
      Number(resultado[0].numero);

    const anio =
      new Date().getFullYear();

    return `REC-${anio}-${String(
      numero,
    ).padStart(6, '0')}`;
  }
}