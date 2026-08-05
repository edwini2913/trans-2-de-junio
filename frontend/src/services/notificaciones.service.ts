import axios from "axios";

import api from "./api";

import {
  obtenerUsuarioId,
} from "./reclamos.service";

export type TipoNotificacion =
  | "NUEVA_COMPRA"
  | "NUEVA_RESERVA"
  | "NUEVO_RECLAMO"
  | "MENSAJE_RECLAMO"
  | "RECLAMO_RESPONDIDO"
  | "TICKET_UTILIZADO"
  | "TICKET_CANCELADO"
  | "INFORMACION"
  | "NUEVO_COMPROBANTE_PAGO"
  | "PAGO_APROBADO"
  | "PAGO_RECHAZADO";

export type PrioridadNotificacion =
  | "BAJA"
  | "NORMAL"
  | "ALTA"
  | "URGENTE";

export type RolDestinatarioNotificacion =
  | "ADMINISTRADOR"
  | "PASAJERO";

export interface Notificacion {
  id: string;

  rolDestinatario:
    RolDestinatarioNotificacion;

  tipo: TipoNotificacion;

  prioridad:
    PrioridadNotificacion;

  titulo: string;

  mensaje: string;

  referenciaTipo:
    | string
    | null;

  referenciaId:
    | string
    | null;

  rutaDestino:
    | string
    | null;

  leida: boolean;

  fechaLectura:
    | string
    | null;

  fechaRegistro: string;

  fechaActualizacion: string;
}

interface RespuestaCantidad {
  cantidad: number;
}

interface RespuestaLectura {
  mensaje: string;
  notificacion?: Notificacion;
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const respuesta =
      error.response?.data as
        | {
            message?:
              | string
              | string[];

            mensaje?: string;
          }
        | undefined;

    if (
      Array.isArray(
        respuesta?.message,
      )
    ) {
      return respuesta.message.join(
        ", ",
      );
    }

    if (
      typeof respuesta?.message ===
      "string"
    ) {
      return respuesta.message;
    }

    if (
      typeof respuesta?.mensaje ===
      "string"
    ) {
      return respuesta.mensaje;
    }

    if (
      error.code ===
      "ERR_NETWORK"
    ) {
      return "No se pudo conectar con el backend.";
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudieron cargar las notificaciones.";
}

/**
 * Obtiene las notificaciones recientes
 * del panel administrativo.
 */
export async function obtenerNotificacionesAdministrador(
  limite = 30,
): Promise<Notificacion[]> {
  try {
    const respuesta =
      await api.get<Notificacion[]>(
        "/notificaciones/administrador",
        {
          params: {
            limite,
          },
        },
      );

    return Array.isArray(
      respuesta.data,
    )
      ? respuesta.data
      : [];
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error),
    );
  }
}

/**
 * Obtiene el contador administrativo
 * que se muestra encima de la campana.
 */
export async function contarNotificacionesNoLeidasAdministrador():
  Promise<number> {
  try {
    const respuesta =
      await api.get<RespuestaCantidad>(
        "/notificaciones/administrador/no-leidas",
      );

    return Number(
      respuesta.data?.cantidad ??
        0,
    );
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error),
    );
  }
}

/**
 * Marca una notificación del usuario
 * autenticado como leída.
 */
export async function marcarNotificacionComoLeida(
  notificacionId: string,
): Promise<RespuestaLectura> {
  const usuarioId =
    obtenerUsuarioId();

  try {
    const respuesta =
      await api.patch<RespuestaLectura>(
        `/notificaciones/${notificacionId}/leida/${usuarioId}`,
      );

    return respuesta.data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error),
    );
  }
}

/**
 * Marca todas las notificaciones del
 * usuario autenticado como leídas.
 */
export async function marcarTodasLasNotificacionesComoLeidas():
  Promise<RespuestaLectura> {
  const usuarioId =
    obtenerUsuarioId();

  try {
    const respuesta =
      await api.patch<RespuestaLectura>(
        `/notificaciones/todas/leidas/${usuarioId}`,
      );

    return respuesta.data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error),
    );
  }
}

/**
 * Obtiene las notificaciones recientes
 * del pasajero autenticado.
 */
export async function obtenerNotificacionesPasajero(
  limite = 30,
): Promise<Notificacion[]> {
  const usuarioId =
    obtenerUsuarioId();

  try {
    const respuesta =
      await api.get<Notificacion[]>(
        `/notificaciones/usuario/${usuarioId}`,
        {
          params: {
            limite,
          },
        },
      );

    return Array.isArray(
      respuesta.data,
    )
      ? respuesta.data
      : [];
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error),
    );
  }
}

/**
 * Cuenta las notificaciones no leídas
 * del pasajero autenticado.
 */
export async function contarNotificacionesNoLeidasPasajero():
  Promise<number> {
  const usuarioId =
    obtenerUsuarioId();

  try {
    const respuesta =
      await api.get<RespuestaCantidad>(
        `/notificaciones/usuario/${usuarioId}/no-leidas`,
      );

    return Number(
      respuesta.data?.cantidad ??
        0,
    );
  } catch (error) {
    throw new Error(
      obtenerMensajeError(error),
    );
  }
}