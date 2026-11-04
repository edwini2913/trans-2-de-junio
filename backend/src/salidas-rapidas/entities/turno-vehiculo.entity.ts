
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import {
  Ruta,
} from "../../rutas/entities/ruta.entity";

import {
  Usuario,
} from "../../users/entities/usuario.entity";

import {
  Vehiculo,
} from "../../vehiculos/entities/vehiculo.entity";

import {
  Viaje,
} from "../../viajes/entities/viaje.entity";

export enum EstadoTurnoVehiculo {
  VENDIENDO = "VENDIENDO",
  SIGUIENTE = "SIGUIENTE",
  EN_ESPERA = "EN_ESPERA",
  COMPLETO = "COMPLETO",
  EN_RUTA = "EN_RUTA",
  FINALIZADO = "FINALIZADO",
  CANCELADO = "CANCELADO",
}

@Entity({
  schema: "sistema",
  name: "turnos_vehiculos",
})
@Index(
  "IDX_TURNOS_RUTA_FECHA",
  ["ruta", "fecha"],
)
@Index(
  "IDX_TURNOS_ESTADO",
  ["estado"],
)
@Index(
  "UQ_TURNO_POSICION_RUTA_FECHA",
  ["ruta", "fecha", "posicion"],
  {
    unique: true,
  },
)
@Index(
  "UQ_TURNO_VEHICULO_RUTA_FECHA",
  ["ruta", "fecha", "vehiculo"],
  {
    unique: true,
  },
)
@Index(
  "UQ_TURNO_VIAJE",
  ["viaje"],
  {
    unique: true,
  },
)
@Index(
  "IDX_TURNOS_CHOFER",
  ["chofer"],
)
@Check(
  "CHK_TURNO_POSICION_POSITIVA",
  '"posicion" > 0',
)
export class TurnoVehiculo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Ruta correspondiente a la salida rápida.
   */
  @ManyToOne(
    () => Ruta,
    {
      nullable: false,
      onDelete: "RESTRICT",
    },
  )
  @JoinColumn({
    name: "ruta_id",
  })
  ruta!: Ruta;

  /**
   * Vehículo Noah o Hiace registrado.
   */
  @ManyToOne(
    () => Vehiculo,
    {
      nullable: false,
      onDelete: "RESTRICT",
    },
  )
  @JoinColumn({
    name: "vehiculo_id",
  })
  vehiculo!: Vehiculo;

  /**
   * Chofer asignado a esta salida.
   *
   * Se deja nullable para mantener
   * compatibilidad con turnos anteriores.
   *
   * La secretaria debe confirmar el chofer
   * al registrar una nueva llegada.
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
    name: "chofer_id",
  })
  chofer!: Usuario | null;

  /**
   * Viaje utilizado por los módulos
   * de asientos, reservas, pagos y tickets.
   */
  @ManyToOne(
    () => Viaje,
    {
      nullable: false,
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({
    name: "viaje_id",
  })
  viaje!: Viaje;

  /**
   * Fecha de trabajo de la fila.
   */
  @Column({
    type: "date",
    name: "fecha",
  })
  fecha!: string;

  /**
   * Posición según el orden de llegada.
   */
  @Column({
    type: "integer",
    name: "posicion",
  })
  posicion!: number;

  /**
   * Estado del vehículo dentro de la fila.
   */
  @Column({
    type: "varchar",
    length: 30,
    name: "estado",
    default: EstadoTurnoVehiculo.EN_ESPERA,
  })
  estado!: EstadoTurnoVehiculo;

  /**
   * Indica si el turno permanece activo.
   */
  @Column({
    type: "boolean",
    name: "activo",
    default: true,
  })
  activo!: boolean;

  /**
   * Momento en que comenzó a vender pasajes.
   */
  @Column({
    type: "timestamp",
    name: "fecha_inicio_venta",
    nullable: true,
  })
  fechaInicioVenta!: Date | null;

  /**
   * Momento real de salida del vehículo.
   */
  @Column({
    type: "timestamp",
    name: "fecha_salida",
    nullable: true,
  })
  fechaSalida!: Date | null;

  /**
   * Administrador o secretaria responsable
   * de habilitar el turno.
   */
  @Column({
    type: "uuid",
    name: "habilitado_por",
    nullable: false,
  })
  habilitadoPor!: string;

  @CreateDateColumn({
    type: "timestamp",
    name: "fecha_registro",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaRegistro!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "fecha_actualizacion",
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}
