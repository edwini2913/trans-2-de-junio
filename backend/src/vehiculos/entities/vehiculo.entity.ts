import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Viaje } from "../../viajes/entities/viaje.entity";

export enum TipoVehiculo {
  FLOTA = "FLOTA",
  NOAH = "NOAH",
}

@Entity({
  schema: "sistema",
  name: "vehiculos",
})
@Index("IDX_VEHICULOS_PLACA", ["placa"], {
  unique: true,
})
@Index("IDX_VEHICULOS_NUMERO_FLOTA", ["numeroFlota"], {
  unique: true,
})
@Index("IDX_VEHICULOS_ESTADO", ["estado"])
@Index("IDX_VEHICULOS_TIPO", ["tipo"])
@Check(
  "CHK_VEHICULOS_CAPACIDAD_POSITIVA",
  '"capacidad" > 0',
)
export class Vehiculo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Número interno con el que el sindicato
   * identifica rápidamente cada flota.
   *
   * Ejemplos: 211, 212, 305.
   */
  @Column({
    type: "varchar",
    length: 20,
    name: "numero_flota",
    unique: true,
    nullable: true,
  })
  numeroFlota!: string | null;

  @Column({
    type: "varchar",
    length: 20,
    name: "placa",
    unique: true,
  })
  placa!: string;

  @Column({
    type: "varchar",
    length: 100,
    name: "marca",
  })
  marca!: string;

  @Column({
    type: "varchar",
    length: 100,
    name: "modelo",
  })
  modelo!: string;

  @Column({
    type: "varchar",
    length: 20,
    name: "tipo",
    default: TipoVehiculo.NOAH,
  })
  tipo!: TipoVehiculo;

  @Column({
    type: "integer",
    name: "capacidad",
    default: 7,
  })
  capacidad!: number;

  @Column({
    type: "boolean",
    name: "estado",
    default: true,
  })
  estado!: boolean;

  @OneToMany(
    () => Viaje,
    (viaje) => viaje.vehiculo,
    {
      cascade: false,
    },
  )
  viajes!: Viaje[];

  @CreateDateColumn({
    type: "timestamp",
    name: "fecha_registro",
  })
  fechaRegistro!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "fecha_actualizacion",
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}