import {
  Type,
} from "class-transformer";

import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CrearFilaSalidaDto {
  /**
   * Ruta en la que trabajarán
   * los Noah y Hiace.
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
   * Fecha de trabajo de la fila.
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
   * La administración puede habilitar
   * todos los vehículos necesarios.
   *
   * Ya no existe el límite de cinco.
   */
  @IsArray({
    message:
      "Los vehículos deben enviarse en una lista.",
  })
  @ArrayMinSize(
    1,
    {
      message:
        "Debes seleccionar al menos un vehículo.",
    },
  )
  @ArrayUnique({
    message:
      "No puedes seleccionar el mismo vehículo más de una vez.",
  })
  @IsUUID(
    "4",
    {
      each: true,
      message:
        "Uno o más identificadores de vehículo no son válidos.",
    },
  )
  vehiculoIds!: string[];

  /**
   * Precio individual del pasaje.
   */
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message:
        "El precio debe ser un número válido.",
    },
  )
  @Min(
    0.01,
    {
      message:
        "El precio debe ser mayor que cero.",
    },
  )
  precio!: number;

  /**
   * Hora en la que comienza la atención.
   *
   * Si no se envía, el servicio utilizará
   * automáticamente la hora actual.
   */
  @IsOptional()
  @IsString({
    message:
      "La hora de inicio debe ser texto.",
  })
  @Matches(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    {
      message:
        "La hora debe tener el formato HH:mm.",
    },
  )
  horaInicio?: string;

  /**
   * Tiempo aproximado entre vehículos.
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
   * habilita la fila.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador del administrador o secretaria no es válido.",
    },
  )
  habilitadoPor!: string;
}