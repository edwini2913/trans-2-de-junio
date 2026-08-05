import { Transform, Type } from "class-transformer";

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

function convertirAsientoIds(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor !== "string") {
    return valor;
  }

  const texto = valor.trim();

  if (!texto) {
    return [];
  }

  try {
    const resultado = JSON.parse(texto);

    return Array.isArray(resultado) ? resultado : valor;
  } catch {
    return texto
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export class RegistrarComprobanteDto {
  @IsOptional()
  @IsUUID("4", {
    message: "El identificador de la reserva no es válido.",
  })
  reservaId?: string;

  @IsUUID("4", {
    message: "El identificador del usuario no es válido.",
  })
  usuarioId!: string;

  @IsUUID("4", {
    message: "El identificador del viaje no es válido.",
  })
  viajeId!: string;

  @Transform(({ value }) => convertirAsientoIds(value))
  @IsArray({
    message: "Los asientos deben enviarse como una lista.",
  })
  @ArrayMinSize(1, {
    message: "Debes seleccionar al menos un asiento.",
  })
  @ArrayMaxSize(40, {
    message: "No puedes seleccionar más de 40 asientos.",
  })
  @ArrayUnique({
    message: "No puedes repetir el mismo asiento.",
  })
  @IsUUID("4", {
    each: true,
    message: "Uno o más asientos no tienen un identificador válido.",
  })
  asientoIds!: string[];

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString({
    message: "La referencia del pago es obligatoria.",
  })
  @MinLength(4, {
    message: "La referencia debe tener al menos 4 caracteres.",
  })
  @MaxLength(100, {
    message: "La referencia no puede superar los 100 caracteres.",
  })
  referencia!: string;

  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: "El monto del pago no es válido.",
    },
  )
  @Min(0.01, {
    message: "El monto debe ser mayor a cero.",
  })
  monto!: number;
}
