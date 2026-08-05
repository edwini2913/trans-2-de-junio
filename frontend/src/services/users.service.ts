import API from "./auth.service";

export const obtenerUsuarios = async () => {
  const response = await API.get("/users");
  return response.data;
};

export const eliminarUsuario = async (id: string) => {
  const response = await API.delete(`/users/${id}`);
  return response.data;
};