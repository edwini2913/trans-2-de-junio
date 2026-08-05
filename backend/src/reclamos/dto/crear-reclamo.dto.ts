import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  CategoriaReclamo,
  PrioridadReclamo,
  TipoReclamo,
} from '../enums/reclamo.enums';

export class CrearReclamoDto {
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsEnum(TipoReclamo)
  tipo!: TipoReclamo;

  @IsEnum(CategoriaReclamo)
  categoria!: CategoriaReclamo;

  @IsEnum(PrioridadReclamo)
  prioridad!: PrioridadReclamo;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  asunto!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;
}