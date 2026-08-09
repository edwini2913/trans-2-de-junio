import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  EntityManager,
  QueryFailedError,
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
    @InjectRepository(Usuario)
    private readonly usuarioRepository:
      Repository<Usuario>,
  ) {}

  async crearUsuario(
    datos: Partial<Usuario>,
  ): Promise<Usuario> {
    const emailNormalizado =
      datos.email
        ?.trim()
        .toLowerCase();

    if (!emailNormalizado) {
      throw new InternalServerErrorException(
        'El correo electrónico es obligatorio.',
      );
    }

    try {
      return await this.usuarioRepository.manager.transaction(
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

          const usuario =
            manager.create(
              Usuario,
              {
                ...datos,

                email:
                  emailNormalizado,

                codigoUsuario,
              },
            );

          return await manager.save(
            Usuario,
            usuario,
          );
        },
      );
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError
      ) {
        const errorPostgres =
          error.driverError as {
            code?: string;
            constraint?: string;
            detail?: string;
            message?: string;
          };

        /*
         * PostgreSQL:
         * 23505 = dato duplicado.
         */
        if (
          errorPostgres.code ===
          '23505'
        ) {
          const detalle =
            (
              errorPostgres.detail ||
              errorPostgres.message ||
              ''
            ).toLowerCase();

          if (
            detalle.includes(
              'email',
            )
          ) {
            throw new ConflictException(
              'El correo electrónico ya está registrado.',
            );
          }

          if (
            detalle.includes(
              'ci',
            )
          ) {
            throw new ConflictException(
              'El carnet de identidad ya está registrado.',
            );
          }

          if (
            detalle.includes(
              'codigo',
            )
          ) {
            throw new ConflictException(
              'No se pudo generar un código de usuario único. Intente nuevamente.',
            );
          }

          throw new ConflictException(
            'Ya existe un usuario con alguno de los datos ingresados.',
          );
        }

        /*
         * PostgreSQL:
         * 42P01 = tabla o secuencia inexistente.
         */
        if (
          errorPostgres.code ===
          '42P01'
        ) {
          console.error(
            'No existe la secuencia sistema.usuario_codigo_seq.',
            errorPostgres,
          );

          throw new InternalServerErrorException(
            'No se pudo generar el código del usuario. La secuencia de usuarios no está configurada.',
          );
        }

        console.error(
          'Error PostgreSQL al crear usuario:',
          errorPostgres,
        );
      } else {
        console.error(
          'Error al crear usuario:',
          error,
        );
      }

      throw error;
    }
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

  /*
   * Guarda el hash del token y la fecha
   * de expiración en el usuario.
   */
  async guardarTokenRecuperacion(
    usuarioId: string,
    tokenHash: string,
    fechaExpiracion: Date,
  ): Promise<void> {
    if (
      !usuarioId.trim() ||
      !tokenHash.trim()
    ) {
      throw new InternalServerErrorException(
        'Los datos del token de recuperación no son válidos.',
      );
    }

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

  /*
   * Busca solamente tokens que:
   * - Coincidan con el hash guardado.
   * - No hayan expirado.
   * - Pertenezcan a un usuario activo.
   */
  async buscarPorTokenRecuperacion(
    tokenHash: string,
  ): Promise<Usuario | null> {
    const tokenNormalizado =
      tokenHash.trim();

    if (!tokenNormalizado) {
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
          tokenHash:
            tokenNormalizado,
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

  /*
   * Cambia la contraseña y elimina el
   * token dentro de una sola consulta.
   * Después de esto, el enlace no puede
   * utilizarse nuevamente.
   */
  async actualizarPasswordYLimpiarToken(
    usuarioId: string,
    passwordHash: string,
  ): Promise<void> {
    if (!passwordHash.trim()) {
      throw new InternalServerErrorException(
        'La contraseña cifrada no es válida.',
      );
    }

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

  /*
   * Elimina un token cuando el correo
   * no pudo enviarse.
   */
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