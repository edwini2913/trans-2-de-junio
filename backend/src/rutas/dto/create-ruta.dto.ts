import {
  Type,
} from "class-transformer";

import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateRutaDto {
  @IsString({
    message:
      "El origen debe ser un texto.",
  })
  @MinLength(2, {
    message:
      "El origen debe tener al menos 2 caracteres.",
  })
  @MaxLength(100, {
    message:
      "El origen no puede superar los 100 caracteres.",
  })
  origen!: string;

  @IsString({
    message:
      "El destino debe ser un texto.",
  })
  @MinLength(2, {
    message:
      "El destino debe tener al menos 2 caracteres.",
  })
  @MaxLength(100, {
    message:
      "El destino no puede superar los 100 caracteres.",
  })
  destino!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message:
        "La distancia debe ser un número válido.",
    },
  )
  @IsPositive({
    message:
      "La distancia debe ser mayor que cero.",
  })
  distanciaKm?: number;

  @IsOptional()
  @IsBoolean({
    message:
      "El estado debe ser verdadero o falso.",
  })
  estado?: boolean;
}