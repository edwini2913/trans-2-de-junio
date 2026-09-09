import API from "./auth.service";

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

export interface VehiculoRapido {
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

export interface AvisoSalidaRapida {
  id: string;
  fecha: string;
  motivo: MotivoAvisoSalida;

  /**
   * SUSPENSION_TOTAL:
   * bloquea compras y reservas.
   *
   * SERVICIO_PARCIAL:
   * permite comprar después de aceptar
   * el destino temporal.
   *
   * INFORMATIVO:
   * solamente informa.
   */
  tipoServicio: TipoServicioAviso;

  permiteCompra: boolean;

  puntoLlegadaTemporal:
    | string
    | null;

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

export interface CrearFilaSalidaDatos {
  rutaId: string;
  fecha: string;
  vehiculoIds: string[];
  precio: number;
  horaInicio?: string;
  intervaloMinutos?: number;
  habilitadoPor: string;
}

export interface AgregarVehiculoFilaDatos {
  rutaId: string;
  fecha: string;
  vehiculoId: string;
  intervaloMinutos?: number;
  administradorId: string;
}

export interface PublicarAvisoSalidaDatos {
  rutaId: string;
  fecha: string;
  motivo: MotivoAvisoSalida;

  tipoServicio:
    TipoServicioAviso;

  permiteCompra: boolean;

  puntoLlegadaTemporal?:
    string;

  titulo: string;
  mensaje: string;
  publicadoPor: string;
}

export interface SolicitarRecojoDatos {
  usuarioId: string;
  viajeId: string;
  referencia: string;
  telefono: string;
  latitud?: number;
  longitud?: number;
  observacion?: string;
}

export interface ActualizarEstadoRecojoDatos {
  estado: EstadoSolicitudRecojo;
  administradorId: string;
}

/* =========================================================
   VEHÍCULOS RÁPIDOS
========================================================= */

export const obtenerVehiculosRapidos =
  async (): Promise<
    VehiculoRapido[]
  > => {
    const response = await API.get<
      VehiculoRapido[]
    >(
      "/vehiculos/sector-rapido",
    );

    return Array.isArray(
      response.data,
    )
      ? response.data
      : [];
  };

/* =========================================================
   FILA DE SALIDA
========================================================= */

export const crearFilaSalida =
  async (
    datos: CrearFilaSalidaDatos,
  ) => {
    if (
      !Array.isArray(
        datos.vehiculoIds,
      ) ||
      datos.vehiculoIds.length ===
        0
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

export const agregarVehiculoFila =
  async (
    datos: AgregarVehiculoFilaDatos,
  ) => {
    const response = await API.post(
      "/salidas-rapidas/fila/vehiculos",
      datos,
    );

    return response.data;
  };

export const obtenerFilaSalida =
  async (
    rutaId: string,
    fecha: string,
  ): Promise<
    TurnoSalidaRapida[]
  > => {
    if (!rutaId || !fecha) {
      return [];
    }

    const response = await API.get<
      TurnoSalidaRapida[]
    >(
      "/salidas-rapidas/fila",
      {
        params: {
          rutaId,
          fecha,
        },
      },
    );

    return Array.isArray(
      response.data,
    )
      ? response.data
      : [];
  };

export const obtenerSalidaRapidaActual =
  async (
    rutaId: string,
    fecha: string,
  ): Promise<
    SalidaRapidaActual
  > => {
    const response =
      await API.get<
        SalidaRapidaActual
      >(
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

export const autorizarSalidaRapida =
  async (
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

export const publicarAvisoSalida =
  async (
    datos: PublicarAvisoSalidaDatos,
  ): Promise<{
    mensaje: string;
    aviso: AvisoSalidaRapida;
  }> => {
    if (
      datos.tipoServicio ===
        "SERVICIO_PARCIAL" &&
      !datos.puntoLlegadaTemporal
        ?.trim()
    ) {
      throw new Error(
        "Debes indicar hasta qué punto llegará el vehículo.",
      );
    }

    const payload: PublicarAvisoSalidaDatos =
      {
        ...datos,

        permiteCompra:
          datos.tipoServicio !==
          "SUSPENSION_TOTAL",

        puntoLlegadaTemporal:
          datos.tipoServicio ===
          "SERVICIO_PARCIAL"
            ? datos
                .puntoLlegadaTemporal
                ?.trim()
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

export const obtenerAvisoSalidaActivo =
  async (
    rutaId: string,
    fecha: string,
  ): Promise<
    AvisoSalidaRapida | null
  > => {
    if (!rutaId || !fecha) {
      return null;
    }

    const response =
      await API.get<
        AvisoSalidaRapida | null
      >(
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

export const retirarAvisoSalida =
  async (
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
   SOLICITUDES DE RECOJO
========================================================= */

export const solicitarRecojo =
  async (
    datos: SolicitarRecojoDatos,
  ) => {
    const response = await API.post(
      "/salidas-rapidas/recojos",
      datos,
    );

    return response.data;
  };

export const obtenerRecojosPorViaje =
  async (
    viajeId: string,
  ) => {
    const response = await API.get(
      `/salidas-rapidas/recojos/viaje/${viajeId}`,
    );

    return response.data;
  };

export const actualizarEstadoRecojo =
  async (
    solicitudId: string,
    datos: ActualizarEstadoRecojoDatos,
  ) => {
    const response = await API.patch(
      `/salidas-rapidas/recojos/${solicitudId}/estado`,
      datos,
    );

    return response.data;
  };