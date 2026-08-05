import API from "./auth.service";

export type MetodoPago =
  | "EFECTIVO"
  | "QR"
  | "TRANSFERENCIA";

export type CrearVentaOficinaDatos = {
  usuarioId?: string;

  pasajeroNombre: string;
  pasajeroCi: string;
  pasajeroTelefono: string;
  pasajeroEmail?: string;

  viajeId: string;
  asientoIds: string[];

  metodoPago: MetodoPago;
};

export const crearVentaOficina = async (
  datos: CrearVentaOficinaDatos
) => {
  const response = await API.post(
    "/ventas/oficina",
    datos
  );

  return response.data;
};

export const obtenerReporteVentas = async () => {
  const response = await API.get(
    "/ventas/reporte"
  );

  return response.data;
};