
import api from "./api";

/* =========================================
   INTERFAZ DEL CHOFER
========================================= */

export interface Chofer {
  id: string;
  codigoUsuario: string | null;
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string | null;
  email: string;
  rol: "CHOFER";
  estado: boolean;
  puedeEscanearTickets: boolean;
}

/* =========================================
   DATOS PARA CREAR CHOFER
========================================= */

export interface CrearChoferDatos {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email: string;
  password: string;
  puedeEscanearTickets: boolean;
}

/* =========================================
   RESPUESTAS DEL BACKEND
========================================= */

export interface RespuestaCrearChofer {
  ok: boolean;
  mensaje: string;
  usuario: Chofer;
}

export interface RespuestaPermisoEscaneo {
  ok: boolean;
  mensaje: string;
  usuario: Pick<
    Chofer,
    | "id"
    | "nombre"
    | "apellido"
    | "rol"
    | "puedeEscanearTickets"
  >;
}

type UsuarioListado = Omit<Chofer, "rol"> & {
  rol: string;
};

/* =========================================
   VALIDACIONES
========================================= */

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarId(id: string): string {
  const valor = id.trim();

  if (!valor) {
    throw new Error(
      "El identificador del chofer no es válido.",
    );
  }

  return encodeURIComponent(valor);
}

/* =========================================
   OBTENER CHOFERES REGISTRADOS
========================================= */

export async function obtenerChoferes(): Promise<Chofer[]> {
  const respuesta =
    await api.get<UsuarioListado[]>("/users");

  if (!Array.isArray(respuesta.data)) {
    throw new Error(
      "El servidor no devolvió una lista válida de usuarios.",
    );
  }

  return respuesta.data.filter(
    (usuario): usuario is Chofer =>
      usuario.rol === "CHOFER",
  );
}

/* =========================================
   REGISTRAR NUEVO CHOFER
========================================= */

export async function crearChofer(
  datos: CrearChoferDatos,
): Promise<RespuestaCrearChofer> {
  const formulario: CrearChoferDatos = {
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    ci: datos.ci.trim(),
    telefono: datos.telefono.trim(),
    email: datos.email.trim().toLowerCase(),
    password: datos.password,
    puedeEscanearTickets:
      datos.puedeEscanearTickets,
  };

  if (
    !formulario.nombre ||
    !formulario.apellido ||
    !formulario.ci ||
    !formulario.telefono ||
    !formulario.email ||
    !formulario.password
  ) {
    throw new Error(
      "Complete todos los campos obligatorios.",
    );
  }

  if (!validarEmail(formulario.email)) {
    throw new Error(
      "Ingrese un correo electrónico válido.",
    );
  }

  if (formulario.password.length < 8) {
    throw new Error(
      "La contraseña debe tener al menos 8 caracteres.",
    );
  }

  const { data } =
    await api.post<RespuestaCrearChofer>(
      "/users/choferes",
      formulario,
    );

  if (
    !data ||
    data.ok !== true ||
    !data.usuario ||
    data.usuario.rol !== "CHOFER"
  ) {
    throw new Error(
      "El servidor no confirmó correctamente el registro del chofer.",
    );
  }

  return data;
}

/* =========================================
   AUTORIZAR O RETIRAR ESCANEO
========================================= */

export async function actualizarPermisoEscaneo(
  choferId: string,
  puedeEscanearTickets: boolean,
): Promise<RespuestaPermisoEscaneo> {
  const id = validarId(choferId);

  const { data } =
    await api.patch<RespuestaPermisoEscaneo>(
      `/users/${id}/permiso-escaneo`,
      {
        puedeEscanearTickets,
      },
    );

  if (
    !data ||
    data.ok !== true ||
    !data.usuario ||
    data.usuario.id !== choferId.trim() ||
    data.usuario.rol !== "CHOFER" ||
    data.usuario.puedeEscanearTickets !==
      puedeEscanearTickets
  ) {
    throw new Error(
      "El servidor no confirmó el cambio de permiso de escaneo.",
    );
  }

  return data;
}
