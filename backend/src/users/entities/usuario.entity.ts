import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
codigoUsuario!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({
  name: 'codigo_registro',
  length: 20,
  unique: true,
  nullable: true,
})
codigoRegistro!: string;

  @Column({ length: 100 })
  apellido!: string;

  @Column({ length: 20, unique: true })
  ci!: string;

  @Column({ length: 20, nullable: true })
  telefono!: string;

  @Column({ length: 150, unique: true })
  email!: string;

  @Column({
  type: 'varchar',
  length: 255,
  select: false,
  })
  password!: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.PASAJERO,
  })
  rol!: RolUsuario;

  @Column({ default: true })
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
  fechaActualizacion!: Date;
}