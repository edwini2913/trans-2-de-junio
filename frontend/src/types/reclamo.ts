export const TipoReclamo = {
  RECLAMO: "RECLAMO",
  QUEJA: "QUEJA",
  CONSULTA: "CONSULTA",
  SUGERENCIA: "SUGERENCIA",
} as const;

export type TipoReclamo =
  (typeof TipoReclamo)[keyof typeof TipoReclamo];

export const CategoriaReclamo = {
  PAGO: "PAGO",
  RESERVA: "RESERVA",
  TICKET: "TICKET",
  VIAJE: "VIAJE",
  CONDUCTOR: "CONDUCTOR",
  ATENCION: "ATENCION",
  OBJETO_PERDIDO:
    "OBJETO_PERDIDO",
  OTRO: "OTRO",
} as const;

export type CategoriaReclamo =
  (typeof CategoriaReclamo)[keyof typeof CategoriaReclamo];

export const PrioridadReclamo = {
  BAJA: "BAJA",
  NORMAL: "NORMAL",
  ALTA: "ALTA",
  URGENTE: "URGENTE",
} as const;

export type PrioridadReclamo =
  (typeof PrioridadReclamo)[keyof typeof PrioridadReclamo];

export const EstadoReclamo = {
  PENDIENTE: "PENDIENTE",
  EN_REVISION: "EN_REVISION",
  RESPONDIDO: "RESPONDIDO",
  CERRADO: "CERRADO",
} as const;

export type EstadoReclamo =
  (typeof EstadoReclamo)[keyof typeof EstadoReclamo];

export const TipoAutorMensaje = {
  USUARIO: "USUARIO",
  ADMINISTRADOR:
    "ADMINISTRADOR",
} as const;

export type TipoAutorMensaje =
  (typeof TipoAutorMensaje)[keyof typeof TipoAutorMensaje];

export interface UsuarioReclamo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  ci?: string | null;
  rol?: string;
}

export interface ReservaReclamo {
  id: string;
  codigoReserva?: string;
  estado?: string;
  fechaReserva?: string;
}

export interface TicketReclamo {
  id: string;
  numeroTicket?: string;
  codigoTicket?: string;
  estado?: string;

  reserva?:
    | ReservaReclamo
    | null;
}

export interface MensajeReclamo {
  id: string;

  tipoAutor:
    TipoAutorMensaje;

  mensaje: string;

  archivoUrl?:
    | string
    | null;

  nombreArchivo?:
    | string
    | null;

  tipoArchivo?:
    | string
    | null;

  leido: boolean;
  fechaRegistro: string;

  usuario?:
    | UsuarioReclamo
    | null;
}

export interface Reclamo {
  id: string;
  codigo: string;

  tipo: TipoReclamo;

  categoria:
    CategoriaReclamo;

  prioridad:
    PrioridadReclamo;

  estado: EstadoReclamo;

  asunto: string;
  descripcion: string;

  respuestaFinal?:
    | string
    | null;

  cerradoPorId?:
    | string
    | null;

  fechaCierre?:
    | string
    | null;

  fechaRegistro: string;
  fechaActualizacion?: string;
  cantidadMensajes?: number;

  usuario?: UsuarioReclamo;

  ticket?:
    | TicketReclamo
    | null;

  mensajes?: MensajeReclamo[];
}

export interface CrearReclamoDto {
  ticketId?: string;

  tipo: TipoReclamo;

  categoria:
    CategoriaReclamo;

  prioridad:
    PrioridadReclamo;

  asunto: string;
  descripcion: string;
}

export interface ResponderReclamoDto {
  mensaje: string;
  archivoUrl?: string;
  nombreArchivo?: string;
  tipoArchivo?: string;
}

export interface ActualizarEstadoReclamoDto {
  estado: EstadoReclamo;
  respuestaFinal?: string;
}

export interface ResumenReclamos {
  total: number;
  pendientes: number;
  enRevision: number;
  respondidos: number;
  cerrados: number;
}

export interface RespuestaCrearReclamo {
  mensaje: string;
  reclamo: Reclamo;
}

export interface RespuestaReclamo {
  mensaje: string;
  reclamo: Reclamo;
}