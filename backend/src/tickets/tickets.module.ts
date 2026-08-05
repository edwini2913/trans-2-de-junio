import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditoriaModule } from '../auditoria/auditoria.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { Reserva } from '../reservas/entities/reserva.entity';

import { Ticket } from './entities/ticket.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    BlockchainModule,
    AuditoriaModule,

    TypeOrmModule.forFeature([
      Ticket,
      Reserva,
    ]),
  ],

  controllers: [
    TicketsController,
  ],

  providers: [
    TicketsService,
  ],

  exports: [
    TicketsService,
    TypeOrmModule,
  ],
})
export class TicketsModule {}