
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
  SelectQueryBuilder,
} from "typeorm";

import {
  RolUsuario,
  Usuario,
} from "../users/entities/usuario.entity";

import {
  CAPACIDAD_POR_TIPO,
  esVehiculoSectorRapido,
  obtenerCapacidadPorTipo,
  obtenerNombreTipoVehiculo,
  TipoVehiculo,
} from "./constants/vehiculo.constants";

import {
  CreateVehiculoDto,
} from "./dto/create-vehiculo.dto";

import {
  UpdateVehiculoDto,
} from "./dto/update-vehiculo.dto";

import {
  Vehiculo,
} from "./entities/vehiculo.entity";

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository:
      Repository<Vehiculo>,

    @InjectRepository(Usuario)
    private readonly usuariosRepository:
      Repository<Usuario>,
  ) {}

  /**
   * Consulta vehículos con datos básicos
   * del chofer habitual.
   *
   * No expone contraseñas ni tokens.
   */
  private consultaConChofer():
    SelectQueryBuilder<Vehiculo> {
    return this.vehiculosRepository
      .createQueryBuilder("vehiculo")
      .leftJoin(
        "vehiculo.choferHabitual",
        "chofer",
      )
      .addSelect([
        "chofer.id",
        "chofer.nombre",
        "chofer.apellido",
        "chofer.rol",
        "chofer.estado",
      ]);
  }

  /**
   * Comprueba que el chofer exista,
   * tenga rol CHOFER y esté activo.
   */
  private async validarChoferHabitual(
    choferId: string,
  ): Promise<Usuario> {
    const chofer =
      await this.usuariosRepository.findOne({
        where: {
          id: choferId,
        },
      });

    if (!chofer) {
      throw new NotFoundException(
        "El chofer seleccionado no existe.",
      );
    }

    if (
      chofer.rol !==
      RolUsuario.CHOFER
    ) {
      throw new BadRequestException(
        "El usuario seleccionado no tiene el rol CHOFER.",
      );
    }

    if (!chofer.estado) {
      throw new BadRequestException(
        "No se puede asignar un chofer desactivado.",
      );
    }

    return chofer;
  }

  /**
   * 1. REGISTRAR VEHÍCULO
   *
   * El chofer habitual es opcional.
   */
  async crear(
    createVehiculoDto: CreateVehiculoDto,
  ): Promise<Vehiculo> {
    const placaNormalizada =
      createVehiculoDto.placa
        .trim()
        .toUpperCase();

    if (!placaNormalizada) {
      throw new BadRequestException(
        "La placa es obligatoria.",
      );
    }

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

    let choferHabitual:
      Usuario | null = null;

    if (createVehiculoDto.choferId) {
      choferHabitual =
        await this.validarChoferHabitual(
          createVehiculoDto.choferId,
        );
    }

    // Separar choferId del resto del DTO.
    // La asociación se guarda mediante
    // la relación choferHabitual.
    const {
      choferId: _choferId,
      ...datosVehiculo
    } = createVehiculoDto;

    void _choferId;

    const vehiculo =
      this.vehiculosRepository.create({
        ...datosVehiculo,

        placa: placaNormalizada,

        marca:
          createVehiculoDto.marca
            .trim(),

        modelo:
          createVehiculoDto.modelo
            .trim(),

        numeroFlota,

        capacidad,

        estado:
          createVehiculoDto.estado ??
          true,

        choferHabitual,
      });

    const guardado =
      await this.vehiculosRepository.save(
        vehiculo,
      );

    return this.buscarPorId(
      guardado.id,
    );
  }

  /**
   * 2. LISTAR TODOS LOS VEHÍCULOS
   */
  async listarTodos():
    Promise<Vehiculo[]> {
    return this.consultaConChofer()
      .orderBy(
        "vehiculo.tipo",
        "ASC",
      )
      .addOrderBy(
        "vehiculo.placa",
        "ASC",
      )
      .getMany();
  }

  /**
   * 3. LISTAR VEHÍCULOS ACTIVOS
   */
  async listarDisponibles():
    Promise<Vehiculo[]> {
    return this.consultaConChofer()
      .where(
        "vehiculo.estado = :estado",
        {
          estado: true,
        },
      )
      .orderBy(
        "vehiculo.tipo",
        "ASC",
      )
      .addOrderBy(
        "vehiculo.placa",
        "ASC",
      )
      .getMany();
  }

  /**
   * 4. LISTAR FLOTAS DISPONIBLES
   */
  async listarFlotasDisponibles():
    Promise<Vehiculo[]> {
    return this.consultaConChofer()
      .where(
        "vehiculo.estado = :estado",
        {
          estado: true,
        },
      )
      .andWhere(
        "vehiculo.tipo = :tipo",
        {
          tipo: TipoVehiculo.FLOTA,
        },
      )
      .orderBy(
        "vehiculo.numeroFlota",
        "ASC",
      )
      .addOrderBy(
        "vehiculo.placa",
        "ASC",
      )
      .getMany();
  }

  /**
   * 5. LISTAR NOAH Y HIACE
   *
   * Devuelve también el chofer habitual,
   * si el vehículo tiene uno asignado.
   */
  async listarSectorRapido():
    Promise<Vehiculo[]> {
    const vehiculos =
      await this.listarDisponibles();

    return vehiculos.filter(
      (vehiculo) =>
        esVehiculoSectorRapido(
          vehiculo.tipo,
        ),
    );
  }

  /**
   * 6. BUSCAR VEHÍCULO POR ID
   */
  async buscarPorId(
    id: string,
  ): Promise<Vehiculo> {
    const vehiculo =
      await this.consultaConChofer()
        .where(
          "vehiculo.id = :id",
          {
            id,
          },
        )
        .getOne();

    if (!vehiculo) {
      throw new NotFoundException(
        "El vehículo seleccionado no existe.",
      );
    }

    return vehiculo;
  }

  /**
   * 7. BUSCAR VEHÍCULO POR PLACA
   *
   * Permite a la secretaria buscar
   * un Noah o Hiace por su placa
   * y consultar su chofer habitual.
   */
  async buscarPorPlaca(
    placa: string,
  ): Promise<Vehiculo> {
    const placaNormalizada =
      placa.trim().toUpperCase();

    if (!placaNormalizada) {
      throw new BadRequestException(
        "Debes ingresar una placa.",
      );
    }

    const vehiculo =
      await this.consultaConChofer()
        .where(
          "vehiculo.placa = :placa",
          {
            placa: placaNormalizada,
          },
        )
        .getOne();

    if (!vehiculo) {
      throw new NotFoundException(
        "No existe un vehículo registrado con esa placa.",
      );
    }

    return vehiculo;
  }

  /**
   * 8. ACTUALIZAR VEHÍCULO
   *
   * choferId:
   *
   * undefined = no cambiar
   * UUID = asignar otro chofer
   * null = quitar chofer habitual
   */
  async actualizar(
    id: string,
    updateVehiculoDto: UpdateVehiculoDto,
  ): Promise<Vehiculo> {
    const vehiculo =
      await this.vehiculosRepository
        .findOne({
          where: {
            id,
          },
        });

    if (!vehiculo) {
      throw new NotFoundException(
        "El vehículo seleccionado no existe.",
      );
    }

    const tipo =
      updateVehiculoDto.tipo ??
      vehiculo.tipo;

    this.validarTipoVehiculo(
      tipo,
    );

    const capacidad =
      obtenerCapacidadPorTipo(
        tipo,
      );

    /**
     * ACTUALIZAR PLACA
     */
    if (
      updateVehiculoDto.placa !==
      undefined
    ) {
      const placaNormalizada =
        updateVehiculoDto.placa
          .trim()
          .toUpperCase();

      if (!placaNormalizada) {
        throw new BadRequestException(
          "La placa no puede quedar vacía.",
        );
      }

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

    /**
     * ACTUALIZAR MARCA
     */
    if (
      updateVehiculoDto.marca !==
      undefined
    ) {
      vehiculo.marca =
        updateVehiculoDto.marca
          .trim();
    }

    /**
     * ACTUALIZAR MODELO
     */
    if (
      updateVehiculoDto.modelo !==
      undefined
    ) {
      vehiculo.modelo =
        updateVehiculoDto.modelo
          .trim();
    }

    /**
     * ACTUALIZAR NÚMERO INTERNO
     */
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

    /**
     * ACTUALIZAR TIPO Y CAPACIDAD
     */
    vehiculo.tipo = tipo;
    vehiculo.capacidad =
      capacidad;

    /**
     * ACTUALIZAR ESTADO
     */
    if (
      updateVehiculoDto.estado !==
      undefined
    ) {
      vehiculo.estado =
        updateVehiculoDto.estado;
    }

    /**
     * ACTUALIZAR CHOFER HABITUAL
     */
    if (
      updateVehiculoDto.choferId !==
      undefined
    ) {
      if (
        updateVehiculoDto.choferId ===
        null
      ) {
        vehiculo.choferHabitual =
          null;
      } else {
        vehiculo.choferHabitual =
          await this.validarChoferHabitual(
            updateVehiculoDto.choferId,
          );
      }
    }

    await this.vehiculosRepository.save(
      vehiculo,
    );

    return this.buscarPorId(
      id,
    );
  }

  /**
   * 9. ELIMINAR VEHÍCULO
   */
  async eliminar(
    id: string,
  ): Promise<{
    mensaje: string;
  }> {
    const vehiculo =
      await this.vehiculosRepository
        .findOne({
          where: {
            id,
          },
        });

    if (!vehiculo) {
      throw new NotFoundException(
        "El vehículo seleccionado no existe.",
      );
    }

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

  /**
   * 10. VALIDAR TIPO DE VEHÍCULO
   */
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

  /**
   * 11. NORMALIZAR NÚMERO INTERNO
   */
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

  /**
   * 12. VALIDAR NÚMERO INTERNO ÚNICO
   */
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
