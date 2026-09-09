import {
  AlertCircle,
  Bell,
  BusFront,
  CheckCircle2,
  Clock3,
  Construction,
  Info,
  Loader2,
  RefreshCw,
  Route,
  TriangleAlert,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  AvisoSalidaRapida,
  TurnoSalidaRapida,
} from "../../services/salidas-rapidas.service";

import {
  obtenerAvisoSalidaActivo,
} from "../../services/salidas-rapidas.service";

import {
  useSalidasRapidas,
} from "../../hooks/compra/useSalidasRapidas";

interface SectorRapidoCompraProps {
  rutaId: string;
  fecha: string;
  bloqueado?: boolean;

  onSeleccionar: (
    turno: TurnoSalidaRapida,
  ) => void;

  onElegirFlota?: () => void;

  onDisponibilidadSuspendida?: () => void;
}

const obtenerEtiquetaEstado = (
  turno: TurnoSalidaRapida,
) => {
  switch (turno.estado) {
    case "VENDIENDO":
      return {
        texto:
          "Disponible ahora",
        clase:
          "bg-emerald-100 text-emerald-700",
      };

    case "SIGUIENTE":
      return {
        texto:
          "Próxima salida",
        clase:
          "bg-amber-100 text-amber-700",
      };

    case "EN_ESPERA":
      return {
        texto:
          "Salida posterior",
        clase:
          "bg-sky-100 text-sky-700",
      };

    case "COMPLETO":
      return {
        texto:
          "Completo",
        clase:
          "bg-red-100 text-red-700",
      };

    default:
      return {
        texto:
          turno.estado,
        clase:
          "bg-slate-100 text-slate-600",
      };
  }
};

const formatearHora = (
  hora?: string,
) => {
  if (!hora) {
    return "--:--";
  }

  return hora.substring(0, 5);
};

export default function SectorRapidoCompra({
  rutaId,
  fecha,
  bloqueado = false,
  onSeleccionar,
  onElegirFlota,
  onDisponibilidadSuspendida,
}: SectorRapidoCompraProps) {
  const [
    turnoSeleccionadoId,
    setTurnoSeleccionadoId,
  ] = useState("");

  const [
    avisoActivo,
    setAvisoActivo,
  ] = useState<AvisoSalidaRapida | null>(
    null,
  );

  const [
    cargandoAviso,
    setCargandoAviso,
  ] = useState(false);

  const [
    actualizandoAviso,
    setActualizandoAviso,
  ] = useState(false);

  const [
    servicioParcialAceptado,
    setServicioParcialAceptado,
  ] = useState(false);

  const limpiarSeleccionRef =
    useRef(
      onDisponibilidadSuspendida,
    );

  useEffect(() => {
    limpiarSeleccionRef.current =
      onDisponibilidadSuspendida;
  }, [onDisponibilidadSuspendida]);

  const {
    fila,
    cargando,
    actualizando,
    error,
  } = useSalidasRapidas({
    rutaId,
    fecha,
    activo:
      Boolean(rutaId && fecha),
  });

  const consultarAviso =
    useCallback(
      async (
        mostrarCarga = false,
      ) => {
        if (!rutaId || !fecha) {
          setAvisoActivo(null);
          return;
        }

        try {
          if (mostrarCarga) {
            setCargandoAviso(true);
          } else {
            setActualizandoAviso(true);
          }

          const aviso =
            await obtenerAvisoSalidaActivo(
              rutaId,
              fecha,
            );

          setAvisoActivo(aviso);
        } catch {
          setAvisoActivo(null);
        } finally {
          setCargandoAviso(false);
          setActualizandoAviso(false);
        }
      },
      [fecha, rutaId],
    );

  useEffect(() => {
    void consultarAviso(true);

    const intervaloAviso =
      window.setInterval(() => {
        void consultarAviso();
      }, 3000);

    return () => {
      window.clearInterval(
        intervaloAviso,
      );
    };
  }, [consultarAviso]);

  useEffect(() => {
    if (
      avisoActivo &&
      (
        avisoActivo.tipoServicio ===
          "SUSPENSION_TOTAL" ||
        avisoActivo.permiteCompra === false
      ) &&
      onDisponibilidadSuspendida
    ) {
      setTurnoSeleccionadoId("");
      onDisponibilidadSuspendida();
    }
  }, [
    avisoActivo,
    onDisponibilidadSuspendida,
  ]);

  useEffect(() => {
    setServicioParcialAceptado(false);
    setTurnoSeleccionadoId("");

    if (
      avisoActivo?.tipoServicio ===
        "SERVICIO_PARCIAL"
    ) {
      limpiarSeleccionRef.current?.();
    }
  }, [avisoActivo?.id]);

  const suspensionTotal =
    Boolean(avisoActivo) &&
    (
      avisoActivo?.tipoServicio ===
        "SUSPENSION_TOTAL" ||
      avisoActivo?.permiteCompra === false
    );

  const servicioParcial =
    avisoActivo?.tipoServicio ===
    "SERVICIO_PARCIAL";

  const compraBloqueada =
    bloqueado ||
    (servicioParcial &&
      !servicioParcialAceptado);

  /**
   * Se muestran solamente los vehículos
   * que todavía no salieron.
   */
  const vehiculosDisponibles =
    useMemo(
      () =>
        fila
          .filter(
            (turno) =>
              turno.activo &&
              [
                "VENDIENDO",
                "SIGUIENTE",
                "EN_ESPERA",
                "COMPLETO",
              ].includes(
                turno.estado,
              ),
          ),
      [fila],
    );

  const seleccionarTurno = (
    turno: TurnoSalidaRapida,
  ) => {
    if (
      compraBloqueada ||
      turno.estado ===
        "COMPLETO" ||
      turno.ocupacion.disponibles <=
        0
    ) {
      return;
    }

    setTurnoSeleccionadoId(
      turno.id,
    );

    onSeleccionar(turno);
  };

  if (!rutaId || !fecha) {
    return (
      <section className="mt-6 rounded-[28px] border border-emerald-100 bg-white p-7 shadow-[0_16px_45px_rgba(15,118,76,0.08)]">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Route size={27} />
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-900">
            Selecciona una ruta y fecha
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Luego podrás elegir cualquiera de
            los vehículos Noah o Hiace
            habilitados por administración.
          </p>
        </div>
      </section>
    );
  }

  if (cargando || cargandoAviso) {
    return (
      <section className="mt-6 flex min-h-[240px] items-center justify-center rounded-[28px] border border-emerald-100 bg-white p-7 shadow-[0_16px_45px_rgba(15,118,76,0.08)]">
        <div className="text-center">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-emerald-700"
          />

          <p className="mt-4 font-black text-emerald-800">
            Buscando Noah y Hiace...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Consultando vehículos y
            asientos disponibles.
          </p>
        </div>
      </section>
    );
  }

  if (avisoActivo && suspensionTotal) {
    return (
      <section className="mt-6 overflow-hidden rounded-[30px] border border-red-200 bg-white shadow-[0_22px_60px_rgba(185,28,28,0.16)]">
        <header className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-emerald-800 px-6 py-7 text-white sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full border-[34px] border-white/10" />
          <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full bg-emerald-950/20" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-white/20 bg-white text-red-600 shadow-2xl sm:h-28 sm:w-28">
              <Construction size={56} />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full border border-white/30 bg-red-700/80 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] shadow-lg">
                Servicio suspendido
              </span>

              <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {avisoActivo.titulo}
              </h3>

              <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-2xl border border-red-200 bg-white px-5 py-3 text-red-700 shadow-xl">
                <TriangleAlert
                  size={26}
                  className="shrink-0"
                />

                <span className="truncate text-sm font-black uppercase tracking-[0.08em] sm:text-base">
                  {avisoActivo.motivo
                    .replaceAll("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4 rounded-3xl border border-red-100 bg-red-50/60 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
              <AlertCircle size={24} />
            </div>

            <p className="pt-1 text-sm font-semibold leading-7 text-slate-800 sm:text-base">
              {avisoActivo.mensaje}
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-3xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 text-red-700">
              <span className="relative flex h-4 w-4 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-red-600" />
              </span>

              <p className="font-black">
                Las compras y reservas están temporalmente pausadas
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={actualizandoAviso}
                onClick={() =>
                  void consultarAviso(false)
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:opacity-60"
              >
                <RefreshCw
                  size={19}
                  className={
                    actualizandoAviso
                      ? "animate-spin"
                      : ""
                  }
                />
                Actualizar disponibilidad
              </button>

              {onElegirFlota && (
                <button
                  type="button"
                  onClick={onElegirFlota}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white px-6 py-4 font-black text-emerald-700 transition hover:bg-emerald-50"
                >
                  <BusFront size={19} />
                  Elegir Sector Flotas
                </button>
              )}
            </div>
          </div>

          <footer className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <Bell size={18} />
              Te avisaremos cuando administración habilite una nueva movilidad.
            </span>

            <span className="text-xs text-emerald-700">
              Publicado por administración ·{" "}
              {new Intl.DateTimeFormat(
                "es-BO",
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone:
                    "America/La_Paz",
                },
              ).format(
                new Date(
                  avisoActivo.fechaPublicacion,
                ),
              )}
            </span>
          </footer>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-3 text-red-700">
          <AlertCircle
            size={22}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-black">
              No se pudo consultar la fila
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (
    vehiculosDisponibles.length ===
    0
  ) {
    return (
      <section className="mt-6 rounded-[28px] border border-amber-200 bg-white p-7 shadow-[0_16px_45px_rgba(15,118,76,0.08)]">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <BusFront size={27} />
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-900">
            No hay salidas rápidas
          </h3>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            La secretaria todavía no habilitó
            vehículos Noah o Hiace para esta
            ruta y fecha.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {avisoActivo && !suspensionTotal && (
        <section
          className={`mt-6 overflow-hidden rounded-[28px] border bg-white shadow-lg ${
            servicioParcial
              ? "border-amber-300 shadow-amber-900/10"
              : "border-sky-200 shadow-sky-900/10"
          }`}
        >
          <header
            className={`px-5 py-5 text-white sm:px-7 ${
              servicioParcial
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-700"
                : "bg-gradient-to-r from-sky-600 to-emerald-700"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                {servicioParcial ? (
                  <TriangleAlert size={30} />
                ) : (
                  <Info size={30} />
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">
                  {servicioParcial
                    ? "Servicio parcial habilitado"
                    : "Comunicado de administración"}
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  {avisoActivo.titulo}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90">
                  {avisoActivo.mensaje}
                </p>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-7">
            {servicioParcial ? (
              <>
                <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                    Punto final temporal
                  </p>

                  <p className="mt-2 text-xl font-black text-slate-950">
                    El vehículo llegará solamente hasta {avisoActivo.puntoLlegadaTemporal}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Confirma que estás de acuerdo con este punto de llegada antes de elegir el vehículo.
                  </p>
                </div>

                <label
                  className={`mt-4 flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition ${
                    servicioParcialAceptado
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-slate-50 hover:border-amber-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={servicioParcialAceptado}
                    onChange={(evento) => {
                      setServicioParcialAceptado(
                        evento.target.checked,
                      );

                      if (!evento.target.checked) {
                        setTurnoSeleccionadoId("");
                        onDisponibilidadSuspendida?.();
                      }
                    }}
                    className="mt-1 h-5 w-5 accent-emerald-700"
                  />

                  <span>
                    <strong className="block text-slate-900">
                      Acepto viajar solamente hasta {avisoActivo.puntoLlegadaTemporal}
                    </strong>
                    <span className="mt-1 block text-sm text-slate-500">
                      Al aceptar podrás elegir el vehículo y continuar con la compra o reserva.
                    </span>
                  </span>
                </label>
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
                <CheckCircle2 size={20} />
                Las compras y reservas continúan habilitadas normalmente.
              </div>
            )}
          </div>
        </section>
      )}

    <section
      className={`mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_16px_45px_rgba(15,118,76,0.08)] ${
        compraBloqueada
          ? "pointer-events-none opacity-70"
          : ""
      }`}
    >
      <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
              <BusFront size={25} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Sector Noah y Hiace
              </p>

              <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                Elige tu vehículo
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Puedes comprar o reservar
                anticipadamente en cualquiera
                de las próximas salidas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase text-emerald-700">
            {actualizando ? (
              <RefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
              </span>
            )}

            En tiempo real
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {vehiculosDisponibles.map(
            (turno) => {
              const seleccionado =
                turnoSeleccionadoId ===
                turno.id;

              const estado =
                obtenerEtiquetaEstado(
                  turno,
                );

              const completo =
                turno.estado ===
                  "COMPLETO" ||
                turno.ocupacion
                  .disponibles <= 0;

              return (
                <article
                  key={turno.id}
                  className={`relative overflow-hidden rounded-3xl border-2 p-5 transition ${
                    seleccionado
                      ? "border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-700/10"
                      : completo
                      ? "border-red-200 bg-red-50/60"
                      : "border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-black text-white">
                      {turno.posicion}
                    </span>

                    {seleccionado && (
                      <CheckCircle2
                        size={22}
                        className="text-emerald-700"
                      />
                    )}
                  </div>

                  <span
                    className={`mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${estado.clase}`}
                  >
                    {estado.texto}
                  </span>

                  <div className="mt-4">
                    <p className="text-lg font-black text-slate-950">
                      {turno.vehiculo.tipo}
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-600">
                      {turno.vehiculo.marca}{" "}
                      {turno.vehiculo.modelo}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Placa{" "}
                      <strong>
                        {turno.vehiculo.placa}
                      </strong>
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Clock3 size={17} />

                      <span className="text-sm font-black">
                        {turno.estado ===
                        "VENDIENDO"
                          ? "Ahora"
                          : `Aprox. ${formatearHora(
                              turno.viaje
                                .horaSalida,
                            )}`}
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      Hora aproximada
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-emerald-50 p-3 text-center">
                      <p className="text-xl font-black text-emerald-700">
                        {
                          turno.ocupacion
                            .disponibles
                        }
                      </p>

                      <p className="text-[10px] font-bold text-emerald-700">
                        Disponibles
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-3 text-center">
                      <p className="text-xl font-black text-amber-700">
                        {
                          turno.ocupacion
                            .faltan
                        }
                      </p>

                      <p className="text-[10px] font-bold text-amber-700">
                        Faltan
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          turno.ocupacion
                            .porcentaje,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>
                      <Users
                        size={13}
                        className="mr-1 inline"
                      />

                      {
                        turno.ocupacion
                          .ocupados
                      }
                      /
                      {
                        turno.ocupacion
                          .capacidad
                      }
                    </span>

                    <span>
                      {
                        turno.ocupacion
                          .porcentaje
                      }
                      %
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={
                      completo ||
                      compraBloqueada
                    }
                    onClick={() =>
                      seleccionarTurno(
                        turno,
                      )
                    }
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                      seleccionado
                        ? "bg-emerald-800 text-white"
                        : completo
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    <BusFront size={17} />

                    {completo
                      ? "Sin asientos"
                      : seleccionado
                      ? "Vehículo elegido"
                      : "Elegir vehículo"}
                  </button>
                </article>
              );
            },
          )}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <Clock3
            size={20}
            className="mt-0.5 shrink-0"
          />

          <p className="leading-6">
            <strong>
              Horas aproximadas:
            </strong>{" "}
            los vehículos Noah y Hiace salen
            cuando completan sus asientos o
            cuando la secretaria autoriza la
            salida. La hora puede adelantarse
            o retrasarse.
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
