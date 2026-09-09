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
  Vehiculo,
} from "../../vehiculos/entities/vehiculo.entity";

import {
  Viaje,
} from "../../viajes/entities/viaje.entity";

export enum EstadoTurnoVehiculo {
  /**
   * Vehículo que actualmente recibe
   * compras y reservas.
   */
  VENDIENDO = "VENDIENDO",

  /**
   * Segundo vehículo de la fila.
   */
  SIGUIENTE = "SIGUIENTE",

  /**
   * Vehículos que esperan su turno.
   */
  EN_ESPERA = "EN_ESPERA",

  /**
   * Alcanzó su capacidad máxima.
   */
  COMPLETO = "COMPLETO",

  /**
   * La secretaria autorizó la salida
   * o el vehículo salió automáticamente.
   */
  EN_RUTA = "EN_RUTA",

  /**
   * El recorrido fue completado.
   */
  FINALIZADO = "FINALIZADO",

  /**
   * Fue retirado de la fila.
   */
  CANCELADO = "CANCELADO",
}

@Entity({
  schema: "sistema",
  name: "turnos_vehiculos",
})
@Index(
  "IDX_TURNOS_RUTA_FECHA",
  [
    "ruta",
    "fecha",
  ],
)
@Index(
  "IDX_TURNOS_ESTADO",
  [
    "estado",
  ],
)
@Index(
  "UQ_TURNO_POSICION_RUTA_FECHA",
  [
    "ruta",
    "fecha",
    "posicion",
  ],
  {
    unique: true,
  },
)
@Index(
  "UQ_TURNO_VEHICULO_RUTA_FECHA",
  [
    "ruta",
    "fecha",
    "vehiculo",
  ],
  {
    unique: true,
  },
)
@Index(
  "UQ_TURNO_VIAJE",
  [
    "viaje",
  ],
  {
    unique: true,
  },
)
@Check(
  "CHK_TURNO_POSICION_POSITIVA",
  '"posicion" > 0',
)
export class TurnoVehiculo {
  @PrimaryGeneratedColumn(
    "uuid",
  )
  id!: string;

  /**
   * Ruta para la cual fue habilitado
   * el vehículo rápido.
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
   * Noah o Hiace asignado al turno.
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
   * Viaje utilizado para generar asientos,
   * reservas, ventas, pagos y tickets.
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
   * Orden asignado por la secretaria.
   *
   * Ejemplo:
   * 1 = vehículo actual.
   * 2 = siguiente.
   * 3, 4 y 5 = en espera.
   */
  @Column({
    type: "integer",
    name: "posicion",
  })
  posicion!: number;

  @Column({
    type: "varchar",
    length: 30,
    name: "estado",
    default:
      EstadoTurnoVehiculo.EN_ESPERA,
  })
  estado!: EstadoTurnoVehiculo;

  /**
   * Indica si el turno permanece habilitado
   * para mostrarse a usuarios y administración.
   */
  @Column({
    type: "boolean",
    name: "activo",
    default: true,
  })
  activo!: boolean;

  /**
   * Momento en que el vehículo comenzó
   * a recibir compras y reservas.
   */
  @Column({
    type: "timestamp",
    name: "fecha_inicio_venta",
    nullable: true,
  })
  fechaInicioVenta!: Date | null;

  /**
   * Momento real de salida.
   */
  @Column({
    type: "timestamp",
    name: "fecha_salida",
    nullable: true,
  })
  fechaSalida!: Date | null;

  /**
   * Identificador del administrador o
   * secretaria que habilitó el turno.
   *
   * Se almacena como UUID para conservar
   * compatibilidad con la autenticación actual.
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
    default: () =>
      "CURRENT_TIMESTAMP",
  })
  fechaRegistro!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "fecha_actualizacion",
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}