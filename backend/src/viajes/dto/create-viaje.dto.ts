import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreateViajeDto {
  @IsUUID('4', {
    message: 'El identificador de la ruta no es válido.',
  })
  @IsNotEmpty({
    message: 'La ruta es obligatoria.',
  })
  rutaId!: string;

  @IsUUID('4', {
    message: 'El identificador del vehículo no es válido.',
  })
  @IsNotEmpty({
    message: 'El vehículo es obligatorio.',
  })
  vehiculoId!: string;

  @IsDateString(
    {},
    {
      message: 'La fecha del viaje no es válida.',
    },
  )
  fecha!: string;

  @IsString()
  @Matches(
    /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
    {
      message:
        'La hora de salida debe tener el formato HH:mm o HH:mm:ss.',
    },
  )
  horaSalida!: string;

  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: 'El precio debe ser un número válido.',
    },
  )
  @Min(0.01, {
    message: 'El precio debe ser mayor que cero.',
  })
  precio!: number;

  @IsOptional()
  @IsString()
  @IsIn(
    [
      'PROGRAMADO',
      'EN_RUTA',
      'FINALIZADO',
      'CANCELADO',
    ],
    {
      message:
        'El estado debe ser PROGRAMADO, EN_RUTA, FINALIZADO o CANCELADO.',
    },
  )
  estado?: string;
}