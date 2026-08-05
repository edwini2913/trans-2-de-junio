import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Usuario } from '../../users/entities/usuario.entity';
import { Viaje } from '../../viajes/entities/viaje.entity';
import { AsientoViaje } from '../../asientos/entities/asiento-viaje.entity';

@Entity({
  schema: 'sistema',
  name: 'ventas',
})
export class Venta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'codigo_venta',
    type: 'varchar',
    length: 40,
    unique: true,
  })
  codigoVenta!: string;

  @ManyToOne(() => Usuario, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'usuario_id',
  })
  usuario!: Usuario | null;

  @Column({
    name: 'pasajero_nombre',
    type: 'varchar',
    length: 150,
  })
  pasajeroNombre!: string;

  @Column({
    name: 'pasajero_ci',
    type: 'varchar',
    length: 30,
  })
  pasajeroCi!: string;

  @Column({
    name: 'pasajero_telefono',
    type: 'varchar',
    length: 30,
  })
  pasajeroTelefono!: string;

  @Column({
    name: 'pasajero_email',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  pasajeroEmail!: string | null;

  @ManyToOne(() => Viaje, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'viaje_id',
  })
  viaje!: Viaje;

  @ManyToOne(() => AsientoViaje, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'asiento_viaje_id',
  })
  asiento!: AsientoViaje;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  monto!: number;

  @Column({
    name: 'metodo_pago',
    type: 'varchar',
    length: 30,
    default: 'EFECTIVO',
  })
  metodoPago!: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'PAGADA',
  })
  estado!: string;

  @Column({
    name: 'origen_venta',
    type: 'varchar',
    length: 30,
    default: 'OFICINA',
  })
  origenVenta!: string;

  @CreateDateColumn({
    name: 'fecha_venta',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaVenta!: Date;
}