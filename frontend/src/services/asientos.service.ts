const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type EstadoAsiento =
  | 'DISPONIBLE'
  | 'BLOQUEADO'
  | 'RESERVADO'
  | 'VENDIDO';

export interface AsientoViaje {
  id: string;
  numero: number;
  estado: EstadoAsiento;
  bloqueadoPor: string | null;
  bloqueadoHasta: string | null;
}

export interface RespuestaBloqueoAsiento {
  mensaje: string;
  expiraEn: string;
  asiento: AsientoViaje;
}

function obtenerToken(): string {
  return localStorage.getItem('access_token') || '';
}

async function procesarRespuesta<T>(
  respuesta: Response,
): Promise<T> {
  const contenido = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje =
      contenido?.message ||
      contenido?.mensaje ||
      'Ocurrió un error al comunicarse con el servidor.';

    throw new Error(
      Array.isArray(mensaje) ? mensaje.join(', ') : mensaje,
    );
  }

  return contenido as T;
}

export async function obtenerAsientosPorViaje(
  viajeId: string,
): Promise<AsientoViaje[]> {
  if (!viajeId) {
    throw new Error('Debe seleccionar un viaje.');
  }

  const respuesta = await fetch(
    `${API_URL}/asientos/viaje/${viajeId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obtenerToken()}`,
      },
    },
  );

  return procesarRespuesta<AsientoViaje[]>(respuesta);
}

export async function bloquearAsiento(
  asientoId: string,
  usuarioId: string,
): Promise<RespuestaBloqueoAsiento> {
  if (!asientoId) {
    throw new Error('Debe seleccionar un asiento.');
  }

  if (!usuarioId) {
    throw new Error('No se encontró el usuario autenticado.');
  }

  const respuesta = await fetch(
    `${API_URL}/asientos/${asientoId}/bloquear`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: JSON.stringify({
        usuarioId,
      }),
    },
  );

  return procesarRespuesta<RespuestaBloqueoAsiento>(
    respuesta,
  );
}

export async function liberarAsiento(
  asientoId: string,
  usuarioId: string,
): Promise<{
  mensaje: string;
  asiento: AsientoViaje;
}> {
  const respuesta = await fetch(
    `${API_URL}/asientos/${asientoId}/liberar`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${obtenerToken()}`,
      },
      body: JSON.stringify({
        usuarioId,
      }),
    },
  );

  return procesarRespuesta<{
    mensaje: string;
    asiento: AsientoViaje;
  }>(respuesta);
}