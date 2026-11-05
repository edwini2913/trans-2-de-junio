import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  DatosComprobantePago,
  EstadoPagoPasajero,
  TicketPagoAprobado,
} from "../../components/compra/PagoQR";

import {
  obtenerPagoPorId,
  registrarComprobantePago,
} from "../../services/pagos.service";

import {
  generarTicketPorReserva,
  obtenerTicketPorReserva,
  type TicketRespuesta,
} from "../../services/tickets.service";

const CLAVE_PAGO_PENDIENTE =
  "trans2junio_pago_pendiente";

interface PagoPendienteGuardado {
  pagoId: string;
  usuarioId: string;
  referencia: string;
  contexto?: {
    viaje: ViajePagoCompra | null;
    fecha: string;
    asientos: AsientoPagoCompra[];
    total: number;
  };
}

function leerPagoPendiente(
  usuarioId?: string,
): PagoPendienteGuardado | null {
  if (!usuarioId) {
    return null;
  }

  try {
    const contenido = localStorage.getItem(
      CLAVE_PAGO_PENDIENTE,
    );

    if (!contenido) {
      return null;
    }

    const pago = JSON.parse(
      contenido,
    ) as Partial<PagoPendienteGuardado>;

    if (
      !pago.pagoId ||
      pago.usuarioId !== usuarioId
    ) {
      return null;
    }

    return {
      pagoId: pago.pagoId,
      usuarioId: pago.usuarioId,
      referencia: pago.referencia ?? "",
      contexto: pago.contexto,
    };
  } catch {
    localStorage.removeItem(
      CLAVE_PAGO_PENDIENTE,
    );
    return null;
  }
}

export type UsuarioPagoCompra = {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
};

export type AsientoPagoCompra = {
  id: string;
  numero: number | string;
  estado: string;
};

export type ViajePagoCompra = {
  id: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;

  ruta?: {
    id?: string;
    origen?: string;
    destino?: string;
  };

  vehiculo?: {
    id?: string;
    marca?: string;
    modelo?: string;
    placa?: string;
    capacidad?: number;
    tipo?: string;
  };
};

interface ConstruirTicketParametros {
  ticketBackend: TicketRespuesta;
  viaje: ViajePagoCompra | null;
  fecha: string;
  asientos: AsientoPagoCompra[];
  total: number;
}

interface UsePagoCompraOpciones {
  usuario: UsuarioPagoCompra;

  viaje: ViajePagoCompra | null;

  fecha: string;

  asientosSeleccionados: AsientoPagoCompra[];

  total: number;

  bloqueadoExterno?: boolean;

  construirTicket: (
    parametros: ConstruirTicketParametros,
  ) => TicketPagoAprobado;

  onMensaje?: (
    texto: string,
    exito?: boolean,
  ) => void;

  onCambiarPaso?: (
    paso: number,
  ) => void;

  onBloquearAsientos?: (
    ids: string[],
  ) => void;

  onRecargarAsientos?: (
    viajeId?: string,
  ) => Promise<AsientoPagoCompra[]>;

  onSeleccionInvalida?: (
    asientosDisponibles: AsientoPagoCompra[],
  ) => void;
}

function usePagoCompra({
  usuario,
  viaje,
  fecha,
  asientosSeleccionados,
  total,
  bloqueadoExterno = false,
  construirTicket,
  onMensaje,
  onCambiarPaso,
  onBloquearAsientos,
  onRecargarAsientos,
  onSeleccionInvalida,
}: UsePagoCompraOpciones) {
  const pagoGuardado =
    leerPagoPendiente(usuario.id);

  const [
    mostrarQR,
    setMostrarQR,
  ] = useState(
    Boolean(pagoGuardado),
  );

  const [
    confirmando,
    setConfirmando,
  ] = useState(false);

  const [
    compraConfirmada,
    setCompraConfirmada,
  ] = useState(false);

  const [
    pagoEnRevision,
    setPagoEnRevision,
  ] = useState(
    Boolean(pagoGuardado),
  );

  const [
    pagoId,
    setPagoId,
  ] = useState(
    pagoGuardado?.pagoId ?? "",
  );

  const [
    estadoPago,
    setEstadoPago,
  ] =
    useState<EstadoPagoPasajero | null>(
      null,
    );

  const [
    motivoRechazo,
    setMotivoRechazo,
  ] = useState("");

  const [
    referenciaPago,
    setReferenciaPago,
  ] = useState(
    pagoGuardado?.referencia ?? "",
  );

  const [
    ticketAprobado,
    setTicketAprobado,
  ] =
    useState<TicketPagoAprobado | null>(
      null,
    );

  const cantidadAsientos =
    asientosSeleccionados.length;

  // Mantener la versión más reciente de los datos y callbacks sin
  // reiniciar la consulta periódica en cada renderizado de React.
  const contextoActualRef = useRef({
    viaje, fecha, asientosSeleccionados, total,
    construirTicket, onCambiarPaso, onRecargarAsientos, onMensaje,
  });
  contextoActualRef.current = {
    viaje, fecha, asientosSeleccionados, total,
    construirTicket, onCambiarPaso, onRecargarAsientos, onMensaje,
  };

  // El estado del pago puede sobrevivir a una recarga de la página.
  // Guardar también los datos mínimos para representar el ticket.
  const contextoPendienteRef = useRef(
    pagoGuardado?.contexto ?? null,
  );


  const mostrarMensaje = useCallback(
    (
      texto = "",
      exito = false,
    ) => {
      onMensaje?.(texto, exito);
    },
    [onMensaje],
  );

  const limpiarPago = useCallback(
    () => {
      localStorage.removeItem(
        CLAVE_PAGO_PENDIENTE,
      );
      contextoPendienteRef.current = null;

      setMostrarQR(false);
      setConfirmando(false);
      setCompraConfirmada(false);
      setPagoEnRevision(false);
      setPagoId("");
      setEstadoPago(null);
      setMotivoRechazo("");
      setReferenciaPago("");
      setTicketAprobado(null);
    },
    [],
  );

  const pagarPorQR = useCallback(
    () => {
      if (!cantidadAsientos) {
        mostrarMensaje(
          "Selecciona al menos un asiento.",
        );

        return;
      }

      if (
        compraConfirmada ||
        pagoEnRevision ||
        bloqueadoExterno
      ) {
        return;
      }

      setMostrarQR(true);
      mostrarMensaje();
    },
    [
      bloqueadoExterno,
      cantidadAsientos,
      compraConfirmada,
      mostrarMensaje,
      pagoEnRevision,
    ],
  );

  const reintentarPago = useCallback(
    () => {
      // No permitir que el seguimiento anterior reaparezca al recargar.
      localStorage.removeItem(CLAVE_PAGO_PENDIENTE);
      contextoPendienteRef.current = null;
      setPagoId("");
      setEstadoPago(null);
      setMotivoRechazo("");
      setReferenciaPago("");
      setTicketAprobado(null);
      setCompraConfirmada(false);
      setPagoEnRevision(false);
      setMostrarQR(true);

      mostrarMensaje();
    },
    [mostrarMensaje],
  );

  const actualizarAsientosDespuesDeError =
    useCallback(
      async (
        viajeId: string,
      ) => {
        if (!onRecargarAsientos) {
          return;
        }

        try {
          const listaActualizada =
            await onRecargarAsientos(
              viajeId,
            );

          const seleccionDisponible =
            asientosSeleccionados.filter(
              (seleccionado) =>
                listaActualizada.some(
                  (asiento) =>
                    asiento.id ===
                      seleccionado.id &&
                    normalizarEstado(
                      asiento.estado,
                    ) ===
                      "DISPONIBLE",
                ),
            );

          if (
            seleccionDisponible.length ===
            cantidadAsientos
          ) {
            return;
          }

          setMostrarQR(false);

          onCambiarPaso?.(3);

          onSeleccionInvalida?.(
            seleccionDisponible,
          );

          mostrarMensaje(
            "Uno o más asientos fueron ocupados por otra compra. Revisa tu selección.",
          );
        } catch {
          /*
           * Conserva el mensaje del error
           * principal del comprobante.
           */
        }
      },
      [
        asientosSeleccionados,
        cantidadAsientos,
        mostrarMensaje,
        onCambiarPaso,
        onRecargarAsientos,
        onSeleccionInvalida,
      ],
    );

  const enviarComprobante = useCallback(
    async (
      datos: DatosComprobantePago,
    ) => {
      if (
        confirmando ||
        compraConfirmada ||
        pagoEnRevision ||
        bloqueadoExterno
      ) {
        return;
      }

      const validacion =
        (!usuario.id &&
          "No se encontró el usuario conectado. Inicia sesión nuevamente.") ||
        (!viaje?.id &&
          "Selecciona un horario y un vehículo.") ||
        (!cantidadAsientos &&
          "Selecciona al menos un asiento disponible.") ||
        (!mostrarQR &&
          "Primero debes generar el pago por QR.");

      if (validacion) {
        mostrarMensaje(validacion);
        return;
      }

      const usuarioId = usuario.id;
      const viajeId = viaje?.id;

      if (!usuarioId || !viajeId) {
        mostrarMensaje(
          "No se encontró el usuario o el viaje seleccionado.",
        );

        return;
      }

      setConfirmando(true);
      mostrarMensaje();

      const asientoIds =
        asientosSeleccionados.map(
          ({ id }) => id,
        );

      try {
        const respuesta =
          await registrarComprobantePago({
            usuarioId,
            viajeId,
            asientoIds,
            referencia:
              datos.referencia,
            monto: total,
            comprobante:
              datos.comprobante,
          });

        onBloquearAsientos?.(
          asientoIds,
        );

        setPagoId(
          respuesta.pago.id,
        );

        setEstadoPago(
          respuesta.pago.estado,
        );

        setReferenciaPago(
          respuesta.pago.referencia ||
            datos.referencia,
        );

        setMotivoRechazo("");
        setTicketAprobado(null);
        setCompraConfirmada(false);
        setPagoEnRevision(true);

        const contexto = {
          viaje,
          fecha,
          asientos: [...asientosSeleccionados],
          total,
        };
        contextoPendienteRef.current = contexto;

        localStorage.setItem(
          CLAVE_PAGO_PENDIENTE,
          JSON.stringify({
            pagoId:
              respuesta.pago.id,
            usuarioId,
            referencia:
              respuesta.pago.referencia ||
              datos.referencia,
            contexto,
          } satisfies PagoPendienteGuardado),
        );

        onCambiarPaso?.(4);

        const nombreAsientos =
          cantidadAsientos === 1
            ? "asiento"
            : "asientos";

        mostrarMensaje(
          respuesta.mensaje ||
            `Comprobante enviado correctamente para ${cantidadAsientos} ${nombreAsientos}. La administradora revisará el pago antes de generar el ticket.`,
          true,
        );
      } catch (error: unknown) {
        const mensajeError =
          obtenerMensajeError(
            error,
            "No se pudo registrar el comprobante. Verifica la información e inténtalo nuevamente.",
          );

        mostrarMensaje(
          mensajeError,
        );

        await actualizarAsientosDespuesDeError(
          viajeId,
        );

        /*
         * PagoQR debe recibir el error para
         * no mostrar falsamente que el
         * comprobante fue enviado.
         */
        throw error;
      } finally {
        setConfirmando(false);
      }
    },
    [
      actualizarAsientosDespuesDeError,
      asientosSeleccionados,
      bloqueadoExterno,
      cantidadAsientos,
      compraConfirmada,
      confirmando,
      mostrarMensaje,
      mostrarQR,
      onBloquearAsientos,
      onCambiarPaso,
      pagoEnRevision,
      total,
      usuario.id,
      viaje?.id,
    ],
  );

  /**
   * Comprueba el estado del pago cada cinco segundos sin interrumpir
   * el seguimiento durante actualizaciones visuales de React.
   * Un pago APROBADO no significa que el ticket ya esté disponible:
   * se confirma la compra solamente al obtener el ticket real.
   */
  useEffect(() => {
    if (!pagoId || !pagoEnRevision) return;

    let activo = true;
    let consultando = false;
    let ultimoError = "";

    const consultar = async () => {
      if (consultando || !activo) return;
      consultando = true;

      try {
        const respuestaPago = await obtenerPagoPorId(pagoId);
        if (!activo) return;

        setEstadoPago(respuestaPago.estado);
        setReferenciaPago((anterior) => respuestaPago.referencia || anterior);

        if (respuestaPago.estado === "APROBADO") {
          const reservaId = respuestaPago.reserva?.id;
          if (!reservaId) {
            throw new Error(
              "Tu pago está aprobado, pero todavía no aparece la reserva asociada. Estamos esperando el ticket.",
            );
          }

          let ticketBackend: TicketRespuesta;
          try {
            ticketBackend = await obtenerTicketPorReserva(reservaId);
          } catch {
            // Conservamos el endpoint existente por compatibilidad.
            // La autorización para generar tickets debe verificarse
            // en el backend; un pasajero no debe poder falsificar pagos.
            ticketBackend = await generarTicketPorReserva(reservaId);
          }
          if (!activo) return;

          const actual = contextoActualRef.current;
          const guardado = contextoPendienteRef.current;
          const datos = guardado ?? {
            viaje: actual.viaje,
            fecha: actual.fecha,
            asientos: actual.asientosSeleccionados,
            total: actual.total,
          };

          const ticket = actual.construirTicket({
            ticketBackend,
            viaje: datos.viaje,
            fecha: datos.fecha,
            asientos: datos.asientos,
            total: datos.total,
          });

          if (!activo) return;
          setTicketAprobado(ticket);
          setCompraConfirmada(true);
          setPagoEnRevision(false);
          setMostrarQR(true);
          actual.onCambiarPaso?.(5);
          contextoPendienteRef.current = null;
          try {
            localStorage.setItem("ultimoTicket", JSON.stringify(ticket));
            localStorage.removeItem(CLAVE_PAGO_PENDIENTE);
          } catch {
            // El ticket ya existe en memoria y puede descargarse.
          }
          actual.onMensaje?.("¡Pago aprobado! Tu ticket ya está disponible.", true);
          return;
        }

        if (respuestaPago.estado === "RECHAZADO") {
          setMotivoRechazo(
            respuestaPago.observacionAdministrador?.trim() ||
              "El comprobante no pudo ser validado. Revisa la referencia y vuelve a enviarlo.",
          );
          setCompraConfirmada(false);
          setPagoEnRevision(false);
          contextoPendienteRef.current = null;
          localStorage.removeItem(CLAVE_PAGO_PENDIENTE);
          const actual = contextoActualRef.current;
          actual.onCambiarPaso?.(4);
          actual.onMensaje?.("El comprobante fue rechazado. Revisa el motivo indicado.");
          if (actual.viaje?.id && actual.onRecargarAsientos) {
            await actual.onRecargarAsientos(actual.viaje.id);
          }
          return;
        }
        ultimoError = "";
      } catch (error: unknown) {
        // No inventar una compra exitosa ni detener el seguimiento.
        if (activo) {
          const mensaje = error instanceof Error
            ? error.message
            : "No se pudo comprobar el ticket. Se volverá a consultar.";
          if (mensaje !== ultimoError) {
            contextoActualRef.current.onMensaje?.(
              `Seguimiento de pago: ${mensaje}`,
              false,
            );
            ultimoError = mensaje;
          }
        }
      } finally {
        consultando = false;
      }
    };

    void consultar();
    const intervalo = window.setInterval(() => void consultar(), 5000);
    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, [pagoId, pagoEnRevision]);

  const bloqueadoPago =
    confirmando ||
    compraConfirmada ||
    pagoEnRevision;

  return {
    mostrarQR,
    confirmando,
    compraConfirmada,
    pagoEnRevision,
    pagoId,
    estadoPago,
    motivoRechazo,
    referenciaPago,
    ticketAprobado,
    bloqueadoPago,

    pagarPorQR,
    enviarComprobante,
    reintentarPago,
    limpiarPago,

    setMostrarQR,
    setConfirmando,
    setCompraConfirmada,
    setPagoEnRevision,
    setPagoId,
    setEstadoPago,
    setMotivoRechazo,
    setReferenciaPago,
    setTicketAprobado,
  };
}

function normalizarEstado(
  estado?: string,
): string {
  return String(estado || "")
    .trim()
    .toUpperCase();
}

function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error
  ) {
    const mensaje = (
      error as {
        mensaje?: unknown;
      }
    ).mensaje;

    if (
      typeof mensaje === "string" &&
      mensaje.trim()
    ) {
      return mensaje;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const respuesta = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];

            mensaje?: string;
          };
        };
      }
    ).response?.data;

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
  }

  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return mensajePredeterminado;
}

export default usePagoCompra;
