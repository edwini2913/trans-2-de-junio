import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  CreateVehiculoDto,
} from './dto/create-vehiculo.dto';

import {
  UpdateVehiculoDto,
} from './dto/update-vehiculo.dto';

import {
  TipoVehiculo,
  Vehiculo,
} from './entities/vehiculo.entity';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository:
      Repository<Vehiculo>,
  ) {}

  async crear(
    createVehiculoDto: CreateVehiculoDto,
  ): Promise<Vehiculo> {
    const placaNormalizada =
      createVehiculoDto.placa
        .trim()
        .toUpperCase();

    const placaExiste =
      await this.vehiculosRepository.findOne({
        where: {
          placa: placaNormalizada,
        },
      });

    if (placaExiste) {
      throw new ConflictException(
        'Ya existe un vehículo registrado con esa placa.',
      );
    }

    this.validarCapacidad(
      createVehiculoDto.tipo,
      createVehiculoDto.capacidad,
    );

    const vehiculo =
      this.vehiculosRepository.create({
        ...createVehiculoDto,
        placa: placaNormalizada,
        marca: createVehiculoDto.marca.trim(),
        modelo: createVehiculoDto.modelo.trim(),
        estado: createVehiculoDto.estado ?? true,
      });

    return this.vehiculosRepository.save(vehiculo);
  }

  async listarTodos(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      order: {
        tipo: 'ASC',
        placa: 'ASC',
      },
    });
  }

  async listarDisponibles(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      where: {
        estado: true,
      },
      order: {
        tipo: 'ASC',
        placa: 'ASC',
      },
    });
  }

  async buscarPorId(
    id: string,
  ): Promise<Vehiculo> {
    const vehiculo =
      await this.vehiculosRepository.findOne({
        where: {
          id,
        },
      });

    if (!vehiculo) {
      throw new NotFoundException(
        'El vehículo seleccionado no existe.',
      );
    }

    return vehiculo;
  }

  async actualizar(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo = await this.buscarPorId(id);

    const tipo =
      updateVehiculoDto.tipo ?? vehiculo.tipo;

    const capacidad =
      updateVehiculoDto.capacidad ??
      vehiculo.capacidad;

    this.validarCapacidad(tipo, capacidad);

    if (updateVehiculoDto.placa) {
      const placaNormalizada =
        updateVehiculoDto.placa
          .trim()
          .toUpperCase();

      const otroVehiculo =
        await this.vehiculosRepository
          .createQueryBuilder('vehiculo')
          .where('vehiculo.placa = :placa', {
            placa: placaNormalizada,
          })
          .andWhere('vehiculo.id != :id', {
            id,
          })
          .getOne();

      if (otroVehiculo) {
        throw new ConflictException(
          'Ya existe otro vehículo con esa placa.',
        );
      }

      vehiculo.placa = placaNormalizada;
    }

    if (updateVehiculoDto.marca !== undefined) {
      vehiculo.marca =
        updateVehiculoDto.marca.trim();
    }

    if (updateVehiculoDto.modelo !== undefined) {
      vehiculo.modelo =
        updateVehiculoDto.modelo.trim();
    }

    vehiculo.tipo = tipo;
    vehiculo.capacidad = capacidad;

    if (updateVehiculoDto.estado !== undefined) {
      vehiculo.estado =
        updateVehiculoDto.estado;
    }

    return this.vehiculosRepository.save(vehiculo);
  }

  async eliminar(
    id: string,
  ): Promise<{
    mensaje: string;
  }> {
    const vehiculo = await this.buscarPorId(id);

    try {
      await this.vehiculosRepository.remove(
        vehiculo,
      );
    } catch {
      throw new BadRequestException(
        'No se puede eliminar el vehículo porque tiene viajes relacionados.',
      );
    }

    return {
      mensaje: 'Vehículo eliminado correctamente.',
    };
  }

  private validarCapacidad(
    tipo: TipoVehiculo,
    capacidad: number,
  ): void {
    if (
      tipo === TipoVehiculo.FLOTA &&
      capacidad !== 40
    ) {
      throw new BadRequestException(
        'Las flotas deben tener exactamente 40 asientos.',
      );
    }

    if (
      tipo === TipoVehiculo.NOAH &&
      capacidad !== 7
    ) {
      throw new BadRequestException(
        'Los vehículos Noah deben tener exactamente 7 asientos.',
      );
    }
  }
}