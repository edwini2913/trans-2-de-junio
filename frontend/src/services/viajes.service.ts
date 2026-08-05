const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

/* =========================================================
   TIPOS GENERALES
========================================================= */

export interface Ruta {
  id: string;
  origen: string;
  destino: string;
  distanciaKm: number | null;
  estado: boolean;
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidad: number;
  estado: boolean;
}

export interface Viaje {
  id: string;
  fecha: string;
  horaSalida: string;
  precio: number;
  asientosDisponibles: number;
  estado: string;
  ruta: Ruta;
  vehiculo: Vehiculo;
}

/* =========================================================
   TIPOS PARA CREAR VIAJES DESDE ADMINISTRACIÓN
========================================================= */

export interface CrearViajePayload {
  rutaId: string;
  vehiculoId: string;
  fecha: string;
  horaSalida: string;
  precio: number;
  estado?: string;
}

/* =========================================================
   TIPOS PARA LA PÁGINA COMPRAR / RESERVAR
========================================================= */

export interface VehiculoDisponible {
  viajeId: string;
  vehiculoId: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidad: number;
  precio: number;
  asientosDisponibles: number;
  estadoViaje?: string;
  estadoVehiculo?: boolean;
}

export interface HorarioDisponible {
  horaSalida: string;
  cantidadVehiculos: number;
  vehiculos: VehiculoDisponible[];
}

export interface FechaDisponible {
  fecha: string;
  cantidadViajes: number;
}

/* =========================================================
   TIPOS AUXILIARES PARA RESPUESTAS DEL BACKEND
========================================================= */

type RespuestaError = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type ViajeBackend = {
  id?: string;
  fecha?: string;

  horaSalida?: string;
  hora_salida?: string;

  precio?: number | string;

  asientosDisponibles?: number | string;
  asientos_disponibles?: number | string;

  estado?: string;

  ruta?: {
    id?: string;
    origen?: string;
    destino?: string;

    distanciaKm?: number | string | null;
    distancia_km?: number | string | null;

    estado?: boolean;
  };

  vehiculo?: {
    id?: string;
    placa?: string;
    marca?: string;
    modelo?: string;
    tipo?: string;

    capacidad?: number | string;

    estado?: boolean;
  };
};

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function obtenerToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function crearHeaders(
  incluirToken = false,
): HeadersInit {
  const token = obtenerToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (incluirToken && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function obtenerMensajeError(
  response: Response,
): Promise<string> {
  try {
    const data =
      (await response.json()) as RespuestaError;

    if (Array.isArray(data.message)) {
      return data.message.join(", ");
    }

    if (
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    if (
      typeof data.error === "string" &&
      data.error.trim()
    ) {
      return data.error;
    }

    return `Error del servidor: ${response.status}`;
  } catch {
    return `No fue posible comunicarse con el servidor. Código: ${response.status}`;
  }
}

async function procesarRespuesta<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    throw new Error(
      await obtenerMensajeError(response),
    );
  }

  return response.json() as Promise<T>;
}

function convertirNumero(
  valor: unknown,
  valorPredeterminado = 0,
): number {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : valorPredeterminado;
}

function normalizarHora(
  hora: unknown,
): string {
  if (
    typeof hora !== "string" ||
    !hora.trim()
  ) {
    return "";
  }

  const valor = hora.trim();

  if (/^\d{2}:\d{2}:\d{2}/.test(valor)) {
    return valor.substring(0, 5);
  }

  return valor;
}

function normalizarFecha(
  fecha: unknown,
): string {
  if (
    typeof fecha !== "string" ||
    !fecha.trim()
  ) {
    return "";
  }

  return fecha.trim().substring(0, 10);
}

function normalizarViaje(
  item: ViajeBackend,
): Viaje {
  const distancia =
    item.ruta?.distanciaKm ??
    item.ruta?.distancia_km ??
    null;

  return {
    id: String(item.id || ""),

    fecha: normalizarFecha(item.fecha),

    horaSalida: normalizarHora(
      item.horaSalida ??
        item.hora_salida,
    ),

    precio: convertirNumero(
      item.precio,
    ),

    asientosDisponibles:
      convertirNumero(
        item.asientosDisponibles ??
          item.asientos_disponibles,
      ),

    estado: String(
      item.estado || "PROGRAMADO",
    ),

    ruta: {
      id: String(
        item.ruta?.id || "",
      ),

      origen: String(
        item.ruta?.origen || "",
      ),

      destino: String(
        item.ruta?.destino || "",
      ),

      distanciaKm:
        distancia === null
          ? null
          : convertirNumero(distancia),

      estado:
        item.ruta?.estado !== false,
    },

    vehiculo: {
      id: String(
        item.vehiculo?.id || "",
      ),

      placa: String(
        item.vehiculo?.placa || "",
      ),

      marca: String(
        item.vehiculo?.marca || "",
      ),

      modelo: String(
        item.vehiculo?.modelo || "",
      ),

      tipo: String(
        item.vehiculo?.tipo || "",
      ),

      capacidad: convertirNumero(
        item.vehiculo?.capacidad,
      ),

      estado:
        item.vehiculo?.estado !== false,
    },
  };
}

function ordenarHorarios(
  horarios: HorarioDisponible[],
): HorarioDisponible[] {
  return [...horarios].sort(
    (a, b) =>
      a.horaSalida.localeCompare(
        b.horaSalida,
      ),
  );
}

/* =========================================================
   CREAR VIAJE
========================================================= */

export async function crearViaje(
  payload: CrearViajePayload,
): Promise<Viaje> {
  const response = await fetch(
    `${API_URL}/viajes`,
    {
      method: "POST",
      headers: crearHeaders(true),
      body: JSON.stringify(payload),
    },
  );

  const data =
    await procesarRespuesta<ViajeBackend>(
      response,
    );

  return normalizarViaje(data);
}

/* =========================================================
   OBTENER TODOS LOS VIAJES
========================================================= */

export async function obtenerViajes(): Promise<
  Viaje[]
> {
  const response = await fetch(
    `${API_URL}/viajes`,
    {
      method: "GET",
      headers: crearHeaders(true),
    },
  );

  const data =
    await procesarRespuesta<ViajeBackend[]>(
      response,
    );

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizarViaje);
}

export async function listarViajes(): Promise<
  Viaje[]
> {
  return obtenerViajes();
}

/* =========================================================
   OBTENER VIAJES PUBLICADOS PARA EL PANEL DEL PASAJERO
========================================================= */

export async function obtenerViajesPublicados(): Promise<
  Viaje[]
> {
  try {
    const response = await fetch(
      `${API_URL}/viajes/publicados`,
      {
        method: "GET",
        headers: crearHeaders(false),
      },
    );

    if (response.ok) {
      const data =
        (await response.json()) as
          ViajeBackend[];

      if (
        Array.isArray(data) &&
        data.length > 0
      ) {
        return data.map(
          normalizarViaje,
        );
      }
    }
  } catch {
    /*
     * Si el endpoint público todavía no está
     * disponible, se utiliza la lista general.
     */
  }

  const viajes =
    await obtenerViajes();

  return viajes
    .filter((viaje) => {
      const estado = String(
        viaje.estado || "",
      ).toUpperCase();

      return (
        viaje.id !== "" &&
        viaje.ruta?.id !== "" &&
        estado === "PROGRAMADO"
      );
    })
    .sort((a, b) => {
      const fecha =
        a.fecha.localeCompare(
          b.fecha,
        );

      if (fecha !== 0) {
        return fecha;
      }

      return a.horaSalida.localeCompare(
        b.horaSalida,
      );
    });
}

/* =========================================================
   OBTENER VIAJES DISPONIBLES POR RUTA Y FECHA
========================================================= */

export async function listarViajesDisponibles(
  rutaId: string,
  fecha: string,
): Promise<Viaje[]> {
  if (!rutaId || !fecha) {
    return [];
  }

  const params = new URLSearchParams({
    rutaId,
    fecha,
  });

  const response = await fetch(
    `${API_URL}/viajes/disponibles?${params.toString()}`,
    {
      method: "GET",
      headers: crearHeaders(false),
    },
  );

  const data =
    await procesarRespuesta<ViajeBackend[]>(
      response,
    );

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizarViaje);
}

export async function obtenerViajesDisponibles(
  rutaId: string,
  fecha: string,
): Promise<Viaje[]> {
  return listarViajesDisponibles(
    rutaId,
    fecha,
  );
}

export async function buscarViajes(
  origen: string,
  destino: string,
  fecha: string,
): Promise<Viaje[]> {
  const origenBuscado = origen
    .trim()
    .toLocaleLowerCase("es-BO");

  const destinoBuscado = destino
    .trim()
    .toLocaleLowerCase("es-BO");

  const fechaBuscada = normalizarFecha(fecha);

  const viajes = await obtenerViajes();

  return viajes.filter((viaje) => {
    const estado = String(viaje.estado || "")
      .toUpperCase();

    return (
      viaje.ruta.origen
        .trim()
        .toLocaleLowerCase("es-BO") === origenBuscado &&
      viaje.ruta.destino
        .trim()
        .toLocaleLowerCase("es-BO") === destinoBuscado &&
      normalizarFecha(viaje.fecha) === fechaBuscada &&
      estado !== "CANCELADO" &&
      estado !== "CANCELADA" &&
      estado !== "FINALIZADO" &&
      estado !== "FINALIZADA"
    );
  });
}

/* =========================================================
   OBTENER FECHAS DISPONIBLES PARA UNA RUTA
========================================================= */

export async function obtenerFechasDisponibles(
  rutaId: string,
): Promise<FechaDisponible[]> {
  if (!rutaId) {
    return [];
  }

  /*
   * Se obtienen los viajes y se agrupan por fecha.
   * Esto evita depender de un endpoint adicional en el backend.
   */
  const viajes = await obtenerViajes();

  const contadorFechas = new Map<
    string,
    number
  >();

  for (const viaje of viajes) {
    const idRuta = String(
      viaje.ruta?.id || "",
    );

    const fechaViaje = normalizarFecha(
      viaje.fecha,
    );

    const estadoViaje = String(
      viaje.estado || "",
    ).toUpperCase();

    if (idRuta !== String(rutaId)) {
      continue;
    }

    if (!fechaViaje) {
      continue;
    }

    if (
      estadoViaje === "CANCELADO" ||
      estadoViaje === "CANCELADA" ||
      estadoViaje === "FINALIZADO" ||
      estadoViaje === "FINALIZADA"
    ) {
      continue;
    }

    const cantidadActual =
      contadorFechas.get(fechaViaje) || 0;

    contadorFechas.set(
      fechaViaje,
      cantidadActual + 1,
    );
  }

  return Array.from(
    contadorFechas.entries(),
  )
    .map(
      ([fecha, cantidadViajes]) => ({
        fecha,
        cantidadViajes,
      }),
    )
    .sort(
      (a, b) =>
        a.fecha.localeCompare(b.fecha),
    );
}

/* =========================================================
   OBTENER OPCIONES AGRUPADAS POR HORARIO
========================================================= */

export async function obtenerOpcionesDeViaje(
  rutaId: string,
  fecha: string,
): Promise<HorarioDisponible[]> {
  const viajes =
    await listarViajesDisponibles(
      rutaId,
      fecha,
    );

  const horariosMap = new Map<
    string,
    VehiculoDisponible[]
  >();

  for (const viaje of viajes) {
    if (!viaje.id) {
      continue;
    }

    if (!viaje.vehiculo?.id) {
      continue;
    }

    const horaSalida = normalizarHora(
      viaje.horaSalida,
    );

    if (!horaSalida) {
      continue;
    }

    const vehiculoDisponible: VehiculoDisponible =
      {
        viajeId: viaje.id,

        vehiculoId:
          viaje.vehiculo.id,

        placa:
          viaje.vehiculo.placa || "",

        marca:
          viaje.vehiculo.marca || "",

        modelo:
          viaje.vehiculo.modelo || "",

        tipo:
          viaje.vehiculo.tipo || "",

        capacidad: convertirNumero(
          viaje.vehiculo.capacidad,
        ),

        precio: convertirNumero(
          viaje.precio,
        ),

        asientosDisponibles:
          convertirNumero(
            viaje.asientosDisponibles,
          ),

        estadoViaje:
          viaje.estado,

        estadoVehiculo:
          viaje.vehiculo.estado,
      };

    const vehiculosActuales =
      horariosMap.get(horaSalida) || [];

    vehiculosActuales.push(
      vehiculoDisponible,
    );

    horariosMap.set(
      horaSalida,
      vehiculosActuales,
    );
  }

  const horarios: HorarioDisponible[] =
    Array.from(
      horariosMap.entries(),
    ).map(
      ([horaSalida, vehiculos]) => ({
        horaSalida,

        cantidadVehiculos:
          vehiculos.length,

        vehiculos:
          [...vehiculos].sort(
            (a, b) => {
              const tipoComparacion =
                String(
                  a.tipo,
                ).localeCompare(
                  String(b.tipo),
                );

              if (
                tipoComparacion !== 0
              ) {
                return tipoComparacion;
              }

              return String(
                a.placa,
              ).localeCompare(
                String(b.placa),
              );
            },
          ),
      }),
    );

  return ordenarHorarios(horarios);
}

/* =========================================================
   OBTENER VIAJE POR ID
========================================================= */

export async function obtenerViajePorId(
  viajeId: string,
): Promise<Viaje> {
  if (!viajeId) {
    throw new Error(
      "Debe proporcionar el identificador del viaje.",
    );
  }

  const response = await fetch(
    `${API_URL}/viajes/${viajeId}`,
    {
      method: "GET",
      headers: crearHeaders(true),
    },
  );

  const data =
    await procesarRespuesta<ViajeBackend>(
      response,
    );

  return normalizarViaje(data);
}

/* =========================================================
   OBTENER ASIENTOS DEL VIAJE
========================================================= */

export async function obtenerAsientosDelViaje(
  viajeId: string,
): Promise<unknown[]> {
  if (!viajeId) {
    return [];
  }

  const response = await fetch(
    `${API_URL}/viajes/${viajeId}/asientos`,
    {
      method: "GET",
      headers: crearHeaders(true),
    },
  );

  const data =
    await procesarRespuesta<unknown[]>(
      response,
    );

  return Array.isArray(data)
    ? data
    : [];
}
