import API from "./auth.service";

export const obtenerRutas = async () => {
  const response = await API.get("/rutas");
  return response.data;
};