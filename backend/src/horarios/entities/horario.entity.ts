import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ruta } from '../../rutas/entities/ruta.entity';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Ruta)
  @JoinColumn({ name: 'ruta_id' })
  ruta!: Ruta;

  @Column({ name: 'hora_salida', type: 'time' })
  horaSalida!: string;

  @Column({ length: 50, nullable: true })
  dias!: string;

  @Column({ default: true })
  estado!: boolean;

  @Column({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro!: Date;
}