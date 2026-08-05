import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';
import { Viaje } from './entities/viaje.entity';

import { Ruta } from '../rutas/entities/ruta.entity';
import { Vehiculo } from '../vehiculos/entities/vehiculo.entity';
import { AsientoViaje } from '../asientos/entities/asiento-viaje.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Viaje,
      Ruta,
      Vehiculo,
      AsientoViaje,
    ]),
  ],
  controllers: [
    ViajesController,
  ],
  providers: [
    ViajesService,
  ],
  exports: [
    ViajesService,
    TypeOrmModule,
  ],
})
export class ViajesModule {}