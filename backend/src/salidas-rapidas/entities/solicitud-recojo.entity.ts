import {
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
  Usuario,
} from "../../users/entities/usuario.entity";

import {
  Viaje,
} from "../../viajes/entities/viaje.entity";

export enum EstadoSolicitudRecojo {
  PENDIENTE = "PENDIENTE",
  CONFIRMADA = "CONFIRMADA",
  RECOGIDO = "RECOGIDO",
  CANCELADA = "CANCELADA",
  NO_ENCONTRADO = "NO_ENCONTRADO",
}

@Entity({
  schema: "sistema",
  name: "solicitudes_recojo",
})
@Index(
  "IDX_SOLICITUDES_RECOJO_USUARIO",
  ["usuario"],
)
@Index(
  "IDX_SOLICITUDES_RECOJO_VIAJE",
  ["viaje"],
)
@Index(
  "IDX_SOLICITUDES_RECOJO_ESTADO",
  ["estado"],
)
export class SolicitudRecojo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /**
   * Usuario que solicita ser recogido
   * durante el recorrido.
   */
  @ManyToOne(
    () => Usuario,
    {
      nullable: false,
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({
    name: "usuario_id",
  })
  usuario!: Usuario;

  /**
   * Viaje Noah o Hiace correspondiente.
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
   * Lugar donde se recogerá al pasajero.
   */
  @Column({
    type: "varchar",
    length: 250,
    name: "referencia",
  })
  referencia!: string;

  @Column({
    type: "varchar",
    length: 20,
    name: "telefono",
  })
  telefono!: string;

  /**
   * Coordenadas opcionales del pasajero.
   */
  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    name: "latitud",
    nullable: true,
  })
  latitud!: number | null;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 7,
    name: "longitud",
    nullable: true,
  })
  longitud!: number | null;

  @Column({
    type: "varchar",
    length: 300,
    name: "observacion",
    nullable: true,
  })
  observacion!: string | null;

  @Column({
    type: "varchar",
    length: 30,
    name: "estado",
    default:
      EstadoSolicitudRecojo.PENDIENTE,
  })
  estado!: EstadoSolicitudRecojo;

  /**
   * Administrador o secretaria que
   * confirmó o actualizó la solicitud.
   */
  @Column({
    type: "uuid",
    name: "confirmado_por",
    nullable: true,
  })
  confirmadoPor!: string | null;

  @Column({
    type: "timestamp",
    name: "fecha_confirmacion",
    nullable: true,
  })
  fechaConfirmacion!: Date | null;

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