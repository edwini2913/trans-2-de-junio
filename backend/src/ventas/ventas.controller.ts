import { Body, Controller, Get, Post } from '@nestjs/common';

import { VentasService } from './ventas.service';
import { CrearVentaOficinaDto } from './dto/crear-venta-oficina.dto';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
  ) {}

  @Post('oficina')
  crearVentaOficina(
    @Body() dto: CrearVentaOficinaDto,
  ) {
    return this.ventasService.crearVentaOficina(dto);
  }

  @Get()
  obtenerTodas() {
    return this.ventasService.obtenerTodas();
  }

  @Get('reporte')
  obtenerReporte() {
    return this.ventasService.obtenerReporte();
  }
}