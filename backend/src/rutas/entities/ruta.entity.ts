import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Viaje } from '../../viajes/entities/viaje.entity';

@Entity({
  schema: 'sistema',
  name: 'rutas',
})
@Index('idx_rutas_origen_destino', [
  'origen',
  'destino',
])
@Check(
  'chk_rutas_distancia_positiva',
  '"distancia_km" IS NULL OR "distancia_km" > 0',
)
export class Ruta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  origen!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  destino!: string;

  @Column({
    name: 'distancia_km',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  distanciaKm!: number | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  estado!: boolean;

  @OneToMany(
    () => Viaje,
    (viaje) => viaje.ruta,
  )
  viajes!: Viaje[];

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
    type: 'timestamp',
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}