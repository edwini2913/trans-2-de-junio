import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GestionarChoferesGuard } from '../auth/guards/gestionar-choferes.guard';

import { Usuario } from './entities/usuario.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
  ],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
    GestionarChoferesGuard,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}