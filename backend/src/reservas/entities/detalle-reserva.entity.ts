import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Reserva } from './reserva.entity';

import { AsientoViaje } from '../../asientos/entities/asiento-viaje.entity';

@Entity({
  schema: 'sistema',
  name: 'detalle_reserva',
})
@Index(
  'IDX_DETALLE_RESERVA_RESERVA',
  ['reserva'],
)
@Index(
  'IDX_DETALLE_RESERVA_ASIENTO',
  ['asientoViaje'],
)
@Index(
  'UQ_DETALLE_RESERVA_ASIENTO',
  [
    'reserva',
    'asientoViaje',
  ],
  {
    unique: true,
  },
)
export class DetalleReserva {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => Reserva,
    (reserva) =>
      reserva.detalles,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'reserva_id',
  })
  reserva!: Reserva;

  @ManyToOne(
    () => AsientoViaje,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'asiento_viaje_id',
  })
  asientoViaje!: AsientoViaje;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  precio!: number;

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () =>
      'CURRENT_TIMESTAMP',
  })
  fechaRegistro!: Date;
}