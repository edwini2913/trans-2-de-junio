import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import {
  Ruta,
} from "../../rutas/entities/ruta.entity";

export enum MotivoAvisoSalida {
  SIN_VEHICULOS =
    "SIN_VEHICULOS",

  BLOQUEO =
    "BLOQUEO",

  DERRUMBE =
    "DERRUMBE",

  MAL_TIEMPO =
    "MAL_TIEMPO",

  MANTENIMIENTO =
    "MANTENIMIENTO",

  OTRO =
    "OTRO",
}

export enum TipoServicioAviso {
  /**
   * No existen salidas y se bloquean
   * las compras y reservas.
   */
  SUSPENSION_TOTAL =
    "SUSPENSION_TOTAL",

  /**
   * El vehículo solamente llegará
   * hasta un punto temporal.
   *
   * El pasajero podrá comprar después
   * de aceptar expresamente la condición.
   */
  SERVICIO_PARCIAL =
    "SERVICIO_PARCIAL",

  /**
   * Comunicado informativo que no
   * bloquea compras ni reservas.
   */
  INFORMATIVO =
    "INFORMATIVO",
}

@Entity({
  schema: "sistema",
  name: "avisos_salidas_rapidas",
})
@Index(
  "IDX_AVISOS_SALIDAS_RUTA_FECHA",
  [
    "ruta",
    "fecha",
  ],
)
@Index(
  "IDX_AVISOS_SALIDAS_ACTIVO",
  [
    "activo",
  ],
)
@Index(
  "IDX_AVISOS_SALIDAS_TIPO_SERVICIO",
  [
    "tipoServicio",
  ],
)
@Check(
  "CHK_AVISO_PUNTO_SERVICIO_PARCIAL",
  `
    "tipo_servicio" != 'SERVICIO_PARCIAL'
    OR (
      "permite_compra" = true
      AND "punto_llegada_temporal" IS NOT NULL
      AND LENGTH(TRIM("punto_llegada_temporal")) >= 3
    )
  `,
)
export class AvisoSalida {
  @PrimaryGeneratedColumn(
    "uuid",
  )
  id!: string;

  /**
   * Ruta afectada por el comunicado.
   */
  @ManyToOne(
    () => Ruta,
    {
      nullable: false,
      onDelete: "CASCADE",
    },
  )
  @JoinColumn({
    name: "ruta_id",
  })
  ruta!: Ruta;

  /**
   * Fecha en la que se aplica
   * el comunicado.
   */
  @Column({
    type: "date",
    name: "fecha",
  })
  fecha!: string;

  /**
   * Motivo seleccionado por
   * administración.
   */
  @Column({
    type: "varchar",
    length: 40,
    name: "motivo",
    default:
      MotivoAvisoSalida.SIN_VEHICULOS,
  })
  motivo!: MotivoAvisoSalida;

  /**
   * Define el comportamiento del sistema:
   *
   * SUSPENSION_TOTAL:
   * bloquea compras y reservas.
   *
   * SERVICIO_PARCIAL:
   * permite comprar después de aceptar
   * el punto de llegada temporal.
   *
   * INFORMATIVO:
   * solamente muestra el comunicado.
   */
  @Column({
    type: "varchar",
    length: 40,
    name: "tipo_servicio",
    default:
      TipoServicioAviso.SUSPENSION_TOTAL,
  })
  tipoServicio!: TipoServicioAviso;

  /**
   * Indica si el pasajero puede continuar
   * con la compra o reserva.
   */
  @Column({
    type: "boolean",
    name: "permite_compra",
    default: false,
  })
  permiteCompra!: boolean;

  /**
   * Punto máximo al que llegará el vehículo
   * cuando existe servicio parcial.
   *
   * Ejemplo:
   * Puente Locotal.
   */
  @Column({
    type: "varchar",
    length: 200,
    name: "punto_llegada_temporal",
    nullable: true,
  })
  puntoLlegadaTemporal!: string | null;

  /**
   * Título visible para el pasajero.
   */
  @Column({
    type: "varchar",
    length: 150,
    name: "titulo",
  })
  titulo!: string;

  /**
   * Comunicado completo escrito
   * por administración.
   */
  @Column({
    type: "varchar",
    length: 500,
    name: "mensaje",
  })
  mensaje!: string;

  /**
   * Mientras esté activo, el aviso
   * se mostrará a los pasajeros.
   */
  @Column({
    type: "boolean",
    name: "activo",
    default: true,
  })
  activo!: boolean;

  /**
   * Administrador o secretaria que
   * publicó el comunicado.
   */
  @Column({
    type: "uuid",
    name: "publicado_por",
  })
  publicadoPor!: string;

  /**
   * Persona que retiró el comunicado.
   */
  @Column({
    type: "uuid",
    name: "retirado_por",
    nullable: true,
  })
  retiradoPor!: string | null;

  /**
   * Momento en el que el aviso dejó
   * de mostrarse.
   */
  @Column({
    type: "timestamp",
    name: "fecha_retiro",
    nullable: true,
  })
  fechaRetiro!: Date | null;

  @CreateDateColumn({
    type: "timestamp",
    name: "fecha_publicacion",
    default: () =>
      "CURRENT_TIMESTAMP",
  })
  fechaPublicacion!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    name: "fecha_actualizacion",
    nullable: true,
  })
  fechaActualizacion!: Date | null;
}