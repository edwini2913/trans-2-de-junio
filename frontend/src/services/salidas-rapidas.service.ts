import API from "./auth.service";

/* =========================================================
   ESTADOS
========================================================= */

export type EstadoTurnoVehiculo =
  | "VENDIENDO"
  | "SIGUIENTE"
  | "EN_ESPERA"
  | "COMPLETO"
  | "EN_RUTA"
  | "FINALIZADO"
  | "CANCELADO";

export type EstadoSolicitudRecojo =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "RECOGIDO"
  | "CANCELADA"
  | "NO_ENCONTRADO";

export type EstadoActualizableRecojo = Exclude<
  EstadoSolicitudRecojo,
  "PENDIENTE"
>;

export type MotivoAvisoSalida =
  | "SIN_VEHICULOS"
  | "BLOQUEO"
  | "DERRUMBE"
  | "MAL_TIEMPO"
  | "MANTENIMIENTO"
  | "OTRO";

export type TipoServicioAviso =
  | "SUSPENSION_TOTAL"
  | "SERVICIO_PARCIAL"
  | "INFORMATIVO";

/* =========================================================
   VEHÍCULOS, ASIENTOS Y SALIDAS
========================================================= */

export interface ChoferHabitualVehiculo {
  id: string;
  nombre: string;
  apellido: string;
  rol?: "CHOFER";
  estado?: boolean;
}

export interface VehiculoRapido {
  choferHabitual?: ChoferHabitualVehiculo | null;
  id: string;
  numeroFlota: string | null;
  placa: string;
  marca: string;
  modelo: string;
  tipo: "NOAH" | "HIACE";
  capacidad: number;
  estado: boolean;
}

export interface AsientoSalidaRapida {
  id: string;
  numero: number;

  estado:
    | "DISPONIBLE"
    | "BLOQUEADO"
    | "RESERVADO"
    | "VENDIDO";

  bloqueadoPor: string | null;
  bloqueadoHasta: string | null;
}

export interface TurnoSalidaRapida {
  id: string;
  posicion: number;
  estado: EstadoTurnoVehiculo;
  activo: boolean;
  chofer?: { id: string; nombre: string; apellido: string } | null;
  fecha: string;
  fechaInicioVenta: string | null;
  fechaSalida: string | null;

  ruta: {
    id: string;
    origen: string;
    destino: string;
  };

  vehiculo: {
    id: string;
    placa: string;
    numeroFlota: string | null;
    marca: string;
    modelo: string;
    tipo: "NOAH" | "HIACE";
    capacidad: number;
  };

  viaje: {
    id: string;
    horaSalida: string;
    precio: number;
  };

  ocupacion: {
    capacidad: number;
    disponibles: number;
    bloqueados: number;
    reservados: number;
    vendidos: number;
    ocupados: number;
    faltan: number;
    porcentaje: number;
  };

  asientos: AsientoSalidaRapida[];
}

export interface SalidaRapidaActual {
  actual: TurnoSalidaRapida;
  siguiente: TurnoSalidaRapida | null;
  fila: TurnoSalidaRapida[];
}

/* =========================================================
   AVISOS
========================================================= */

export interface AvisoSalidaRapida {
  id: string;
  fecha: string;
  motivo: MotivoAvisoSalida;

  /**
   * SUSPENSION_TOTAL: bloquea compras y reservas.
   * SERVICIO_PARCIAL: permite aceptar un destino temporal.
   * INFORMATIVO: solamente informa.
   */
  tipoServicio: TipoServicioAviso;

  permiteCompra: boolean;
  puntoLlegadaTemporal: string | null;

  titulo: string;
  mensaje: string;
  activo: boolean;

  publicadoPor: string;
  retiradoPor: string | null;
  fechaRetiro: string | null;
  fechaPublicacion: string;
  fechaActualizacion: string | null;

  ruta: {
    id: string;
    origen: string;
    destino: string;
  };
}

/* =========================================================
   DATOS PARA FILAS Y AVISOS
========================================================= */

export interface ChoferDisponible {
  id: string;
  nombre: string;
  apellido: string;
  rol: "CHOFER";
  estado: boolean;
}

/** Lista usuarios activos con rol CHOFER desde el endpoint existente. */
export const obtenerChoferesActivos = async (): Promise<ChoferDisponible[]> => {
  const respuesta = await API.get<unknown>("/users");
  const datos: unknown = respuesta.data;
  const registro = datos && typeof datos === "object"
    ? datos as Record<string, unknown>
    : {};
  const lista = Array.isArray(datos) ? datos
    : Array.isArray(registro.usuarios) ? registro.usuarios
    : Array.isArray(registro.data) ? registro.data
    : Array.isArray(registro.items) ? registro.items
    : null;
  if (!lista) {
    throw new Error("El servidor no devolvió una lista válida de usuarios.");
  }
  return lista.filter((valor): valor is ChoferDisponible => {
    if (!valor || typeof valor !== "object") return false;
    const usuario = valor as Partial<ChoferDisponible>;
    return typeof usuario.id === "string" &&
      typeof usuario.nombre === "string" &&
      typeof usuario.apellido === "string" &&
      usuario.rol === "CHOFER" && usuario.estado === true;
  });
};

export interface CrearFilaSalidaDatos {
  rutaId: string;
  fecha: string;
  vehiculoIds: string[];
  asignacionesChoferes?: { vehiculoId: string; choferId: string }[];
  precio: number;
  horaInicio?: string;
  intervaloMinutos?: number;
  habilitadoPor: string;
}

export interface AgregarVehiculoFilaDatos {
  rutaId: string;
  fecha: string;
  vehiculoId: string;
  choferId?: string;
  intervaloMinutos?: number;
  administradorId: string;
}

export interface PublicarAvisoSalidaDatos {
  rutaId: string;
  fecha: string;
  motivo: MotivoAvisoSalida;
  tipoServicio: TipoServicioAviso;
  permiteCompra: boolean;
  puntoLlegadaTemporal?: string;
  titulo: string;
  mensaje: string;
  publicadoPor: string;
}

/* =========================================================
   DATOS DE RECOJO
========================================================= */

export interface SolicitarRecojoDatos {
  /**
   * Se conserva por compatibilidad con el formulario actual.
   * El backend debe comprobar la identidad mediante el JWT.
   */
  usuarioId: string;
  viajeId: string;
  referencia: string;
  telefono: string;
  latitud?: number;
  longitud?: number;
  observacion?: string;
}

/**
 * Compatible con el endpoint anterior.
 */
/** Campos que el pasajero puede modificar en su recojo PENDIENTE. */
export interface ActualizarMiRecojoDatos {
  referencia?: string;
  telefono?: string;
  observacion?: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface RespuestaActualizarMiRecojo {
  mensaje: string;
  solicitud: {
    id: string;
    referencia: string;
    telefono: string;
    observacion: string | null;
    latitud: number | string | null;
    longitud: number | string | null;
    estado: EstadoSolicitudRecojo;
  };
}

export interface ActualizarEstadoRecojoDatos {
  estado: EstadoSolicitudRecojo;
  administradorId: string;
}

export interface PasajeroRecojo {
  id: string;
  nombre: string;
  apellido: string;
}

export interface ChoferRecojo {
  id: string;
  nombre: string;
  apellido: string;
}

export interface ViajeRecojo {
  id: string;
  fecha: string;
  horaSalida: string;
  estado?: string;
  choferId?: string | null;

  ruta?: {
    id?: string;
    origen: string;
    destino: string;
  } | null;

  vehiculo?: {
    id?: string;
    placa: string;
    marca?: string;
    modelo?: string;
    tipo?: "NOAH" | "HIACE";
  } | null;
}

export interface SolicitudRecojo {
  id: string;
  referencia: string;
  telefono: string;
  observacion: string | null;
  estado: EstadoSolicitudRecojo;

  /**
   * PostgreSQL puede devolver campos decimal como texto.
   */
  latitud: number | string | null;
  longitud: number | string | null;

  usuario: PasajeroRecojo;
  viaje: ViajeRecojo;

  fechaRegistro?: string;
  fechaActualizacion?: string | null;
  confirmadoPor?: string | null;
  fechaConfirmacion?: string | null;

  /**
   * Campos del nuevo seguimiento.
   * Opcionales para conservar compatibilidad con el backend anterior.
   */
  ubicacionActualizada?: string | null;
  compartiendoUbicacion?: boolean;
  precisionUbicacion?: number | null;
  compraConfirmada?: boolean;
}

export interface RespuestaSolicitudRecojo {
  mensaje: string;

  /**
   * El registro puede responder únicamente con ID y estado.
   * Para mostrar los detalles se utiliza la consulta de solicitudes.
   */
  solicitud: {
    id: string;
    estado: EstadoSolicitudRecojo;
  };
}

export interface RespuestaMensajeRecojo {
  mensaje: string;
}

/**
 * Para compartir se requieren ambas coordenadas.
 * Para detener no es necesario volver a enviar la posición.
 */
export type ActualizarUbicacionRecojoDatos =
  | {
      compartiendo: true;
      latitud: number;
      longitud: number;
      precision?: number;
    }
  | {
      compartiendo: false;
    };

/* =========================================================
   VALIDACIONES AUXILIARES
========================================================= */

function exigirIdentificador(
  valor: string,
  nombre: string,
): string {
  const limpio = valor.trim();

  if (!limpio) {
    throw new Error(`Falta el identificador de ${nombre}.`);
  }

  return encodeURIComponent(limpio);
}

function validarCoordenadas(
  latitud: number,
  longitud: number,
): void {
  if (
    !Number.isFinite(latitud) ||
    latitud < -90 ||
    latitud > 90
  ) {
    throw new Error("La latitud no es válida.");
  }

  if (
    !Number.isFinite(longitud) ||
    longitud < -180 ||
    longitud > 180
  ) {
    throw new Error("La longitud no es válida.");
  }
}

/* =========================================================
   VEHÍCULOS RÁPIDOS
========================================================= */

export const obtenerVehiculosRapidos =
  async (): Promise<VehiculoRapido[]> => {
    const response = await API.get<VehiculoRapido[]>(
      "/vehiculos/sector-rapido",
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  };

/** Busca una placa exacta con la sesión del administrador o secretaria. */
export const obtenerVehiculoRapidoPorPlaca = async (
  placa: string,
): Promise<VehiculoRapido> => {
  const placaNormalizada = placa.trim().toUpperCase();
  if (!placaNormalizada) {
    throw new Error("Ingresa la placa del vehículo.");
  }

  const response = await API.get<VehiculoRapido>(
    `/vehiculos/placa/${encodeURIComponent(placaNormalizada)}`,
  );
  if (
    response.data.tipo !== "NOAH" &&
    response.data.tipo !== "HIACE"
  ) {
    throw new Error("La placa no corresponde a un Noah o Hiace.");
  }
  return response.data;
};

/* =========================================================
   FILA DE SALIDA
========================================================= */

export const crearFilaSalida = async (
  datos: CrearFilaSalidaDatos,
) => {
  if (
    !Array.isArray(datos.vehiculoIds) ||
    datos.vehiculoIds.length === 0
  ) {
    throw new Error(
      "Debes seleccionar al menos un vehículo.",
    );
  }

  const response = await API.post(
    "/salidas-rapidas/fila",
    datos,
  );

  return response.data;
};

export const agregarVehiculoFila = async (
  datos: AgregarVehiculoFilaDatos,
) => {
  const response = await API.post(
    "/salidas-rapidas/fila/vehiculos",
    datos,
  );

  return response.data;
};

export const obtenerFilaSalida = async (
  rutaId: string,
  fecha: string,
): Promise<TurnoSalidaRapida[]> => {
  if (!rutaId || !fecha) {
    return [];
  }

  const response = await API.get<TurnoSalidaRapida[]>(
    "/salidas-rapidas/fila",
    {
      params: {
        rutaId,
        fecha,
      },
    },
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
};

export const obtenerSalidaRapidaActual = async (
  rutaId: string,
  fecha: string,
): Promise<SalidaRapidaActual> => {
  const response = await API.get<SalidaRapidaActual>(
    "/salidas-rapidas/actual",
    {
      params: {
        rutaId,
        fecha,
      },
    },
  );

  return response.data;
};

export const autorizarSalidaRapida = async (
  turnoId: string,
  administradorId: string,
) => {
  const response = await API.patch(
    `/salidas-rapidas/turnos/${turnoId}/autorizar-salida`,
    {
      administradorId,
    },
  );

  return response.data;
};

/* =========================================================
   AVISOS ADMINISTRATIVOS
========================================================= */

export const publicarAvisoSalida = async (
  datos: PublicarAvisoSalidaDatos,
): Promise<{
  mensaje: string;
  aviso: AvisoSalidaRapida;
}> => {
  if (
    datos.tipoServicio === "SERVICIO_PARCIAL" &&
    !datos.puntoLlegadaTemporal?.trim()
  ) {
    throw new Error(
      "Debes indicar hasta qué punto llegará el vehículo.",
    );
  }

  const payload: PublicarAvisoSalidaDatos = {
    ...datos,

    permiteCompra:
      datos.tipoServicio !== "SUSPENSION_TOTAL",

    puntoLlegadaTemporal:
      datos.tipoServicio === "SERVICIO_PARCIAL"
        ? datos.puntoLlegadaTemporal?.trim()
        : undefined,
  };

  const response = await API.post<{
    mensaje: string;
    aviso: AvisoSalidaRapida;
  }>(
    "/salidas-rapidas/avisos",
    payload,
  );

  return response.data;
};

export const obtenerAvisoSalidaActivo = async (
  rutaId: string,
  fecha: string,
): Promise<AvisoSalidaRapida | null> => {
  if (!rutaId || !fecha) {
    return null;
  }

  const response =
    await API.get<AvisoSalidaRapida | null>(
      "/salidas-rapidas/avisos/activo",
      {
        params: {
          rutaId,
          fecha,
        },
      },
    );

  return response.data ?? null;
};

export const retirarAvisoSalida = async (
  avisoId: string,
  administradorId: string,
): Promise<{
  mensaje: string;
  aviso: AvisoSalidaRapida;
}> => {
  const response = await API.patch<{
    mensaje: string;
    aviso: AvisoSalidaRapida;
  }>(
    `/salidas-rapidas/avisos/${avisoId}/retirar`,
    {
      administradorId,
    },
  );

  return response.data;
};

/* =========================================================
   RECOJOS: FUNCIONES EXISTENTES
========================================================= */

export const solicitarRecojo = async (
  datos: SolicitarRecojoDatos,
): Promise<RespuestaSolicitudRecojo> => {
  exigirIdentificador(datos.usuarioId, "usuario");
  exigirIdentificador(datos.viajeId, "viaje");

  const referencia = datos.referencia.trim();
  const telefono = datos.telefono.trim();
  const observacion = datos.observacion?.trim();

  if (referencia.length < 5 || referencia.length > 250) {
    throw new Error(
      "La referencia debe contener entre 5 y 250 caracteres.",
    );
  }

  if (telefono.length < 7 || telefono.length > 20) {
    throw new Error(
      "El teléfono debe contener entre 7 y 20 caracteres.",
    );
  }

  if (observacion && observacion.length > 300) {
    throw new Error(
      "La observación no debe superar los 300 caracteres.",
    );
  }

  const tieneLatitud = datos.latitud !== undefined;
  const tieneLongitud = datos.longitud !== undefined;

  if (tieneLatitud !== tieneLongitud) {
    throw new Error(
      "Debes enviar la latitud y la longitud juntas.",
    );
  }

  if (
    datos.latitud !== undefined &&
    datos.longitud !== undefined
  ) {
    validarCoordenadas(datos.latitud, datos.longitud);
  }

  const response = await API.post<RespuestaSolicitudRecojo>(
    "/salidas-rapidas/recojos",
    {
      ...datos,
      usuarioId: datos.usuarioId.trim(),
      viajeId: datos.viajeId.trim(),
      referencia,
      telefono,
      observacion: observacion || undefined,
    },
  );

  return response.data;
};

/**
 * Consulta el recojo propio del pasajero autenticado para el viaje.
 * El backend obtiene el usuario desde el token JWT.
 * Si aún no existe ninguna solicitud, devuelve null.
 *
 * Requiere: GET /salidas-rapidas/recojos/mio/:viajeId
 */
export type MiSolicitudRecojo = Omit<SolicitudRecojo, "usuario">;

export const obtenerMiRecojo = async (
  viajeId: string,
): Promise<MiSolicitudRecojo | null> => {
  const id = exigirIdentificador(viajeId, "viaje");

  const response = await API.get<MiSolicitudRecojo | null>(
    `/salidas-rapidas/recojos/mio/${id}`,
  );

  return response.data ?? null;
};

/**
 * Edita el recojo propio sin crear una segunda solicitud.
 * Requiere PATCH /salidas-rapidas/recojos/mio/:solicitudId
 * El backend comprueba el propietario mediante JWT y el estado PENDIENTE.
 */
export const actualizarMiRecojo = async (
  solicitudId: string,
  datos: ActualizarMiRecojoDatos,
): Promise<RespuestaActualizarMiRecojo> => {
  const id = exigirIdentificador(solicitudId, "solicitud de recojo");

  const payload: ActualizarMiRecojoDatos = {};

  if (datos.referencia !== undefined) {
    const referencia = datos.referencia.trim();
    if (referencia.length < 5 || referencia.length > 250) {
      throw new Error("La referencia debe tener entre 5 y 250 caracteres.");
    }
    payload.referencia = referencia;
  }

  if (datos.telefono !== undefined) {
    const telefono = datos.telefono.trim();
    if (telefono.length < 7 || telefono.length > 20) {
      throw new Error("El teléfono debe tener entre 7 y 20 caracteres.");
    }
    if (!/^[0-9+\s()-]+$/.test(telefono)) {
      throw new Error("El teléfono contiene caracteres no permitidos.");
    }
    payload.telefono = telefono;
  }

  if (datos.observacion !== undefined) {
    const observacion = datos.observacion.trim();
    if (observacion.length > 300) {
      throw new Error("La observación no puede superar los 300 caracteres.");
    }
    payload.observacion = observacion;
  }

  const tieneLatitud = datos.latitud !== undefined;
  const tieneLongitud = datos.longitud !== undefined;

  if (tieneLatitud !== tieneLongitud) {
    throw new Error("Debes enviar ambas coordenadas GPS o ninguna.");
  }

  if (tieneLatitud && tieneLongitud) {
    if ((datos.latitud === null) !== (datos.longitud === null)) {
      throw new Error("Para quitar el GPS, ambas coordenadas deben ser null.");
    }
    if (datos.latitud !== null && datos.longitud !== null) {
      validarCoordenadas(datos.latitud!, datos.longitud!);
    }
    payload.latitud = datos.latitud;
    payload.longitud = datos.longitud;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No has indicado ningún cambio para guardar.");
  }

  const response = await API.patch<RespuestaActualizarMiRecojo>(
    `/salidas-rapidas/recojos/mio/${id}`,
    payload,
  );

  return response.data;
};

export const obtenerRecojosPorViaje = async (
  viajeId: string,
): Promise<SolicitudRecojo[]> => {
  const id = exigirIdentificador(viajeId, "viaje");

  const response = await API.get<SolicitudRecojo[]>(
    `/salidas-rapidas/recojos/viaje/${id}`,
  );

  if (!Array.isArray(response.data)) {
    throw new Error(
      "El servidor no devolvió una lista válida de recojos.",
    );
  }

  return response.data;
};

/**
 * Se mantiene para los componentes que usan el endpoint
 * anterior y envían administradorId.
 *
 * El backend debe validar permisos mediante el JWT;
 * administradorId no debe utilizarse como autorización.
 */
export const actualizarEstadoRecojo = async (
  solicitudId: string,
  datos: ActualizarEstadoRecojoDatos,
): Promise<RespuestaMensajeRecojo> => {
  const id = exigirIdentificador(
    solicitudId,
    "solicitud de recojo",
  );

  if (datos.estado === "PENDIENTE") {
    throw new Error(
      "No se puede devolver un recojo al estado PENDIENTE.",
    );
  }

  const response = await API.patch<RespuestaMensajeRecojo>(
    `/salidas-rapidas/recojos/${id}/estado`,
    datos,
  );

  return response.data;
};

/* =========================================================
   NUEVO FLUJO AUTENTICADO DE RECOJOS

   Requiere implementar los endpoints /recojos en backend.

   El servidor obtiene la identidad desde el JWT:
   - Administración: solicitudes que puede gestionar.
   - Chofer: únicamente viajes asignados a su cuenta.
   - Pasajero: únicamente sus propias solicitudes.

   No se envía un choferId para elegir qué datos consultar.
========================================================= */

export const obtenerSolicitudesRecojo =
  async (): Promise<SolicitudRecojo[]> => {
    const response = await API.get<SolicitudRecojo[]>(
      "/recojos",
    );

    if (!Array.isArray(response.data)) {
      throw new Error(
        "El servidor no devolvió una lista válida de recojos.",
      );
    }

    return response.data;
  };

/**
 * Lista los choferes activos disponibles para asignación.
 * Solo debe estar autorizada para administración.
 */
export const obtenerChoferesParaRecojo =
  async (): Promise<ChoferRecojo[]> => {
    const response = await API.get<ChoferRecojo[]>(
      "/recojos/choferes",
    );

    if (!Array.isArray(response.data)) {
      throw new Error(
        "El servidor no devolvió una lista válida de choferes.",
      );
    }

    return response.data;
  };

/**
 * Asigna el chofer al viaje completo.
 * Todos los recojos de ese viaje quedan bajo esa asignación.
 */
export const asignarChoferAlViajeRecojo = async (
  viajeId: string,
  choferId: string,
): Promise<RespuestaMensajeRecojo> => {
  const id = exigirIdentificador(viajeId, "viaje");

  exigirIdentificador(choferId, "chofer");

  const response = await API.patch<RespuestaMensajeRecojo>(
    `/recojos/viajes/${id}/chofer`,
    {
      choferId: choferId.trim(),
    },
  );

  return response.data;
};

/**
 * Nuevo cambio de estado.
 * La identidad del actor se obtiene del JWT en el backend.
 */
export const cambiarEstadoSolicitudRecojo = async (
  solicitudId: string,
  estado: EstadoActualizableRecojo,
): Promise<RespuestaMensajeRecojo> => {
  const id = exigirIdentificador(
    solicitudId,
    "solicitud de recojo",
  );

  const response = await API.patch<RespuestaMensajeRecojo>(
    `/recojos/${id}/estado`,
    {
      estado,
    },
  );

  return response.data;
};

/**
 * Publica una posición o detiene el seguimiento.
 *
 * Esta función no activa el GPS por sí sola:
 * el componente del pasajero debe solicitar permiso,
 * obtener la posición y llamar a esta función.
 */
export const actualizarUbicacionRecojo = async (
  solicitudId: string,
  datos: ActualizarUbicacionRecojoDatos,
): Promise<RespuestaMensajeRecojo> => {
  const id = exigirIdentificador(
    solicitudId,
    "solicitud de recojo",
  );

  if (datos.compartiendo) {
    validarCoordenadas(datos.latitud, datos.longitud);

    if (
      datos.precision !== undefined &&
      (
        !Number.isFinite(datos.precision) ||
        datos.precision < 0 ||
        datos.precision > 100000
      )
    ) {
      throw new Error(
        "La precisión de la ubicación no es válida.",
      );
    }
  }

  const response = await API.patch<RespuestaMensajeRecojo>(
    `/recojos/${id}/ubicacion`,
    datos,
  );

  return response.data;
};

export const detenerUbicacionRecojo = async (
  solicitudId: string,
): Promise<RespuestaMensajeRecojo> => {
  return actualizarUbicacionRecojo(solicitudId, {
    compartiendo: false,
  });
};

/* =========================================================
   ENLACE AL MAPA

   Devuelve null si no existen coordenadas válidas.
   No transforma una referencia escrita en una ubicación GPS.
========================================================= */

export const obtenerEnlaceMapaRecojo = (
  solicitud: Pick<SolicitudRecojo, "latitud" | "longitud">,
  modo: "VER" | "RUTA" = "VER",
): string | null => {
  const { latitud, longitud } = solicitud;

  if (
    latitud === null ||
    longitud === null ||
    latitud === undefined ||
    longitud === undefined ||
    String(latitud).trim() === "" ||
    String(longitud).trim() === ""
  ) {
    return null;
  }

  const lat = Number(latitud);
  const lng = Number(longitud);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  const punto = encodeURIComponent(`${lat},${lng}`);

  if (modo === "RUTA") {
    return (
      "https://www.google.com/maps/dir/" +
      `?api=1&destination=${punto}&travelmode=driving`
    );
  }

  return (
    "https://www.google.com/maps/search/" +
    `?api=1&query=${punto}`
  );
};

/* =========================================================
   MENSAJES DE ERROR

   Compatible con errores normalizados por api.ts
   y respuestas de Axios.
========================================================= */

export const obtenerMensajeErrorRecojo = (
  error: unknown,
): string => {
  if (typeof error === "object" && error !== null) {
    const datos = error as {
      mensaje?: unknown;
      response?: {
        data?: {
          message?: unknown;
          mensaje?: unknown;
        };
      };
    };

    if (
      typeof datos.mensaje === "string" &&
      datos.mensaje.trim()
    ) {
      return datos.mensaje;
    }

    const respuesta = datos.response?.data;

    if (Array.isArray(respuesta?.message)) {
      const mensajes = respuesta.message.filter(
        (valor): valor is string =>
          typeof valor === "string",
      );

      if (mensajes.length > 0) {
        return mensajes.join(". ");
      }
    }

    if (typeof respuesta?.message === "string") {
      return respuesta.message;
    }

    if (typeof respuesta?.mensaje === "string") {
      return respuesta.mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la operación de recojo.";
};

/* =========================================================
   RECOJOS DEL CHOFER ASIGNADO AL TURNO
   Identidad del chofer obtenida del JWT, sin choferId en URL.
========================================================= */

export interface TurnoRecojoChofer {
  id: string;
  estado: string;
  fecha: string;
  posicion: number;
  viaje: {
    id: string;
    fecha: string;
    horaSalida: string;
    ruta: { origen: string; destino: string };
    vehiculo: { placa: string; tipo: string };
  };
}

export const obtenerMisTurnosRecojoChofer = async (): Promise<TurnoRecojoChofer[]> => {
  const respuesta = await API.get<TurnoRecojoChofer[]>(
    "/salidas-rapidas/recojos/chofer/mis-turnos",
  );
  if (!Array.isArray(respuesta.data)) {
    throw new Error("El servidor no devolvió una lista válida de turnos.");
  }
  return respuesta.data;
};

export const obtenerMisRecojosChofer = async (
  viajeId: string,
): Promise<SolicitudRecojo[]> => {
  const id = exigirIdentificador(viajeId, "viaje");
  const respuesta = await API.get<SolicitudRecojo[]>(
    `/salidas-rapidas/recojos/chofer/viaje/${id}`,
  );
  if (!Array.isArray(respuesta.data)) {
    throw new Error("El servidor no devolvió una lista válida de recojos.");
  }
  return respuesta.data;
};

export const marcarResultadoRecojoChofer = async (
  solicitudId: string,
  estado: "RECOGIDO" | "NO_ENCONTRADO",
): Promise<{ mensaje: string }> => {
  const id = exigirIdentificador(solicitudId, "solicitud de recojo");
  const respuesta = await API.patch<{ mensaje: string }>(
    `/salidas-rapidas/recojos/chofer/${id}/estado`,
    { estado },
  );
  return respuesta.data;
};