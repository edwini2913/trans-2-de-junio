import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditoriaModule } from '../auditoria/auditoria.module';

import { AsientoViaje } from '../asientos/entities/asiento-viaje.entity';

import { Notificacion } from '../notificaciones/entities/notificacion.entity';

import { Reserva } from '../reservas/entities/reserva.entity';

import { ReservasModule } from '../reservas/reservas.module';

import { Usuario } from '../users/entities/usuario.entity';

import { Viaje } from '../viajes/entities/viaje.entity';

import { Pago } from './entities/pago.entity';

import { PagosController } from './pagos.controller';

import { PagosService } from './pagos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      Usuario,
      Viaje,
      AsientoViaje,
      Reserva,
      Notificacion,
    ]),

    ReservasModule,

    AuditoriaModule,
  ],

  controllers: [
    PagosController,
  ],

  providers: [
    PagosService,
  ],

  exports: [
    PagosService,
    TypeOrmModule,
  ],
})
export class PagosModule {}