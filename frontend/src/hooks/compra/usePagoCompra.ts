import {
  useCallback,
  useEffect,
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

        localStorage.setItem(
          CLAVE_PAGO_PENDIENTE,
          JSON.stringify({
            pagoId:
              respuesta.pago.id,
            usuarioId,
            referencia:
              respuesta.pago.referencia ||
              datos.referencia,
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

  /*
   * Consulta automática del estado del
   * comprobante cada cinco segundos.
   */
  useEffect(() => {
    if (
      !pagoId ||
      !pagoEnRevision
    ) {
      return;
    }

    let componenteActivo = true;
    let consultaEnCurso = false;

    const consultarEstadoPago =
      async () => {
        if (consultaEnCurso) {
          return;
        }

        consultaEnCurso = true;

        try {
          const pago =
            await obtenerPagoPorId(
              pagoId,
            );

          if (!componenteActivo) {
            return;
          }

          setEstadoPago(
            pago.estado,
          );

          setReferenciaPago(
            (
              referenciaAnterior,
            ) =>
              pago.referencia ||
              referenciaAnterior,
          );

          if (
            pago.estado ===
            "APROBADO"
          ) {
            const reservaId =
              pago.reserva?.id;

            if (!reservaId) {
              throw new Error(
                "El pago fue aprobado, pero todavía no tiene una reserva asociada.",
              );
            }

            let ticketBackend:
              TicketRespuesta;

            try {
              ticketBackend =
                await obtenerTicketPorReserva(
                  reservaId,
                );
            } catch {
              ticketBackend =
                await generarTicketPorReserva(
                  reservaId,
                );
            }

            if (!componenteActivo) {
              return;
            }

            const ticket =
              construirTicket({
                ticketBackend,
                viaje,
                fecha,
                asientos:
                  asientosSeleccionados,
                total,
              });

            setTicketAprobado(
              ticket,
            );

            setCompraConfirmada(
              true,
            );

            setPagoEnRevision(
              false,
            );

            onCambiarPaso?.(5);

            localStorage.setItem(
              "ultimoTicket",
              JSON.stringify(ticket),
            );

            localStorage.removeItem(
              CLAVE_PAGO_PENDIENTE,
            );

            mostrarMensaje(
              "¡Pago aprobado! Tu ticket ya fue generado.",
              true,
            );

            return;
          }

          if (
            pago.estado ===
            "RECHAZADO"
          ) {
            setMotivoRechazo(
              pago.observacionAdministrador?.trim() ||
                "El comprobante no pudo ser validado. Revisa la referencia y vuelve a enviarlo.",
            );

            setCompraConfirmada(
              false,
            );

            setPagoEnRevision(
              false,
            );

            localStorage.removeItem(
              CLAVE_PAGO_PENDIENTE,
            );

            onCambiarPaso?.(4);

            mostrarMensaje(
              "El comprobante fue rechazado. Revisa el motivo indicado.",
            );

            if (
              viaje?.id &&
              onRecargarAsientos
            ) {
              await onRecargarAsientos(
                viaje.id,
              );
            }
          }
        } catch {
          /*
           * Una falla temporal de Internet
           * no cancela el seguimiento.
           * Se reintentará en el siguiente
           * intervalo.
           */
        } finally {
          consultaEnCurso = false;
        }
      };

    void consultarEstadoPago();

    const intervalo =
      window.setInterval(() => {
        void consultarEstadoPago();
      }, 5000);

    return () => {
      componenteActivo = false;

      window.clearInterval(
        intervalo,
      );
    };
  }, [
    asientosSeleccionados,
    construirTicket,
    fecha,
    mostrarMensaje,
    onCambiarPaso,
    onRecargarAsientos,
    pagoEnRevision,
    pagoId,
    total,
    viaje,
  ]);

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
