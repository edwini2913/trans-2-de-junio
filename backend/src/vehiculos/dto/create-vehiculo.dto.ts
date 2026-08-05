import { Type } from 'class-transformer';
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
} from 'class-validator';

import {
  TipoVehiculo,
} from '../entities/vehiculo.entity';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty({
    message: 'La placa es obligatoria.',
  })
  @MaxLength(20)
  placa!: string;

  @IsString()
  @IsNotEmpty({
    message: 'La marca es obligatoria.',
  })
  @MaxLength(100)
  marca!: string;

  @IsString()
  @IsNotEmpty({
    message: 'El modelo es obligatorio.',
  })
  @MaxLength(100)
  modelo!: string;

  @IsEnum(TipoVehiculo, {
    message: 'El tipo debe ser FLOTA o NOAH.',
  })
  tipo!: TipoVehiculo;

  @Type(() => Number)
  @IsInt({
    message: 'La capacidad debe ser un número entero.',
  })
  @Min(1)
  @Max(40)
  capacidad!: number;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}