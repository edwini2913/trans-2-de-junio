import {
  Type,
} from "class-transformer";

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import {
  TipoVehiculo,
} from "../constants/vehiculo.constants";

export class UpdateVehiculoDto {
  @IsOptional()
  @IsString({
    message:
      "La placa debe ser texto.",
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
    message:
      "La marca debe ser texto.",
  })
  @MaxLength(100, {
    message:
      "La marca no puede superar los 100 caracteres.",
  })
  marca?: string;

  @IsOptional()
  @IsString({
    message:
      "El modelo debe ser texto.",
  })
  @MaxLength(100, {
    message:
      "El modelo no puede superar los 100 caracteres.",
  })
  modelo?: string;

  @IsOptional()
  @IsEnum(
    TipoVehiculo,
    {
      message:
        "El tipo debe ser FLOTA, NOAH o HIACE.",
    },
  )
  tipo?: TipoVehiculo;

  /**
   * Se acepta por compatibilidad, pero
   * VehiculosService recalcula la capacidad
   * según el tipo seleccionado.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message:
      "La capacidad debe ser un número entero.",
  })
  @Min(1)
  @Max(40)
  capacidad?: number;

  @IsOptional()
  @IsBoolean({
    message:
      "El estado debe ser verdadero o falso.",
  })
  estado?: boolean;
}