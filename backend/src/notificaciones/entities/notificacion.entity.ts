import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Usuario } from '../../users/entities/usuario.entity';

import {
  DestinatarioNotificacion,
  PrioridadNotificacion,
  TipoNotificacion,
} from '../enums/notificacion.enums';

@Entity({
  name: 'notificaciones',
  schema: 'sistema',
})
@Index(
  'IDX_NOTIFICACIONES_DESTINATARIO',
  ['destinatario'],
)
@Index(
  'IDX_NOTIFICACIONES_ROL_DESTINATARIO',
  ['rolDestinatario'],
)
@Index(
  'IDX_NOTIFICACIONES_TIPO',
  ['tipo'],
)
@Index(
  'IDX_NOTIFICACIONES_LEIDA',
  ['leida'],
)
@Index(
  'IDX_NOTIFICACIONES_FECHA',
  ['fechaRegistro'],
)
@Index(
  'IDX_NOTIFICACIONES_REFERENCIA',
  ['referenciaTipo', 'referenciaId'],
)
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Se utiliza cuando la notificación
   * pertenece a un usuario específico.
   *
   * Para las notificaciones generales del
   * administrador puede permanecer en null.
   */
  @ManyToOne(
    () => Usuario,
    {
      nullable: true,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'destinatario_id',
  })
  destinatario!: Usuario | null;

  @Column({
    name: 'rol_destinatario',
    type: 'enum',
    enum: DestinatarioNotificacion,
    enumName:
      'destinatario_notificacion',
  })
  rolDestinatario!: DestinatarioNotificacion;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: TipoNotificacion,
    enumName: 'tipo_notificacion',
  })
  tipo!: TipoNotificacion;

  @Column({
    name: 'prioridad',
    type: 'enum',
    enum: PrioridadNotificacion,
    enumName:
      'prioridad_notificacion',
    default:
      PrioridadNotificacion.NORMAL,
  })
  prioridad!: PrioridadNotificacion;

  @Column({
    name: 'titulo',
    type: 'varchar',
    length: 160,
  })
  titulo!: string;

  @Column({
    name: 'mensaje',
    type: 'text',
  })
  mensaje!: string;

  /**
   * Guarda el módulo relacionado:
   * RECLAMO, RESERVA, VENTA o TICKET.
   */
  @Column({
    name: 'referencia_tipo',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  referenciaTipo!: string | null;

  /**
   * Identificador UUID del reclamo,
   * reserva, venta o ticket.
   */
  @Column({
    name: 'referencia_id',
    type: 'uuid',
    nullable: true,
  })
  referenciaId!: string | null;

  /**
   * Página que se abrirá al presionar
   * la notificación.
   */
  @Column({
    name: 'ruta_destino',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  rutaDestino!: string | null;

  @Column({
    name: 'leida',
    type: 'boolean',
    default: false,
  })
  leida!: boolean;

  @Column({
    name: 'fecha_lectura',
    type: 'timestamp',
    nullable: true,
  })
  fechaLectura!: Date | null;

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