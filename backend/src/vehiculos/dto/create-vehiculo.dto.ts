import {
  Type,
} from "class-transformer";

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import {
  TipoVehiculo,
} from "../constants/vehiculo.constants";

export class CreateVehiculoDto {
  @IsString({
    message:
      "La placa debe ser texto.",
  })
  @IsNotEmpty({
    message:
      "La placa es obligatoria.",
  })
  @MaxLength(20, {
    message:
      "La placa no puede superar los 20 caracteres.",
  })
  placa!: string;

  /**
   * Número interno utilizado principalmente
   * por las flotas.
   *
   * Para Noah y Hiace puede quedar vacío.
   */
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

  @IsString({
    message:
      "La marca debe ser texto.",
  })
  @IsNotEmpty({
    message:
      "La marca es obligatoria.",
  })
  @MaxLength(100, {
    message:
      "La marca no puede superar los 100 caracteres.",
  })
  marca!: string;

  @IsString({
    message:
      "El modelo debe ser texto.",
  })
  @IsNotEmpty({
    message:
      "El modelo es obligatorio.",
  })
  @MaxLength(100, {
    message:
      "El modelo no puede superar los 100 caracteres.",
  })
  modelo!: string;

  @IsEnum(
    TipoVehiculo,
    {
      message:
        "El tipo debe ser FLOTA, NOAH o HIACE.",
    },
  )
  tipo!: TipoVehiculo;

  /**
   * Se mantiene opcional para conservar
   * compatibilidad con formularios antiguos.
   *
   * VehiculosService ignorará este valor y
   * asignará automáticamente:
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