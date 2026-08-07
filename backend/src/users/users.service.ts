import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  EntityManager,
  Repository,
} from 'typeorm';

import {
  Usuario,
} from './entities/usuario.entity';

type ResultadoCodigoUsuario = {
  codigo: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(
      Usuario,
    )
    private readonly usuarioRepository:
      Repository<Usuario>,
  ) {}

  async crearUsuario(
    datos: Partial<Usuario>,
  ): Promise<Usuario> {
    return this.usuarioRepository.manager.transaction(
      async (
        manager: EntityManager,
      ) => {
        const resultado =
          (await manager.query(`
            SELECT
              'E-' || LPAD(
                nextval(
                  'sistema.usuario_codigo_seq'
                )::TEXT,
                3,
                '0'
              ) AS codigo
          `)) as ResultadoCodigoUsuario[];

        const codigoUsuario =
          resultado[0]?.codigo;

        if (!codigoUsuario) {
          throw new InternalServerErrorException(
            'No se pudo generar el código del usuario.',
          );
        }

        const emailNormalizado =
          datos.email
            ?.trim()
            .toLowerCase();

        const usuario =
          manager.create(
            Usuario,
            {
              ...datos,

              email:
                emailNormalizado ??
                datos.email,

              codigoUsuario,
            },
          );

        return manager.save(
          Usuario,
          usuario,
        );
      },
    );
  }

  async buscarPorEmail(
    email: string,
  ): Promise<Usuario | null> {
    const emailNormalizado =
      email
        .trim()
        .toLowerCase();

    if (!emailNormalizado) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder(
        'usuario',
      )
      .where(
        'LOWER(usuario.email) = :email',
        {
          email:
            emailNormalizado,
        },
      )
      .getOne();
  }

  async buscarPorEmailConPassword(
    email: string,
  ): Promise<Usuario | null> {
    const emailNormalizado =
      email
        .trim()
        .toLowerCase();

    if (!emailNormalizado) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder(
        'usuario',
      )
      .addSelect(
        'usuario.password',
      )
      .where(
        'LOWER(usuario.email) = :email',
        {
          email:
            emailNormalizado,
        },
      )
      .getOne();
  }

  async buscarPorId(
    id: string,
  ): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: {
        id,
      },
    });
  }

  async obtenerTodos():
  Promise<Usuario[]> {
    return this.usuarioRepository.find({
      order: {
        fechaRegistro:
          'DESC',
      },
    });
  }

  async guardarTokenRecuperacion(
    usuarioId: string,
    tokenHash: string,
    fechaExpiracion: Date,
  ): Promise<void> {
    const resultado =
      await this.usuarioRepository.update(
        {
          id:
            usuarioId,
        },
        {
          tokenRecuperacionPassword:
            tokenHash,

          tokenRecuperacionExpira:
            fechaExpiracion,

          fechaActualizacion:
            new Date(),
        },
      );

    if (!resultado.affected) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }
  }

  async buscarPorTokenRecuperacion(
    tokenHash: string,
  ): Promise<Usuario | null> {
    if (!tokenHash.trim()) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder(
        'usuario',
      )
      .addSelect([
        'usuario.tokenRecuperacionPassword',
        'usuario.tokenRecuperacionExpira',
      ])
      .where(
        'usuario.tokenRecuperacionPassword = :tokenHash',
        {
          tokenHash,
        },
      )
      .andWhere(
        'usuario.tokenRecuperacionExpira IS NOT NULL',
      )
      .andWhere(
        'usuario.tokenRecuperacionExpira > :fechaActual',
        {
          fechaActual:
            new Date(),
        },
      )
      .andWhere(
        'usuario.estado = :estado',
        {
          estado:
            true,
        },
      )
      .getOne();
  }

  async actualizarPasswordYLimpiarToken(
    usuarioId: string,
    passwordHash: string,
  ): Promise<void> {
    const resultado =
      await this.usuarioRepository.update(
        {
          id:
            usuarioId,
        },
        {
          password:
            passwordHash,

          tokenRecuperacionPassword:
            null,

          tokenRecuperacionExpira:
            null,

          fechaActualizacion:
            new Date(),
        },
      );

    if (!resultado.affected) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }
  }

  async limpiarTokenRecuperacion(
    usuarioId: string,
  ): Promise<void> {
    const resultado =
      await this.usuarioRepository.update(
        {
          id:
            usuarioId,
        },
        {
          tokenRecuperacionPassword:
            null,

          tokenRecuperacionExpira:
            null,

          fechaActualizacion:
            new Date(),
        },
      );

    if (!resultado.affected) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }
  }

  async eliminarUsuario(
    id: string,
  ): Promise<{
    mensaje: string;
  }> {
    const usuario =
      await this.usuarioRepository.findOne({
        where: {
          id,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }

    await this.usuarioRepository.remove(
      usuario,
    );

    return {
      mensaje:
        'Usuario eliminado correctamente.',
    };
  }
}