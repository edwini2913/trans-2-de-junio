
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';

import * as bcrypt from 'bcrypt';

import { CrearChoferDto } from './dto/crear-chofer.dto';

import {
  RolUsuario,
  Usuario,
} from './entities/usuario.entity';

/* =========================================
   INTERFACES
========================================= */

type ResultadoCodigoUsuario = {
  codigo: string;
};

/* =========================================
   SERVICIO DE USUARIOS
========================================= */

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /* =====================================
     1. REGISTRAR CHOFER
  ===================================== */

  async crearChofer(dto: CrearChoferDto) {
    const nombre = dto.nombre.trim();
    const apellido = dto.apellido.trim();
    const ci = dto.ci.trim();
    const telefono = dto.telefono.trim();
    const email = dto.email.trim().toLowerCase();

    if (
      !nombre ||
      !apellido ||
      !ci ||
      !telefono ||
      !email ||
      !dto.password
    ) {
      throw new BadRequestException(
        'Todos los campos del chofer son obligatorios.',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException(
        'El correo electrónico no es válido.',
      );
    }

    if (dto.password.length < 8) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres.',
      );
    }

    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException(
        'La contraseña supera el límite permitido de 72 bytes.',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      10,
    );

    const usuario = await this.crearUsuario({
      nombre,
      apellido,
      ci,
      telefono,
      email,
      password: passwordHash,
      rol: RolUsuario.CHOFER,
      estado: true,
      puedeEscanearTickets:
        dto.puedeEscanearTickets === true,
    });

    return {
      ok: true,
      mensaje: 'Cuenta de chofer creada correctamente.',
      usuario: {
        id: usuario.id,
        codigoUsuario: usuario.codigoUsuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        ci: usuario.ci,
        telefono: usuario.telefono,
        email: usuario.email,
        rol: usuario.rol,
        estado: usuario.estado,
        puedeEscanearTickets:
          usuario.puedeEscanearTickets,
      },
    };
  }

  /* =====================================
     2. AUTORIZAR O RETIRAR ESCANEO QR
  ===================================== */

  async actualizarPermisoEscaneo(
    usuarioId: string,
    puedeEscanearTickets: boolean,
  ) {
    if (typeof puedeEscanearTickets !== 'boolean') {
      throw new BadRequestException(
        'El permiso de escaneo debe ser true o false.',
      );
    }

    const usuario = await this.usuarioRepository.findOne({
      where: {
        id: usuarioId,
      },
    });

    if (!usuario) {
      throw new NotFoundException(
        'El usuario no existe.',
      );
    }

    if (usuario.rol !== RolUsuario.CHOFER) {
      throw new BadRequestException(
        'Este permiso solo se puede modificar para choferes.',
      );
    }

    if (puedeEscanearTickets && !usuario.estado) {
      throw new BadRequestException(
        'No se puede habilitar el escaneo de una cuenta desactivada.',
      );
    }

    const resultado = await this.usuarioRepository.update(
      {
        id: usuarioId,
        rol: RolUsuario.CHOFER,
        estado: usuario.estado,
      },
      {
        puedeEscanearTickets,
        fechaActualizacion: new Date(),
      },
    );

    if (resultado.affected !== 1) {
      throw new ConflictException(
        'La cuenta cambió durante la actualización. Intente nuevamente.',
      );
    }

    return {
      ok: true,
      mensaje: puedeEscanearTickets
        ? 'Escaneo habilitado para el chofer.'
        : 'Escaneo deshabilitado para el chofer.',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        puedeEscanearTickets,
      },
    };
  }

  /* =====================================
     3. CREAR USUARIO EN POSTGRESQL
  ===================================== */

  async crearUsuario(
    datos: Partial<Usuario>,
  ): Promise<Usuario> {
    const emailNormalizado = datos.email
      ?.trim()
      .toLowerCase();

    if (!emailNormalizado) {
      throw new BadRequestException(
        'El correo electrónico es obligatorio.',
      );
    }

    try {
      return await this.usuarioRepository.manager.transaction(
        async (manager: EntityManager) => {
          const resultado = (await manager.query(`
            SELECT
              'E-' || LPAD(
                nextval(
                  'sistema.usuario_codigo_seq'
                )::TEXT,
                3,
                '0'
              ) AS codigo
          `)) as ResultadoCodigoUsuario[];

          const codigoUsuario = resultado[0]?.codigo;

          if (!codigoUsuario) {
            throw new InternalServerErrorException(
              'No se pudo generar el código del usuario.',
            );
          }

          const usuario = manager.create(Usuario, {
            ...datos,
            email: emailNormalizado,
            codigoUsuario,
          });

          return await manager.save(
            Usuario,
            usuario,
          );
        },
      );
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const errorPostgres = error.driverError as {
          code?: string;
          constraint?: string;
          detail?: string;
          message?: string;
        };

        if (errorPostgres.code === '23505') {
          const detalle = [
            errorPostgres.constraint,
            errorPostgres.detail,
            errorPostgres.message,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (detalle.includes('email')) {
            throw new ConflictException(
              'El correo electrónico ya está registrado.',
            );
          }

          if (detalle.includes('ci')) {
            throw new ConflictException(
              'El carnet de identidad ya está registrado.',
            );
          }

          if (detalle.includes('codigo')) {
            throw new ConflictException(
              'El código de usuario ya existe. Intente nuevamente.',
            );
          }

          throw new ConflictException(
            'Ya existe un usuario con los datos ingresados.',
          );
        }

        if (
          errorPostgres.code === '42P01' ||
          errorPostgres.code === '3F000'
        ) {
          throw new InternalServerErrorException(
            'No se encuentra configurada la secuencia de usuarios en PostgreSQL.',
          );
        }

        console.error(
          'Error PostgreSQL al crear usuario:',
          errorPostgres,
        );
      }

      throw error;
    }
  }

  /* =====================================
     4. BUSCAR USUARIO POR CORREO
  ===================================== */

  async buscarPorEmail(
    email: string,
  ): Promise<Usuario | null> {
    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (!emailNormalizado) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .where(
        'LOWER(usuario.email) = :email',
        {
          email: emailNormalizado,
        },
      )
      .getOne();
  }

  /* =====================================
     5. BUSCAR USUARIO CON CONTRASEÑA
  ===================================== */

  async buscarPorEmailConPassword(
    email: string,
  ): Promise<Usuario | null> {
    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (!emailNormalizado) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password')
      .where(
        'LOWER(usuario.email) = :email',
        {
          email: emailNormalizado,
        },
      )
      .getOne();
  }

  /* =====================================
     6. BUSCAR USUARIO POR ID
  ===================================== */

  async buscarPorId(
    id: string,
  ): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: {
        id,
      },
    });
  }

  /* =====================================
     7. LISTAR TODOS LOS USUARIOS
  ===================================== */

  async obtenerTodos(): Promise<
    Omit<
      Usuario,
      | 'password'
      | 'tokenRecuperacionPassword'
      | 'tokenRecuperacionExpira'
    >[]
  > {
    const usuarios = await this.usuarioRepository.find({
      order: {
        fechaRegistro: 'DESC',
      },
    });

    return usuarios.map((usuario) => {
      const {
        password: _password,
        tokenRecuperacionPassword: _token,
        tokenRecuperacionExpira: _expiracion,
        ...datosPublicos
      } = usuario;

      void _password;
      void _token;
      void _expiracion;

      return datosPublicos;
    });
  }

  /* =====================================
     8. GUARDAR TOKEN DE RECUPERACIÓN
  ===================================== */

  async guardarTokenRecuperacion(
    usuarioId: string,
    tokenHash: string,
    fechaExpiracion: Date,
  ): Promise<void> {
    if (!usuarioId.trim() || !tokenHash.trim()) {
      throw new BadRequestException(
        'Los datos del token de recuperación no son válidos.',
      );
    }

    const resultado = await this.usuarioRepository.update(
      {
        id: usuarioId,
      },
      {
        tokenRecuperacionPassword: tokenHash,
        tokenRecuperacionExpira: fechaExpiracion,
        fechaActualizacion: new Date(),
      },
    );

    if (!resultado.affected) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }
  }

  /* =====================================
     9. BUSCAR TOKEN DE RECUPERACIÓN
  ===================================== */

  async buscarPorTokenRecuperacion(
    tokenHash: string,
  ): Promise<Usuario | null> {
    const tokenNormalizado = tokenHash.trim();

    if (!tokenNormalizado) {
      return null;
    }

    return this.usuarioRepository
      .createQueryBuilder('usuario')
      .addSelect([
        'usuario.tokenRecuperacionPassword',
        'usuario.tokenRecuperacionExpira',
      ])
      .where(
        'usuario.tokenRecuperacionPassword = :tokenHash',
        {
          tokenHash: tokenNormalizado,
        },
      )
      .andWhere(
        'usuario.tokenRecuperacionExpira IS NOT NULL',
      )
      .andWhere(
        'usuario.tokenRecuperacionExpira > :fechaActual',
        {
          fechaActual: new Date(),
        },
      )
      .andWhere(
        'usuario.estado = :estado',
        {
          estado: true,
        },
      )
      .getOne();
  }

  /* =====================================
     10. ACTUALIZAR CONTRASEÑA
         Y ELIMINAR TOKEN
  ===================================== */

  async actualizarPasswordYLimpiarToken(
    usuarioId: string,
    passwordHash: string,
  ): Promise<void> {
    if (!passwordHash.trim()) {
      throw new BadRequestException(
        'La contraseña cifrada no es válida.',
      );
    }

    const resultado = await this.usuarioRepository.update(
      {
        id: usuarioId,
      },
      {
        password: passwordHash,
        tokenRecuperacionPassword: null,
        tokenRecuperacionExpira: null,
        fechaActualizacion: new Date(),
      },
    );

    if (!resultado.affected) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }
  }

  /* =====================================
     11. LIMPIAR TOKEN DE RECUPERACIÓN
  ===================================== */

  async limpiarTokenRecuperacion(
    usuarioId: string,
  ): Promise<void> {
    const resultado = await this.usuarioRepository.update(
      {
        id: usuarioId,
      },
      {
        tokenRecuperacionPassword: null,
        tokenRecuperacionExpira: null,
        fechaActualizacion: new Date(),
      },
    );

    if (!resultado.affected) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }
  }

  /* =====================================
     12. ELIMINAR USUARIO
  ===================================== */

  async eliminarUsuario(
    id: string,
  ): Promise<{ mensaje: string }> {
    const usuario = await this.usuarioRepository.findOne({
      where: {
        id,
      },
    });

    if (!usuario) {
      throw new NotFoundException(
        'Usuario no encontrado.',
      );
    }

    await this.usuarioRepository.remove(usuario);

    return {
      mensaje: 'Usuario eliminado correctamente.',
    };
  }
}
