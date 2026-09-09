import {
  IsUUID,
} from "class-validator";

export class RetirarAvisoSalidaDto {
  /**
   * Administrador o secretaria
   * que retira el comunicado.
   */
  @IsUUID(
    "4",
    {
      message:
        "El identificador de quien retira el aviso no es válido.",
    },
  )
  administradorId!: string;
}