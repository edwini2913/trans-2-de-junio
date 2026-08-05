import api from "./api";

export interface ResumenAdmin {
  usuarios: number;
  rutas: number;
  vehiculos: number;
  viajes: number;
  reservas: number;

  asientosDisponibles: number;
  asientosOcupados: number;
  totalAsientos: number;
  porcentajeOcupacion: number;

  pagosPendientes: number;
  pagosEnRevision: number;
  pagosAprobados: number;
  pagosRechazados: number;

  ingresosHoy: number;
  ingresosMes: number;
  ingresosTotales: number;

  tickets: number;
  ticketsValidos: number;
  ticketsUtilizados: number;
  ticketsCancelados: number;
  ticketsHoy: number;

  blockchainProtegidos: number;
  bloquesHoy: number;

  reclamosPendientes: number;
  reclamosTotal: number;

  fechaActualizacion: string;
}

export interface UsuarioAdmin {
  id: string;
  codigoUsuario?: string;
  nombre?: string;
  apellido?: string;
  ci?: string;
  telefono?: string;
  email?: string;
  rol?: string;
  estado?: boolean;
  fechaRegistro?: string;
  fechaActualizacion?: string;
}

export interface RutaAdmin {
  id?: string;
  origen?: string;
  destino?: string;
}

export interface VehiculoAdmin {
  id?: string;
  placa?: string;
  nombre?: string;
  numeroInterno?: string;
}

export interface ViajeAdmin {
  id: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;
  estado?: string;
  ruta?: RutaAdmin;
  vehiculo?: VehiculoAdmin;
}

export interface AsientoViajeAdmin {
  id?: string;
  numero?: number | string;
  estado?: string;
}

export interface DetalleReservaAdmin {
  id?: string;
  precio?: number | string;
  asientoViaje?: AsientoViajeAdmin;
}

export interface ReservaAdmin {
  id: string;
  codigoReserva?: string;
  estado?: string;
  montoTotal?: number | string;
  fechaReserva?: string;
  fechaVencimiento?: string | null;

  usuario?: UsuarioAdmin;

  viaje?: ViajeAdmin;

  detalles?: DetalleReservaAdmin[];
}

function normalizarNumero(
  valor: unknown,
): number {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function normalizarResumen(
  datos: Partial<ResumenAdmin> | null | undefined,
): ResumenAdmin {
  return {
    usuarios:
      normalizarNumero(datos?.usuarios),

    rutas:
      normalizarNumero(datos?.rutas),

    vehiculos:
      normalizarNumero(datos?.vehiculos),

    viajes:
      normalizarNumero(datos?.viajes),

    reservas:
      normalizarNumero(datos?.reservas),

    asientosDisponibles:
      normalizarNumero(
        datos?.asientosDisponibles,
      ),

    asientosOcupados:
      normalizarNumero(
        datos?.asientosOcupados,
      ),

    totalAsientos:
      normalizarNumero(
        datos?.totalAsientos,
      ),

    porcentajeOcupacion:
      normalizarNumero(
        datos?.porcentajeOcupacion,
      ),

    pagosPendientes:
      normalizarNumero(
        datos?.pagosPendientes,
      ),

    pagosEnRevision:
      normalizarNumero(
        datos?.pagosEnRevision,
      ),

    pagosAprobados:
      normalizarNumero(
        datos?.pagosAprobados,
      ),

    pagosRechazados:
      normalizarNumero(
        datos?.pagosRechazados,
      ),

    ingresosHoy:
      normalizarNumero(
        datos?.ingresosHoy,
      ),

    ingresosMes:
      normalizarNumero(
        datos?.ingresosMes,
      ),

    ingresosTotales:
      normalizarNumero(
        datos?.ingresosTotales,
      ),

    tickets:
      normalizarNumero(
        datos?.tickets,
      ),

    ticketsValidos:
      normalizarNumero(
        datos?.ticketsValidos,
      ),

    ticketsUtilizados:
      normalizarNumero(
        datos?.ticketsUtilizados,
      ),

    ticketsCancelados:
      normalizarNumero(
        datos?.ticketsCancelados,
      ),

    ticketsHoy:
      normalizarNumero(
        datos?.ticketsHoy,
      ),

    blockchainProtegidos:
      normalizarNumero(
        datos?.blockchainProtegidos,
      ),

    bloquesHoy:
      normalizarNumero(
        datos?.bloquesHoy,
      ),

    reclamosPendientes:
      normalizarNumero(
        datos?.reclamosPendientes,
      ),

    reclamosTotal:
      normalizarNumero(
        datos?.reclamosTotal,
      ),

    fechaActualizacion:
      typeof datos?.fechaActualizacion ===
        "string"
        ? datos.fechaActualizacion
        : new Date().toISOString(),
  };
}

export async function obtenerResumenAdmin():
  Promise<ResumenAdmin> {
  const response =
    await api.get<Partial<ResumenAdmin>>(
      "/admin/resumen",
    );

  return normalizarResumen(
    response.data,
  );
}

export async function obtenerUltimasReservas():
  Promise<ReservaAdmin[]> {
  const response =
    await api.get<ReservaAdmin[]>(
      "/admin/ultimas-reservas",
    );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

export async function obtenerUsuariosAdmin():
  Promise<UsuarioAdmin[]> {
  const response =
    await api.get<UsuarioAdmin[]>(
      "/admin/usuarios",
    );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

export async function obtenerReservasAdmin():
  Promise<ReservaAdmin[]> {
  const response =
    await api.get<ReservaAdmin[]>(
      "/admin/reservas",
    );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

export async function obtenerViajesAdmin():
  Promise<ViajeAdmin[]> {
  const response =
    await api.get<ViajeAdmin[]>(
      "/admin/viajes",
    );

  return Array.isArray(response.data)
    ? response.data
    : [];
}