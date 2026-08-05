import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  Ticket,
} from '../../tickets/entities/ticket.entity';

import {
  Usuario,
} from '../../users/entities/usuario.entity';

import {
  CategoriaReclamo,
  EstadoReclamo,
  PrioridadReclamo,
  TipoReclamo,
} from '../enums/reclamo.enums';

import {
  MensajeReclamo,
} from './mensaje-reclamo.entity';

@Entity({
  name: 'reclamos',
  schema: 'sistema',
})
@Index(
  'IDX_RECLAMOS_CODIGO',
  ['codigo'],
  {
    unique: true,
  },
)
@Index(
  'IDX_RECLAMOS_ESTADO',
  ['estado'],
)
@Index(
  'IDX_RECLAMOS_USUARIO',
  ['usuario'],
)
@Index(
  'IDX_RECLAMOS_FECHA_REGISTRO',
  ['fechaRegistro'],
)
export class Reclamo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'codigo',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  codigo!: string;

  @ManyToOne(
    () => Usuario,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'usuario_id',
  })
  usuario!: Usuario;

  @ManyToOne(
    () => Ticket,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'ticket_id',
  })
  ticket!: Ticket | null;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: TipoReclamo,
    enumName: 'tipo_reclamo',
    default:
      TipoReclamo.RECLAMO,
  })
  tipo!: TipoReclamo;

  @Column({
    name: 'categoria',
    type: 'enum',
    enum: CategoriaReclamo,
    enumName:
      'categoria_reclamo',
    default:
      CategoriaReclamo.OTRO,
  })
  categoria!: CategoriaReclamo;

  @Column({
    name: 'prioridad',
    type: 'enum',
    enum: PrioridadReclamo,
    enumName:
      'prioridad_reclamo',
    default:
      PrioridadReclamo.NORMAL,
  })
  prioridad!: PrioridadReclamo;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoReclamo,
    enumName:
      'estado_reclamo',
    default:
      EstadoReclamo.PENDIENTE,
  })
  estado!: EstadoReclamo;

  @Column({
    name: 'asunto',
    type: 'varchar',
    length: 180,
  })
  asunto!: string;

  @Column({
    name: 'descripcion',
    type: 'text',
  })
  descripcion!: string;

  @Column({
    name: 'respuesta_final',
    type: 'text',
    nullable: true,
  })
  respuestaFinal!: string | null;

  @Column({
    name: 'cerrado_por_id',
    type: 'uuid',
    nullable: true,
  })
  cerradoPorId!: string | null;

  @Column({
    name: 'fecha_cierre',
    type: 'timestamp',
    nullable: true,
  })
  fechaCierre!: Date | null;

  @OneToMany(
    () => MensajeReclamo,
    (mensaje) =>
      mensaje.reclamo,
  )
  mensajes!: MensajeReclamo[];

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'timestamp',
  })
  fechaRegistro!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
    type: 'timestamp',
  })
  fechaActualizacion!: Date;
}