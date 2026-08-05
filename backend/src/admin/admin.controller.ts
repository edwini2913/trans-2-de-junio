import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('resumen')
  resumen() {
    return this.adminService.resumen();
  }

  @Get('ultimas-reservas')
  ultimasReservas() {
    return this.adminService.ultimasReservas();
  }

  @Get('usuarios')
  usuarios() {
    return this.adminService.usuarios();
  }

  @Get('reservas')
  reservas() {
    return this.adminService.reservas();
  }

  @Get('viajes')
  viajes() {
    return this.adminService.viajes();
  }
}