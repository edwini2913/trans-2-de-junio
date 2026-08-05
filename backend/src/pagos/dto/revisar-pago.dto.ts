import {
  Transform,
} from 'class-transformer';

import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum DecisionPago {
  APROBAR = 'APROBAR',
  RECHAZAR = 'RECHAZAR',
}

export class RevisarPagoDto {
  @IsEnum(
    DecisionPago,
    {
      message:
        'La decisión debe ser APROBAR o RECHAZAR.',
    },
  )
  decision!: DecisionPago;

  @Transform(
    ({ value }) =>
      typeof value === 'string'
        ? value.trim()
        : value,
  )
  @IsOptional()
  @IsString({
    message:
      'La observación debe ser un texto.',
  })
  @MaxLength(500, {
    message:
      'La observación no puede superar los 500 caracteres.',
  })
  observacion?: string;
}