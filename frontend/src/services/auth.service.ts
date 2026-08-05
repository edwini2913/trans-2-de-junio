import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
});

export const login = async (email: string, password: string) => {
  const response = await API.post("/auth/login", { email, password });
  return response.data;
};

export const register = async (usuario: {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email: string;
  password: string;
}) => {
  const response = await API.post("/auth/register", usuario);
  return response.data;
};

export default API;