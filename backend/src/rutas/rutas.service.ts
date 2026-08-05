import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { Ruta } from './entities/ruta.entity';

@Injectable()
export class RutasService {
  constructor(
    @InjectRepository(Ruta)
    private readonly rutasRepository: Repository<Ruta>,
  ) {}

  /**
   * Lista únicamente las rutas activas.
   * Este método puede ser utilizado por el pasajero
   * y por el formulario de programación de viajes.
   */
  async obtenerRutas(): Promise<Ruta[]> {
    return this.rutasRepository.find({
      where: {
        estado: true,
      },
      order: {
        origen: 'ASC',
        destino: 'ASC',
      },
    });
  }

  /**
   * Lista todas las rutas, tanto activas como inactivas.
   * Este método será utilizado por el administrador.
   */
  async obtenerTodasLasRutas(): Promise<Ruta[]> {
    return this.rutasRepository.find({
      order: {
        estado: 'DESC',
        origen: 'ASC',
        destino: 'ASC',
      },
    });
  }

  /**
   * Busca una ruta por su identificador.
   */
  async obtenerRutaPorId(id: string): Promise<Ruta> {
    const ruta = await this.rutasRepository.findOne({
      where: {
        id,
      },
    });

    if (!ruta) {
      throw new NotFoundException(
        'La ruta solicitada no existe.',
      );
    }

    return ruta;
  }

  /**
   * Registra una nueva ruta.
   */
  async crearRuta(
    createRutaDto: CreateRutaDto,
  ): Promise<Ruta> {
    const origen = this.normalizarTexto(
      createRutaDto.origen,
    );

    const destino = this.normalizarTexto(
      createRutaDto.destino,
    );

    if (!origen) {
      throw new BadRequestException(
        'El origen de la ruta es obligatorio.',
      );
    }

    if (!destino) {
      throw new BadRequestException(
        'El destino de la ruta es obligatorio.',
      );
    }

    if (
      origen.toLocaleLowerCase() ===
      destino.toLocaleLowerCase()
    ) {
      throw new BadRequestException(
        'El origen y el destino no pueden ser iguales.',
      );
    }

    await this.validarRutaDuplicada(
      origen,
      destino,
    );

    const ruta = this.rutasRepository.create({
      origen,
      destino,
      distanciaKm:
        createRutaDto.distanciaKm ?? null,
      estado: createRutaDto.estado ?? true,
    });

    return this.rutasRepository.save(ruta);
  }

  /**
   * Actualiza los datos de una ruta.
   */
  async actualizarRuta(
    id: string,
    updateRutaDto: UpdateRutaDto,
  ): Promise<Ruta> {
    const ruta =
      await this.obtenerRutaPorId(id);

    const origen =
      updateRutaDto.origen !== undefined
        ? this.normalizarTexto(
            updateRutaDto.origen,
          )
        : ruta.origen;

    const destino =
      updateRutaDto.destino !== undefined
        ? this.normalizarTexto(
            updateRutaDto.destino,
          )
        : ruta.destino;

    if (!origen) {
      throw new BadRequestException(
        'El origen de la ruta es obligatorio.',
      );
    }

    if (!destino) {
      throw new BadRequestException(
        'El destino de la ruta es obligatorio.',
      );
    }

    if (
      origen.toLocaleLowerCase() ===
      destino.toLocaleLowerCase()
    ) {
      throw new BadRequestException(
        'El origen y el destino no pueden ser iguales.',
      );
    }

    await this.validarRutaDuplicada(
      origen,
      destino,
      id,
    );

    ruta.origen = origen;
    ruta.destino = destino;

    if (
      updateRutaDto.distanciaKm !==
      undefined
    ) {
      ruta.distanciaKm =
        updateRutaDto.distanciaKm ?? null;
    }

    if (
      updateRutaDto.estado !== undefined
    ) {
      ruta.estado = updateRutaDto.estado;
    }

    return this.rutasRepository.save(ruta);
  }

  /**
   * Cambia únicamente el estado de una ruta.
   */
  async cambiarEstadoRuta(
    id: string,
    estado: boolean,
  ): Promise<Ruta> {
    const ruta =
      await this.obtenerRutaPorId(id);

    ruta.estado = estado;

    return this.rutasRepository.save(ruta);
  }

  /**
   * Elimina una ruta.
   *
   * Si la ruta ya tiene viajes relacionados,
   * no debe eliminarse físicamente porque
   * rompería el historial del sistema.
   */
  async eliminarRuta(
    id: string,
  ): Promise<{ mensaje: string }> {
    const ruta =
      await this.rutasRepository.findOne({
        where: {
          id,
        },
        relations: {
          viajes: true,
        },
      });

    if (!ruta) {
      throw new NotFoundException(
        'La ruta solicitada no existe.',
      );
    }

    if (
      Array.isArray(ruta.viajes) &&
      ruta.viajes.length > 0
    ) {
      throw new ConflictException(
        'No se puede eliminar la ruta porque tiene viajes registrados. Puede desactivarla.',
      );
    }

    await this.rutasRepository.remove(ruta);

    return {
      mensaje:
        'La ruta fue eliminada correctamente.',
    };
  }

  /**
   * Valida que no exista otra ruta
   * con el mismo origen y destino.
   */
  private async validarRutaDuplicada(
    origen: string,
    destino: string,
    idExcluir?: string,
  ): Promise<void> {
    const rutas =
      await this.rutasRepository.find();

    const rutaDuplicada = rutas.find(
      (ruta) => {
        const mismoOrigen =
          ruta.origen
            .trim()
            .toLocaleLowerCase() ===
          origen.trim().toLocaleLowerCase();

        const mismoDestino =
          ruta.destino
            .trim()
            .toLocaleLowerCase() ===
          destino.trim().toLocaleLowerCase();

        const esOtraRuta =
          !idExcluir || ruta.id !== idExcluir;

        return (
          mismoOrigen &&
          mismoDestino &&
          esOtraRuta
        );
      },
    );

    if (rutaDuplicada) {
      throw new ConflictException(
        'Ya existe una ruta registrada con el mismo origen y destino.',
      );
    }
  }

  /**
   * Limpia espacios innecesarios
   * y normaliza la escritura del texto.
   */
  private normalizarTexto(
    valor: string,
  ): string {
    return valor
      .trim()
      .replace(/\s+/g, ' ');
  }
}