import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  NotificacionesModule,
} from '../notificaciones/notificaciones.module';

import {
  Ticket,
} from '../tickets/entities/ticket.entity';

import {
  Usuario,
} from '../users/entities/usuario.entity';

import {
  MensajeReclamo,
} from './entities/mensaje-reclamo.entity';

import {
  Reclamo,
} from './entities/reclamo.entity';

import {
  ReclamosController,
} from './reclamos.controller';

import {
  ReclamosService,
} from './reclamos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reclamo,
      MensajeReclamo,
      Usuario,
      Ticket,
    ]),

    NotificacionesModule,
  ],

  controllers: [
    ReclamosController,
  ],

  providers: [
    ReclamosService,
  ],

  exports: [
    ReclamosService,
  ],
})
export class ReclamosModule {}