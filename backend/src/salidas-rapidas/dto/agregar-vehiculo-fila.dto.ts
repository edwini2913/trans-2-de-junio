
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
   * Ruta donde se incorpora el vehículo.
   */
  @IsUUID("4", {
    message:
      "El identificador de la ruta no es válido.",
  })
  rutaId!: string;

  /**
   * Fecha de la fila.
   */
  @IsDateString({}, {
    message:
      "La fecha de la fila no es válida.",
  })
  fecha!: string;

  /**
   * Vehículo seleccionado por su placa.
   */
  @IsUUID("4", {
    message:
      "El identificador del vehículo no es válido.",
  })
  vehiculoId!: string;

  /**
   * Chofer que conducirá el vehículo.
   *
   * Opcional temporalmente para mantener
   * compatibilidad con el frontend actual.
   *
   * El servicio debe comprobar que:
   * - El usuario exista.
   * - Tenga rol CHOFER.
   * - Su cuenta esté activa.
   */
  @IsOptional()
  @IsUUID("4", {
    message:
      "El identificador del chofer no es válido.",
  })
  choferId?: string;

  /**
   * Intervalo aproximado entre vehículos.
   */
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

  /**
   * Administrador o secretaria que
   * registra la llegada del vehículo.
   */
  @IsUUID("4", {
    message:
      "El identificador del administrador o secretaria no es válido.",
  })
  administradorId!: string;
}
