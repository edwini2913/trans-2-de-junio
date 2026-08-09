import { Module } from '@nestjs/common';
import {ConfigModule,ConfigService,} from '@nestjs/config';
import {TypeOrmModule,TypeOrmModuleOptions,} from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AdminModule } from './admin/admin.module';
import { AsientosModule } from './asientos/asientos.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { PagosModule } from './pagos/pagos.module';
import { ReclamosModule } from './reclamos/reclamos.module';
import { ReservasModule } from './reservas/reservas.module';
import { RutasModule } from './rutas/rutas.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { VentasModule } from './ventas/ventas.module';
import { ViajesModule } from './viajes/viajes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
//configuración de la conexión a PostgreSQL usando TypeORM//
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ): TypeOrmModuleOptions => {
        const host =
          configService.get<string>(
            'DATABASE_HOST',
          );

        const port =
          configService.get<string>(
            'DATABASE_PORT',
          );

        const username =
          configService.get<string>(
            'DATABASE_USER',
          );

        const password =
          configService.get<string>(
            'DATABASE_PASSWORD',
          );

        const database =
          configService.get<string>(
            'DATABASE_NAME',
          );

        if (
          !host ||
          !port ||
          !username ||
          !password ||
          !database
        ) {
          throw new Error(
            'Faltan variables de conexión a PostgreSQL.',
          );
        }

        return {
          type: 'postgres',
          host,
          port: Number(port),
          username,
          password,
          database,

          schema: 'sistema',

          autoLoadEntities: true,

          /*
           * En Railway la base de datos está vacía.
           * Esta opción permitirá crear las tablas
           * automáticamente dentro del esquema sistema.
           *
           * Cuando el sistema esté estable en producción,
           * se recomienda usar migraciones y cambiarlo
           * nuevamente a false.
           */
          synchronize: false,

          logging: ['error'],
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
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}