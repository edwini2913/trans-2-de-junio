import {
  IsUUID,
} from "class-validator";

export class AutorizarSalidaDto {
  /**
   * Administrador o secretaria que
   * autoriza la salida del vehículo.
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