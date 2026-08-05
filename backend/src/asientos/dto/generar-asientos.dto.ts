import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class GenerarAsientosDto {
  @Type(() => Number)
  @IsInt({
    message: 'La cantidad de asientos debe ser un número entero.',
  })
  @Min(1, {
    message: 'Debe generar por lo menos un asiento.',
  })
  @Max(100, {
    message: 'No se pueden generar más de 100 asientos.',
  })
  cantidad!: number;
}