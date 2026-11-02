
import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  JwtModule,
} from '@nestjs/jwt';

import {
  PassportModule,
} from '@nestjs/passport';

import {
  AuditoriaModule,
} from '../auditoria/auditoria.module';

import {
  UsersModule,
} from '../users/users.module';

import {
  AuthController,
} from './auth.controller';

import {
  AuthService,
} from './auth.service';

import {
  CorreoService,
} from './correo.service';

import {
  JwtStrategy,
} from './jwt.strategy';

/* =========================================
   MÓDULO DE AUTENTICACIÓN
========================================= */

@Module({
  imports: [
    /* CONFIGURACIÓN */

    ConfigModule,

    /* USUARIOS */

    UsersModule,

    /* AUDITORÍA */

    AuditoriaModule,

    /* PASSPORT JWT */

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    /* CONFIGURACIÓN JWT */

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => {
        const jwtSecret =
          configService.get<string>(
            'JWT_SECRET',
          );

        if (!jwtSecret?.trim()) {
          throw new Error(
            'La variable JWT_SECRET no está configurada.',
          );
        }

        return {
          secret: jwtSecret,

          signOptions: {
            expiresIn: '1d',
            algorithm: 'HS256' as const,
          },
        };
      },
    }),
  ],

  /* =====================================
     CONTROLADORES
  ===================================== */

  controllers: [
    AuthController,
  ],

  /* =====================================
     SERVICIOS Y ESTRATEGIAS
  ===================================== */

  providers: [
    AuthService,
    CorreoService,
    JwtStrategy,
  ],

  /* =====================================
     EXPORTACIONES
  ===================================== */

  exports: [
    AuthService,
    CorreoService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
