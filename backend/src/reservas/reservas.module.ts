import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditoriaModule } from '../auditoria/auditoria.module';

import { AsientoViaje } from '../asientos/entities/asiento-viaje.entity';

import { NotificacionesModule } from '../notificaciones/notificaciones.module';

import { TicketsModule } from '../tickets/tickets.module';

import { Usuario } from '../users/entities/usuario.entity';

import { Viaje } from '../viajes/entities/viaje.entity';

import { DetalleReserva } from './entities/detalle-reserva.entity';

import { Reserva } from './entities/reserva.entity';

import { ReservasController } from './reservas.controller';

import { ReservasService } from './reservas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reserva,
      DetalleReserva,
      AsientoViaje,
      Viaje,
      Usuario,
    ]),

    TicketsModule,
    NotificacionesModule,
    AuditoriaModule,
  ],

  controllers: [
    ReservasController,
  ],

  providers: [
    ReservasService,
  ],

  exports: [
    ReservasService,
    TypeOrmModule,
  ],
})
export class ReservasModule {}