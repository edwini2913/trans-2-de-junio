import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import {
  AsientoViaje,
  EstadoAsiento,
} from './entities/asiento-viaje.entity';
import {
  EstadoViaje,
  Viaje,
} from '../viajes/entities/viaje.entity';

const MINUTOS_BLOQUEO = 10;

@Injectable()
export class AsientosService {
  constructor(
    @InjectRepository(AsientoViaje)
    private readonly asientosRepository: Repository<AsientoViaje>,

    @InjectRepository(Viaje)
    private readonly viajesRepository: Repository<Viaje>,

    private readonly dataSource: DataSource,
  ) {}

  async generarAsientos(viajeId: string) {
    this.validarId(viajeId, 'El identificador del viaje es obligatorio.');

    return this.dataSource.transaction(async (manager) => {
      const viaje = await manager
        .getRepository(Viaje)
        .createQueryBuilder('viaje')
        .setLock(
          'pessimistic_write',
          undefined,
          ['viaje'],
        )
        .leftJoinAndSelect('viaje.vehiculo', 'vehiculo')
        .where('viaje.id = :viajeId', { viajeId })
        .getOne();

      if (!viaje) {
        throw new NotFoundException(
          'El viaje seleccionado no existe.',
        );
      }

      if (!viaje.vehiculo) {
        throw new BadRequestException(
          'El viaje no tiene un vehículo asignado.',
        );
      }

      const capacidad = Number(viaje.vehiculo.capacidad);

      if (!Number.isInteger(capacidad) || capacidad <= 0) {
        throw new BadRequestException(
          'La capacidad del vehículo no es válida.',
        );
      }

      if (
        viaje.vehiculo.tipo === 'NOAH' &&
        capacidad !== 7
      ) {
        throw new BadRequestException(
          `La Noah ${viaje.vehiculo.placa} debe tener exactamente 7 asientos.`,
        );
      }

      const repository = manager.getRepository(AsientoViaje);

      const existentes = await repository.count({
        where: { viaje: { id: viajeId } },
      });

      if (existentes > 0) {
        throw new ConflictException(
          `Este viaje ya tiene ${existentes} asientos generados.`,
        );
      }

      const asientos = Array.from(
        { length: capacidad },
        (_, indice) =>
          repository.create({
            viaje,
            numero: indice + 1,
            estado: EstadoAsiento.DISPONIBLE,
            bloqueadoPor: null,
            bloqueadoHasta: null,
          }),
      );

      const guardados = await repository.save(asientos);

      viaje.asientosDisponibles = guardados.length;
      await manager.save(Viaje, viaje);

      return {
        mensaje: `Se generaron ${guardados.length} asientos para el vehículo ${viaje.vehiculo.placa}.`,
        cantidad: guardados.length,
        asientos: guardados,
      };
    });
  }

  async listarPorViaje(
    viajeId: string,
  ): Promise<AsientoViaje[]> {
    this.validarId(viajeId, 'El identificador del viaje es obligatorio.');

    const viajeExiste = await this.viajesRepository.exists({
      where: { id: viajeId },
    });

    if (!viajeExiste) {
      throw new NotFoundException(
        'El viaje seleccionado no existe.',
      );
    }

    await this.liberarBloqueosVencidos(viajeId);

    return this.asientosRepository.find({
      where: { viaje: { id: viajeId } },
      order: { numero: 'ASC' },
    });
  }

  async buscarPorId(
    asientoId: string,
  ): Promise<AsientoViaje> {
    this.validarId(
      asientoId,
      'El identificador del asiento es obligatorio.',
    );

    const asiento = await this.asientosRepository.findOne({
      where: { id: asientoId },
      relations: {
        viaje: {
          ruta: true,
          vehiculo: true,
        },
      },
    });

    if (!asiento) {
      throw new NotFoundException(
        'El asiento seleccionado no existe.',
      );
    }

    return asiento;
  }

  async bloquearAsiento(
    asientoId: string,
    usuarioId: string,
  ) {
    this.validarId(
      asientoId,
      'El identificador del asiento es obligatorio.',
    );
    this.validarId(
      usuarioId,
      'El identificador del usuario es obligatorio.',
    );

    return this.dataSource.transaction(async (manager) => {
      const asiento = await this.buscarBloqueado(
        manager,
        asientoId,
      );

      if (asiento.viaje.estado !== EstadoViaje.PROGRAMADO) {
        throw new BadRequestException(
          'El viaje no está disponible para reservar asientos.',
        );
      }

      const ahora = new Date();

      if (
        asiento.estado === EstadoAsiento.BLOQUEADO &&
        asiento.bloqueadoHasta &&
        asiento.bloqueadoHasta <= ahora
      ) {
        this.limpiarBloqueo(asiento);
      }

      if (asiento.estado === EstadoAsiento.RESERVADO) {
        throw new ConflictException(
          'El asiento ya se encuentra reservado.',
        );
      }

      if (asiento.estado === EstadoAsiento.VENDIDO) {
        throw new ConflictException(
          'El asiento ya fue vendido.',
        );
      }

      if (
        asiento.estado === EstadoAsiento.BLOQUEADO &&
        asiento.bloqueadoPor !== usuarioId
      ) {
        throw new ConflictException(
          'Otro usuario está seleccionando este asiento.',
        );
      }

      const expiraEn = new Date(
        ahora.getTime() + MINUTOS_BLOQUEO * 60_000,
      );

      asiento.estado = EstadoAsiento.BLOQUEADO;
      asiento.bloqueadoPor = usuarioId;
      asiento.bloqueadoHasta = expiraEn;

      const guardado = await manager.save(
        AsientoViaje,
        asiento,
      );

      return {
        mensaje: `Asiento bloqueado durante ${MINUTOS_BLOQUEO} minutos.`,
        expiraEn,
        asiento: guardado,
      };
    });
  }

  async liberarAsiento(
    asientoId: string,
    usuarioId: string,
  ) {
    this.validarId(
      asientoId,
      'El identificador del asiento es obligatorio.',
    );
    this.validarId(
      usuarioId,
      'El identificador del usuario es obligatorio.',
    );

    return this.dataSource.transaction(async (manager) => {
      const asiento = await this.buscarBloqueado(
        manager,
        asientoId,
      );

      if (asiento.estado !== EstadoAsiento.BLOQUEADO) {
        throw new BadRequestException(
          'El asiento no está bloqueado.',
        );
      }

      if (asiento.bloqueadoPor !== usuarioId) {
        throw new ConflictException(
          'No puedes liberar un asiento bloqueado por otro usuario.',
        );
      }

      this.limpiarBloqueo(asiento);

      const guardado = await manager.save(
        AsientoViaje,
        asiento,
      );

      return {
        mensaje: 'Asiento liberado correctamente.',
        asiento: guardado,
      };
    });
  }

  async marcarReservado(
    asientoId: string,
    usuarioId: string,
  ): Promise<AsientoViaje> {
    return this.cambiarEstado(
      asientoId,
      usuarioId,
      EstadoAsiento.RESERVADO,
    );
  }

  async marcarVendido(
    asientoId: string,
    usuarioId: string,
  ): Promise<AsientoViaje> {
    return this.cambiarEstado(
      asientoId,
      usuarioId,
      EstadoAsiento.VENDIDO,
    );
  }

  private async cambiarEstado(
    asientoId: string,
    usuarioId: string,
    estado: EstadoAsiento.RESERVADO | EstadoAsiento.VENDIDO,
  ): Promise<AsientoViaje> {
    this.validarId(
      asientoId,
      'El identificador del asiento es obligatorio.',
    );
    this.validarId(
      usuarioId,
      'El identificador del usuario es obligatorio.',
    );

    return this.dataSource.transaction(async (manager) => {
      const asiento = await this.buscarBloqueado(
        manager,
        asientoId,
      );

      this.validarBloqueo(asiento, usuarioId);

      asiento.estado = estado;
      asiento.bloqueadoPor = null;
      asiento.bloqueadoHasta = null;

      return manager.save(AsientoViaje, asiento);
    });
  }

  private async buscarBloqueado(
    manager: EntityManager,
    asientoId: string,
  ): Promise<AsientoViaje> {
    const asiento = await manager
      .getRepository(AsientoViaje)
      .createQueryBuilder('asiento')
      .setLock(
        'pessimistic_write',
        undefined,
        ['asiento'],
      )
      .leftJoinAndSelect('asiento.viaje', 'viaje')
      .where('asiento.id = :asientoId', { asientoId })
      .getOne();

    if (!asiento) {
      throw new NotFoundException(
        'El asiento seleccionado no existe.',
      );
    }

    return asiento;
  }

  private validarBloqueo(
    asiento: AsientoViaje,
    usuarioId: string,
  ): void {
    if (asiento.estado !== EstadoAsiento.BLOQUEADO) {
      throw new ConflictException(
        'El asiento no está bloqueado para esta operación.',
      );
    }

    if (asiento.bloqueadoPor !== usuarioId) {
      throw new ConflictException(
        'El asiento está bloqueado por otro usuario.',
      );
    }

    if (
      !asiento.bloqueadoHasta ||
      asiento.bloqueadoHasta <= new Date()
    ) {
      throw new ConflictException(
        'El tiempo para seleccionar el asiento expiró.',
      );
    }
  }

  private limpiarBloqueo(asiento: AsientoViaje): void {
    asiento.estado = EstadoAsiento.DISPONIBLE;
    asiento.bloqueadoPor = null;
    asiento.bloqueadoHasta = null;
  }

  private async liberarBloqueosVencidos(
    viajeId: string,
  ): Promise<void> {
    await this.asientosRepository
      .createQueryBuilder()
      .update(AsientoViaje)
      .set({
        estado: EstadoAsiento.DISPONIBLE,
        bloqueadoPor: null,
        bloqueadoHasta: null,
      })
      .where('viaje_id = :viajeId', { viajeId })
      .andWhere('estado = :estado', {
        estado: EstadoAsiento.BLOQUEADO,
      })
      .andWhere('bloqueado_hasta <= CURRENT_TIMESTAMP')
      .execute();
  }

  private validarId(id: string, mensaje: string): void {
    if (!id?.trim()) {
      throw new BadRequestException(mensaje);
    }
  }
}
