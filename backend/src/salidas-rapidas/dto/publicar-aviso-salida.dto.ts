import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

import {
  MotivoAvisoSalida,
  TipoServicioAviso,
} from "../entities/aviso-salida.entity";

export class PublicarAvisoSalidaDto {
  @IsUUID(
    "4",
    {
      message:
        "El identificador de la ruta no es válido.",
    },
  )
  rutaId!: string;

  @IsDateString(
    {},
    {
      message:
        "La fecha del comunicado no es válida.",
    },
  )
  fecha!: string;

  @IsEnum(
    MotivoAvisoSalida,
    {
      message:
        "El motivo seleccionado no es válido.",
    },
  )
  motivo!: MotivoAvisoSalida;

  /**
   * Define si el comunicado:
   *
   * - Suspende completamente el servicio.
   * - Permite viajar hasta un punto temporal.
   * - Solamente informa.
   */
  @IsEnum(
    TipoServicioAviso,
    {
      message:
        "El tipo de servicio debe ser SUSPENSION_TOTAL, SERVICIO_PARCIAL o INFORMATIVO.",
    },
  )
  tipoServicio!: TipoServicioAviso;

  /**
   * Indica si el pasajero puede
   * continuar con la compra.
   *
   * Para SERVICIO_PARCIAL debe ser true.
   * Para SUSPENSION_TOTAL será false.
   */
  @IsBoolean({
    message:
      "El campo permiteCompra debe ser verdadero o falso.",
  })
  permiteCompra!: boolean;

  /**
   * Solamente es obligatorio cuando
   * se selecciona SERVICIO_PARCIAL.
   */
  @ValidateIf(
    (dto: PublicarAvisoSalidaDto) =>
      dto.tipoServicio ===
      TipoServicioAviso.SERVICIO_PARCIAL,
  )
  @IsString({
    message:
      "El punto de llegada temporal debe ser texto.",
  })
  @MinLength(
    3,
    {
      message:
        "El punto de llegada temporal debe tener al menos 3 caracteres.",
    },
  )
  @MaxLength(
    200,
    {
      message:
        "El punto de llegada temporal no puede superar los 200 caracteres.",
    },
  )
  puntoLlegadaTemporal?: string;

  /**
   * Para avisos que no sean parciales,
   * el punto temporal puede omitirse.
   */
  @IsOptional()
  puntoLlegadaTemporalOpcional?: string;

  @IsString({
    message:
      "El título debe ser texto.",
  })
  @MinLength(
    5,
    {
      message:
        "El título debe tener al menos 5 caracteres.",
    },
  )
  @MaxLength(
    150,
    {
      message:
        "El título no puede superar los 150 caracteres.",
    },
  )
  titulo!: string;

  @IsString({
    message:
      "El mensaje debe ser texto.",
  })
  @MinLength(
    10,
    {
      message:
        "El mensaje debe tener al menos 10 caracteres.",
    },
  )
  @MaxLength(
    500,
    {
      message:
        "El mensaje no puede superar los 500 caracteres.",
    },
  )
  mensaje!: string;

  @IsUUID(
    "4",
    {
      message:
        "El identificador de quien publica el aviso no es válido.",
    },
  )
  publicadoPor!: string;
}