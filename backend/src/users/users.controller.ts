
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { GestionarChoferesGuard } from '../auth/guards/gestionar-choferes.guard';

import { CrearChoferDto } from './dto/crear-chofer.dto';

import { UsersService } from './users.service';

/* =========================================
   CONTROLADOR DE USUARIOS
========================================= */

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  /* =====================================
     OBTENER USUARIOS
     ADMINISTRADOR / SECRETARIA
  ===================================== */

  @Get()
  @UseGuards(GestionarChoferesGuard)
  obtenerTodos() {
    return this.usersService.obtenerTodos();
  }

  /* =====================================
     REGISTRAR CHOFER

     ADMINISTRADOR / SECRETARIA
  ===================================== */

  @Post('choferes')
  @UseGuards(GestionarChoferesGuard)
  crearChofer(
    @Body() dto: CrearChoferDto,
  ) {
    return this.usersService.crearChofer(dto);
  }

  /* =====================================
     AUTORIZAR ESCANEO QR

     ADMINISTRADOR / SECRETARIA
  ===================================== */

  @Patch(':id/permiso-escaneo')
  @UseGuards(GestionarChoferesGuard)
  actualizarPermisoEscaneo(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body(
      'puedeEscanearTickets',
      ParseBoolPipe,
    )
    puedeEscanearTickets: boolean,
  ) {
    return this.usersService.actualizarPermisoEscaneo(
      id,
      puedeEscanearTickets,
    );
  }

  /* =====================================
     ELIMINAR USUARIO

     ACCESO PROTEGIDO
  ===================================== */

  @Delete(':id')
  @UseGuards(GestionarChoferesGuard)
  eliminarUsuario(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.usersService.eliminarUsuario(id);
  }
}
