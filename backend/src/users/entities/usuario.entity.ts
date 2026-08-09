import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  SECRETARIA = 'SECRETARIA',
  CHOFER = 'CHOFER',
  PASAJERO = 'PASAJERO',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'codigo_usuario',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  codigoUsuario!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
  })
  nombre!: string;

  @Column({
    name: 'codigo_registro',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  codigoRegistro!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
  })
  apellido!: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  ci!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefono!: string | null;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
  })
  password!: string;

  /*
   * Guarda solamente el hash SHA-256
   * del token de recuperación.
   */
  @Column({
    name: 'token_recuperacion_password',
    type: 'varchar',
    length: 64,
    nullable: true,
    select: false,
  })
  tokenRecuperacionPassword!: string | null;

  /*
   * Fecha y hora hasta la que el enlace
   * de recuperación será válido.
   */
  @Column({
    name: 'token_recuperacion_expira',
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  tokenRecuperacionExpira!: Date | null;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.PASAJERO,
  })
  rol!: RolUsuario;

  @Column({
    type: 'boolean',
    default: true,
  })
  estado!: boolean;

  @Column({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro!: Date;

  @Column({
    name: 'fecha_actualizacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}