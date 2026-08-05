import API from "./auth.service";

export type EstadoReserva =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "CANCELADA"
  | "VENCIDA";

export type CrearReservaDatos = {
  usuarioId: string;
  viajeId: string;
  asientoIds: string[];
};

export interface ReservaPasajero {
  id: string;
  codigoReserva: string;
  estado: EstadoReserva;
  fechaReserva: string;
  fechaVencimiento: string | null;
  usuario?: {
    id: string;
  };
  viaje: {
    id: string;
    fecha?: string;
    fechaSalida?: string;
    horaSalida?: string;
    precio: number | string;
    ruta?: {
      origen?: string;
      destino?: string;
    };
    vehiculo?: {
      placa?: string;
      marca?: string;
      modelo?: string;
    };
  };
  detalles: Array<{
    id: string;
    precio: number | string;
    asientoViaje: {
      id: string;
      numero: number | string;
      estado: string;
    };
  }>;
}

export interface RespuestaCrearReservaPendiente {
  ok?: boolean;
  mensaje: string;
  reserva: ReservaPasajero;
  montoTotal: number;
}

export interface RespuestaCancelarReserva {
  ok: boolean;
  mensaje: string;
  codigoReserva: string;
  asientosLiberados: Array<string | number>;
}

/**
 * Crea una reserva temporal y bloquea todos los asientos seleccionados.
 * El pasajero dispone de 2 horas para completar el pago.
 */
export async function crearReservaPendiente(
  data: CrearReservaDatos,
): Promise<RespuestaCrearReservaPendiente> {
  const response = await API.post<RespuestaCrearReservaPendiente>(
    "/reservas/pendiente",
    data,
  );

  return response.data;
}

/**
 * Conserva la creación de reserva utilizada por las pantallas anteriores.
 */
export async function crearReserva(data: CrearReservaDatos) {
  const response = await API.post("/reservas", data);

  return response.data;
}

/**
 * Obtiene todas las reservas pertenecientes a un pasajero.
 */
export async function obtenerReservasUsuario(
  usuarioId: string,
): Promise<ReservaPasajero[]> {
  const response = await API.get<ReservaPasajero[]>(
    `/reservas/usuario/${usuarioId}`,
  );

  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Obtiene una reserva mediante su identificador.
 */
export async function obtenerReservaPorId(
  id: string,
): Promise<ReservaPasajero> {
  const response = await API.get<ReservaPasajero>(`/reservas/${id}`);

  return response.data;
}

/**
 * Permite que un pasajero cancele una reserva propia pendiente de pago.
 */
export async function cancelarReservaUsuario(
  reservaId: string,
  usuarioId: string,
): Promise<RespuestaCancelarReserva> {
  const response = await API.delete<RespuestaCancelarReserva>(
    `/reservas/${reservaId}/usuario/${usuarioId}`,
  );

  return response.data;
}

/**
 * Cancelación administrativa utilizada por las pantallas anteriores.
 */
export async function eliminarReserva(
  id: string,
): Promise<RespuestaCancelarReserva> {
  const response = await API.delete<RespuestaCancelarReserva>(
    `/reservas/${id}`,
  );

  return response.data;
}