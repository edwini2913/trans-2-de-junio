import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ schema: 'sistema', name: 'blockchain_tickets' })
@Index('UQ_BLOCKCHAIN_TICKET_ID', ['ticketId'], { unique: true })
@Index('UQ_BLOCKCHAIN_HASH_BLOQUE', ['hashBloque'], { unique: true })
@Index('UQ_BLOCKCHAIN_INDICE', ['indice'], { unique: true })
export class BloqueTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'bigint', unique: true })
  indice!: string;

  @Column({ name: 'ticket_id', type: 'uuid', unique: true })
  ticketId!: string;

  @Column({ name: 'codigo_ticket', type: 'varchar', length: 40 })
  codigoTicket!: string;

  @Column({ name: 'datos_ticket', type: 'text' })
  datosTicket!: string;

  @Column({ name: 'hash_datos', type: 'varchar', length: 64 })
  hashDatos!: string;

  @Column({ name: 'hash_anterior', type: 'varchar', length: 64 })
  hashAnterior!: string;

  @Column({ name: 'hash_bloque', type: 'varchar', length: 64, unique: true })
  hashBloque!: string;

  @Column({ name: 'fecha_bloque', type: 'timestamp' })
  fechaBloque!: Date;

  @CreateDateColumn({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro!: Date;
}
