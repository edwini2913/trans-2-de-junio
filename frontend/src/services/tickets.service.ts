import api from "./api";

export type EstadoTicket =
  | "VALIDO"
  | "UTILIZADO"
  | "CANCELADO";

export interface AsientoTicket {
  id: string;
  numero: string | number;
  estado?: string;
}

export interface RutaTicket {
  id?: string;
  origen?: string;
  destino?: string;
}

export interface VehiculoTicket {
  id?: string;
  marca?: string;
  modelo?: string;
  placa?: string;
  tipo?: string;
}

export interface ViajeTicket {
  id?: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;
  ruta?: RutaTicket | null;
  vehiculo?: VehiculoTicket | null;
}

export interface UsuarioTicket {
  id?: string;
  nombre?: string;
  apellido?: string;
  ci?: string;
  telefono?: string;
  email?: string;
}

export interface ReservaTicket {
  id: string;
  codigoReserva?: string;
  estado?: string;
  fechaReserva?: string;
  usuario?: UsuarioTicket | null;
  viaje?: ViajeTicket | null;
  asientos?: AsientoTicket[];
}

export interface TicketRespuesta {
  id: string;
  numeroTicket: string;
  codigoTicket: string;
  tokenValidacion: string;
  imagenQr: string;
  estado: EstadoTicket;
  fechaCreacion?: string;
  fechaUso?: string | null;
  cantidadAsientos: number;
  precioUnitario: number;
  montoTotal: number;
  total: number;
  origen: string | null;
  destino: string | null;
  fecha: string | null;
  hora: string | null;
  asientoNumeros: Array<
    string | number
  >;
  asientos: AsientoTicket[];
  reserva: ReservaTicket | null;
}

export interface RespuestaValidarTicket {
  ok: boolean;
  mensaje: string;
  ticket: TicketRespuesta;
}

function normalizarNumero(
  valor: unknown,
): number {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function normalizarTicket(
  ticket: TicketRespuesta,
): TicketRespuesta {
  const asientos =
    Array.isArray(ticket?.asientos)
      ? ticket.asientos
      : [];

  const asientoNumeros =
    Array.isArray(
      ticket?.asientoNumeros,
    )
      ? ticket.asientoNumeros
      : asientos.map(
          (asiento) =>
            asiento.numero,
        );

  const montoTotal =
    normalizarNumero(
      ticket?.montoTotal ??
        ticket?.total,
    );

  return {
    ...ticket,
    cantidadAsientos:
      Number(
        ticket?.cantidadAsientos ??
          asientos.length,
      ),
    precioUnitario:
      normalizarNumero(
        ticket?.precioUnitario,
      ),
    montoTotal,
    total: montoTotal,
    asientoNumeros,
    asientos,
    reserva:
      ticket?.reserva ?? null,
  };
}

/**
 * Obtiene todos los tickets generados
 * para el pasajero conectado.
 */
export async function obtenerMisTickets(
  usuarioId: string,
): Promise<TicketRespuesta[]> {
  const respuesta =
    await api.get<TicketRespuesta[]>(
      `/tickets/usuario/${encodeURIComponent(
        usuarioId,
      )}`,
    );

  return Array.isArray(
    respuesta.data,
  )
    ? respuesta.data.map(
        normalizarTicket,
      )
    : [];
}

/**
 * Obtiene el ticket real asociado a la
 * reserva creada al aprobar un pago.
 */
export async function obtenerTicketPorReserva(
  reservaId: string,
): Promise<TicketRespuesta> {
  const respuesta =
    await api.get<TicketRespuesta>(
      `/tickets/reserva/${encodeURIComponent(
        reservaId,
      )}`,
    );

  return normalizarTicket(
    respuesta.data,
  );
}

/**
 * Genera o recupera el ticket de una reserva confirmada.
 * El endpoint del backend es idempotente: si el ticket ya
 * existe, devuelve el mismo ticket en lugar de duplicarlo.
 */
export async function generarTicketPorReserva(
  reservaId: string,
): Promise<TicketRespuesta> {
  const respuesta =
    await api.post<TicketRespuesta>(
      `/tickets/generar/${encodeURIComponent(
        reservaId,
      )}`,
    );

  return normalizarTicket(
    respuesta.data,
  );
}

/**
 * Consulta los datos de un ticket usando
 * el token contenido dentro de su QR.
 */
export async function obtenerTicketPorToken(
  token: string,
): Promise<TicketRespuesta> {
  const respuesta =
    await api.get<TicketRespuesta>(
      `/tickets/token/${encodeURIComponent(
        token,
      )}`,
    );

  return normalizarTicket(
    respuesta.data,
  );
}

/**
 * Marca el ticket como utilizado cuando
 * el encargado valida el código QR.
 */
export async function validarTicket(
  token: string,
): Promise<RespuestaValidarTicket> {
  const respuesta =
    await api.patch<RespuestaValidarTicket>(
      `/tickets/validar/${encodeURIComponent(
        token,
      )}`,
    );

  return {
    ...respuesta.data,
    ticket: normalizarTicket(
      respuesta.data.ticket,
    ),
  };
}
