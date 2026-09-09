import {
  Type,
} from "class-transformer";

import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class AgregarVehiculoFilaDto {
  /**
   * Ruta de la fila existente.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador de la ruta no es válido.",
    },
  )
  rutaId!: string;

  /**
   * Fecha de la fila existente.
   */
  @IsDateString(
    {},
    {
      message:
        "La fecha de la fila no es válida.",
    },
  )
  fecha!: string;

  /**
   * Noah o Hiace que se agregará
   * al final de la fila.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador del vehículo no es válido.",
    },
  )
  vehiculoId!: string;

  /**
   * Intervalo utilizado para calcular
   * su hora aproximada.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      "El intervalo debe ser un número entero.",
  })
  @Min(
    5,
    {
      message:
        "El intervalo mínimo es de 5 minutos.",
    },
  )
  @Max(
    180,
    {
      message:
        "El intervalo máximo es de 180 minutos.",
    },
  )
  intervaloMinutos?: number;

  /**
   * Administrador o secretaria que
   * agrega el vehículo.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador del administrador o secretaria no es válido.",
    },
  )
  administradorId!: string;
}