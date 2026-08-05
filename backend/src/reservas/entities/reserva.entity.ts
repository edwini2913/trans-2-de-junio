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
} from "typeorm";

import { Usuario } from "../../users/entities/usuario.entity";
import { Viaje } from "../../viajes/entities/viaje.entity";
import { DetalleReserva } from "./detalle-reserva.entity";

export enum EstadoReserva {
  PENDIENTE = "PENDIENTE",
  CONFIRMADA = "CONFIRMADA",
  CANCELADA = "CANCELADA",
  VENCIDA = "VENCIDA",
}

@Entity({
  schema: "sistema",
  name: "reservas",
})
@Index("IDX_RESERVA_CODIGO", ["codigoReserva"], {
  unique: true,
})
@Index("IDX_RESERVA_ESTADO", ["estado"])
@Index("IDX_RESERVA_USUARIO", ["usuario"])
@Index("IDX_RESERVA_VIAJE", ["viaje"])
@Index("IDX_RESERVA_FECHA", ["fechaReserva"])
export class Reserva {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /*
   * El usuario puede ser null porque una venta
   * en oficina puede realizarse sin una cuenta.
   */
  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({
    name: "usuario_id",
  })
  usuario!: Usuario | null;

  @ManyToOne(() => Viaje, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "viaje_id",
  })
  viaje!: Viaje;

  /*
   * Los asientos de la reserva se almacenan
   * en la tabla detalle_reservas.
   */
  @OneToMany(() => DetalleReserva, (detalle) => detalle.reserva, {
    cascade: ["insert"],
  })
  detalles!: DetalleReserva[];

  @Column({
    name: "codigo_reserva",
    type: "varchar",
    length: 50,
    unique: true,
  })
  codigoReserva!: string;

  @Column({
    type: "varchar",
    length: 20,
    default: EstadoReserva.PENDIENTE,
  })
  estado!: EstadoReserva;

  /**
   * Solo se utiliza mientras la reserva está PENDIENTE.
   * Al vencer, los asientos se liberan automáticamente.
   */
  @Column({
    name: "fecha_vencimiento",
    type: "timestamp",
    nullable: true,
  })
  fechaVencimiento!: Date | null;

  @CreateDateColumn({
    name: "fecha_registro",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  fechaReserva!: Date;

  @UpdateDateColumn({
    name: "fecha_actualizacion",
    type: "timestamp",
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}
