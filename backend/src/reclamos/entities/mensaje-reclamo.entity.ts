import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Usuario } from '../../users/entities/usuario.entity';

import { TipoAutorMensaje } from '../enums/reclamo.enums';

import { Reclamo } from './reclamo.entity';

@Entity({
  schema: 'sistema',
  name: 'mensajes_reclamo',
})
@Index('IDX_MENSAJE_RECLAMO', ['reclamo'])
@Index('IDX_MENSAJE_USUARIO', ['usuario'])
@Index('IDX_MENSAJE_FECHA', ['fechaRegistro'])
export class MensajeReclamo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => Reclamo,
    (reclamo) => reclamo.mensajes,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'reclamo_id',
  })
  reclamo!: Reclamo;

  @ManyToOne(
    () => Usuario,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'usuario_id',
  })
  usuario!: Usuario | null;

  @Column({
    name: 'tipo_autor',
    type: 'enum',
    enum: TipoAutorMensaje,
    enumName: 'tipo_autor_mensaje_reclamo',
  })
  tipoAutor!: TipoAutorMensaje;

  @Column({
    name: 'mensaje',
    type: 'text',
  })
  mensaje!: string;

  @Column({
    name: 'archivo_url',
    type: 'text',
    nullable: true,
  })
  archivoUrl!: string | null;

  @Column({
    name: 'nombre_archivo',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  nombreArchivo!: string | null;

  @Column({
    name: 'tipo_archivo',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  tipoArchivo!: string | null;

  @Column({
    name: 'leido',
    type: 'boolean',
    default: false,
  })
  leido!: boolean;

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'timestamp',
  })
  fechaRegistro!: Date;
}