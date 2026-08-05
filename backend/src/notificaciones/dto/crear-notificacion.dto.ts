import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  DestinatarioNotificacion,
  PrioridadNotificacion,
  TipoNotificacion,
} from '../enums/notificacion.enums';

export class CrearNotificacionDto {
  @IsOptional()
  @IsUUID('4', {
    message:
      'El destinatario debe ser un UUID válido',
  })
  destinatarioId?: string;

  @IsEnum(
    DestinatarioNotificacion,
    {
      message:
        'El destinatario de la notificación no es válido',
    },
  )
  rolDestinatario!:
    DestinatarioNotificacion;

  @IsEnum(TipoNotificacion, {
    message:
      'El tipo de notificación no es válido',
  })
  tipo!: TipoNotificacion;

  @IsOptional()
  @IsEnum(
    PrioridadNotificacion,
    {
      message:
        'La prioridad de la notificación no es válida',
    },
  )
  prioridad?:
    PrioridadNotificacion;

  @IsString({
    message:
      'El título debe ser un texto',
  })
  @MinLength(3, {
    message:
      'El título debe tener al menos 3 caracteres',
  })
  @MaxLength(160, {
    message:
      'El título no puede superar los 160 caracteres',
  })
  titulo!: string;

  @IsString({
    message:
      'El mensaje debe ser un texto',
  })
  @MinLength(3, {
    message:
      'El mensaje debe tener al menos 3 caracteres',
  })
  mensaje!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referenciaTipo?: string;

  @IsOptional()
  @IsUUID('4', {
    message:
      'El identificador de referencia debe ser un UUID válido',
  })
  referenciaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  rutaDestino?: string;
}