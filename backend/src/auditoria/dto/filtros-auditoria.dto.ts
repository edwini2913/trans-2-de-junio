import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  ResultadoAuditoria,
  TipoAccionAuditoria,
} from '../entities/auditoria.entity';

export class FiltrosAuditoriaDto {
  @IsOptional()
  @IsUUID('4')
  usuarioId?: string;

  @IsOptional()
  @IsEnum(TipoAccionAuditoria)
  accion?: TipoAccionAuditoria;

  @IsOptional()
  @IsString()
  modulo?: string;

  @IsOptional()
  @IsEnum(ResultadoAuditoria)
  resultado?: ResultadoAuditoria;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite: number = 20;
}