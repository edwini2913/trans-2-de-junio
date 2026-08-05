import axios from "axios";

import api from "./api";

import type {
  ActualizarEstadoReclamoDto,
  CrearReclamoDto,
  EstadoReclamo,
  Reclamo,
  RespuestaCrearReclamo,
  RespuestaReclamo,
  ResponderReclamoDto,
  ResumenReclamos,
} from "../types/reclamo";

type UsuarioSesion = {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
};

type SesionGuardada = {
  usuario?: UsuarioSesion;
  user?: UsuarioSesion;
  access_token?: string;
};

function leerJsonLocalStorage(
  clave: string,
): unknown {
  const valor =
    localStorage.getItem(clave);

  if (!valor) {
    return null;
  }

  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

export function obtenerUsuarioSesion():
  UsuarioSesion | null {
  const claves = [
    "usuario",
    "user",
    "auth",
    "sesion",
    "session",
  ];

  for (const clave of claves) {
    const datos =
      leerJsonLocalStorage(clave);

    if (
      datos &&
      typeof datos === "object"
    ) {
      const objeto =
        datos as SesionGuardada &
          UsuarioSesion;

      if (
        objeto.id &&
        typeof objeto.id === "string"
      ) {
        return objeto;
      }

      if (
        objeto.usuario?.id
      ) {
        return objeto.usuario;
      }

      if (objeto.user?.id) {
        return objeto.user;
      }
    }
  }

  return null;
}

export function obtenerUsuarioId():
  string {
  const usuario =
    obtenerUsuarioSesion();

  if (!usuario?.id) {
    throw new Error(
      "No se encontró el usuario autenticado. Cierra sesión e inicia nuevamente.",
    );
  }

  return usuario.id;
}

export function obtenerMensajeError(
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
            error?: string;
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
      error.code === "ERR_NETWORK"
    ) {
      return "No se pudo conectar con el backend. Verifica que esté funcionando en http://localhost:3000.";
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

export async function crearReclamo(
  dto: CrearReclamoDto,
): Promise<RespuestaCrearReclamo> {
  const usuarioId =
    obtenerUsuarioId();

  const respuesta =
    await api.post<RespuestaCrearReclamo>(
      `/reclamos/${usuarioId}`,
      dto,
    );

  return respuesta.data;
}

export async function obtenerMisReclamos():
  Promise<Reclamo[]> {
  const usuarioId =
    obtenerUsuarioId();

  const respuesta =
    await api.get<Reclamo[]>(
      `/reclamos/usuario/${usuarioId}`,
    );

  return respuesta.data;
}

export async function obtenerReclamoPorId(
  reclamoId: string,
): Promise<Reclamo> {
  const usuarioId =
    obtenerUsuarioId();

  const respuesta =
    await api.get<Reclamo>(
      `/reclamos/${reclamoId}/${usuarioId}`,
    );

  return respuesta.data;
}

export async function buscarReclamoPorCodigo(
  codigo: string,
): Promise<Reclamo> {
  const usuarioId =
    obtenerUsuarioId();

  const codigoLimpio =
    codigo.trim();

  const respuesta =
    await api.get<Reclamo>(
      `/reclamos/codigo/${encodeURIComponent(
        codigoLimpio,
      )}/${usuarioId}`,
    );

  return respuesta.data;
}

export async function responderReclamo(
  reclamoId: string,
  dto: ResponderReclamoDto,
): Promise<RespuestaReclamo> {
  const usuarioId =
    obtenerUsuarioId();

  const respuesta =
    await api.post<RespuestaReclamo>(
      `/reclamos/${reclamoId}/responder/${usuarioId}`,
      dto,
    );

  return respuesta.data;
}

export async function marcarMensajesLeidos(
  reclamoId: string,
): Promise<{
  mensaje: string;
}> {
  const usuarioId =
    obtenerUsuarioId();

  const respuesta =
    await api.patch<{
      mensaje: string;
    }>(
      `/reclamos/${reclamoId}/leidos/${usuarioId}`,
    );

  return respuesta.data;
}

/*
 * Funciones administrativas.
 */

export async function obtenerTodosLosReclamos(
  estado?: EstadoReclamo,
): Promise<Reclamo[]> {
  const respuesta =
    await api.get<Reclamo[]>(
      "/reclamos",
      {
        params: estado
          ? {
              estado,
            }
          : undefined,
      },
    );

  return respuesta.data;
}

export async function actualizarEstadoReclamo(
  reclamoId: string,
  dto: ActualizarEstadoReclamoDto,
): Promise<RespuestaReclamo> {
  const usuarioId =
    obtenerUsuarioId();

  const respuesta =
    await api.patch<RespuestaReclamo>(
      `/reclamos/${reclamoId}/estado/${usuarioId}`,
      dto,
    );

  return respuesta.data;
}

export async function obtenerResumenReclamos():
  Promise<ResumenReclamos> {
  const respuesta =
    await api.get<ResumenReclamos>(
      "/reclamos/dashboard/resumen",
    );

  return respuesta.data;
}