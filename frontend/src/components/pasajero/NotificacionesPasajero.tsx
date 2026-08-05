import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Info,
  RefreshCw,
  TicketCheck,
  X,
  XCircle,
} from "lucide-react";

import {
  contarNotificacionesNoLeidasPasajero,
  marcarNotificacionComoLeida,
  marcarTodasLasNotificacionesComoLeidas,
  obtenerNotificacionesPasajero,
  type Notificacion,
  type TipoNotificacion,
} from "../../services/notificaciones.service";

const INTERVALO_ACTUALIZACION =
  15_000;

function NotificacionesPasajero() {
  const navigate = useNavigate();

  const [abierto, setAbierto] =
    useState(false);

  const [
    notificaciones,
    setNotificaciones,
  ] = useState<Notificacion[]>([]);

  const [
    cantidadNoLeidas,
    setCantidadNoLeidas,
  ] = useState(0);

  const [cargando, setCargando] =
    useState(false);

  const [mensajeError, setMensajeError] =
    useState("");

  const cargarNotificaciones =
    useCallback(
      async (
        mostrarCarga = false,
      ) => {
        if (mostrarCarga) {
          setCargando(true);
        }

        try {
          const [
            lista,
            cantidad,
          ] = await Promise.all([
            obtenerNotificacionesPasajero(
              30,
            ),
            contarNotificacionesNoLeidasPasajero(),
          ]);

          setNotificaciones(lista);
          setCantidadNoLeidas(
            Math.max(0, cantidad),
          );
          setMensajeError("");
        } catch (error: unknown) {
          if (mostrarCarga) {
            setMensajeError(
              error instanceof Error
                ? error.message
                : "No se pudieron cargar las notificaciones.",
            );
          }
        } finally {
          if (mostrarCarga) {
            setCargando(false);
          }
        }
      },
      [],
    );

  useEffect(() => {
    void cargarNotificaciones();

    const intervalo =
      window.setInterval(() => {
        void cargarNotificaciones();
      }, INTERVALO_ACTUALIZACION);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [cargarNotificaciones]);

  const alternarPanel = () => {
    const abrir = !abierto;
    setAbierto(abrir);

    if (abrir) {
      void cargarNotificaciones(true);
    }
  };

  const abrirNotificacion = async (
    notificacion: Notificacion,
  ) => {
    if (!notificacion.leida) {
      try {
        await marcarNotificacionComoLeida(
          notificacion.id,
        );

        setNotificaciones((lista) =>
          lista.map((item) =>
            item.id ===
            notificacion.id
              ? {
                  ...item,
                  leida: true,
                  fechaLectura:
                    new Date().toISOString(),
                }
              : item,
          ),
        );

        setCantidadNoLeidas(
          (cantidad) =>
            Math.max(
              0,
              cantidad - 1,
            ),
        );
      } catch (error: unknown) {
        setMensajeError(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la notificación.",
        );
      }
    }

    setAbierto(false);

    if (
      notificacion.tipo ===
      "PAGO_APROBADO"
    ) {
      navigate(
        "/pasajero/mis-reservas",
      );
      return;
    }

    const ruta =
      notificacion.rutaDestino ||
      (notificacion.tipo ===
      "PAGO_RECHAZADO"
        ? "/pasajero/comprar-reservar"
        : "/pasajero");

    navigate(ruta);
  };

  const marcarTodas = async () => {
    if (cantidadNoLeidas === 0) {
      return;
    }

    try {
      await marcarTodasLasNotificacionesComoLeidas();

      setNotificaciones((lista) =>
        lista.map((item) => ({
          ...item,
          leida: true,
          fechaLectura:
            item.fechaLectura ||
            new Date().toISOString(),
        })),
      );

      setCantidadNoLeidas(0);
      setMensajeError("");
    } catch (error: unknown) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudieron marcar las notificaciones.",
      );
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={alternarPanel}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/15 text-white shadow-md backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/25"
        aria-label="Abrir notificaciones"
        aria-expanded={abierto}
      >
        <Bell size={21} />

        {cantidadNoLeidas > 0 && (
          <span className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[11px] font-black text-white">
            {cantidadNoLeidas > 99
              ? "99+"
              : cantidadNoLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-[80] w-[min(92vw,430px)] overflow-hidden rounded-[26px] border border-emerald-100 bg-white text-slate-800 shadow-2xl shadow-emerald-950/20">
          <header className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 px-5 py-5 text-white">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border-[22px] border-white/10" />

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <Bell size={22} />
                </div>

                <div>
                  <h2 className="font-black">
                    Mis notificaciones
                  </h2>

                  <p className="mt-1 text-xs text-emerald-100">
                    {cantidadNoLeidas ===
                    0
                      ? "No tienes avisos pendientes"
                      : `${cantidadNoLeidas} sin leer`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAbierto(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
                aria-label="Cerrar notificaciones"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
              Actividad reciente
            </p>

            <button
              type="button"
              onClick={() =>
                void marcarTodas()
              }
              disabled={
                cantidadNoLeidas === 0
              }
              className="flex items-center gap-1.5 text-xs font-black text-emerald-700 transition hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={16} />
              Marcar todas como leídas
            </button>
          </div>

          {mensajeError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {mensajeError}
            </div>
          )}

          <div className="max-h-[430px] overflow-y-auto">
            {cargando &&
            notificaciones.length ===
              0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <RefreshCw
                  size={35}
                  className="animate-spin text-emerald-700"
                />

                <p className="mt-4 font-black text-slate-800">
                  Cargando avisos...
                </p>
              </div>
            ) : notificaciones.length ===
              0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Bell size={31} />
                </div>

                <p className="mt-4 font-black text-slate-900">
                  No hay notificaciones
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Aquí aparecerá el
                  resultado de la
                  revisión de tus
                  pagos.
                </p>
              </div>
            ) : (
              notificaciones.map(
                (notificacion) => (
                  <BotonNotificacion
                    key={
                      notificacion.id
                    }
                    notificacion={
                      notificacion
                    }
                    onAbrir={() =>
                      void abrirNotificacion(
                        notificacion,
                      )
                    }
                  />
                ),
              )
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-emerald-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] text-slate-400">
              Se actualiza cada 15
              segundos
            </p>

            <button
              type="button"
              onClick={() =>
                void cargarNotificaciones(
                  true,
                )
              }
              disabled={cargando}
              className="flex items-center gap-1.5 text-xs font-black text-emerald-700 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  cargando
                    ? "animate-spin"
                    : ""
                }
              />
              Actualizar
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

function BotonNotificacion({
  notificacion,
  onAbrir,
}: {
  notificacion: Notificacion;
  onAbrir: () => void;
}) {
  const estilo =
    obtenerEstiloNotificacion(
      notificacion.tipo,
    );

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={[
        "relative flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-emerald-50/60",
        notificacion.leida
          ? "bg-white"
          : "bg-emerald-50/40",
      ].join(" ")}
    >
      {!notificacion.leida && (
        <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-500" />
      )}

      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          estilo.icono,
        ].join(" ")}
      >
        {estilo.elemento}
      </div>

      <div className="min-w-0 flex-1 pr-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="line-clamp-1 font-black text-slate-900">
            {notificacion.titulo}
          </p>

          <span
            className={[
              "rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide",
              estilo.etiqueta,
            ].join(" ")}
          >
            {estilo.texto}
          </span>
        </div>

        <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-600">
          {notificacion.mensaje}
        </p>

        <p className="mt-2 text-[11px] font-semibold text-slate-400">
          {formatearTiempo(
            notificacion.fechaRegistro,
          )}
        </p>
      </div>
    </button>
  );
}

function obtenerEstiloNotificacion(
  tipo: TipoNotificacion,
) {
  if (tipo === "PAGO_RECHAZADO") {
    return {
      icono:
        "bg-red-100 text-red-700",
      etiqueta:
        "bg-red-100 text-red-700",
      texto: "Rechazado",
      elemento: <XCircle size={23} />,
    };
  }

  if (tipo === "PAGO_APROBADO") {
    return {
      icono:
        "bg-emerald-100 text-emerald-700",
      etiqueta:
        "bg-emerald-100 text-emerald-700",
      texto: "Aprobado",
      elemento: (
        <CheckCircle2 size={23} />
      ),
    };
  }

  if (
    tipo ===
    "NUEVO_COMPROBANTE_PAGO"
  ) {
    return {
      icono:
        "bg-blue-100 text-blue-700",
      etiqueta:
        "bg-blue-100 text-blue-700",
      texto: "En revisión",
      elemento: <Clock3 size={23} />,
    };
  }

  if (
    tipo === "NUEVA_COMPRA" ||
    tipo === "NUEVA_RESERVA"
  ) {
    return {
      icono:
        "bg-amber-100 text-amber-700",
      etiqueta:
        "bg-amber-100 text-amber-700",
      texto: "Pasaje",
      elemento: (
        <TicketCheck size={23} />
      ),
    };
  }

  return {
    icono:
      "bg-slate-100 text-slate-600",
    etiqueta:
      "bg-slate-100 text-slate-600",
    texto: "Información",
    elemento: <Info size={23} />,
  };
}

function formatearTiempo(
  fecha: string,
): string {
  const fechaNotificacion =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaNotificacion.getTime(),
    )
  ) {
    return "Fecha no disponible";
  }

  const diferencia =
    Date.now() -
    fechaNotificacion.getTime();

  const minutos = Math.max(
    0,
    Math.floor(
      diferencia / 60_000,
    ),
  );

  if (minutos < 1) {
    return "Ahora";
  }

  if (minutos < 60) {
    return `Hace ${minutos} min`;
  }

  const horas = Math.floor(
    minutos / 60,
  );

  if (horas < 24) {
    return `Hace ${horas} ${
      horas === 1 ? "hora" : "horas"
    }`;
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(fechaNotificacion);
}

export default NotificacionesPasajero;