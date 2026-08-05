import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AsientoViaje } from "../asientos/entities/asiento-viaje.entity";
import { Pago } from "../pagos/entities/pago.entity";
import { BlockchainModule } from "../blockchain/blockchain.module";
import { DetalleReserva } from "../reservas/entities/detalle-reserva.entity";
import { Reserva } from "../reservas/entities/reserva.entity";
import { Ticket } from "../tickets/entities/ticket.entity";
import { Usuario } from "../users/entities/usuario.entity";
import { Viaje } from "../viajes/entities/viaje.entity";

import { Venta } from "./entities/venta.entity";
import { VentasController } from "./ventas.controller";
import { VentasService } from "./ventas.service";

@Module({
  imports: [
    BlockchainModule,
    TypeOrmModule.forFeature([
      Venta,
      Usuario,
      Viaje,
      AsientoViaje,
      Reserva,
      DetalleReserva,
      Ticket,
      Pago,
    ]),
  ],

  controllers: [
    VentasController,
  ],

  providers: [
    VentasService,
  ],

  exports: [
    VentasService,
  ],
})
export class VentasModule {}
