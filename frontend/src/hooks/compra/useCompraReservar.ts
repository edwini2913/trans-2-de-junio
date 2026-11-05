
import {
  useCallback,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

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

  const usuario = obtenerUsuarioLocal();

  const [paso, setPaso] = useState(1);

  const [
    modoOperacion,
    setModoOperacion,
  ] = useState<ModoOperacion>("COMPRA");

  const [mensaje, setMensaje] = useState("");

  const [exito, setExito] = useState(false);

  const [
    reservando,
    setReservando,
  ] = useState(false);

  /**
   * MOSTRAR MENSAJES
   *
   * Permite informar al pasajero
   * sobre compras, reservas,
   * errores y operaciones exitosas.
   */
  const mostrarMensaje = useCallback(
    (
      texto = "",
      esExito = false,
    ) => {
      setMensaje(texto);
      setExito(esExito);
    },
    [],
  );

  /**
   * CONTROL DE VIAJE
   *
   * Mantiene la selección de:
   * - Ruta
   * - Fecha
   * - Horario
   * - Vehículo
   * - Asientos
   *
   * La separación FLOTA / NOAH / HIACE
   * se gestiona desde los servicios
   * y componentes correspondientes.
   */
  const compraViaje = useCompraViaje({
    bloqueado: false,

    onCambiarPaso: setPaso,

    onMensaje: mostrarMensaje,
  });

  const {
    viaje,
    fecha,
    asientosSeleccionados,
    total,
  } = compraViaje;

  /**
   * CONTROL DE PAGO
   *
   * Gestiona:
   * - Pago mediante QR
   * - Envío de comprobante
   * - Aprobación y rechazo
   * - Ticket digital
   *
   * Se pasa directamente
   * construirTicketAprobado para conservar
   * una referencia estable.
   */
  const pago = usePagoCompra({
    usuario,

    viaje,

    fecha,

    asientosSeleccionados,

    total,

    bloqueadoExterno: reservando,

    construirTicket: construirTicketAprobado,

    onMensaje: mostrarMensaje,

    onCambiarPaso: setPaso,

    onBloquearAsientos:
      compraViaje.bloquearAsientos,

    onRecargarAsientos:
      compraViaje.recargarAsientos,

    onSeleccionInvalida:
      compraViaje.setAsientosSeleccionados,
  });

  /**
   * BLOQUEAR OPERACIONES
   *
   * Impide iniciar otras operaciones
   * mientras se procesa una reserva
   * o un pago.
   */
  const bloqueado =
    reservando || pago.bloqueadoPago;

  /**
   * DATOS DEL PASAJERO
   */
  const pasajero =
    formatearNombrePasajero(usuario);

  /**
   * CAMBIAR MODALIDAD
   *
   * COMPRA o RESERVA.
   */
  const cambiarModoOperacion = useCallback(
    (valor: ModoOperacion) => {
      if (bloqueado) {
        return;
      }

      if (valor === modoOperacion) {
        return;
      }

      setModoOperacion(valor);

      pago.setMostrarQR(false);

      mostrarMensaje();
    },
    [
      bloqueado,
      modoOperacion,
      mostrarMensaje,
      pago.setMostrarQR,
    ],
  );

  /**
   * CONFIRMAR RESERVA TEMPORAL
   *
   * Utiliza el viaje seleccionado
   * y los asientos bloqueados.
   */
  const confirmarReservaTemporal = useCallback(
    async () => {
      if (reservando || bloqueado) {
        return;
      }

      if (
        !usuario.id ||
        !viaje?.id ||
        compraViaje.cantidadAsientos === 0
      ) {
        mostrarMensaje(
          "Selecciona el viaje y al menos un asiento.",
        );
        return;
      }

      const asientoIds = [
        ...compraViaje.idsAsientosSeleccionados,
      ];

      if (
        asientoIds.length === 0 ||
        new Set(asientoIds).size !== asientoIds.length
      ) {
        mostrarMensaje(
          "La selección de asientos no es válida.",
        );
        return;
      }

      setReservando(true);
      mostrarMensaje();

      try {
        const respuesta =
          await crearReservaPendiente({
            usuarioId: usuario.id,

            viajeId: viaje.id,

            asientoIds,
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
      } catch (error: unknown) {
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
      reservando,
      bloqueado,
      usuario.id,
      viaje?.id,
      compraViaje.cantidadAsientos,
      compraViaje.idsAsientosSeleccionados,
      mostrarMensaje,
      navigate,
    ],
  );

  /**
   * GUARDAR TICKET DIGITAL
   *
   * Solamente permite guardar
   * cuando existe un ticket aprobado.
   */
  const guardarTicket = useCallback(
    () => {
      const ticket = pago.ticketAprobado;

      if (!ticket) {
        mostrarMensaje(
          "El ticket todavía no está disponible.",
        );
        return;
      }

      try {
        localStorage.setItem(
          "ultimoTicket",
          JSON.stringify(ticket),
        );

        mostrarMensaje(
          "Ticket guardado correctamente en este dispositivo.",
          true,
        );
      } catch {
        mostrarMensaje(
          "No se pudo guardar el ticket en este dispositivo.",
        );
      }
    },
    [
      mostrarMensaje,
      pago.ticketAprobado,
    ],
  );

  /**
   * DESCARGAR TICKET
   *
   * Genera una imagen del ticket
   * aprobado para el pasajero.
   */
  const descargarTicket = useCallback(
    async () => {
      const ticket = pago.ticketAprobado;

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
          nombreArchivoTicket(ticket),
        );

        mostrarMensaje(
          "Ticket preparado para descargar.",
          true,
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

  /**
   * COMPARTIR TICKET
   *
   * Conserva el mecanismo existente
   * para compartir por WhatsApp
   * o mediante las opciones del dispositivo.
   */
  const compartirPorWhatsApp = useCallback(
    async () => {
      const ticket = pago.ticketAprobado;

      if (!ticket) {
        mostrarMensaje(
          "El ticket todavía no está disponible.",
        );
        return;
      }

      try {
        await compartirTicket(
          ticket,
          pasajero,
        );
      } catch {
        mostrarMensaje(
          "No se pudo compartir el ticket.",
        );
      }
    },
    [
      mostrarMensaje,
      pago.ticketAprobado,
      pasajero,
    ],
  );

  /**
   * CERRAR SESIÓN
   *
   * Elimina los datos de sesión
   * almacenados por el frontend.
   */
  const cerrarSesion = useCallback(
    () => {
      [
        "token",
        "access_token",
        "usuario",
        "ultimoTicket",
      ].forEach((clave) => {
        localStorage.removeItem(clave);
      });

      navigate("/");
    },
    [navigate],
  );

  /**
   * FUNCIONES Y ESTADOS
   *
   * Mantiene los nombres utilizados
   * por ComprarReservar.tsx
   * y los demás componentes.
   */
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
