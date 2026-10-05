import {
  Module,
} from "@nestjs/common";

import {
  ConfigModule,
  ConfigService,
} from "@nestjs/config";

import {
  TypeOrmModule,
  TypeOrmModuleOptions,
} from "@nestjs/typeorm";

import {
  AppController,
} from "./app.controller";

import {
  AppService,
} from "./app.service";

import {
  AdminModule,
} from "./admin/admin.module";

import {
  AsientosModule,
} from "./asientos/asientos.module";

import {
  AuditoriaModule,
} from "./auditoria/auditoria.module";

import {
  AuthModule,
} from "./auth/auth.module";

import {
  BlockchainModule,
} from "./blockchain/blockchain.module";

import {
  NotificacionesModule,
} from "./notificaciones/notificaciones.module";

import {
  PagosModule,
} from "./pagos/pagos.module";

import {
  ReclamosModule,
} from "./reclamos/reclamos.module";

import {
  ReservasModule,
} from "./reservas/reservas.module";

import {
  RutasModule,
} from "./rutas/rutas.module";

import {
  SalidasRapidasModule,
} from "./salidas-rapidas/salidas-rapidas.module";

import {
  TicketsModule,
} from "./tickets/tickets.module";

import {
  UsersModule,
} from "./users/users.module";

import {
  VehiculosModule,
} from "./vehiculos/vehiculos.module";

import {
  VentasModule,
} from "./ventas/ventas.module";

import {
  ViajesModule,
} from "./viajes/viajes.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

     //Conexión de NestJS con PostgreSQL.//
  TypeOrmModule.forRootAsync({
     // Permite utilizar las variables de configuración del sistema.
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    // Obtiene los datos de conexión desde las variables de entorno (.env).//
    const host = configService.get<string>('DATABASE_HOST');
    const port = configService.get<string>('DATABASE_PORT');
    const user = configService.get<string>('DATABASE_USER');
    const password = configService.get<string>('DATABASE_PASSWORD');
    const database = configService.get<string>('DATABASE_NAME');

    return {
      type: 'postgres',
      host,
      port: Number(port),
      username: user,
      password,
      database,
      schema: 'sistema',
      autoLoadEntities: true,
      synchronize: false,
    };
  },
}),
    UsersModule,
    AuthModule,
    BlockchainModule,
    RutasModule,
    VehiculosModule,
    ViajesModule,
    AsientosModule,
    ReservasModule,
    AdminModule,
    VentasModule,
    TicketsModule,
    ReclamosModule,
    NotificacionesModule,
    PagosModule,
    AuditoriaModule,

    /*
     * Módulo para filas, ventas rápidas,
     * Noah, Hiace y recojo en camino.
     */
    SalidasRapidasModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}