
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import {
  Usuario,
} from "../../users/entities/usuario.entity";

import {
  Viaje,
} from "../../viajes/entities/viaje.entity";

export enum TipoVehiculo {
  FLOTA = "FLOTA",
  NOAH = "NOAH",
  HIACE = "HIACE",
}

@Entity({
  schema: "sistema",
  name: "vehiculos",
})
@Index("IDX_VEHICULOS_PLACA", ["placa"], {
  unique: true,
})
@Index(
  "IDX_VEHICULOS_NUMERO_FLOTA",
  ["numeroFlota"],
  {
    unique: true,
  },
)
@Index("IDX_VEHICULOS_ESTADO", ["estado"])
@Index("IDX_VEHICULOS_TIPO", ["tipo"])
@Index(
  "IDX_VEHICULOS_CHOFER_HABITUAL",
  ["choferHabitual"],
)
@Check(
  "CHK_VEHICULOS_CAPACIDAD_POSITIVA",
  '"capacidad" > 0',
)
export class Vehiculo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Número interno del vehículo.
   * Para Noah y Hiace puede quedar vacío.
   */
  @Column({
    type: "varchar",
    length: 20,
    name: "numero_flota",
    unique: true,
    nullable: true,
  })
  numeroFlota!: string | null;

  /**
   * Placa única del vehículo.
   */
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

  /**
   * Tipos de vehículos:
   * FLOTA = 40 pasajeros
   * NOAH = 7 pasajeros
   * HIACE = 10 pasajeros
   */
  @Column({
    type: "varchar",
    length: 20,
    name: "tipo",
    default: TipoVehiculo.NOAH,
  })
  tipo!: TipoVehiculo;

  /**
   * Capacidad calculada por VehiculosService.
   */
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

  /**
   * CHOFER HABITUAL
   *
   * Relación opcional con un usuario CHOFER.
   *
   * Permite identificar automáticamente
   * el conductor habitual al buscar la placa.
   *
   * Si el chofer se elimina, la asignación
   * queda vacía, sin borrar el vehículo.
   *
   * El conductor efectivo de cada salida
   * continúa almacenándose por separado
   * en TurnoVehiculo.
   */
  @ManyToOne(
    () => Usuario,
    {
      nullable: true,
      eager: false,
      onDelete: "SET NULL",
    },
  )
  @JoinColumn({
    name: "chofer_habitual_id",
  })
  choferHabitual!: Usuario | null;

  /**
   * Viajes asociados al vehículo.
   */
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
