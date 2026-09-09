import {
  Module,
} from "@nestjs/common";

import {
  TypeOrmModule,
} from "@nestjs/typeorm";

import {
  AsientoViaje,
} from "../asientos/entities/asiento-viaje.entity";

import {
  Ruta,
} from "../rutas/entities/ruta.entity";

import {
  Usuario,
} from "../users/entities/usuario.entity";

import {
  Vehiculo,
} from "../vehiculos/entities/vehiculo.entity";

import {
  Viaje,
} from "../viajes/entities/viaje.entity";

import {
  AvisoSalida,
} from "./entities/aviso-salida.entity";

import {
  SolicitudRecojo,
} from "./entities/solicitud-recojo.entity";

import {
  TurnoVehiculo,
} from "./entities/turno-vehiculo.entity";

import {
  SalidasRapidasController,
} from "./salidas-rapidas.controller";

import {
  SalidasRapidasService,
} from "./salidas-rapidas.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TurnoVehiculo,
      SolicitudRecojo,
      AvisoSalida,
      Ruta,
      Vehiculo,
      Viaje,
      AsientoViaje,
      Usuario,
    ]),
  ],

  controllers: [
    SalidasRapidasController,
  ],

  providers: [
    SalidasRapidasService,
  ],

  exports: [
    SalidasRapidasService,
    TypeOrmModule,
  ],
})
export class SalidasRapidasModule {}