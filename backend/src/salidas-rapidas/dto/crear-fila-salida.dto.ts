
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
  ValidateNested,
} from "class-validator";

/**
 * Relaciona un vehículo seleccionado
 * con el chofer que conducirá ese día.
 */
export class AsignacionChoferFilaDto {
  @IsUUID("4", {
    message:
      "El identificador del vehículo asignado no es válido.",
  })
  vehiculoId!: string;

  @IsUUID("4", {
    message:
      "El identificador del chofer asignado no es válido.",
  })
  choferId!: string;
}

export class CrearFilaSalidaDto {
  @IsUUID("4", {
    message:
      "El identificador de la ruta no es válido.",
  })
  rutaId!: string;

  @IsDateString({}, {
    message:
      "La fecha de la fila no es válida.",
  })
  fecha!: string;

  /**
   * Se mantiene este campo para conservar
   * la compatibilidad con el frontend.
   */
  @IsArray({
    message:
      "Los vehículos deben enviarse en una lista.",
  })
  @ArrayMinSize(1, {
    message:
      "Debes seleccionar al menos un vehículo.",
  })
  @ArrayUnique({
    message:
      "No puedes seleccionar vehículos repetidos.",
  })
  @IsUUID("4", {
    each: true,
    message:
      "Uno o más vehículos no son válidos.",
  })
  vehiculoIds!: string[];

  /**
   * Asignación de choferes a vehículos.
   *
   * Es opcional temporalmente para mantener
   * la compatibilidad con el sistema actual.
   *
   * El servicio deberá verificar que cada
   * vehículo y chofer sean válidos.
   */
  @IsOptional()
  @IsArray({
    message:
      "Las asignaciones deben enviarse en una lista.",
  })
  @ValidateNested({
    each: true,
  })
  @Type(() => AsignacionChoferFilaDto)
  asignacionesChoferes?: AsignacionChoferFilaDto[];

  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  }, {
    message:
      "El precio debe ser un número válido.",
  })
  @Min(0.01, {
    message:
      "El precio debe ser mayor que cero.",
  })
  precio!: number;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      "El intervalo debe ser un número entero.",
  })
  @Min(5, {
    message:
      "El intervalo mínimo es de 5 minutos.",
  })
  @Max(180, {
    message:
      "El intervalo máximo es de 180 minutos.",
  })
  intervaloMinutos?: number;

  @IsUUID("4", {
    message:
      "El identificador del administrador o secretaria no es válido.",
  })
  habilitadoPor!: string;
}
