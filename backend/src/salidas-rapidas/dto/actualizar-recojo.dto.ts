
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class ActualizarRecojoDto {
  /**
   * Nueva referencia de recojo.
   * Ejemplo: Puente Chimoré, frente al surtidor.
   */
  @IsOptional()
  @IsString()
  @Length(5, 250, {
    message:
      "La referencia debe tener entre 5 y 250 caracteres.",
  })
  referencia?: string;

  /**
   * Teléfono de contacto del pasajero.
   */
  @IsOptional()
  @IsString()
  @Length(7, 20)
  @Matches(/^[0-9+\s()-]+$/, {
    message:
      "El teléfono contiene caracteres no permitidos.",
  })
  telefono?: string;

  /**
   * Observaciones adicionales.
   */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacion?: string;

  /**
   * Latitud GPS.
   * Ambas coordenadas deben actualizarse juntas.
   */
  @ValidateIf(
    (_obj, valor) =>
      valor !== undefined && valor !== null,
  )
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number | null;

  /**
   * Longitud GPS.
   */
  @ValidateIf(
    (_obj, valor) =>
      valor !== undefined && valor !== null,
  )
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number | null;
}
