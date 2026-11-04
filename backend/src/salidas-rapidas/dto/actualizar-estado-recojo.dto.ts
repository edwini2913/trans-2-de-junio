
import {
  IsEnum,
  IsUUID,
  NotEquals,
} from "class-validator";

import {
  EstadoSolicitudRecojo,
} from "../entities/solicitud-recojo.entity";

export class ActualizarEstadoRecojoDto {
  /**
   * Nuevo estado de la solicitud.
   * No se permite regresar a PENDIENTE.
   */
  @IsEnum(
    EstadoSolicitudRecojo,
    {
      message:
        "El estado debe ser CONFIRMADA, RECOGIDO, CANCELADA o NO_ENCONTRADO.",
    },
  )
  @NotEquals(
    EstadoSolicitudRecojo.PENDIENTE,
    {
      message:
        "No se puede actualizar una solicitud al estado PENDIENTE.",
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
