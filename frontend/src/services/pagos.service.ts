import api from "./api";

export type EstadoPago = "PENDIENTE" | "EN_REVISION" | "APROBADO" | "RECHAZADO";

export type DecisionPago = "APROBAR" | "RECHAZAR";

export interface UsuarioPago {
  id: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  ci?: string;
  rol?: string;
}

export interface RutaPago {
  id?: string;
  origen?: string;
  destino?: string;
}

export interface VehiculoPago {
  id?: string;
  marca?: string;
  modelo?: string;
  placa?: string;
  numeroInterno?: string;
}

export interface ViajePago {
  id: string;
  fechaSalida?: string;
  horaSalida?: string;
  precio?: number | string;
  ruta?: RutaPago | null;
  vehiculo?: VehiculoPago | null;
}

export interface ReservaPago {
  id: string;
  codigoReserva?: string;
  estado?: string;
  fechaReserva?: string;
}

export interface Pago {
  id: string;
  estado: EstadoPago;
  referencia: string;
  monto: number;
  asientoIds: string[];
  comprobanteNombre?: string;
  comprobanteTipo?: string;
  comprobanteTamanio?: number;
  observacionAdministrador?: string | null;
  fechaRevision?: string | null;
  fechaRegistro?: string;
  fechaActualizacion?: string;
  usuario?: UsuarioPago;
  viaje?: ViajePago;
  reserva?: ReservaPago | null;
  revisadoPor?: UsuarioPago | null;
}

export type PagoRegistrado = Pago;

export interface RegistrarComprobantePagoDatos {
  /** Reserva temporal que se está pagando. Se omite en una compra directa. */
  reservaId?: string;
  usuarioId: string;
  viajeId: string;
  asientoIds: string[];
  referencia: string;
  monto: number;
  comprobante: File;
}

export interface RevisarPagoDatos {
  decision: DecisionPago;
  observacion?: string;
}

export interface RespuestaRegistrarPago {
  ok?: boolean;
  mensaje: string;
  pago: Pago;
  reserva?: ReservaPago;
}

export interface RespuestaRevisionPago {
  ok?: boolean;
  mensaje: string;
  pago: Pago;
  reserva?: ReservaPago;
  ticket?: unknown;
}

type PagoApi = Omit<Pago, "monto"> & {
  monto: number | string;
};

function normalizarPago(pago: PagoApi): Pago {
  const montoConvertido = Number(pago.monto);

  return {
    ...pago,
    monto: Number.isFinite(montoConvertido) ? montoConvertido : 0,
    asientoIds: Array.isArray(pago.asientoIds) ? pago.asientoIds : [],
  };
}

export async function registrarComprobantePago(
  datos: RegistrarComprobantePagoDatos,
): Promise<RespuestaRegistrarPago> {
  const formulario = new FormData();

  if (datos.reservaId) {
    formulario.append("reservaId", datos.reservaId);
  }

  formulario.append("usuarioId", datos.usuarioId);
  formulario.append("viajeId", datos.viajeId);
  formulario.append("asientoIds", JSON.stringify(datos.asientoIds));
  formulario.append("referencia", datos.referencia);
  formulario.append("monto", String(datos.monto));
  formulario.append("comprobante", datos.comprobante);

  const respuesta = await api.postForm<
    Omit<RespuestaRegistrarPago, "pago"> & {
      pago: PagoApi;
    }
  >("/pagos/comprobante", formulario);

  if (!respuesta.data?.pago?.id) {
    throw new Error(
      "El backend no confirmó el registro del pago. El comprobante no fue guardado.",
    );
  }

  return {
    ...respuesta.data,
    pago: normalizarPago(respuesta.data.pago),
  };
}

export async function obtenerTodosLosPagos(
  estado?: EstadoPago,
): Promise<Pago[]> {
  const respuesta = await api.get<PagoApi[]>("/pagos", {
    params: estado ? { estado } : undefined,
  });

  return Array.isArray(respuesta.data)
    ? respuesta.data.map(normalizarPago)
    : [];
}

export async function obtenerPagoPorId(pagoId: string): Promise<Pago> {
  const respuesta = await api.get<PagoApi>(`/pagos/${pagoId}`);

  return normalizarPago(respuesta.data);
}

export async function obtenerPagosUsuario(usuarioId: string): Promise<Pago[]> {
  const respuesta = await api.get<PagoApi[]>(`/pagos/usuario/${usuarioId}`);

  return Array.isArray(respuesta.data)
    ? respuesta.data.map(normalizarPago)
    : [];
}

export async function revisarPago(
  pagoId: string,
  administradorId: string,
  datos: RevisarPagoDatos,
): Promise<RespuestaRevisionPago> {
  const respuesta = await api.patch<
    Omit<RespuestaRevisionPago, "pago"> & {
      pago: PagoApi;
    }
  >(`/pagos/${pagoId}/revisar/${administradorId}`, {
    decision: datos.decision,
    observacion: datos.observacion?.trim() || undefined,
  });

  return {
    ...respuesta.data,
    pago: normalizarPago(respuesta.data.pago),
  };
}

export async function obtenerComprobantePago(pagoId: string): Promise<Blob> {
  const respuesta = await api.get<Blob>(`/pagos/${pagoId}/comprobante`, {
    responseType: "blob",
  });

  return respuesta.data;
}

export function obtenerUrlComprobantePago(pagoId: string): string {
  return api.getUri({
    url: `/pagos/${pagoId}/comprobante`,
  });
}
