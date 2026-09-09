const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

/* =========================================================
   INTERFACES DE RUTAS
========================================================= */

export interface Ruta {
  id: string;
  origen: string;
  destino: string;
  distanciaKm: number | null;
  estado: boolean;
  fechaRegistro?: string;
  fechaActualizacion?: string | null;
}

export interface CrearRutaPayload {
  origen: string;
  destino: string;
  distanciaKm?: number | null;
  estado?: boolean;
}

export interface ActualizarRutaPayload {
  origen?: string;
  destino?: string;
  distanciaKm?: number | null;
  estado?: boolean;
}

/* =========================================================
   INTERFACES DE VEHÍCULOS
========================================================= */

export type TipoVehiculo =
  | "FLOTA"
  | "NOAH"
  | "HIACE";

export const CAPACIDAD_POR_TIPO: Record<
  TipoVehiculo,
  number
> = {
  FLOTA: 40,
  NOAH: 7,
  HIACE: 10,
};

export interface Vehiculo {
  id: string;
  numeroFlota: string | null;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculo;
  capacidad: number;
  estado: boolean;
  fechaRegistro?: string;
  fechaActualizacion?: string | null;
}

export interface CrearVehiculoPayload {
  numeroFlota?: string | null;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculo;
  estado?: boolean;
}

export interface ActualizarVehiculoPayload {
  numeroFlota?: string | null;
  placa?: string;
  marca?: string;
  modelo?: string;
  tipo?: TipoVehiculo;
  estado?: boolean;
}

/* =========================================================
   RESPUESTAS DEL BACKEND
========================================================= */

interface RespuestaError {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

interface RutaBackend {
  id?: string;
  origen?: string;
  destino?: string;

  distanciaKm?:
    | number
    | string
    | null;

  distancia_km?:
    | number
    | string
    | null;

  estado?: boolean;

  fechaRegistro?: string;
  fecha_registro?: string;

  fechaActualizacion?:
    | string
    | null;

  fecha_actualizacion?:
    | string
    | null;
}

interface VehiculoBackend {
  id?: string;

  numeroFlota?:
    | string
    | null;

  numero_flota?:
    | string
    | null;

  placa?: string;
  marca?: string;
  modelo?: string;
  tipo?: string;

  capacidad?:
    | number
    | string;

  estado?: boolean;

  fechaRegistro?: string;
  fecha_registro?: string;

  fechaActualizacion?:
    | string
    | null;

  fecha_actualizacion?:
    | string
    | null;
}

/* =========================================================
   FUNCIONES AUXILIARES
========================================================= */

function obtenerToken():
  string | null {
  return (
    localStorage.getItem(
      "access_token",
    ) ||
    localStorage.getItem(
      "token",
    )
  );
}

function crearHeaders(
  incluirToken = true,
): HeadersInit {
  const token =
    obtenerToken();

  const headers:
    Record<string, string> = {
      Accept:
        "application/json",
      "Content-Type":
        "application/json",
    };

  if (
    incluirToken &&
    token
  ) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
}

async function obtenerMensajeError(
  response: Response,
): Promise<string> {
  try {
    const data =
      (await response.json()) as
        RespuestaError;

    if (
      Array.isArray(
        data.message,
      )
    ) {
      return data.message.join(
        ", ",
      );
    }

    if (
      typeof data.message ===
        "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    if (
      typeof data.error ===
        "string" &&
      data.error.trim()
    ) {
      return data.error;
    }

    return `Error del servidor: ${response.status}`;
  } catch {
    return (
      "No se pudo completar la solicitud. " +
      `Código: ${response.status}`
    );
  }
}

async function procesarRespuesta<T>(
  response: Response,
): Promise<T> {
  if (!response.ok) {
    throw new Error(
      await obtenerMensajeError(
        response,
      ),
    );
  }

  return response.json() as
    Promise<T>;
}

function convertirNumero(
  valor: unknown,
  valorPredeterminado = 0,
): number {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero,
  )
    ? numero
    : valorPredeterminado;
}

function esTipoVehiculo(
  tipo: string,
): tipo is TipoVehiculo {
  return [
    "FLOTA",
    "NOAH",
    "HIACE",
  ].includes(tipo);
}

function normalizarRuta(
  item: RutaBackend,
): Ruta {
  const distancia =
    item.distanciaKm ??
    item.distancia_km ??
    null;

  return {
    id:
      String(item.id || ""),

    origen:
      String(
        item.origen || "",
      ),

    destino:
      String(
        item.destino || "",
      ),

    distanciaKm:
      distancia === null
        ? null
        : convertirNumero(
            distancia,
          ),

    estado:
      item.estado !== false,

    fechaRegistro:
      item.fechaRegistro ??
      item.fecha_registro,

    fechaActualizacion:
      item.fechaActualizacion ??
      item.fecha_actualizacion ??
      null,
  };
}

function normalizarVehiculo(
  item: VehiculoBackend,
): Vehiculo {
  const tipoNormalizado =
    String(
      item.tipo || "NOAH",
    )
      .trim()
      .toUpperCase();

  const tipo:
    TipoVehiculo =
      esTipoVehiculo(
        tipoNormalizado,
      )
        ? tipoNormalizado
        : "NOAH";

  return {
    id:
      String(item.id || ""),

    numeroFlota:
      item.numeroFlota ??
      item.numero_flota ??
      null,

    placa:
      String(
        item.placa || "",
      ),

    marca:
      String(
        item.marca || "",
      ),

    modelo:
      String(
        item.modelo || "",
      ),

    tipo,

    capacidad:
      convertirNumero(
        item.capacidad,
        CAPACIDAD_POR_TIPO[
          tipo
        ],
      ),

    estado:
      item.estado !== false,

    fechaRegistro:
      item.fechaRegistro ??
      item.fecha_registro,

    fechaActualizacion:
      item.fechaActualizacion ??
      item.fecha_actualizacion ??
      null,
  };
}

/* =========================================================
   SERVICIOS DE RUTAS
========================================================= */

export async function listarRutas():
  Promise<Ruta[]> {
  const response =
    await fetch(
      `${API_URL}/rutas`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      RutaBackend[]
    >(response);

  return Array.isArray(data)
    ? data.map(
        normalizarRuta,
      )
    : [];
}

export async function listarTodasLasRutas():
  Promise<Ruta[]> {
  const response =
    await fetch(
      `${API_URL}/rutas?incluirInactivas=true`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      RutaBackend[]
    >(response);

  return Array.isArray(data)
    ? data.map(
        normalizarRuta,
      )
    : [];
}

export async function obtenerRutaPorId(
  rutaId: string,
): Promise<Ruta> {
  if (!rutaId.trim()) {
    throw new Error(
      "El identificador de la ruta es obligatorio.",
    );
  }

  const response =
    await fetch(
      `${API_URL}/rutas/${rutaId}`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      RutaBackend
    >(response);

  return normalizarRuta(
    data,
  );
}

export async function crearRuta(
  payload: CrearRutaPayload,
): Promise<Ruta> {
  const datos:
    CrearRutaPayload = {
      origen:
        payload.origen.trim(),

      destino:
        payload.destino.trim(),

      distanciaKm:
        payload.distanciaKm ===
          null ||
        payload.distanciaKm ===
          undefined
          ? undefined
          : Number(
              payload.distanciaKm,
            ),

      estado:
        payload.estado ??
        true,
    };

  const response =
    await fetch(
      `${API_URL}/rutas`,
      {
        method: "POST",
        headers:
          crearHeaders(),
        body:
          JSON.stringify(
            datos,
          ),
      },
    );

  const data =
    await procesarRespuesta<
      RutaBackend
    >(response);

  return normalizarRuta(
    data,
  );
}

export async function actualizarRuta(
  rutaId: string,
  payload: ActualizarRutaPayload,
): Promise<Ruta> {
  if (!rutaId.trim()) {
    throw new Error(
      "El identificador de la ruta es obligatorio.",
    );
  }

  const datos:
    ActualizarRutaPayload = {
      ...payload,
    };

  if (
    typeof payload.origen ===
    "string"
  ) {
    datos.origen =
      payload.origen.trim();
  }

  if (
    typeof payload.destino ===
    "string"
  ) {
    datos.destino =
      payload.destino.trim();
  }

  if (
    payload.distanciaKm !==
    undefined
  ) {
    datos.distanciaKm =
      payload.distanciaKm ===
      null
        ? null
        : Number(
            payload.distanciaKm,
          );
  }

  const response =
    await fetch(
      `${API_URL}/rutas/${rutaId}`,
      {
        method:
          "PATCH",
        headers:
          crearHeaders(),
        body:
          JSON.stringify(
            datos,
          ),
      },
    );

  const data =
    await procesarRespuesta<
      RutaBackend
    >(response);

  return normalizarRuta(
    data,
  );
}

export async function cambiarEstadoRuta(
  rutaId: string,
  estado: boolean,
): Promise<Ruta> {
  if (!rutaId.trim()) {
    throw new Error(
      "El identificador de la ruta es obligatorio.",
    );
  }

  const response =
    await fetch(
      `${API_URL}/rutas/${rutaId}/estado`,
      {
        method:
          "PATCH",
        headers:
          crearHeaders(),
        body:
          JSON.stringify({
            estado,
          }),
      },
    );

  const data =
    await procesarRespuesta<
      RutaBackend
    >(response);

  return normalizarRuta(
    data,
  );
}

export async function eliminarRuta(
  rutaId: string,
): Promise<void> {
  if (!rutaId.trim()) {
    throw new Error(
      "El identificador de la ruta es obligatorio.",
    );
  }

  const response =
    await fetch(
      `${API_URL}/rutas/${rutaId}`,
      {
        method:
          "DELETE",
        headers:
          crearHeaders(),
      },
    );

  if (!response.ok) {
    throw new Error(
      await obtenerMensajeError(
        response,
      ),
    );
  }
}

/* =========================================================
   SERVICIOS DE VEHÍCULOS
========================================================= */

export async function listarVehiculos():
  Promise<Vehiculo[]> {
  const response =
    await fetch(
      `${API_URL}/vehiculos`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      VehiculoBackend[]
    >(response);

  return Array.isArray(data)
    ? data.map(
        normalizarVehiculo,
      )
    : [];
}

export async function listarVehiculosDisponibles():
  Promise<Vehiculo[]> {
  const response =
    await fetch(
      `${API_URL}/vehiculos/disponibles`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      VehiculoBackend[]
    >(response);

  return Array.isArray(data)
    ? data.map(
        normalizarVehiculo,
      )
    : [];
}

export async function listarVehiculosRapidos():
  Promise<Vehiculo[]> {
  const response =
    await fetch(
      `${API_URL}/vehiculos/sector-rapido`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      VehiculoBackend[]
    >(response);

  return Array.isArray(data)
    ? data.map(
        normalizarVehiculo,
      )
    : [];
}

export async function obtenerVehiculoPorId(
  vehiculoId: string,
): Promise<Vehiculo> {
  if (!vehiculoId.trim()) {
    throw new Error(
      "El identificador del vehículo es obligatorio.",
    );
  }

  const response =
    await fetch(
      `${API_URL}/vehiculos/${vehiculoId}`,
      {
        method: "GET",
        headers:
          crearHeaders(),
      },
    );

  const data =
    await procesarRespuesta<
      VehiculoBackend
    >(response);

  return normalizarVehiculo(
    data,
  );
}

export async function crearVehiculo(
  payload: CrearVehiculoPayload,
): Promise<Vehiculo> {
  const datos:
    CrearVehiculoPayload = {
      numeroFlota:
        payload.numeroFlota
          ?.trim() ||
        null,

      placa:
        payload.placa
          .trim()
          .toUpperCase(),

      marca:
        payload.marca.trim(),

      modelo:
        payload.modelo.trim(),

      tipo:
        payload.tipo,

      estado:
        payload.estado ??
        true,
    };

  const response =
    await fetch(
      `${API_URL}/vehiculos`,
      {
        method:
          "POST",
        headers:
          crearHeaders(),
        body:
          JSON.stringify(
            datos,
          ),
      },
    );

  const data =
    await procesarRespuesta<
      VehiculoBackend
    >(response);

  return normalizarVehiculo(
    data,
  );
}

export async function actualizarVehiculo(
  vehiculoId: string,
  payload: ActualizarVehiculoPayload,
): Promise<Vehiculo> {
  if (!vehiculoId.trim()) {
    throw new Error(
      "El identificador del vehículo es obligatorio.",
    );
  }

  const datos:
    ActualizarVehiculoPayload = {
      ...payload,
    };

  if (
    payload.numeroFlota !==
    undefined
  ) {
    datos.numeroFlota =
      payload.numeroFlota
        ?.trim() ||
      null;
  }

  if (
    typeof payload.placa ===
    "string"
  ) {
    datos.placa =
      payload.placa
        .trim()
        .toUpperCase();
  }

  if (
    typeof payload.marca ===
    "string"
  ) {
    datos.marca =
      payload.marca.trim();
  }

  if (
    typeof payload.modelo ===
    "string"
  ) {
    datos.modelo =
      payload.modelo.trim();
  }

  const response =
    await fetch(
      `${API_URL}/vehiculos/${vehiculoId}`,
      {
        method:
          "PATCH",
        headers:
          crearHeaders(),
        body:
          JSON.stringify(
            datos,
          ),
      },
    );

  const data =
    await procesarRespuesta<
      VehiculoBackend
    >(response);

  return normalizarVehiculo(
    data,
  );
}

export async function cambiarEstadoVehiculo(
  vehiculoId: string,
  estado: boolean,
): Promise<Vehiculo> {
  return actualizarVehiculo(
    vehiculoId,
    {
      estado,
    },
  );
}

export async function eliminarVehiculo(
  vehiculoId: string,
): Promise<void> {
  if (!vehiculoId.trim()) {
    throw new Error(
      "El identificador del vehículo es obligatorio.",
    );
  }

  const response =
    await fetch(
      `${API_URL}/vehiculos/${vehiculoId}`,
      {
        method:
          "DELETE",
        headers:
          crearHeaders(),
      },
    );

  if (!response.ok) {
    throw new Error(
      await obtenerMensajeError(
        response,
      ),
    );
  }
}