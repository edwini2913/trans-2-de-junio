import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';

import { AuditoriaService } from './auditoria.service';

import { FiltrosAuditoriaDto } from './dto/filtros-auditoria.dto';

@Controller('auditoria')
export class AuditoriaController {
  constructor(
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Lista los registros de auditoría
   * aplicando filtros y paginación.
   *
   * Ejemplo:
   * GET /auditoria?pagina=1&limite=20
   */
  @Get()
  async obtenerTodas(
    @Query()
    filtros: FiltrosAuditoriaDto,
  ) {
    return this.auditoriaService.obtenerTodas(
      filtros,
    );
  }

  /**
   * Devuelve la cantidad total de
   * registros existentes.
   *
   * GET /auditoria/total
   */
  @Get('total')
  async contarRegistros() {
    const total =
      await this.auditoriaService.contarRegistros();

    return {
      total,
    };
  }

  /**
   * Devuelve los registros más recientes.
   *
   * GET /auditoria/ultimos/20
   */
  @Get('ultimos/:limite')
  async obtenerUltimosRegistros(
    @Param(
      'limite',
      ParseIntPipe,
    )
    limite: number,
  ) {
    const limiteSeguro = Math.min(
      Math.max(limite, 1),
      100,
    );

    return this.auditoriaService.obtenerUltimosRegistros(
      limiteSeguro,
    );
  }

  /**
   * Lista la auditoría de un usuario.
   *
   * GET /auditoria/usuario/:usuarioId
   */
  @Get('usuario/:usuarioId')
  async obtenerPorUsuario(
    @Param(
      'usuarioId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    usuarioId: string,
  ) {
    return this.auditoriaService.obtenerPorUsuario(
      usuarioId,
    );
  }

  /**
   * Lista registros por módulo.
   *
   * GET /auditoria/modulo/VENTAS
   */
  @Get('modulo/:modulo')
  async obtenerPorModulo(
    @Param('modulo')
    modulo: string,
  ) {
    return this.auditoriaService.obtenerPorModulo(
      modulo.trim().toUpperCase(),
    );
  }

  /**
   * Obtiene un registro específico.
   *
   * GET /auditoria/:id
   */
  @Get(':id')
  async obtenerPorId(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    id: string,
  ) {
    const auditoria =
      await this.auditoriaService.obtenerPorId(
        id,
      );

    if (!auditoria) {
      throw new NotFoundException(
        'El registro de auditoría no existe.',
      );
    }

    return auditoria;
  }
}