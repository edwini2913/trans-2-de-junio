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

@Module({
  imports: [
    ConfigModule,

    UsersModule,

    AuditoriaModule,

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService:
          ConfigService,
      ) => {
        const jwtSecret =
          configService.get<string>(
            'JWT_SECRET',
          );

        if (!jwtSecret) {
          throw new Error(
            'La variable JWT_SECRET no está configurada.',
          );
        }

        return {
          secret:
            jwtSecret,

          signOptions: {
            expiresIn:
              '1d',
          },
        };
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    CorreoService,
  ],

  exports: [
    AuthService,
    CorreoService,
  ],
})
export class AuthModule {}