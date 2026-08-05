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

import { Viaje } from '../../viajes/entities/viaje.entity';

export enum EstadoAsientoViaje {
  DISPONIBLE = 'DISPONIBLE',
  BLOQUEADO = 'BLOQUEADO',
  RESERVADO = 'RESERVADO',
  VENDIDO = 'VENDIDO',
}

/**
 * Alias de compatibilidad.
 *
 * Permite que los archivos antiguos sigan importando:
 *
 * import { EstadoAsiento } from './asiento-viaje.entity';
 *
 * sin cambiar la estructura de la base de datos.
 */
export { EstadoAsientoViaje as EstadoAsiento };

@Entity({
  schema: 'sistema',
  name: 'asientos_viaje',
})
@Index(
  'uq_asiento_numero_por_viaje',
  ['viaje', 'numero'],
  {
    unique: true,
  },
)
export class AsientoViaje {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => Viaje,
    (viaje) => viaje.asientos,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'viaje_id',
  })
  viaje!: Viaje;

  @Column({
    type: 'integer',
  })
  numero!: number;

  @Column({
    type: 'varchar',
    length: 30,
    default:
      EstadoAsientoViaje.DISPONIBLE,
  })
  estado!: EstadoAsientoViaje;

  @Column({
    name: 'bloqueado_por',
    type: 'uuid',
    nullable: true,
  })
  bloqueadoPor!: string | null;

  @Column({
    name: 'bloqueado_hasta',
    type: 'timestamp',
    nullable: true,
  })
  bloqueadoHasta!: Date | null;

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