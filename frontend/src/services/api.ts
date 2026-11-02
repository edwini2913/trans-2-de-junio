
import axios, {
  AxiosError,
  type AxiosRequestConfig,
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

const BASE_URL = API_URL.replace(/\/+$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

/* =========================================
   TIPOS DE ERRORES
========================================= */

export interface ErrorApi {
  mensaje: string;
  estado?: number;
  codigo?: string;
  sinConexion: boolean;
  tiempoAgotado: boolean;
  errorOriginal?: unknown;
}

/* =========================================
   TOKEN JWT
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
    // Almacenamiento no disponible.
  }
}

/* =========================================
   RUTAS DE AUTENTICACIÓN
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
   RESPUESTA DE ERRORES DEL SERVIDOR
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
        (valor): valor is string =>
          typeof valor === "string",
      );

      if (mensajes.length > 0) {
        return mensajes.join(". ");
      }
    }

    if (
      typeof respuesta.mensaje === "string" &&
      respuesta.mensaje.trim()
    ) {
      return respuesta.mensaje;
    }

    if (
      typeof respuesta.message === "string" &&
      respuesta.message.trim()
    ) {
      return respuesta.message;
    }
  }

  switch (error.response?.status) {
    case 400:
      return "Los datos enviados no son válidos.";

    case 401:
      return "Correo electrónico o contraseña incorrectos.";

    case 403:
      return "No tiene permisos para realizar esta acción.";

    case 404:
      return "No se encontró el recurso solicitado.";

    case 409:
      return "El registro ya existe.";

    case 422:
      return "Los datos enviados no cumplen las validaciones.";

    case 429:
      return "Demasiadas solicitudes. Intente más tarde.";

    case 500:
      return "Error interno del servidor. Contacte al administrador.";

    case 502:
    case 503:
    case 504:
      return "El servicio no está disponible temporalmente.";

    default:
      return "No se pudo completar la solicitud.";
  }
}

/* =========================================
   INTERCEPTOR DE SOLICITUDES
========================================= */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = obtenerToken();

    const url = config.url ?? "";

    if (esRutaAutenticacion(url)) {
      config.headers.delete("Authorization");
    } else if (token) {
      config.headers.set(
        "Authorization",
        `Bearer ${token}`,
      );
    } else {
      config.headers.delete("Authorization");
    }

    return config;
  },

  (error: unknown) => Promise.reject(error),
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

    const solicitudCancelada =
      error.code === "ERR_CANCELED";

    const sinRespuestaServidor =
      !error.response &&
      !tiempoAgotado &&
      !solicitudCancelada;

    const sinConexion =
      sinConexionNavegador ||
      sinRespuestaServidor;

    /* =====================================
       CONTROL DE SESIÓN JWT
    ===================================== */

    const urlSolicitud =
      error.config?.url ?? "";

    if (
      estado === 401 &&
      !esRutaAutenticacion(urlSolicitud)
    ) {
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
       MENSAJES PERSONALIZADOS
    ===================================== */

    let mensaje = obtenerMensajeServidor(error);

    if (tiempoAgotado) {
      mensaje =
        "El servidor tardó demasiado en responder. Intente nuevamente.";
    } else if (sinConexionNavegador) {
      mensaje =
        "No tiene conexión a Internet. Verifique su conexión.";
    } else if (sinRespuestaServidor) {
      mensaje =
        "No se pudo establecer comunicación con la API. Verifique la dirección del servidor, HTTPS o CORS.";
    } else if (solicitudCancelada) {
      mensaje = "La solicitud fue cancelada.";
    }

    const errorApi: ErrorApi = {
      mensaje,
      estado,
      codigo: error.code,
      sinConexion,
      tiempoAgotado,
      errorOriginal: error,
    };

    if (import.meta.env.DEV) {
      console.error("Error de API:", {
        ruta: error.config?.url,
        estado,
        codigo: error.code,
        mensaje,
      });
    }

    return Promise.reject(errorApi);
  },
);

/* =========================================
   MÉTODOS AUXILIARES
========================================= */

export function obtenerUrlApi(): string {
  return BASE_URL;
}

export async function verificarConexionApi(
  ruta: string,
): Promise<boolean> {
  try {
    const configuracion: AxiosRequestConfig = {
      timeout: 10000,
    };

    // Debe utilizarse una ruta GET pública
    // que exista realmente en el backend.
    await api.get(ruta, configuracion);

    return true;
  } catch {
    return false;
  }
}

/* =========================================
   EXPORTAR API
========================================= */

export default api;
