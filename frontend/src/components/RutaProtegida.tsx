
import type { ReactNode } from "react";

import {
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";

/* =========================================
   ROLES DEL SISTEMA
========================================= */

type RolUsuario =
  | "ADMINISTRADOR"
  | "SECRETARIA"
  | "CHOFER"
  | "PASAJERO";

/* =========================================
   INTERFACES
========================================= */

interface UsuarioSesion {
  id: string;
  email?: string;
  rol: RolUsuario;
}

interface RutaProtegidaProps {
  children: ReactNode;
  rolesPermitidos: string[];
}

/* =========================================
   VALIDAR ROL DEL USUARIO
========================================= */

function esRolValido(
  rol: unknown,
): rol is RolUsuario {
  return (
    rol === "ADMINISTRADOR" ||
    rol === "SECRETARIA" ||
    rol === "CHOFER" ||
    rol === "PASAJERO"
  );
}

/* =========================================
   OBTENER USUARIO DE LA SESIÓN
========================================= */

function obtenerUsuarioSesion(): UsuarioSesion | null {
  try {
    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      return null;
    }

    const datos: unknown =
      JSON.parse(usuarioGuardado);

    if (
      typeof datos !== "object" ||
      datos === null ||
      Array.isArray(datos)
    ) {
      return null;
    }

    const usuario = datos as Record<
      string,
      unknown
    >;

    const rol =
      typeof usuario.rol === "string"
        ? usuario.rol.trim().toUpperCase()
        : null;

    if (
      typeof usuario.id !== "string" ||
      !usuario.id.trim() ||
      !esRolValido(rol)
    ) {
      return null;
    }

    return {
      id: usuario.id.trim(),
      email:
        typeof usuario.email === "string"
          ? usuario.email
          : undefined,
      rol,
    };
  } catch {
    return null;
  }
}

/* =========================================
   OBTENER TOKEN JWT
========================================= */

function obtenerToken(): string | null {
  try {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    return token?.trim() || null;
  } catch {
    return null;
  }
}

/* =========================================
   RUTA PRINCIPAL SEGÚN EL ROL
========================================= */

function obtenerRutaPorRol(
  rol: RolUsuario,
): string {
  switch (rol) {
    case "ADMINISTRADOR":
    case "SECRETARIA":
      return "/admin";

    case "CHOFER":
      return "/chofer/escanear-ticket";

    case "PASAJERO":
      return "/pasajero";
  }
}

/* =========================================
   PANTALLA DE ACCESO DENEGADO
========================================= */

function AccesoDenegado({
  rutaInicio,
}: {
  rutaInicio: string;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-lg">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
          ⚠️
        </div>

        <h1 className="text-2xl font-black text-red-700">
          Acceso denegado
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Su cuenta no tiene los permisos
          necesarios para acceder a esta sección.
        </p>

        <Link
          to={rutaInicio}
          replace
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
        >
          Volver a mi panel
        </Link>
      </div>
    </main>
  );
}

/* =========================================
   COMPONENTE DE RUTA PROTEGIDA
========================================= */

export default function RutaProtegida({
  children,
  rolesPermitidos,
}: RutaProtegidaProps) {
  const location = useLocation();

  const token = obtenerToken();
  const usuario = obtenerUsuarioSesion();

  /* =====================================
     1. VERIFICAR AUTENTICACIÓN
  ===================================== */

  if (!token || !usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          desde:
            location.pathname +
            location.search +
            location.hash,
        }}
      />
    );
  }

  /* =====================================
     2. VERIFICAR ROL AUTORIZADO
  ===================================== */

  const tienePermiso = rolesPermitidos.some(
    (rolPermitido) =>
      rolPermitido.trim().toUpperCase() ===
      usuario.rol,
  );

  if (tienePermiso) {
    return <>{children}</>;
  }

  /* =====================================
     3. OBTENER RUTA DEL USUARIO
  ===================================== */

  const rutaDestino =
    obtenerRutaPorRol(usuario.rol);

  /* =====================================
     4. RESTRINGIR MÓDULOS INTERNOS
        DEL PANEL ADMINISTRATIVO
  ===================================== */

  if (
    location.pathname.startsWith("/admin/") &&
    (
      usuario.rol === "SECRETARIA" ||
      usuario.rol === "ADMINISTRADOR"
    )
  ) {
    return (
      <AccesoDenegado
        rutaInicio={rutaDestino}
      />
    );
  }

  /* =====================================
     5. EVITAR BUCLES DE REDIRECCIÓN
  ===================================== */

  if (location.pathname === rutaDestino) {
    return (
      <AccesoDenegado
        rutaInicio="/"
      />
    );
  }

  /* =====================================
     6. REDIRIGIR AL PANEL CORRECTO
  ===================================== */

  return (
    <Navigate
      to={rutaDestino}
      replace
    />
  );
}
