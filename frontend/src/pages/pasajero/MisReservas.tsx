import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type {
  ComponentProps,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  CreditCard,
  Home,
  LogOut,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  UploadCloud,
} from "lucide-react";

import logo from "../../assets/logo.png";
import qrPago from "../../assets/QR.png";
import TicketCard from "../../components/TicketCard";
import {
  obtenerPagosUsuario,
  registrarComprobantePago,
} from "../../services/pagos.service";
import type {
  Pago,
} from "../../services/pagos.service";
import {
  cancelarReservaUsuario,
  obtenerReservasUsuario,
} from "../../services/reservas.service";
import type {
  ReservaPasajero,
} from "../../services/reservas.service";
import {
  obtenerMisTickets,
} from "../../services/tickets.service";

type TicketItem =
  ComponentProps<
    typeof TicketCard
  >["ticket"];

type UsuarioSesion = {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
};

function obtenerUsuarioSesion():
  UsuarioSesion {
  const usuarioGuardado =
    localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    return {};
  }

  try {
    const usuario: unknown =
      JSON.parse(usuarioGuardado);

    return usuario &&
      typeof usuario === "object"
      ? (usuario as UsuarioSesion)
      : {};
  } catch {
    return {};
  }
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const respuesta = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
          };
        };
      }
    ).response;

    const mensaje =
      respuesta?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (
      typeof mensaje === "string"
    ) {
      return mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudieron cargar tus tickets.";
}

function obtenerInicial(
  nombre?: string,
): string {
  return (nombre || "P")
    .charAt(0)
    .toUpperCase();
}

function obtenerDetallesReserva(
  reserva: ReservaPasajero,
) {
  return Array.isArray(reserva.detalles)
    ? reserva.detalles
    : [];
}

function calcularTotalReserva(
  reserva: ReservaPasajero,
): number {
  return obtenerDetallesReserva(
    reserva,
  ).reduce(
    (total, detalle) =>
      total +
      Number(
        detalle.precio ??
          reserva.viaje?.precio ??
          0,
      ),
    0,
  );
}

function formatearFechaHora(
  valor?: string | null,
): string {
  if (!valor) {
    return "No disponible";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(fecha);
}

function obtenerTiempoRestante(
  fechaVencimiento: string | null | undefined,
  ahora: number,
): {
  vencida: boolean;
  texto: string;
} {
  if (!fechaVencimiento) {
    return {
      vencida: false,
      texto: "Reserva vigente",
    };
  }

  const milisegundos =
    new Date(fechaVencimiento).getTime() -
    ahora;

  if (
    !Number.isFinite(milisegundos) ||
    milisegundos <= 0
  ) {
    return {
      vencida: true,
      texto: "Tiempo agotado",
    };
  }

  const segundos = Math.floor(
    milisegundos / 1000,
  );
  const horas = Math.floor(
    segundos / 3600,
  );
  const minutos = Math.floor(
    (segundos % 3600) / 60,
  );
  const segundosRestantes =
    segundos % 60;

  return {
    vencida: false,
    texto: `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`,
  };
}

function MisReservas() {
  const navigate = useNavigate();
  const usuario =
    obtenerUsuarioSesion();

  const [tickets, setTickets] =
    useState<TicketItem[]>([]);

  const [reservas, setReservas] =
    useState<ReservaPasajero[]>([]);

  const [pagos, setPagos] =
    useState<Pago[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [mensajeExito, setMensajeExito] =
    useState("");

  const [reservaPagoId, setReservaPagoId] =
    useState<string | null>(null);

  const [referencia, setReferencia] =
    useState("");

  const [comprobante, setComprobante] =
    useState<File | null>(null);

  const [enviandoPago, setEnviandoPago] =
    useState(false);

  const [cancelandoReservaId, setCancelandoReservaId] =
    useState<string | null>(null);

  const [ahora, setAhora] =
    useState(() => Date.now());

  const cargarDatos =
    useCallback(async () => {
      if (!usuario.id) {
        setMensaje(
          "No se encontró el usuario conectado. Inicia sesión nuevamente.",
        );
        setTickets([]);
        setReservas([]);
        setPagos([]);
        setCargando(false);
        return;
      }

      setMensaje("");

      try {
        const [
          ticketsRespuesta,
          reservasRespuesta,
          pagosRespuesta,
        ] = await Promise.all([
          obtenerMisTickets(
            usuario.id,
          ),
          obtenerReservasUsuario(
            usuario.id,
          ),
          obtenerPagosUsuario(
            usuario.id,
          ),
        ]);

        setTickets(
          Array.isArray(
            ticketsRespuesta,
          )
            ? (ticketsRespuesta as TicketItem[])
            : [],
        );

        setReservas(
          Array.isArray(
            reservasRespuesta,
          )
            ? (reservasRespuesta as ReservaPasajero[])
            : [],
        );

        setPagos(
          Array.isArray(
            pagosRespuesta,
          )
            ? pagosRespuesta
            : [],
        );
      } catch (error: unknown) {
        setMensaje(
          obtenerMensajeError(error),
        );
        setTickets([]);
        setReservas([]);
        setPagos([]);
      } finally {
        setCargando(false);
      }
    }, [usuario.id]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const temporizador = window.setInterval(
      () => setAhora(Date.now()),
      1000,
    );

    return () =>
      window.clearInterval(
        temporizador,
      );
  }, []);

  const reservasPendientes =
    reservas.filter(
      (reserva) =>
        reserva.estado ===
        "PENDIENTE",
    );

  const actualizarTickets =
    async () => {
      setActualizando(true);

      try {
        await cargarDatos();
      } finally {
        setActualizando(false);
      }
    };

  const abrirPagoReserva = (
    reservaId: string,
  ) => {
    setMensaje("");
    setMensajeExito("");
    setReferencia("");
    setComprobante(null);
    setReservaPagoId(
      reservaPagoId === reservaId
        ? null
        : reservaId,
    );
  };

  const enviarPagoReserva = async (
    reserva: ReservaPasajero,
  ) => {
    if (!usuario.id) {
      setMensaje(
        "No se encontró el usuario conectado.",
      );
      return;
    }

    const referenciaLimpia =
      referencia.trim();

    if (
      referenciaLimpia.length < 4
    ) {
      setMensaje(
        "La referencia debe tener al menos 4 caracteres.",
      );
      return;
    }

    if (!comprobante) {
      setMensaje(
        "Selecciona el comprobante de pago.",
      );
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (
      !tiposPermitidos.includes(
        comprobante.type,
      )
    ) {
      setMensaje(
        "El comprobante debe ser JPG, JPEG, PNG, WEBP o PDF.",
      );
      return;
    }

    if (
      comprobante.size >
      5 * 1024 * 1024
    ) {
      setMensaje(
        "El comprobante no puede superar los 5 MB.",
      );
      return;
    }

    const asientoIds =
      obtenerDetallesReserva(
        reserva,
      )
        .map(
          (detalle) =>
            detalle.asientoViaje
              ?.id,
        )
        .filter(
          (id): id is string =>
            typeof id === "string" &&
            id.length > 0,
        );

    if (
      !reserva.viaje?.id ||
      asientoIds.length === 0
    ) {
      setMensaje(
        "La reserva no contiene los datos del viaje o de los asientos.",
      );
      return;
    }

    setEnviandoPago(true);
    setMensaje("");
    setMensajeExito("");

    try {
      const respuesta =
        await registrarComprobantePago(
          {
            reservaId:
              reserva.id,
            usuarioId:
              usuario.id,
            viajeId:
              reserva.viaje.id,
            asientoIds,
            referencia:
              referenciaLimpia,
            monto:
              calcularTotalReserva(
                reserva,
              ),
            comprobante,
          },
        );

      setPagos((actuales) => [
        {
          ...respuesta.pago,
          reserva:
            respuesta.pago
              .reserva ?? {
              id: reserva.id,
            },
        },
        ...actuales.filter(
          (pago) =>
            pago.id !==
            respuesta.pago.id,
        ),
      ]);

      setReservaPagoId(null);
      setReferencia("");
      setComprobante(null);
      setMensajeExito(
        respuesta.mensaje ||
          "Comprobante enviado. La administración revisará tu pago.",
      );

      await cargarDatos();
    } catch (error: unknown) {
      setMensaje(
        obtenerMensajeError(error),
      );
    } finally {
      setEnviandoPago(false);
    }
  };

  const cancelarReserva = async (
    reserva: ReservaPasajero,
  ) => {
    if (!usuario.id || cancelandoReservaId) {
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas cancelar la reserva ${reserva.codigoReserva}? Los asientos quedarán disponibles nuevamente.`,
    );

    if (!confirmar) {
      return;
    }

    setCancelandoReservaId(reserva.id);
    setMensaje("");
    setMensajeExito("");

    try {
      const respuesta = await cancelarReservaUsuario(
        reserva.id,
        usuario.id,
      );

      setReservas((actuales) =>
        actuales.filter((item) => item.id !== reserva.id),
      );
      setReservaPagoId(null);
      setMensajeExito(
        respuesta.mensaje ||
          "Reserva cancelada. Los asientos fueron liberados.",
      );

      await cargarDatos();
    } catch (error: unknown) {
      setMensaje(obtenerMensajeError(error));
    } finally {
      setCancelandoReservaId(null);
    }
  };

  const cerrarSesion = () => {
    [
      "token",
      "access_token",
      "usuario",
      "user",
      "auth",
      "sesion",
      "session",
      "ultimoTicket",
    ].forEach((clave) =>
      localStorage.removeItem(clave),
    );

    navigate("/", {
      replace: true,
    });
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f3f8f5] text-slate-900">
      <FondoTicketsDecorativo />

      <header className="sticky top-0 z-50 overflow-hidden border-b-4 border-lime-400 bg-gradient-to-r from-[#005b31] via-[#007a43] to-[#006d3c] text-white shadow-xl shadow-emerald-950/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-radial-gradient(ellipse at 16% 10%, rgba(255,255,255,.25) 0, rgba(255,255,255,.25) 1px, transparent 2px, transparent 18px)",
          }}
        />

        <svg
          aria-hidden="true"
          viewBox="0 0 500 140"
          preserveAspectRatio="none"
          className="pointer-events-none absolute right-0 top-0 h-full w-[390px] opacity-25"
        >
          <path
            d="M270 -30C340 20 275 85 365 165"
            fill="none"
            stroke="#bef264"
            strokeWidth="17"
          />
          <path
            d="M325 -30C395 20 330 85 420 165"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="13"
          />
          <path
            d="M380 -30C450 20 385 85 475 165"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
          />
        </svg>

        <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 sm:px-7 xl:flex-row xl:items-center xl:justify-between xl:px-10">
          <Link
            to="/pasajero"
            className="flex items-center gap-3"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white shadow-lg">
              <img
                src={logo}
                alt="Logo Trans 2 de Junio"
                className="h-11 w-11 object-contain"
              />
            </div>

            <div>
              <p className="text-xl font-black">
                Trans 2 de Junio
              </p>

              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                Sistema de pasajes
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 overflow-x-auto pb-1 xl:overflow-visible xl:pb-0">
            <Link
              to="/pasajero"
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-emerald-50 transition hover:bg-white/15"
            >
              <Home size={18} />
              Inicio
            </Link>

            <Link
              to="/pasajero/comprar-reservar"
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-emerald-50 transition hover:bg-white/15"
            >
              <Ticket size={18} />
              Comprar / Reservar
            </Link>

            <span className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-lg">
              <CalendarDays size={18} />
              Mis Reservas
            </span>

            <Link
              to="/pasajero/mis-reclamos"
              className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-emerald-50 transition hover:bg-white/15"
            >
              <MessageCircle size={18} />
              Mis Reclamos
            </Link>

          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-44 truncate text-sm font-black">
                {usuario.nombre ||
                  "Pasajero"}
              </p>

              <p className="max-w-44 truncate text-xs text-emerald-100">
                {usuario.email ||
                  "Cuenta de pasajero"}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 font-black shadow-md">
              {obtenerInicial(
                usuario.nombre,
              )}
            </div>

            <button
              type="button"
              onClick={cerrarSesion}
              className="flex items-center gap-2 rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-black text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">
                Salir
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        <section className="relative overflow-hidden rounded-[30px] border border-emerald-100 bg-white/90 px-6 py-7 shadow-xl shadow-emerald-950/5 backdrop-blur-sm sm:px-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-emerald-600/[0.06]" />

          <div className="pointer-events-none absolute bottom-4 left-[46%] h-24 w-24 rounded-full border border-emerald-200/50 bg-emerald-100/30" />

          <div className="pointer-events-none absolute right-[27%] top-5 text-3xl text-lime-400/70">
            ✦
          </div>

          <div className="pointer-events-none absolute bottom-5 right-[19%] text-2xl text-emerald-400/60">
            ✧
          </div>

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
                <Ticket size={31} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  Reservas y boletos
                </p>

                <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Mis Reservas
                </h1>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Paga tus reservas pendientes y consulta tus tickets electrónicos.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/pasajero"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <ArrowLeft size={20} />
                Volver al inicio
              </Link>

              <button
                type="button"
                onClick={
                  actualizarTickets
                }
                disabled={actualizando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={20}
                  className={
                    actualizando
                      ? "animate-spin"
                      : ""
                  }
                />

                {actualizando
                  ? "Actualizando..."
                  : "Actualizar"}
              </button>
            </div>
          </div>
        </section>

        {mensaje && (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700 shadow-sm">
            {mensaje}
          </div>
        )}

        {mensajeExito && (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800 shadow-sm">
            {mensajeExito}
          </div>
        )}

        {cargando ? (
          <CargandoTickets />
        ) : (
          <>
            <section className="mt-9">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                    Reservas temporales
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-slate-950">
                    Pendientes de pago
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Completa el pago antes de que finalice el tiempo de bloqueo.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                  <Clock3 size={18} />
                  {reservasPendientes.length}{" "}
                  {reservasPendientes.length === 1
                    ? "reserva"
                    : "reservas"}
                </span>
              </div>

              {reservasPendientes.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-emerald-200 bg-white/80 px-6 py-10 text-center shadow-sm">
                  <CalendarDays
                    size={42}
                    className="mx-auto text-emerald-600"
                  />
                  <p className="mt-4 text-xl font-black text-slate-900">
                    No tienes reservas pendientes
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Cuando reserves asientos por 2 horas, aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  {reservasPendientes.map(
                    (reserva) => {
                      const tiempo =
                        obtenerTiempoRestante(
                          reserva.fechaVencimiento,
                          ahora,
                        );

                      const pagoReserva =
                        pagos.find(
                          (pago) =>
                            pago.reserva?.id ===
                            reserva.id,
                        );

                      const pagoEnRevision =
                        pagoReserva?.estado ===
                          "PENDIENTE" ||
                        pagoReserva?.estado ===
                          "EN_REVISION";

                      const detalles =
                        obtenerDetallesReserva(
                          reserva,
                        );

                      return (
                        <article
                          key={reserva.id}
                          className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5"
                        >
                          <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-5 text-white">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
                                  {reserva.codigoReserva ||
                                    "Reserva temporal"}
                                </p>
                                <h3 className="mt-2 text-2xl font-black">
                                  {reserva.viaje?.ruta?.origen ||
                                    "Origen"}{" "}
                                  →{" "}
                                  {reserva.viaje?.ruta?.destino ||
                                    "Destino"}
                                </h3>
                              </div>

                              <div
                                className={[
                                  "rounded-2xl border px-4 py-3 text-center",
                                  tiempo.vencida
                                    ? "border-red-200 bg-red-500/20"
                                    : "border-white/20 bg-white/15",
                                ].join(" ")}
                              >
                                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                                  Tiempo restante
                                </p>
                                <p className="mt-1 font-mono text-xl font-black">
                                  {tiempo.texto}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <DatoReserva
                                etiqueta="Salida"
                                valor={`${formatearFechaHora(
                                  reserva.viaje?.fechaSalida,
                                )}${
                                  reserva.viaje?.horaSalida
                                    ? ` · ${reserva.viaje.horaSalida}`
                                    : ""
                                }`}
                              />
                              <DatoReserva
                                etiqueta="Asientos"
                                valor={
                                  detalles
                                    .map(
                                      (detalle) =>
                                        detalle.asientoViaje?.numero,
                                    )
                                    .filter(
                                      (numero) =>
                                        numero !== undefined &&
                                        numero !== null,
                                    )
                                    .join(", ") ||
                                  `${detalles.length} seleccionados`
                                }
                              />
                              <DatoReserva
                                etiqueta="Total"
                                valor={`Bs. ${calcularTotalReserva(
                                  reserva,
                                ).toFixed(2)}`}
                                destacado
                              />
                            </div>

                            {pagoEnRevision ? (
                              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800">
                                <RefreshCw size={21} />
                                <div>
                                  <p className="font-black">
                                    Comprobante en revisión
                                  </p>
                                  <p className="mt-1 text-sm">
                                    La administración verificará el pago antes de generar tu ticket.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    abrirPagoReserva(
                                      reserva.id,
                                    )
                                  }
                                  disabled={
                                    tiempo.vencida ||
                                    cancelandoReservaId === reserva.id
                                  }
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  <CreditCard size={20} />
                                  {tiempo.vencida
                                    ? "Reserva vencida"
                                    : reservaPagoId === reserva.id
                                      ? "Cerrar formulario"
                                      : "Pagar reserva"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void cancelarReserva(reserva)
                                  }
                                  disabled={
                                    tiempo.vencida ||
                                    cancelandoReservaId !== null
                                  }
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {cancelandoReservaId === reserva.id ? (
                                    <RefreshCw
                                      size={20}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={20} />
                                  )}
                                  {cancelandoReservaId === reserva.id
                                    ? "Cancelando..."
                                    : "Cancelar reserva"}
                                </button>
                              </div>
                            )}

                            {reservaPagoId ===
                              reserva.id &&
                              !pagoEnRevision &&
                              !tiempo.vencida && (
                                <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
                                  <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                                    <div className="rounded-2xl border border-emerald-200 bg-white p-3 text-center">
                                      <img
                                        src={qrPago}
                                        alt="QR oficial de pago"
                                        className="mx-auto aspect-square w-full object-contain"
                                      />
                                      <p className="mt-2 text-sm font-black text-emerald-800">
                                        Paga Bs.{" "}
                                        {calcularTotalReserva(
                                          reserva,
                                        ).toFixed(2)}
                                      </p>
                                    </div>

                                    <div className="space-y-4">
                                      <div>
                                        <label
                                          htmlFor={`referencia-${reserva.id}`}
                                          className="text-sm font-black text-slate-800"
                                        >
                                          Número de transacción
                                        </label>
                                        <input
                                          id={`referencia-${reserva.id}`}
                                          value={referencia}
                                          onChange={(evento) =>
                                            setReferencia(
                                              evento.target.value,
                                            )
                                          }
                                          maxLength={100}
                                          placeholder="Ejemplo: 784803837"
                                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                        />
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`comprobante-${reserva.id}`}
                                          className="text-sm font-black text-slate-800"
                                        >
                                          Comprobante
                                        </label>
                                        <input
                                          id={`comprobante-${reserva.id}`}
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp,application/pdf"
                                          onChange={(evento) =>
                                            setComprobante(
                                              evento.target.files?.[0] ??
                                                null,
                                            )
                                          }
                                          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-black file:text-emerald-800"
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                          JPG, JPEG, PNG, WEBP o PDF · máximo 5 MB.
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          void enviarPagoReserva(
                                            reserva,
                                          )
                                        }
                                        disabled={enviandoPago}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {enviandoPago ? (
                                          <RefreshCw
                                            size={20}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <UploadCloud size={20} />
                                        )}
                                        {enviandoPago
                                          ? "Enviando..."
                                          : "Enviar comprobante"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              )}
            </section>

            {tickets.length === 0 ? (
              <EstadoSinTickets />
            ) : (
              <section className="mt-9">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                      Boletos electrónicos
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      Tus viajes registrados
                    </h2>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 shadow-sm">
                    <ShieldCheck size={18} />
                    {tickets.length}{" "}
                    {tickets.length === 1
                      ? "ticket"
                      : "tickets"}
                  </span>
                </div>

                <div className="space-y-10">
                  {tickets.map(
                    (ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-[32px] border border-emerald-100 bg-white/85 p-3 shadow-xl shadow-emerald-950/5 backdrop-blur-sm sm:p-5"
                      >
                        <TicketCard
                          ticket={ticket}
                        />
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CargandoTickets() {
  return (
    <section className="mt-9 flex min-h-[390px] items-center justify-center rounded-[30px] border border-emerald-100 bg-white/90 p-8 text-center shadow-xl shadow-emerald-950/5 backdrop-blur-sm">
      <div>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <RefreshCw
            size={46}
            className="animate-spin"
          />
        </div>

        <h2 className="mt-6 text-2xl font-black text-slate-950">
          Cargando tus tickets...
        </h2>

        <p className="mt-2 text-slate-500">
          Estamos consultando tus
          boletos electrónicos.
        </p>
      </div>
    </section>
  );
}

function DatoReserva({
  etiqueta,
  valor,
  destacado = false,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        destacado
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {etiqueta}
      </p>
      <p
        className={[
          "mt-2 break-words font-black",
          destacado
            ? "text-emerald-800"
            : "text-slate-900",
        ].join(" ")}
      >
        {valor}
      </p>
    </div>
  );
}

function EstadoSinTickets() {
  return (
    <section className="relative mt-9 overflow-hidden rounded-[30px] border border-dashed border-emerald-300 bg-white/90 px-6 py-14 text-center shadow-xl shadow-emerald-950/5 backdrop-blur-sm sm:py-16">
      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-100/50" />

      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-lime-100/50" />

      <div className="relative z-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-emerald-100 text-emerald-700 shadow-inner">
          <QrCode size={52} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
          <Sparkles size={17} />
          Tu próximo viaje
        </div>

        <h2 className="mt-3 text-3xl font-black text-slate-950">
          No tienes tickets todavía
        </h2>

        <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-500">
          Cuando compres un pasaje,
          el ticket QR aparecerá aquí
          automáticamente.
        </p>

        <Link
          to="/pasajero/comprar-reservar"
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-7 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          <Ticket size={20} />
          Comprar un pasaje
        </Link>
      </div>
    </section>
  );
}

function FondoTicketsDecorativo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(167,243,208,0.17),transparent_25%),radial-gradient(circle_at_86%_40%,rgba(190,242,100,0.13),transparent_30%)]" />

      <svg
        viewBox="0 0 360 1000"
        className="absolute left-0 top-28 hidden h-[1000px] w-[300px] opacity-[0.09] xl:block"
        fill="none"
      >
        <path
          d="M0 130H82Q112 130 112 160V260Q112 290 142 290H340"
          stroke="#059669"
          strokeWidth="3"
        />
        <path
          d="M28 430H120Q150 430 150 460V585Q150 615 180 615H330"
          stroke="#047857"
          strokeWidth="3"
        />
        <path
          d="M0 850H72Q102 850 102 820V735Q102 705 132 705H255"
          stroke="#65a30d"
          strokeWidth="3"
        />

        {[
          [38, 130],
          [112, 220],
          [250, 290],
          [70, 430],
          [150, 540],
          [270, 615],
          [44, 850],
          [102, 770],
          [220, 705],
        ].map(([cx, cy], indice) => (
          <circle
            key={indice}
            cx={cx}
            cy={cy}
            r="7"
            fill="#f3f8f5"
            stroke="#10b981"
            strokeWidth="3"
          />
        ))}
      </svg>

      <svg
        viewBox="0 0 640 1500"
        preserveAspectRatio="none"
        className="absolute -right-48 top-20 hidden h-[1550px] w-[610px] xl:block"
        fill="none"
      >
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#d9f99d"
          strokeWidth="132"
          opacity="0.8"
        />
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#ffffff"
          strokeWidth="106"
        />
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#a3e635"
          strokeWidth="89"
        />
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#ffffff"
          strokeWidth="69"
        />
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#10b981"
          strokeWidth="54"
        />
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#ffffff"
          strokeWidth="36"
        />
        <path
          d="M500 -100C175 255 625 520 325 850C130 1065 545 1225 300 1580"
          stroke="#065f46"
          strokeWidth="24"
        />
      </svg>

      <svg
        viewBox="0 0 850 520"
        preserveAspectRatio="none"
        className="absolute -bottom-28 -left-56 hidden h-[480px] w-[850px] xl:block"
        fill="none"
      >
        <path
          d="M-80 410C170 230 370 480 610 220C705 115 775 130 910 25"
          stroke="#d9f99d"
          strokeWidth="105"
        />
        <path
          d="M-80 410C170 230 370 480 610 220C705 115 775 130 910 25"
          stroke="#ffffff"
          strokeWidth="82"
        />
        <path
          d="M-80 410C170 230 370 480 610 220C705 115 775 130 910 25"
          stroke="#34d399"
          strokeWidth="64"
        />
        <path
          d="M-80 410C170 230 370 480 610 220C705 115 775 130 910 25"
          stroke="#ffffff"
          strokeWidth="42"
        />
        <path
          d="M-80 410C170 230 370 480 610 220C705 115 775 130 910 25"
          stroke="#047857"
          strokeWidth="25"
        />
      </svg>
    </div>
  );
}

export default MisReservas;
