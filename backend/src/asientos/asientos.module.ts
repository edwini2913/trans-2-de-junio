import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AsientosController } from './asientos.controller';
import { AsientosService } from './asientos.service';
import { AsientoViaje } from './entities/asiento-viaje.entity';
import { Viaje } from '../viajes/entities/viaje.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsientoViaje,
      Viaje,
    ]),
  ],
  controllers: [AsientosController],
  providers: [AsientosService],
  exports: [
    AsientosService,
    TypeOrmModule,
  ],
})
export class AsientosModule {}