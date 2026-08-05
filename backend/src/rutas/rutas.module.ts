import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ruta } from './entities/ruta.entity';
import { RutasController } from './rutas.controller';
import { RutasService } from './rutas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ruta]),
  ],
  controllers: [RutasController],
  providers: [RutasService],
  exports: [RutasService],
})
export class RutasModule {}