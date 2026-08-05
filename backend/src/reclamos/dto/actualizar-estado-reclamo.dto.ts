import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { EstadoReclamo } from '../enums/reclamo.enums';

export class ActualizarEstadoReclamoDto {
  @IsEnum(EstadoReclamo)
  estado!: EstadoReclamo;

  @IsOptional()
  @IsString()
  respuestaFinal?: string;
}