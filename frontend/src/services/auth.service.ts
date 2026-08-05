import api from "./api";

export type LoginResponse = {
  mensaje: string;
  access_token: string;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: "ADMINISTRADOR" | "PASAJERO";
  };
};

export type RegisterData = {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email: string;
  password: string;
};

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response =
    await api.post<LoginResponse>(
      "/auth/login",
      {
        email: email.trim().toLowerCase(),
        password,
      },
    );

  return response.data;
};

export const register = async (
  usuario: RegisterData,
): Promise<LoginResponse> => {
  const response =
    await api.post<LoginResponse>(
      "/auth/register",
      {
        ...usuario,
        email:
          usuario.email
            .trim()
            .toLowerCase(),
      },
    );

  return response.data;
};

export default api;