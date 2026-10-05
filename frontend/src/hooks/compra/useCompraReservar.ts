import {
  useCallback,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import type {
  ModoOperacion,
} from "../../components/compra/ModoCompraReserva";

import {
  crearReservaPendiente,
} from "../../services/reservas.service";

import {
  formatearNombrePasajero,
  obtenerMensajeError,
  obtenerUsuarioLocal,
} from "../../utils/compra/compra.utils";

import {
  compartirTicket,
  construirTicketAprobado,
  crearImagenTicket,
  descargarArchivo,
  nombreArchivoTicket,
} from "../../utils/ticket/ticketCompra.utils";

import useCompraViaje from "./useCompraViaje";
import usePagoCompra from "./usePagoCompra";

function useCompraReservar() {
  const navigate = useNavigate();

  const usuario =
    obtenerUsuarioLocal();

  const [paso, setPaso] =
    useState(1);

  const [
    modoOperacion,
    setModoOperacion,
  ] =
    useState<ModoOperacion>(
      "COMPRA",
    );

  const [mensaje, setMensaje] =
    useState("");

  const [exito, setExito] =
    useState(false);

  const [
    reservando,
    setReservando,
  ] = useState(false);

  const mostrarMensaje =
    useCallback(
      (
        texto = "",
        esExito = false,
      ) => {
        setMensaje(texto);
        setExito(esExito);
      },
      [],
    );

  const compraViaje =
    useCompraViaje({
      bloqueado: false,

      onCambiarPaso: setPaso,

      onMensaje:
        mostrarMensaje,
    });

  const {
    viaje,
    fecha,
    asientosSeleccionados,
    total,
  } = compraViaje;

  /*
   * IMPORTANTE:
   * Se pasa directamente la función importada.
   * De esta manera mantiene la misma referencia
   * y no reinicia la consulta automática del pago
   * en cada renderizado.
   */
  const pago =
    usePagoCompra({
      usuario,

      viaje,

      fecha,

      asientosSeleccionados,

      total,

      bloqueadoExterno:
        reservando,

      construirTicket:
        construirTicketAprobado,

      onMensaje:
        mostrarMensaje,

      onCambiarPaso:
        setPaso,

      onBloquearAsientos:
        compraViaje
          .bloquearAsientos,

      onRecargarAsientos:
        compraViaje
          .recargarAsientos,

      onSeleccionInvalida:
        compraViaje
          .setAsientosSeleccionados,
    });

  const bloqueado =
    reservando ||
    pago.bloqueadoPago;

  const pasajero =
    formatearNombrePasajero(
      usuario,
    );

  const cambiarModoOperacion =
    useCallback(
      (
        valor: ModoOperacion,
      ) => {
        if (bloqueado) {
          return;
        }

        setModoOperacion(
          valor,
        );

        pago.setMostrarQR(
          false,
        );

        mostrarMensaje();
      },
      [
        bloqueado,
        mostrarMensaje,
        pago.setMostrarQR,
      ],
    );

  const confirmarReservaTemporal =
    useCallback(
      async () => {
        if (
          reservando ||
          bloqueado
        ) {
          return;
        }

        if (
          !usuario.id ||
          !viaje?.id ||
          !compraViaje
            .cantidadAsientos
        ) {
          mostrarMensaje(
            "Selecciona el viaje y al menos un asiento.",
          );

          return;
        }

        setReservando(true);

        mostrarMensaje();

        try {
          const respuesta =
            await crearReservaPendiente({
              usuarioId:
                usuario.id,

              viajeId:
                viaje.id,

              asientoIds:
                compraViaje
                  .idsAsientosSeleccionados,
            });

          mostrarMensaje(
            respuesta.mensaje ||
              "Reserva creada correctamente. Tienes 2 horas para realizar el pago.",
            true,
          );

          navigate(
            "/pasajero/mis-reservas",
            {
              replace: true,
            },
          );
        } catch (
          error: unknown
        ) {
          mostrarMensaje(
            obtenerMensajeError(
              error,
              "No se pudo crear la reserva.",
            ),
          );
        } finally {
          setReservando(false);
        }
      },
      [
        bloqueado,
        compraViaje
          .cantidadAsientos,
        compraViaje
          .idsAsientosSeleccionados,
        mostrarMensaje,
        navigate,
        reservando,
        usuario.id,
        viaje?.id,
      ],
    );

  const guardarTicket =
    useCallback(() => {
      const ticket =
        pago.ticketAprobado;

      if (!ticket) {
        mostrarMensaje(
          "El ticket todavía no está disponible.",
        );

        return;
      }

      localStorage.setItem(
        "ultimoTicket",
        JSON.stringify(ticket),
      );

      mostrarMensaje(
        "Ticket guardado correctamente en este dispositivo.",
        true,
      );
    }, [
      mostrarMensaje,
      pago.ticketAprobado,
    ]);

  const descargarTicket =
    useCallback(
      async () => {
        const ticket =
          pago.ticketAprobado;

        if (!ticket) {
          mostrarMensaje(
            "El ticket todavía no está disponible.",
          );

          return;
        }

        try {
          const archivo =
            await crearImagenTicket(
              ticket,
              pasajero,
            );

          descargarArchivo(
            archivo,
            nombreArchivoTicket(
              ticket,
            ),
          );
        } catch {
          mostrarMensaje(
            "No se pudo generar la imagen del ticket.",
          );
        }
      },
      [
        mostrarMensaje,
        pago.ticketAprobado,
        pasajero,
      ],
    );

  const compartirPorWhatsApp =
    useCallback(
      async () => {
        const ticket =
          pago.ticketAprobado;

        if (!ticket) {
          mostrarMensaje(
            "El ticket todavía no está disponible.",
          );

          return;
        }

        await compartirTicket(
          ticket,
          pasajero,
        );
      },
      [
        mostrarMensaje,
        pago.ticketAprobado,
        pasajero,
      ],
    );

  const cerrarSesion =
    useCallback(() => {
      [
        "token",
        "access_token",
        "usuario",
        "ultimoTicket",
      ].forEach(
        (clave) =>
          localStorage.removeItem(
            clave,
          ),
      );

      navigate("/");
    }, [navigate]);

  return {
    usuario,
    pasajero,

    paso,
    setPaso,

    modoOperacion,
    cambiarModoOperacion,

    mensaje,
    exito,
    mostrarMensaje,

    reservando,
    bloqueado,

    confirmarReservaTemporal,

    guardarTicket,
    descargarTicket,
    compartirPorWhatsApp,
    cerrarSesion,

    compraViaje,
    pago,
  };
}

export default useCompraReservar;