import type {
  ReactNode,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

interface UsuarioSesion {
  id?: string;
  email?: string;
  rol?: string;
}

interface RutaProtegidaProps {
  children: ReactNode;
  rolesPermitidos: string[];
}

function obtenerUsuarioSesion():
  UsuarioSesion | null {
  const usuarioGuardado =
    localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    return null;
  }

  try {
    const usuario: unknown =
      JSON.parse(usuarioGuardado);

    if (
      !usuario ||
      typeof usuario !== "object"
    ) {
      return null;
    }

    return usuario as UsuarioSesion;
  } catch {
    return null;
  }
}

function obtenerToken():
  string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem(
      "access_token",
    )
  );
}

export default function RutaProtegida({
  children,
  rolesPermitidos,
}: RutaProtegidaProps) {
  const location =
    useLocation();

  const token = obtenerToken();

  const usuario =
    obtenerUsuarioSesion();

  if (
    !token ||
    !usuario?.id ||
    !usuario.rol
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          desde:
            location.pathname,
        }}
      />
    );
  }

  const rol =
    usuario.rol.toUpperCase();

  const tienePermiso =
    rolesPermitidos.some(
      (rolPermitido) =>
        rolPermitido.toUpperCase() ===
        rol,
    );

  if (!tienePermiso) {
    if (
      rol === "ADMINISTRADOR" ||
      rol === "SECRETARIA"
    ) {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/pasajero"
        replace
      />
    );
  }

  return <>{children}</>;
}