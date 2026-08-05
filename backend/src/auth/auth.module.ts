import { Module } from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';

import { AuditoriaModule } from '../auditoria/auditoria.module';
import { UsersModule } from '../users/users.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
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
        config: ConfigService,
      ) => ({
        secret:
          config.get<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
  ],

  exports: [
    AuthService,
  ],
})
export class AuthModule {}