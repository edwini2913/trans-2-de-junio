import {
  Type,
} from "class-transformer";

import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class SolicitarRecojoDto {
  /**
   * Usuario que solicita el recojo.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador del usuario no es válido.",
    },
  )
  usuarioId!: string;

  /**
   * Viaje Noah o Hiace en el que
   * se realizará la compra o reserva.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador del viaje no es válido.",
    },
  )
  viajeId!: string;

  /**
   * Lugar escrito por el pasajero.
   *
   * Ejemplo:
   * Puente Chimoré, frente al surtidor.
   */
  @IsString({
    message:
      "La referencia de recojo debe ser texto.",
  })
  @MinLength(
    5,
    {
      message:
        "La referencia de recojo debe tener al menos 5 caracteres.",
    },
  )
  @MaxLength(
    250,
    {
      message:
        "La referencia de recojo no puede superar los 250 caracteres.",
    },
  )
  referencia!: string;

  /**
   * Número utilizado por el conductor
   * para contactar al pasajero.
   */
  @IsString({
    message:
      "El teléfono debe ser texto.",
  })
  @MinLength(
    7,
    {
      message:
        "El teléfono debe tener al menos 7 dígitos.",
    },
  )
  @MaxLength(
    20,
    {
      message:
        "El teléfono no puede superar los 20 caracteres.",
    },
  )
  telefono!: string;

  /**
   * Coordenadas opcionales obtenidas
   * desde la ubicación del celular.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message:
        "La latitud debe ser un número válido.",
    },
  )
  @Min(
    -90,
    {
      message:
        "La latitud no puede ser menor que -90.",
    },
  )
  @Max(
    90,
    {
      message:
        "La latitud no puede ser mayor que 90.",
    },
  )
  latitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    {},
    {
      message:
        "La longitud debe ser un número válido.",
    },
  )
  @Min(
    -180,
    {
      message:
        "La longitud no puede ser menor que -180.",
    },
  )
  @Max(
    180,
    {
      message:
        "La longitud no puede ser mayor que 180.",
    },
  )
  longitud?: number;

  /**
   * Instrucción adicional para el conductor.
   */
  @IsOptional()
  @IsString({
    message:
      "La observación debe ser texto.",
  })
  @MaxLength(
    300,
    {
      message:
        "La observación no puede superar los 300 caracteres.",
    },
  )
  observacion?: string;
}