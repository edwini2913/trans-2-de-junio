import API from "./auth.service";

export type MetodoPago =
  | "EFECTIVO"
  | "QR"
  | "TRANSFERENCIA";

export type CrearVentaOficinaDatos = {
  /*
   * Pasajero registrado.
   * Es opcional para ventas a personas
   * que no tienen una cuenta.
   */
  usuarioId?: string;

  /*
   * Administrador o secretaria que
   * bloquea y confirma los asientos.
   */
  operadorId?: string;

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
  if (!datos.operadorId) {
    throw new Error(
      "No se encontró al administrador o secretaria que realiza la venta."
    );
  }

  if (
    !Array.isArray(datos.asientoIds) ||
    datos.asientoIds.length === 0
  ) {
    throw new Error(
      "Debes seleccionar al menos un asiento."
    );
  }

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