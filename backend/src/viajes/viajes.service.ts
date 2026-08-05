import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Not,
  Repository,
} from 'typeorm';

import {
  EstadoViaje,
  Viaje,
} from './entities/viaje.entity';

import { Ruta } from '../rutas/entities/ruta.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';

import {
  AsientoViaje,
  EstadoAsientoViaje,
} from '../asientos/entities/asiento-viaje.entity';

type CrearViajeEntrada = {
  rutaId: string;
  vehiculoId: string;
  fecha: string;
  horaSalida: string;
  precio: number;
  estado?: EstadoViaje;
};

type ActualizarViajeEntrada = {
  rutaId?: string;
  vehiculoId?: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number;
  estado?: EstadoViaje;
};

type VehiculoDisponibleRespuesta = {
  viajeId: string;
  vehiculoId: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidad: number;
  precio: number;
  asientosDisponibles: number;
};

type HorarioDisponibleRespuesta = {
  horaSalida: string;
  cantidadVehiculos: number;
  vehiculos: VehiculoDisponibleRespuesta[];
};

@Injectable()
export class ViajesService {
  constructor(
    @InjectRepository(Viaje)
    private readonly viajesRepository: Repository<Viaje>,

    @InjectRepository(Ruta)
    private readonly rutasRepository: Repository<Ruta>,

    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository: Repository<Vehiculo>,

    @InjectRepository(AsientoViaje)
    private readonly asientosViajeRepository: Repository<AsientoViaje>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async crear(
    datos: CrearViajeEntrada,
  ): Promise<Viaje> {
    this.validarDatosCreacion(datos);

    const ruta = await this.rutasRepository.findOne({
      where: {
        id: datos.rutaId,
        estado: true,
      },
    });

    if (!ruta) {
      throw new NotFoundException(
        'La ruta seleccionada no existe o está inactiva.',
      );
    }

    const vehiculo =
      await this.vehiculosRepository.findOne({
        where: {
          id: datos.vehiculoId,
          estado: true,
        },
      });

    if (!vehiculo) {
      throw new NotFoundException(
        'El vehículo seleccionado no existe o está inactivo.',
      );
    }

    const capacidad = Number(vehiculo.capacidad);

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      throw new BadRequestException(
        'El vehículo debe tener una capacidad válida.',
      );
    }

    await this.verificarVehiculoDisponible(
      vehiculo.id,
      datos.fecha,
      datos.horaSalida,
    );

    return this.dataSource.transaction(
      async (manager) => {
        const viaje = manager.create(Viaje, {
          ruta,
          vehiculo,
          fecha: datos.fecha,
          horaSalida: datos.horaSalida,
          precio: Number(datos.precio),
          asientosDisponibles: capacidad,
          estado:
            datos.estado ??
            EstadoViaje.PROGRAMADO,
        });

        const viajeGuardado = await manager.save(
          Viaje,
          viaje,
        );

        await this.generarAsientos(
          manager,
          viajeGuardado,
          capacidad,
        );

        return manager.findOneOrFail(Viaje, {
          where: {
            id: viajeGuardado.id,
          },
          relations: {
            ruta: true,
            vehiculo: true,
            asientos: true,
          },
        });
      },
    );
  }

  async listarTodos(): Promise<Viaje[]> {
    return this.viajesRepository.find({
      relations: {
        ruta: true,
        vehiculo: true,
      },
      order: {
        fecha: 'DESC',
        horaSalida: 'ASC',
      },
    });
  }

  async listarPublicados(): Promise<Viaje[]> {
    return this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoinAndSelect(
        'viaje.ruta',
        'ruta',
      )
      .innerJoinAndSelect(
        'viaje.vehiculo',
        'vehiculo',
      )
      .where(
        'viaje.estado = :estado',
        {
          estado:
            EstadoViaje.PROGRAMADO,
        },
      )
      .andWhere(
        'viaje.fecha >= CURRENT_DATE',
      )
      .andWhere(
        'viaje.asientos_disponibles > 0',
      )
      .andWhere(
        'ruta.estado = :rutaActiva',
        {
          rutaActiva: true,
        },
      )
      .andWhere(
        'vehiculo.estado = :vehiculoActivo',
        {
          vehiculoActivo: true,
        },
      )
      .orderBy(
        'viaje.fecha',
        'ASC',
      )
      .addOrderBy(
        'viaje.hora_salida',
        'ASC',
      )
      .getMany();
  }

  async buscarPorId(
    id: string,
  ): Promise<Viaje> {
    const viaje =
      await this.viajesRepository.findOne({
        where: {
          id,
        },
        relations: {
          ruta: true,
          vehiculo: true,
          asientos: true,
        },
      });

    if (!viaje) {
      throw new NotFoundException(
        'El viaje solicitado no existe.',
      );
    }

    return viaje;
  }

  async obtenerFechasDisponibles(
    rutaId: string,
  ): Promise<string[]> {
    if (!rutaId) {
      throw new BadRequestException(
        'Debe proporcionar una ruta.',
      );
    }

    const filas = await this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoin('viaje.ruta', 'ruta')
      .innerJoin('viaje.vehiculo', 'vehiculo')
      .select('DISTINCT viaje.fecha', 'fecha')
      .where('ruta.id = :rutaId', {
        rutaId,
      })
      .andWhere('ruta.estado = :rutaActiva', {
        rutaActiva: true,
      })
      .andWhere('vehiculo.estado = :vehiculoActivo', {
        vehiculoActivo: true,
      })
      .andWhere('viaje.estado = :estado', {
        estado: EstadoViaje.PROGRAMADO,
      })
      .andWhere(
        'viaje.asientos_disponibles > 0',
      )
      .andWhere(
        'viaje.fecha >= CURRENT_DATE',
      )
      .orderBy('viaje.fecha', 'ASC')
      .getRawMany<{ fecha: string }>();

    return filas.map((fila) =>
      String(fila.fecha),
    );
  }

  async obtenerDisponibles(
    rutaId: string,
    fecha: string,
  ): Promise<Viaje[]> {
    this.validarBusqueda(rutaId, fecha);

    return this.viajesRepository
      .createQueryBuilder('viaje')
      .leftJoinAndSelect(
        'viaje.ruta',
        'ruta',
      )
      .leftJoinAndSelect(
        'viaje.vehiculo',
        'vehiculo',
      )
      .where('ruta.id = :rutaId', {
        rutaId,
      })
      .andWhere('ruta.estado = :rutaActiva', {
        rutaActiva: true,
      })
      .andWhere('viaje.fecha = :fecha', {
        fecha,
      })
      .andWhere('viaje.estado = :estado', {
        estado: EstadoViaje.PROGRAMADO,
      })
      .andWhere(
        'viaje.asientos_disponibles > 0',
      )
      .andWhere(
        'vehiculo.estado = :vehiculoActivo',
        {
          vehiculoActivo: true,
        },
      )
      .orderBy(
        'viaje.hora_salida',
        'ASC',
      )
      .addOrderBy(
        'vehiculo.tipo',
        'ASC',
      )
      .addOrderBy(
        'vehiculo.placa',
        'ASC',
      )
      .getMany();
  }

  async obtenerOpcionesAgrupadas(
    rutaId: string,
    fecha: string,
  ): Promise<HorarioDisponibleRespuesta[]> {
    const viajes =
      await this.obtenerDisponibles(
        rutaId,
        fecha,
      );

    const agrupados = new Map<
      string,
      HorarioDisponibleRespuesta
    >();

    for (const viaje of viajes) {
      const horaSalida = this.normalizarHora(
        viaje.horaSalida,
      );

      if (!agrupados.has(horaSalida)) {
        agrupados.set(horaSalida, {
          horaSalida,
          cantidadVehiculos: 0,
          vehiculos: [],
        });
      }

      const horario =
        agrupados.get(
          horaSalida,
        );

      if (!horario) {
        continue;
      }

      horario.vehiculos.push({
          viajeId: viaje.id,
          vehiculoId: viaje.vehiculo.id,
          placa: viaje.vehiculo.placa,
          marca: viaje.vehiculo.marca,
          modelo: viaje.vehiculo.modelo,
          tipo: viaje.vehiculo.tipo,
          capacidad: Number(
            viaje.vehiculo.capacidad,
          ),
          precio: Number(viaje.precio),
          asientosDisponibles: Number(
            viaje.asientosDisponibles,
          ),
        });

      horario.cantidadVehiculos =
        horario.vehiculos.length;
    }

    return Array.from(agrupados.values()).sort(
      (a, b) =>
        a.horaSalida.localeCompare(
          b.horaSalida,
        ),
    );
  }

  async obtenerAsientos(
    viajeId: string,
  ): Promise<AsientoViaje[]> {
    await this.buscarPorId(viajeId);

    return this.asientosViajeRepository.find({
      where: {
        viaje: {
          id: viajeId,
        },
      },
      order: {
        numero: 'ASC',
      },
    });
  }

  async actualizar(
    id: string,
    datos: ActualizarViajeEntrada,
  ): Promise<Viaje> {
    const viaje = await this.buscarPorId(id);

    let nuevaRuta = viaje.ruta;
    let nuevoVehiculo = viaje.vehiculo;

    if (datos.rutaId) {
      const ruta =
        await this.rutasRepository.findOne({
          where: {
            id: datos.rutaId,
            estado: true,
          },
        });

      if (!ruta) {
        throw new NotFoundException(
          'La ruta seleccionada no existe o está inactiva.',
        );
      }

      nuevaRuta = ruta;
    }

    if (datos.vehiculoId) {
      const vehiculo =
        await this.vehiculosRepository.findOne({
          where: {
            id: datos.vehiculoId,
            estado: true,
          },
        });

      if (!vehiculo) {
        throw new NotFoundException(
          'El vehículo seleccionado no existe o está inactivo.',
        );
      }

      nuevoVehiculo = vehiculo;
    }

    const nuevaFecha =
      datos.fecha ?? viaje.fecha;

    const nuevaHora =
      datos.horaSalida ?? viaje.horaSalida;

    if (
      nuevoVehiculo.id !==
        viaje.vehiculo.id ||
      nuevaFecha !== viaje.fecha ||
      nuevaHora !== viaje.horaSalida
    ) {
      await this.verificarVehiculoDisponible(
        nuevoVehiculo.id,
        nuevaFecha,
        nuevaHora,
        id,
      );
    }

    if (
      datos.precio !== undefined &&
      Number(datos.precio) <= 0
    ) {
      throw new BadRequestException(
        'El precio debe ser mayor a cero.',
      );
    }

    const cambioVehiculo =
      nuevoVehiculo.id !==
      viaje.vehiculo.id;

    if (cambioVehiculo) {
      const asientosOcupados =
        await this.asientosViajeRepository.count({
          where: {
            viaje: {
              id,
            },
            estado: Not(
              EstadoAsientoViaje.DISPONIBLE,
            ),
          },
        });

      if (asientosOcupados > 0) {
        throw new BadRequestException(
          'No se puede cambiar el vehículo porque el viaje ya tiene asientos ocupados.',
        );
      }
    }

    return this.dataSource.transaction(
      async (manager) => {
        viaje.ruta = nuevaRuta;
        viaje.vehiculo = nuevoVehiculo;
        viaje.fecha = nuevaFecha;
        viaje.horaSalida = nuevaHora;

        if (datos.precio !== undefined) {
          viaje.precio = Number(
            datos.precio,
          );
        }

        if (datos.estado !== undefined) {
          viaje.estado = datos.estado;
        }

        if (cambioVehiculo) {
          await manager.delete(
            AsientoViaje,
            {
              viaje: {
                id,
              },
            },
          );

          const capacidad = Number(
            nuevoVehiculo.capacidad,
          );

          viaje.asientosDisponibles =
            capacidad;

          const guardado = await manager.save(
            Viaje,
            viaje,
          );

          await this.generarAsientos(
            manager,
            guardado,
            capacidad,
          );
        } else {
          await manager.save(Viaje, viaje);
        }

        return manager.findOneOrFail(Viaje, {
          where: {
            id,
          },
          relations: {
            ruta: true,
            vehiculo: true,
            asientos: true,
          },
        });
      },
    );
  }

  async actualizarDisponibilidad(
    viajeId: string,
  ): Promise<Viaje> {
    const viaje =
      await this.buscarPorId(viajeId);

    const disponibles =
      await this.asientosViajeRepository.count({
        where: {
          viaje: {
            id: viajeId,
          },
          estado:
            EstadoAsientoViaje.DISPONIBLE,
        },
      });

    viaje.asientosDisponibles =
      disponibles;

    return this.viajesRepository.save(
      viaje,
    );
  }

  async eliminar(
    id: string,
  ): Promise<{
    mensaje: string;
  }> {
    const viaje = await this.buscarPorId(id);

    const asientosOcupados =
      await this.asientosViajeRepository.count({
        where: {
          viaje: {
            id,
          },
          estado: Not(
            EstadoAsientoViaje.DISPONIBLE,
          ),
        },
      });

    if (asientosOcupados > 0) {
      throw new BadRequestException(
        'No se puede eliminar el viaje porque tiene asientos reservados o vendidos.',
      );
    }

    await this.viajesRepository.remove(
      viaje,
    );

    return {
      mensaje:
        'Viaje eliminado correctamente.',
    };
  }

  private async verificarVehiculoDisponible(
    vehiculoId: string,
    fecha: string,
    horaSalida: string,
    viajeIgnoradoId?: string,
  ): Promise<void> {
    const consulta = this.viajesRepository
      .createQueryBuilder('viaje')
      .innerJoin(
        'viaje.vehiculo',
        'vehiculo',
      )
      .where(
        'vehiculo.id = :vehiculoId',
        {
          vehiculoId,
        },
      )
      .andWhere('viaje.fecha = :fecha', {
        fecha,
      })
      .andWhere(
        'viaje.hora_salida = :horaSalida',
        {
          horaSalida,
        },
      )
      .andWhere(
        'viaje.estado != :cancelado',
        {
          cancelado:
            EstadoViaje.CANCELADO,
        },
      );

    if (viajeIgnoradoId) {
      consulta.andWhere(
        'viaje.id != :viajeIgnoradoId',
        {
          viajeIgnoradoId,
        },
      );
    }

    const existe = await consulta.getOne();

    if (existe) {
      throw new BadRequestException(
        'El vehículo ya tiene otro viaje programado en esa fecha y hora.',
      );
    }
  }

  private async generarAsientos(
    manager: EntityManager,
    viaje: Viaje,
    capacidad: number,
  ): Promise<void> {
    const asientos: AsientoViaje[] = [];

    for (
      let numero = 1;
      numero <= capacidad;
      numero += 1
    ) {
      asientos.push(
        manager.create(AsientoViaje, {
          viaje,
          numero,
          estado:
            EstadoAsientoViaje.DISPONIBLE,
          bloqueadoPor: null,
          bloqueadoHasta: null,
        }),
      );
    }

    if (asientos.length > 0) {
      await manager.save(
        AsientoViaje,
        asientos,
      );
    }
  }

  private validarDatosCreacion(
    datos: CrearViajeEntrada,
  ): void {
    if (!datos.rutaId) {
      throw new BadRequestException(
        'Debe seleccionar una ruta.',
      );
    }

    if (!datos.vehiculoId) {
      throw new BadRequestException(
        'Debe seleccionar un vehículo.',
      );
    }

    if (!datos.fecha) {
      throw new BadRequestException(
        'Debe seleccionar una fecha.',
      );
    }

    if (!datos.horaSalida) {
      throw new BadRequestException(
        'Debe seleccionar una hora de salida.',
      );
    }

    if (
      !Number.isFinite(Number(datos.precio)) ||
      Number(datos.precio) <= 0
    ) {
      throw new BadRequestException(
        'El precio debe ser mayor a cero.',
      );
    }
  }

  private validarBusqueda(
    rutaId: string,
    fecha: string,
  ): void {
    if (!rutaId) {
      throw new BadRequestException(
        'Debe seleccionar una ruta.',
      );
    }

    if (!fecha) {
      throw new BadRequestException(
        'Debe seleccionar una fecha.',
      );
    }
  }

  private normalizarHora(
    hora: string,
  ): string {
    if (!hora) {
      return '';
    }

    return String(hora).slice(0, 5);
  }
}
