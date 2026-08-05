import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AsientoViaje } from '../asientos/entities/asiento-viaje.entity';
import { BloqueTicket } from '../blockchain/entities/bloque-ticket.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Reclamo } from '../reclamos/entities/reclamo.entity';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Ruta } from '../rutas/entities/ruta.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { Viaje } from '../viajes/entities/viaje.entity';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Ruta,
      Vehiculo,
      Viaje,
      Reserva,
      AsientoViaje,
      Pago,
      Ticket,
      BloqueTicket,
      Reclamo,
    ]),
  ],

  controllers: [
    AdminController,
  ],

  providers: [
    AdminService,
  ],

  exports: [
    AdminService,
  ],
})
export class AdminModule {}