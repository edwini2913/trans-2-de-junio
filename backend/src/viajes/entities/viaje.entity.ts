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

import { Ruta } from '../../rutas/entities/ruta.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { AsientoViaje } from '../../asientos/entities/asiento-viaje.entity';

export enum EstadoViaje {
  PROGRAMADO = 'PROGRAMADO',
  EN_CURSO = 'EN_CURSO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

@Entity({
  schema: 'sistema',
  name: 'viajes',
})
@Index('idx_viajes_ruta_fecha', ['ruta', 'fecha'])
export class Viaje {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => Ruta,
    (ruta) => ruta.viajes,
    {
      nullable: false,
      eager: false,
    },
  )
  @JoinColumn({
    name: 'ruta_id',
  })
  ruta!: Ruta;

  @ManyToOne(
    () => Vehiculo,
    (vehiculo) => vehiculo.viajes,
    {
      nullable: false,
      eager: false,
    },
  )
  @JoinColumn({
    name: 'vehiculo_id',
  })
  vehiculo!: Vehiculo;

  @Column({
    type: 'date',
  })
  fecha!: string;

  @Column({
    name: 'hora_salida',
    type: 'time',
  })
  horaSalida!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  precio!: number;

  @Column({
    name: 'asientos_disponibles',
    type: 'integer',
    default: 0,
  })
  asientosDisponibles!: number;

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoViaje.PROGRAMADO,
  })
  estado!: EstadoViaje;

  @OneToMany(
    () => AsientoViaje,
    (asiento) => asiento.viaje,
  )
  asientos!: AsientoViaje[];

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