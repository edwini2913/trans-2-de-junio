import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  LessThan,
  Repository,
} from 'typeorm';

import {
  RolUsuario,
  Usuario,
} from '../users/entities/usuario.entity';

import {
  CrearNotificacionDto,
} from './dto/crear-notificacion.dto';

import {
  Notificacion,
} from './entities/notificacion.entity';

import {
  DestinatarioNotificacion,
  PrioridadNotificacion,
} from './enums/notificacion.enums';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository:
      Repository<Notificacion>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository:
      Repository<Usuario>,
  ) {}

  /**
   * Crea y guarda una notificación.
   */
  async crear(
    dto: CrearNotificacionDto,
  ) {
    let destinatario:
      | Usuario
      | null = null;

    if (dto.destinatarioId) {
      destinatario =
        await this.usuarioRepository.findOne({
          where: {
            id: dto.destinatarioId,
          },
        });

      if (!destinatario) {
        throw new NotFoundException(
          'El destinatario de la notificación no existe',
        );
      }
    }

    const notificacion =
      this.notificacionRepository.create({
        destinatario,

        rolDestinatario:
          dto.rolDestinatario,

        tipo: dto.tipo,

        prioridad:
          dto.prioridad ??
          PrioridadNotificacion.NORMAL,

        titulo: dto.titulo.trim(),

        mensaje: dto.mensaje.trim(),

        referenciaTipo:
          dto.referenciaTipo?.trim() ||
          null,

        referenciaId:
          dto.referenciaId || null,

        rutaDestino:
          dto.rutaDestino?.trim() ||
          null,

        leida: false,

        fechaLectura: null,
      });

    return this.notificacionRepository.save(
      notificacion,
    );
  }

  /**
   * Obtiene las notificaciones generales
   * para el panel administrativo.
   */
  async obtenerParaAdministrador(
    limite = 30,
  ) {
    const limiteSeguro = Math.min(
      Math.max(Number(limite) || 30, 1),
      100,
    );

    return this.notificacionRepository
      .createQueryBuilder(
        'notificacion',
      )
      .leftJoinAndSelect(
        'notificacion.destinatario',
        'destinatario',
      )
      .where(
        'notificacion.rol_destinatario = :rol',
        {
          rol:
            DestinatarioNotificacion.ADMINISTRADOR,
        },
      )
      .orderBy(
        'notificacion.fechaRegistro',
        'DESC',
      )
      .take(limiteSeguro)
      .getMany();
  }

  /**
   * Obtiene las notificaciones dirigidas
   * a un pasajero específico.
   */
  async obtenerParaUsuario(
    usuarioId: string,
    limite = 30,
  ) {
    await this.buscarUsuarioOError(
      usuarioId,
    );

    const limiteSeguro = Math.min(
      Math.max(Number(limite) || 30, 1),
      100,
    );

    return this.notificacionRepository
      .createQueryBuilder(
        'notificacion',
      )
      .leftJoinAndSelect(
        'notificacion.destinatario',
        'destinatario',
      )
      .where(
        'notificacion.rol_destinatario = :rol',
        {
          rol:
            DestinatarioNotificacion.PASAJERO,
        },
      )
      .andWhere(
        'destinatario.id = :usuarioId',
        {
          usuarioId,
        },
      )
      .orderBy(
        'notificacion.fechaRegistro',
        'DESC',
      )
      .take(limiteSeguro)
      .getMany();
  }

  /**
   * Cuenta las notificaciones administrativas
   * que todavía no fueron leídas.
   */
  async contarNoLeidasAdministrador() {
    const cantidad =
      await this.notificacionRepository
        .createQueryBuilder(
          'notificacion',
        )
        .where(
          'notificacion.rol_destinatario = :rol',
          {
            rol:
              DestinatarioNotificacion.ADMINISTRADOR,
          },
        )
        .andWhere(
          'notificacion.leida = :leida',
          {
            leida: false,
          },
        )
        .getCount();

    return {
      cantidad,
    };
  }

  /**
   * Cuenta las notificaciones no leídas
   * de un pasajero.
   */
  async contarNoLeidasUsuario(
    usuarioId: string,
  ) {
    await this.buscarUsuarioOError(
      usuarioId,
    );

    const cantidad =
      await this.notificacionRepository
        .createQueryBuilder(
          'notificacion',
        )
        .innerJoin(
          'notificacion.destinatario',
          'destinatario',
        )
        .where(
          'notificacion.rol_destinatario = :rol',
          {
            rol:
              DestinatarioNotificacion.PASAJERO,
          },
        )
        .andWhere(
          'destinatario.id = :usuarioId',
          {
            usuarioId,
          },
        )
        .andWhere(
          'notificacion.leida = :leida',
          {
            leida: false,
          },
        )
        .getCount();

    return {
      cantidad,
    };
  }

  /**
   * Marca una notificación como leída.
   */
  async marcarComoLeida(
    notificacionId: string,
    usuarioId: string,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    const notificacion =
      await this.buscarNotificacionOError(
        notificacionId,
      );

    this.validarAcceso(
      notificacion,
      usuario,
    );

    if (!notificacion.leida) {
      notificacion.leida = true;
      notificacion.fechaLectura =
        new Date();

      await this.notificacionRepository.save(
        notificacion,
      );
    }

    return {
      mensaje:
        'Notificación marcada como leída',

      notificacion,
    };
  }

  /**
   * Marca todas las notificaciones visibles
   * para el usuario como leídas.
   */
  async marcarTodasComoLeidas(
    usuarioId: string,
  ) {
    const usuario =
      await this.buscarUsuarioOError(
        usuarioId,
      );

    const fechaLectura = new Date();

    if (
      usuario.rol ===
        RolUsuario.ADMINISTRADOR ||
      usuario.rol ===
        RolUsuario.SECRETARIA
    ) {
      await this.notificacionRepository
        .createQueryBuilder()
        .update(Notificacion)
        .set({
          leida: true,
          fechaLectura,
        })
        .where(
          'rol_destinatario = :rol',
          {
            rol:
              DestinatarioNotificacion.ADMINISTRADOR,
          },
        )
        .andWhere(
          'leida = :leida',
          {
            leida: false,
          },
        )
        .execute();
    } else {
      await this.notificacionRepository
        .createQueryBuilder()
        .update(Notificacion)
        .set({
          leida: true,
          fechaLectura,
        })
        .where(
          'destinatario_id = :usuarioId',
          {
            usuarioId,
          },
        )
        .andWhere(
          'rol_destinatario = :rol',
          {
            rol:
              DestinatarioNotificacion.PASAJERO,
          },
        )
        .andWhere(
          'leida = :leida',
          {
            leida: false,
          },
        )
        .execute();
    }

    return {
      mensaje:
        'Todas las notificaciones fueron marcadas como leídas',
    };
  }

  /**
   * Elimina notificaciones leídas antiguas.
   * Puede utilizarse posteriormente desde
   * una tarea automática.
   */
  async eliminarLeidasAntiguas(
    dias = 90,
  ) {
    const diasSeguros = Math.max(
      Number(dias) || 90,
      30,
    );

    const fechaLimite = new Date();

    fechaLimite.setDate(
      fechaLimite.getDate() -
        diasSeguros,
    );

    const resultado =
      await this.notificacionRepository.delete({
        leida: true,
        fechaRegistro:
          LessThan(fechaLimite),
      });

    return {
      mensaje:
        'Notificaciones antiguas eliminadas',

      eliminadas:
        resultado.affected ?? 0,
    };
  }

  private async buscarNotificacionOError(
    notificacionId: string,
  ) {
    const notificacion =
      await this.notificacionRepository.findOne({
        where: {
          id: notificacionId,
        },

        relations: {
          destinatario: true,
        },
      });

    if (!notificacion) {
      throw new NotFoundException(
        'Notificación no encontrada',
      );
    }

    return notificacion;
  }

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
      throw new ForbiddenException(
        'El usuario se encuentra inactivo',
      );
    }

    return usuario;
  }

  private validarAcceso(
    notificacion: Notificacion,
    usuario: Usuario,
  ) {
    const esAdministrativo =
      usuario.rol ===
        RolUsuario.ADMINISTRADOR ||
      usuario.rol ===
        RolUsuario.SECRETARIA;

    if (
      notificacion.rolDestinatario ===
      DestinatarioNotificacion.ADMINISTRADOR
    ) {
      if (!esAdministrativo) {
        throw new ForbiddenException(
          'No tienes permiso para acceder a esta notificación',
        );
      }

      return;
    }

    if (
      notificacion.destinatario?.id !==
      usuario.id
    ) {
      throw new ForbiddenException(
        'La notificación no pertenece al usuario autenticado',
      );
    }
  }
}