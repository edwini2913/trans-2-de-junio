import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Reserva } from '../../reservas/entities/reserva.entity';

export enum EstadoTicket {
  VALIDO = 'VALIDO',
  UTILIZADO = 'UTILIZADO',
  CANCELADO = 'CANCELADO',
}

@Entity({
  schema: 'sistema',
  name: 'tickets',
})
@Index(
  'UQ_TICKET_RESERVA',
  ['reserva'],
  {
    unique: true,
  },
)
@Index(
  'IDX_TICKET_NUMERO',
  ['numeroTicket'],
  {
    unique: true,
  },
)
@Index(
  'IDX_TICKET_CODIGO',
  ['codigoTicket'],
  {
    unique: true,
  },
)
@Index(
  'IDX_TICKET_TOKEN',
  ['tokenValidacion'],
  {
    unique: true,
  },
)
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /*
   * Una reserva genera únicamente un ticket.
   * La reserva puede contener varios detalles de asientos.
   */
  @OneToOne(
    () => Reserva,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'reserva_id',
  })
  reserva!: Reserva;

  @Column({
    name: 'numero_ticket',
    type: 'bigint',
    unique: true,
  })
  numeroTicket!: string;

  @Column({
    name: 'codigo_ticket',
    type: 'varchar',
    length: 40,
    unique: true,
  })
  codigoTicket!: string;

  @Column({
    name: 'token_validacion',
    type: 'varchar',
    length: 100,
    unique: true,
  })
  tokenValidacion!: string;

  @Column({
    name: 'imagen_qr',
    type: 'text',
  })
  imagenQr!: string;

  @Column({
    type: 'enum',
    enum: EstadoTicket,
    default: EstadoTicket.VALIDO,
  })
  estado!: EstadoTicket;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
    default: () =>
      'CURRENT_TIMESTAMP',
  })
  fechaCreacion!: Date;

  @Column({
    name: 'fecha_uso',
    type: 'timestamp',
    nullable: true,
  })
  fechaUso!: Date | null;
}