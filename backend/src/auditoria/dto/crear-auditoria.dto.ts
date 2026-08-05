import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  ResultadoAuditoria,
  TipoAccionAuditoria,
} from '../entities/auditoria.entity';

export class CrearAuditoriaDto {
  @IsOptional()
  @IsUUID('4')
  usuarioId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  usuarioNombre?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  usuarioEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  usuarioRol?: string | null;

  @IsEnum(TipoAccionAuditoria)
  accion!: TipoAccionAuditoria;

  @IsString()
  @MaxLength(100)
  modulo!: string;

  @IsString()
  @MaxLength(255)
  descripcion!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entidad?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entidadId?: string | null;

  @IsOptional()
  @IsEnum(ResultadoAuditoria)
  resultado?: ResultadoAuditoria;

  @IsOptional()
  @IsObject()
  datosAnteriores?: Record<
    string,
    unknown
  > | null;

  @IsOptional()
  @IsObject()
  datosNuevos?: Record<
    string,
    unknown
  > | null;

  @IsOptional()
  @IsObject()
  informacionAdicional?: Record<
    string,
    unknown
  > | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  direccionIp?: string | null;

  @IsOptional()
  @IsString()
  userAgent?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  metodoHttp?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rutaHttp?: string | null;

  @IsOptional()
  @IsString()
  mensajeError?: string | null;
}