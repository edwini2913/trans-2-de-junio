import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Viaje } from '../../viajes/entities/viaje.entity';

export type EstadoAsiento =
  | 'DISPONIBLE'
  | 'OCUPADO'
  | 'BLOQUEADO';

@Entity({
  name: 'asientos',
})
@Unique('uq_asiento_viaje_numero', [
  'viaje',
  'numero',
])
@Index('idx_asientos_estado', [
  'estado',
])
export class Asiento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'integer',
  })
  numero!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'DISPONIBLE',
  })
  estado!: EstadoAsiento;

  @ManyToOne(
    () => Viaje,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'viaje_id',
  })
  viaje!: Viaje;
}