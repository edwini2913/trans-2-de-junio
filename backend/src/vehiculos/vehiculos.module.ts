
import {
  Module,
} from "@nestjs/common";

import {
  TypeOrmModule,
} from "@nestjs/typeorm";

import {
  Usuario,
} from "../users/entities/usuario.entity";

import {
  Vehiculo,
} from "./entities/vehiculo.entity";

import {
  VehiculosController,
} from "./vehiculos.controller";

import {
  VehiculosService,
} from "./vehiculos.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehiculo,
      Usuario,
    ]),
  ],

  controllers: [
    VehiculosController,
  ],

  providers: [
    VehiculosService,
  ],

  exports: [
    VehiculosService,
    TypeOrmModule,
  ],
})
export class VehiculosModule {}
