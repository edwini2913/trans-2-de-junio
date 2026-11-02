
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

/* =========================================
   CONFIGURACIÓN DE LA API
========================================= */

const API_URL = import.meta.env.VITE_API_URL?.trim();

if (!API_URL) {
  throw new Error(
    "Falta configurar VITE_API_URL en el frontend.",
  );
}

const api = axios.create({
  baseURL: API_URL.replace(/\/+$/, ""),
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

/* =========================================
   INTERFAZ DE ERRORES
========================================= */

export interface ErrorApi {
  mensaje: string;
  estado?: number;
  sinConexion: boolean;
  tiempoAgotado: boolean;
  errorOriginal?: unknown;
}

/* =========================================
   OBTENER TOKEN JWT
========================================= */

function obtenerToken(): string | null {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token");

    return token?.trim() || null;
  } catch {
    return null;
  }
}

/* =========================================
   LIMPIAR SESIÓN
========================================= */

export function limpiarSesion(): void {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
  } catch {
    // El navegador puede bloquear el almacenamiento.
  }
}

/* =========================================
   IDENTIFICAR RUTAS DE AUTENTICACIÓN
========================================= */

function esRutaAutenticacion(
  url: string,
): boolean {
  const ruta = url.split("?")[0];

  return (
    /\/auth\/login\/?$/.test(ruta) ||
    /\/auth\/register\/?$/.test(ruta)
  );
}

/* =========================================
   OBTENER MENSAJE DEL SERVIDOR
========================================= */

function obtenerMensajeServidor(
  error: AxiosError,
): string {
  const datos = error.response?.data;

  if (
    typeof datos === "object" &&
    datos !== null
  ) {
    const respuesta = datos as {
      message?: string | string[];
      mensaje?: string;
      error?: string;
    };

    if (Array.isArray(respuesta.message)) {
      const mensajes = respuesta.message.filter(
        (item): item is string =>
          typeof item === "string",
      );

      if (mensajes.length > 0) {
        return mensajes.join(". ");
      }
    }

    if (
      typeof respuesta.message === "string" &&
      respuesta.message.trim()
    ) {
      return respuesta.message;
    }

    if (
      typeof respuesta.mensaje === "string" &&
      respuesta.mensaje.trim()
    ) {
      return respuesta.mensaje;
    }
  }

  switch (error.response?.status) {
    case 400:
      return "Los datos enviados no son válidos.";

    case 401:
      return "Credenciales incorrectas o sesión expirada.";

    case 403:
      return "No tiene permisos para realizar esta acción.";

    case 404:
      return "El recurso solicitado no existe.";

    case 409:
      return "El registro ya existe.";

    case 422:
      return "Los datos no cumplen las validaciones requeridas.";

    case 429:
      return "Demasiadas solicitudes. Intente nuevamente más tarde.";

    case 500:
      return "Ocurrió un error interno en el servidor.";

    case 502:
    case 503:
    case 504:
      return "El servidor no está disponible temporalmente.";

    default:
      return "Ocurrió un error al comunicarse con el servidor.";
  }
}

/* =========================================
   INTERCEPTOR DE SOLICITUDES
========================================= */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = obtenerToken();

    if (token) {
      config.headers.set(
        "Authorization",
        `Bearer ${token}`,
      );
    } else {
      config.headers.delete("Authorization");
    }

    return config;
  },

  (error: unknown) => {
    return Promise.reject(error);
  },
);

/* =========================================
   INTERCEPTOR DE RESPUESTAS
========================================= */

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    const estado = error.response?.status;

    const tiempoAgotado =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT";

    const sinConexionNavegador =
      typeof navigator !== "undefined" &&
      navigator.onLine === false;

    const sinRespuestaServidor =
      !error.response &&
      !tiempoAgotado &&
      error.code !== "ERR_CANCELED";

    const sinConexion =
      sinConexionNavegador ||
      sinRespuestaServidor;

    /* =====================================
       CONTROLAR SESIÓN EXPIRADA
    ===================================== */

    const urlSolicitud =
      error.config?.url ?? "";

    const esAutenticacion =
      esRutaAutenticacion(urlSolicitud);

    if (
      estado === 401 &&
      !esAutenticacion
    ) {
      // Limpiar solamente si la solicitud
      // utilizó el token de la sesión actual.
      const autorizacion =
        error.config?.headers?.get(
          "Authorization",
        );

      const tokenActual = obtenerToken();

      if (
        tokenActual &&
        autorizacion === `Bearer ${tokenActual}`
      ) {
        limpiarSesion();
      }
    }

    /* =====================================
       MENSAJES DE ERROR
    ===================================== */

    let mensaje =
      obtenerMensajeServidor(error);

    if (tiempoAgotado) {
      mensaje =
        "El servidor tardó demasiado en responder. Intente nuevamente.";
    } else if (sinConexionNavegador) {
      mensaje =
        "No tiene conexión a Internet. Verifique su conexión.";
    } else if (sinRespuestaServidor) {
      mensaje =
        "No se pudo conectar con el servidor. Verifique la conexión o la disponibilidad del servicio.";
    }

    /* =====================================
       CONSTRUIR ERROR NORMALIZADO
    ===================================== */

    const errorApi: ErrorApi = {
      mensaje,
      estado,
      sinConexion,
      tiempoAgotado,
      errorOriginal: error,
    };

    return Promise.reject(errorApi);
  },
);

/* =========================================
   EXPORTAR INSTANCIA AXIOS
========================================= */

export default api;
