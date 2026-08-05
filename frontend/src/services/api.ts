import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const API_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export type ErrorApi = {
  mensaje: string;
  estado?: number;
  sinConexion: boolean;
  tiempoAgotado: boolean;
  errorOriginal?: unknown;
};

function obtenerToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function limpiarSesion(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

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
      return respuesta.message.join(", ");
    }

    if (
      typeof respuesta.message ===
      "string"
    ) {
      return respuesta.message;
    }

    if (
      typeof respuesta.mensaje ===
      "string"
    ) {
      return respuesta.mensaje;
    }

    if (
      typeof respuesta.error === "string"
    ) {
      return respuesta.error;
    }
  }

  return "Ocurrió un error al comunicarse con el servidor.";
}

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig,
  ) => {
    const token = obtenerToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error: AxiosError) =>
    Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    const sinConexionNavegador =
      !window.navigator.onLine;

    const sinRespuestaServidor =
      !error.response &&
      error.code !== "ECONNABORTED";

    const tiempoAgotado =
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT";

    if (
      error.response?.status === 401
    ) {
      limpiarSesion();
    }

    let mensaje =
      obtenerMensajeServidor(error);

    if (
      sinConexionNavegador ||
      sinRespuestaServidor
    ) {
      mensaje =
        "No se pudo conectar con el servidor. Verifica tu conexión a Internet.";
    }

    if (tiempoAgotado) {
      mensaje =
        "El servidor tardó demasiado en responder. Intenta nuevamente.";
    }

    const errorApi: ErrorApi = {
      mensaje,
      estado: error.response?.status,
      sinConexion:
        sinConexionNavegador ||
        sinRespuestaServidor,
      tiempoAgotado,
      errorOriginal: error,
    };

    return Promise.reject(errorApi);
  },
);

export default api;