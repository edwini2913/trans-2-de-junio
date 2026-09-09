import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  InjectRepository,
} from "@nestjs/typeorm";

import {
  Repository,
} from "typeorm";

import {
  CreateVehiculoDto,
} from "./dto/create-vehiculo.dto";

import {
  UpdateVehiculoDto,
} from "./dto/update-vehiculo.dto";

import {
  CAPACIDAD_POR_TIPO,
  esVehiculoSectorRapido,
  obtenerCapacidadPorTipo,
  obtenerNombreTipoVehiculo,
  TipoVehiculo,
} from "./constants/vehiculo.constants";

import {
  Vehiculo,
} from "./entities/vehiculo.entity";

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
        "Ya existe un vehículo registrado con esa placa.",
      );
    }

    this.validarTipoVehiculo(
      createVehiculoDto.tipo,
    );

    /*
     * La capacidad se obtiene automáticamente.
     * No se confía en el número enviado desde
     * el navegador.
     */
    const capacidad =
      obtenerCapacidadPorTipo(
        createVehiculoDto.tipo,
      );

    const numeroFlota =
      this.normalizarNumeroFlota(
        createVehiculoDto.numeroFlota,
      );

    await this.validarNumeroFlotaUnico(
      numeroFlota,
    );

    const vehiculo =
      this.vehiculosRepository.create({
        ...createVehiculoDto,

        placa:
          placaNormalizada,

        marca:
          createVehiculoDto.marca
            .trim(),

        modelo:
          createVehiculoDto.modelo
            .trim(),

        numeroFlota,

        /*
         * Siempre se coloca después del DTO
         * para impedir que sea sobrescrito.
         */
        capacidad,

        estado:
          createVehiculoDto.estado ??
          true,
      });

    return this.vehiculosRepository.save(
      vehiculo,
    );
  }

  async listarTodos(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      order: {
        tipo: "ASC",
        placa: "ASC",
      },
    });
  }

  async listarDisponibles(): Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      where: {
        estado: true,
      },
      order: {
        tipo: "ASC",
        placa: "ASC",
      },
    });
  }

  /**
   * Lista únicamente flotas disponibles.
   */
  async listarFlotasDisponibles():
    Promise<Vehiculo[]> {
    return this.vehiculosRepository.find({
      where: {
        estado: true,
        tipo: TipoVehiculo.FLOTA,
      },
      order: {
        numeroFlota: "ASC",
        placa: "ASC",
      },
    });
  }

  /**
   * Lista los Noah y Hiace disponibles
   * para el sector de salidas rápidas.
   */
  async listarSectorRapido():
    Promise<Vehiculo[]> {
    const vehiculos =
      await this.vehiculosRepository.find({
        where: {
          estado: true,
        },
        order: {
          tipo: "ASC",
          placa: "ASC",
        },
      });

    return vehiculos.filter(
      (vehiculo) =>
        esVehiculoSectorRapido(
          vehiculo.tipo,
        ),
    );
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
        "El vehículo seleccionado no existe.",
      );
    }

    return vehiculo;
  }

  async actualizar(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo =
      await this.buscarPorId(id);

    const tipo =
      updateVehiculoDto.tipo ??
      vehiculo.tipo;

    this.validarTipoVehiculo(tipo);

    /*
     * Si cambia de tipo, su capacidad
     * también cambia automáticamente.
     */
    const capacidad =
      obtenerCapacidadPorTipo(tipo);

    if (updateVehiculoDto.placa) {
      const placaNormalizada =
        updateVehiculoDto.placa
          .trim()
          .toUpperCase();

      const otroVehiculo =
        await this.vehiculosRepository
          .createQueryBuilder(
            "vehiculo",
          )
          .where(
            "vehiculo.placa = :placa",
            {
              placa:
                placaNormalizada,
            },
          )
          .andWhere(
            "vehiculo.id != :id",
            {
              id,
            },
          )
          .getOne();

      if (otroVehiculo) {
        throw new ConflictException(
          "Ya existe otro vehículo con esa placa.",
        );
      }

      vehiculo.placa =
        placaNormalizada;
    }

    if (
      updateVehiculoDto.marca !==
      undefined
    ) {
      vehiculo.marca =
        updateVehiculoDto.marca
          .trim();
    }

    if (
      updateVehiculoDto.modelo !==
      undefined
    ) {
      vehiculo.modelo =
        updateVehiculoDto.modelo
          .trim();
    }

    if (
      updateVehiculoDto.numeroFlota !==
      undefined
    ) {
      const numeroFlota =
        this.normalizarNumeroFlota(
          updateVehiculoDto.numeroFlota,
        );

      await this.validarNumeroFlotaUnico(
        numeroFlota,
        id,
      );

      vehiculo.numeroFlota =
        numeroFlota;
    }

    vehiculo.tipo = tipo;
    vehiculo.capacidad =
      capacidad;

    if (
      updateVehiculoDto.estado !==
      undefined
    ) {
      vehiculo.estado =
        updateVehiculoDto.estado;
    }

    return this.vehiculosRepository.save(
      vehiculo,
    );
  }

  async eliminar(
    id: string,
  ): Promise<{
    mensaje: string;
  }> {
    const vehiculo =
      await this.buscarPorId(id);

    try {
      await this.vehiculosRepository.remove(
        vehiculo,
      );
    } catch {
      throw new BadRequestException(
        "No se puede eliminar el vehículo porque tiene viajes relacionados.",
      );
    }

    return {
      mensaje:
        "Vehículo eliminado correctamente.",
    };
  }

  private validarTipoVehiculo(
    tipo: TipoVehiculo,
  ): void {
    if (
      !Object.values(
        TipoVehiculo,
      ).includes(tipo)
    ) {
      throw new BadRequestException(
        "El tipo de vehículo debe ser FLOTA, NOAH o HIACE.",
      );
    }

    const capacidad =
      CAPACIDAD_POR_TIPO[tipo];

    if (
      !Number.isInteger(
        capacidad,
      ) ||
      capacidad <= 0
    ) {
      throw new BadRequestException(
        `La capacidad configurada para ${obtenerNombreTipoVehiculo(
          tipo,
        )} no es válida.`,
      );
    }
  }

  private normalizarNumeroFlota(
    numeroFlota:
      | string
      | null
      | undefined,
  ): string | null {
    const numero =
      String(
        numeroFlota ?? "",
      ).trim();

    return numero || null;
  }

  private async validarNumeroFlotaUnico(
    numeroFlota: string | null,
    vehiculoIdActual?: string,
  ): Promise<void> {
    if (!numeroFlota) {
      return;
    }

    const consulta =
      this.vehiculosRepository
        .createQueryBuilder(
          "vehiculo",
        )
        .where(
          "vehiculo.numeroFlota = :numeroFlota",
          {
            numeroFlota,
          },
        );

    if (vehiculoIdActual) {
      consulta.andWhere(
        "vehiculo.id != :vehiculoIdActual",
        {
          vehiculoIdActual,
        },
      );
    }

    const existe =
      await consulta.getOne();

    if (existe) {
      throw new ConflictException(
        "Ya existe otro vehículo registrado con ese número interno.",
      );
    }
  }
}