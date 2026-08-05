import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditoriaModule } from '../auditoria/auditoria.module';

import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { BloqueTicket } from './entities/bloque-ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BloqueTicket,
    ]),

    AuditoriaModule,
  ],

  controllers: [
    BlockchainController,
  ],

  providers: [
    BlockchainService,
  ],

  exports: [
    BlockchainService,
  ],
})
export class BlockchainModule {}