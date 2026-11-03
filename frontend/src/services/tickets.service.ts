
import api from "./api";

export type EstadoTicket =
  | "VALIDO"
  | "UTILIZADO"
  | "CANCELADO";

/* =========================================
   DATOS DEL TICKET
========================================= */

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

/* =========================================
   RESULTADO DE BLOCKCHAIN
========================================= */

export interface BloqueTicketRespuesta {
  indice: string;
  hashDatos: string;
  hashBloque: string;
  hashAnterior: string;
  fechaBloque: string;
}

export interface BlockchainTicketRespuesta {
  autentico?: boolean;
  cadenaValida?: boolean;
  registrado?: boolean;
  mensaje?: string;

  // El backend puede devolver estos datos
  // al generar un ticket existente.
  indice?: string;
  hashBloque?: string;

  // La consulta por token devuelve el bloque.
  bloque?: BloqueTicketRespuesta | null;
}

/* =========================================
   RESPUESTA COMPLETA DEL TICKET
========================================= */

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

  // Solo aparece cuando el backend
  // proporciona datos de Blockchain.
  blockchain?: BlockchainTicketRespuesta;
}

export interface RespuestaValidarTicket {
  ok: boolean;
  mensaje: string;
  ticket: TicketRespuesta;
}

/* =========================================
   NORMALIZAR VALORES NUMÉRICOS
========================================= */

function normalizarNumero(
  valor: unknown,
): number {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

/* =========================================
   NORMALIZAR TICKET
========================================= */

function normalizarTicket(
  ticket: TicketRespuesta,
): TicketRespuesta {
  if (
    !ticket ||
    typeof ticket !== "object"
  ) {
    throw new Error(
      "El servidor no devolvió los datos del ticket.",
    );
  }

  const asientos =
    Array.isArray(ticket.asientos)
      ? ticket.asientos
      : Array.isArray(
          ticket.reserva?.asientos,
        )
        ? ticket.reserva.asientos
        : [];

  const asientoNumeros =
    Array.isArray(
      ticket.asientoNumeros,
    )
      ? ticket.asientoNumeros
      : asientos.map(
          (asiento) =>
            asiento.numero,
        );

  const montoTotal =
    normalizarNumero(
      ticket.montoTotal ??
        ticket.total,
    );

  const cantidadAsientos =
    normalizarNumero(
      ticket.cantidadAsientos ??
        asientoNumeros.length,
    );

  return {
    ...ticket,

    cantidadAsientos,

    precioUnitario:
      normalizarNumero(
        ticket.precioUnitario,
      ),

    montoTotal,
    total: montoTotal,

    asientoNumeros,
    asientos,

    reserva:
      ticket.reserva ?? null,

    blockchain:
      ticket.blockchain,
  };
}

/* =========================================
   NORMALIZAR TOKEN DE VALIDACIÓN
========================================= */

function normalizarToken(
  token: string,
): string {
  const tokenLimpio =
    token?.trim() ?? "";

  if (!tokenLimpio) {
    throw new Error(
      "El código de validación del ticket es obligatorio.",
    );
  }

  return encodeURIComponent(
    tokenLimpio,
  );
}

/* =========================================
   OBTENER TICKETS DEL USUARIO
========================================= */

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

/* =========================================
   OBTENER TICKET POR RESERVA
========================================= */

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

/* =========================================
   GENERAR TICKET POR RESERVA
========================================= */

/**
 * Genera o recupera el ticket de una reserva confirmada.
 *
 * El endpoint del backend es idempotente:
 * si el ticket ya existe, devuelve el mismo
 * ticket en lugar de duplicarlo.
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

/* =========================================
   CONSULTAR TICKET POR TOKEN QR
========================================= */

/**
 * Consulta los datos de un ticket usando
 * el token contenido dentro de su QR.
 *
 * Esta operación NO marca el ticket
 * como utilizado.
 *
 * También conserva el resultado de
 * autenticidad Blockchain del backend.
 */
export async function obtenerTicketPorToken(
  token: string,
): Promise<TicketRespuesta> {
  const tokenCodificado =
    normalizarToken(token);

  const respuesta =
    await api.get<TicketRespuesta>(
      `/tickets/token/${tokenCodificado}`,
    );

  return normalizarTicket(
    respuesta.data,
  );
}

/* =========================================
   VALIDAR TICKET Y CONFIRMAR EMBARQUE
========================================= */

/**
 * Marca el ticket como utilizado cuando
 * el chofer autorizado confirma el embarque.
 *
 * El backend comprueba:
 * - Autenticidad Blockchain.
 * - Estado del ticket.
 * - Reserva confirmada.
 * - Permisos del chofer.
 *
 * No se debe interpretar una respuesta
 * incompleta como una autorización exitosa.
 */
export async function validarTicket(
  token: string,
): Promise<RespuestaValidarTicket> {
  const tokenCodificado =
    normalizarToken(token);

  const respuesta =
    await api.patch<RespuestaValidarTicket>(
      `/tickets/validar/${tokenCodificado}`,
    );

  const datos = respuesta.data;

  if (
    datos?.ok !== true ||
    !datos.ticket ||
    datos.ticket.estado !== "UTILIZADO"
  ) {
    throw new Error(
      datos?.mensaje ||
        "El servidor no confirmó correctamente el embarque.",
    );
  }

  return {
    ...datos,

    ticket: normalizarTicket(
      datos.ticket,
    ),
  };
}
