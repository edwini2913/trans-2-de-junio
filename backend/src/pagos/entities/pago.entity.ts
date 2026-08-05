import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  Reserva,
} from '../../reservas/entities/reserva.entity';

import {
  Usuario,
} from '../../users/entities/usuario.entity';

import {
  Viaje,
} from '../../viajes/entities/viaje.entity';

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity({
  name: 'pagos',
  schema: 'sistema',
})
@Index(
  'IDX_PAGOS_REFERENCIA',
  ['referencia'],
  {
    unique: true,
  },
)
@Index(
  'IDX_PAGOS_ESTADO',
  ['estado'],
)
@Index(
  'IDX_PAGOS_USUARIO',
  ['usuario'],
)
@Index(
  'IDX_PAGOS_VIAJE',
  ['viaje'],
)
@Index(
  'IDX_PAGOS_FECHA_REGISTRO',
  ['fechaRegistro'],
)
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
    () => Viaje,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'viaje_id',
  })
  viaje!: Viaje;

  /*
   * Se asignará cuando la administradora
   * apruebe el comprobante.
   */
  @OneToOne(
    () => Reserva,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'reserva_id',
  })
  reserva!: Reserva | null;

  /*
   * Permite pagar uno o varios asientos
   * dentro de una sola compra.
   */
  @Column({
    name: 'asiento_ids',
    type: 'uuid',
    array: true,
  })
  asientoIds!: string[];

  @Column({
    name: 'referencia',
    type: 'varchar',
    length: 100,
    unique: true,
  })
  referencia!: string;

  @Column({
    name: 'monto',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  monto!: number;

  @Column({
    name: 'comprobante_ruta',
    type: 'varchar',
    length: 500,
  })
  comprobanteRuta!: string;

  @Column({
    name: 'comprobante_nombre',
    type: 'varchar',
    length: 255,
  })
  comprobanteNombre!: string;

  @Column({
    name: 'comprobante_tipo',
    type: 'varchar',
    length: 100,
  })
  comprobanteTipo!: string;

  @Column({
    name: 'comprobante_tamanio',
    type: 'integer',
  })
  comprobanteTamanio!: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoPago,
    enumName: 'estado_pago',
    default: EstadoPago.PENDIENTE,
  })
  estado!: EstadoPago;

  @Column({
    name: 'observacion_administrador',
    type: 'text',
    nullable: true,
  })
  observacionAdministrador!: string | null;

  @ManyToOne(
    () => Usuario,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'revisado_por_id',
  })
  revisadoPor!: Usuario | null;

  @Column({
    name: 'fecha_revision',
    type: 'timestamp',
    nullable: true,
  })
  fechaRevision!: Date | null;

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