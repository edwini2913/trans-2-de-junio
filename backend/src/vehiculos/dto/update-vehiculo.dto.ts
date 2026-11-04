
import {
  Type,
} from "class-transformer";

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

import {
  TipoVehiculo,
} from "../constants/vehiculo.constants";

export class UpdateVehiculoDto {
  @IsOptional()
  @IsString({
    message: "La placa debe ser texto.",
  })
  @MaxLength(20, {
    message:
      "La placa no puede superar los 20 caracteres.",
  })
  placa?: string;

  @IsOptional()
  @IsString({
    message:
      "El número interno debe ser texto.",
  })
  @MaxLength(20, {
    message:
      "El número interno no puede superar los 20 caracteres.",
  })
  numeroFlota?: string | null;

  @IsOptional()
  @IsString({
    message: "La marca debe ser texto.",
  })
  @MaxLength(100, {
    message:
      "La marca no puede superar los 100 caracteres.",
  })
  marca?: string;

  @IsOptional()
  @IsString({
    message: "El modelo debe ser texto.",
  })
  @MaxLength(100, {
    message:
      "El modelo no puede superar los 100 caracteres.",
  })
  modelo?: string;

  @IsOptional()
  @IsEnum(TipoVehiculo, {
    message:
      "El tipo debe ser FLOTA, NOAH o HIACE.",
  })
  tipo?: TipoVehiculo;

  /**
   * Chofer habitual del vehículo.
   *
   * undefined = no modificar la asignación.
   * UUID = asignar o cambiar el chofer.
   * null = quitar el chofer habitual.
   *
   * El servicio debe validar el rol CHOFER
   * y comprobar que su cuenta esté activa.
   */
  @ValidateIf(
    (_objeto, valor) =>
      valor !== undefined &&
      valor !== null,
  )
  @IsUUID("4", {
    message:
      "El identificador del chofer habitual no es válido.",
  })
  choferId?: string | null;

  /**
   * Se conserva por compatibilidad.
   * La capacidad se calcula por tipo:
   *
   * FLOTA = 40
   * NOAH = 7
   * HIACE = 10
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      "La capacidad debe ser un número entero.",
  })
  @Min(1, {
    message:
      "La capacidad debe ser mayor que cero.",
  })
  @Max(40, {
    message:
      "La capacidad no puede superar los 40 asientos.",
  })
  capacidad?: number;

  @IsOptional()
  @IsBoolean({
    message:
      "El estado debe ser verdadero o falso.",
  })
  estado?: boolean;
}
