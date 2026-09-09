import {
  IsEnum,
  IsUUID,
} from "class-validator";

import {
  EstadoSolicitudRecojo,
} from "../entities/solicitud-recojo.entity";

export class ActualizarEstadoRecojoDto {
  @IsEnum(
    EstadoSolicitudRecojo,
    {
      message:
        "El estado debe ser CONFIRMADA, RECOGIDO, CANCELADA o NO_ENCONTRADO.",
    },
  )
  estado!: EstadoSolicitudRecojo;

  /**
   * Administrador o secretaria que
   * actualiza la solicitud de recojo.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador del administrador o secretaria no es válido.",
    },
  )
  administradorId!: string;
}