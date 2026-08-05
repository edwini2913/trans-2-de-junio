import {
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Between,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import {
  CrearAuditoriaDto,
} from './dto/crear-auditoria.dto';

import {
  FiltrosAuditoriaDto,
} from './dto/filtros-auditoria.dto';

import {
  Auditoria,
  ResultadoAuditoria,
} from './entities/auditoria.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(
      Auditoria,
    )
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async registrar(
    dto: CrearAuditoriaDto,
  ): Promise<Auditoria> {
    const auditoria =
      this.auditoriaRepository.create({
        usuarioId:
          dto.usuarioId ?? null,

        usuarioNombre:
          dto.usuarioNombre ??
          null,

        usuarioEmail:
          dto.usuarioEmail ??
          null,

        usuarioRol:
          dto.usuarioRol ??
          null,

        accion:
          dto.accion,

        modulo:
          dto.modulo,

        descripcion:
          dto.descripcion,

        entidad:
          dto.entidad ?? null,

        entidadId:
          dto.entidadId ??
          null,

        resultado:
          dto.resultado ??
          ResultadoAuditoria.EXITOSO,

        datosAnteriores:
          dto.datosAnteriores ??
          null,

        datosNuevos:
          dto.datosNuevos ??
          null,

        informacionAdicional:
          dto.informacionAdicional ??
          null,

        direccionIp:
          dto.direccionIp ??
          null,

        userAgent:
          dto.userAgent ??
          null,

        metodoHttp:
          dto.metodoHttp ??
          null,

        rutaHttp:
          dto.rutaHttp ??
          null,

        mensajeError:
          dto.mensajeError ??
          null,
      });

    return this.auditoriaRepository.save(
      auditoria,
    );
  }

  async obtenerTodas(
    filtros: FiltrosAuditoriaDto,
  ) {
    const where: FindOptionsWhere<Auditoria> =
      {};

    if (
      filtros.usuarioId
    ) {
      where.usuarioId =
        filtros.usuarioId;
    }

    if (
      filtros.accion
    ) {
      where.accion =
        filtros.accion;
    }

    if (
      filtros.modulo
    ) {
      where.modulo =
        filtros.modulo;
    }

    if (
      filtros.resultado
    ) {
      where.resultado =
        filtros.resultado;
    }

    if (
      filtros.fechaDesde &&
      filtros.fechaHasta
    ) {
      where.fechaRegistro =
        Between(
          new Date(
            filtros.fechaDesde,
          ),
          new Date(
            filtros.fechaHasta,
          ),
        );
    }

    const pagina =
      filtros.pagina || 1;

    const limite =
      filtros.limite || 20;

    const [
      registros,
      total,
    ] =
      await this.auditoriaRepository.findAndCount(
        {
          where,

          order: {
            fechaRegistro:
              'DESC',
          },

          skip:
            (pagina - 1) *
            limite,

          take:
            limite,
        },
      );

    return {
      registros,
      total,
      pagina,
      limite,

      totalPaginas:
        Math.ceil(
          total / limite,
        ),
    };
  }

  async obtenerPorId(
    id: string,
  ): Promise<Auditoria | null> {
    return this.auditoriaRepository.findOne(
      {
        where: {
          id,
        },
      },
    );
  }

  async obtenerPorUsuario(
    usuarioId: string,
  ): Promise<Auditoria[]> {
    return this.auditoriaRepository.find(
      {
        where: {
          usuarioId,
        },

        order: {
          fechaRegistro:
            'DESC',
        },
      },
    );
  }

  async obtenerPorModulo(
    modulo: string,
  ): Promise<Auditoria[]> {
    return this.auditoriaRepository.find(
      {
        where: {
          modulo,
        },

        order: {
          fechaRegistro:
            'DESC',
        },
      },
    );
  }

  async obtenerUltimosRegistros(
    limite = 20,
  ): Promise<Auditoria[]> {
    return this.auditoriaRepository.find(
      {
        order: {
          fechaRegistro:
            'DESC',
        },

        take:
          limite,
      },
    );
  }

  async contarRegistros():
    Promise<number> {
    return this.auditoriaRepository.count();
  }

  async eliminarTodo(): Promise<{
    mensaje: string;
  }> {
    await this.auditoriaRepository.clear();

    return {
      mensaje:
        'Auditoría eliminada correctamente.',
    };
  }
}