export type UsuarioLocal = {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
};

export function normalizarLista<T>(
  datos: unknown,
): T[] {
  return Array.isArray(datos)
    ? (datos as T[])
    : [];
}

export function obtenerUsuarioLocal():
  UsuarioLocal {
  try {
    const texto =
      localStorage.getItem(
        "usuario",
      );

    if (!texto) {
      return {};
    }

    const usuario: unknown =
      JSON.parse(texto);

    if (
      !usuario ||
      typeof usuario !== "object"
    ) {
      return {};
    }

    return usuario as UsuarioLocal;
  } catch {
    return {};
  }
}

export function obtenerFechaActual():
  string {
  const fecha = new Date();

  const anio =
    fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

export function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error !== "object" ||
    error === null
  ) {
    return mensajePredeterminado;
  }

  const errorHttp =
    error as {
      mensaje?: unknown;

      response?: {
        data?: {
          message?:
            | string
            | string[];

          mensaje?: string;
        };
      };

      message?: unknown;
    };

  if (
    typeof errorHttp.mensaje ===
      "string" &&
    errorHttp.mensaje.trim()
  ) {
    return errorHttp.mensaje;
  }

  const respuesta =
    errorHttp.response?.data;

  if (
    Array.isArray(
      respuesta?.message,
    )
  ) {
    return respuesta.message.join(
      ", ",
    );
  }

  if (
    typeof respuesta?.message ===
      "string" &&
    respuesta.message.trim()
  ) {
    return respuesta.message;
  }

  if (
    typeof respuesta?.mensaje ===
      "string" &&
    respuesta.mensaje.trim()
  ) {
    return respuesta.mensaje;
  }

  if (
    typeof errorHttp.message ===
      "string" &&
    errorHttp.message.trim()
  ) {
    return errorHttp.message;
  }

  return mensajePredeterminado;
}

export function normalizarEstado(
  estado?: string,
): string {
  return String(estado || "")
    .trim()
    .toUpperCase();
}

export function formatearNombrePasajero(
  usuario: UsuarioLocal,
): string {
  const nombreCompleto =
    `${usuario.nombre || ""} ${
      usuario.apellido || ""
    }`.trim();

  return nombreCompleto ||
    "Pasajero";
}