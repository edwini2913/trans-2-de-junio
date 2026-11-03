
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  BusFront,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";

import type {
  HorarioDisponible,
  VehiculoDisponible,
} from "../../services/viajes.service";

interface HorariosSalidaProps {
  horarios: HorarioDisponible[];
  horarioSeleccionado: string;
  vehiculoSeleccionadoId?: string;
  cargando: boolean;
  bloqueado?: boolean;
  onSeleccionarHorario: (
    horaSalida: string,
  ) => void;
  onSeleccionarVehiculo: (
    vehiculo: VehiculoDisponible,
    horaSalida: string,
  ) => void;
}

const precio = new Intl.NumberFormat(
  "es-BO",
  {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
);

const tipos: Record<string, string> = {
  FLOTA: "Flota",
  NOAH: "Toyota Noah",
  HIACE: "Toyota Hiace",
};

const panel =
  "min-w-0 rounded-2xl border " +
  "border-emerald-100 bg-white " +
  "p-3 shadow-sm sm:p-6";

const boton =
  "relative min-h-12 min-w-0 " +
  "rounded-xl border p-3 text-left " +
  "transition-all duration-200 " +
  "disabled:cursor-not-allowed " +
  "disabled:opacity-60";

const estilo = (
  elegido: boolean,
) =>
  elegido
    ? " border-emerald-700 " +
      "bg-emerald-50 text-emerald-900 " +
      "ring-1 ring-emerald-600/20"
    : " border-slate-200 bg-white " +
      "text-slate-800 " +
      "hover:border-emerald-500 " +
      "hover:bg-emerald-50/40";

export default function HorariosSalida({
  horarios,
  horarioSeleccionado,
  vehiculoSeleccionadoId,
  cargando,
  bloqueado = false,
  onSeleccionarHorario,
  onSeleccionarVehiculo,
}: HorariosSalidaProps) {
  const [
    horaAbierta,
    setHoraAbierta,
  ] = useState("");

  const activo = horarios.find(
    (horario) =>
      horario.horaSalida ===
      horarioSeleccionado,
  );

  const verVehiculos = Boolean(
    activo &&
      horaAbierta ===
        activo.horaSalida,
  );

  const tituloMovil =
    useRef<HTMLHeadingElement | null>(
      null,
    );

  const seccionHorariosRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const seccionVehiculosRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const botonAnterior =
    useRef<HTMLButtonElement | null>(
      null,
    );

  const desplazamientoPendienteRef =
    useRef(false);

  /*
   * Cuando se selecciona un horario,
   * se muestran sus vehículos y se
   * desplaza la pantalla automáticamente.
   *
   * Solo se aplica en pantallas móviles.
   */
  useEffect(() => {
    if (
      !verVehiculos ||
      cargando ||
      !desplazamientoPendienteRef.current
    ) {
      return;
    }

    desplazamientoPendienteRef.current =
      false;

    if (
      !window.matchMedia(
        "(max-width: 1023px)",
      ).matches
    ) {
      return;
    }

    const elemento =
      seccionVehiculosRef.current;

    if (!elemento) {
      return;
    }

    const animacion =
      window.requestAnimationFrame(
        () => {
          elemento.scrollIntoView({
            behavior: window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches
              ? "instant"
              : "smooth",
            block: "start",
          });
        },
      );

    return () => {
      window.cancelAnimationFrame(
        animacion,
      );
    };
  }, [
    verVehiculos,
    cargando,
    horaAbierta,
  ]);

  /*
   * Si se cambia la ruta o fecha,
   * no debemos conservar abierto
   * un horario que ya no existe.
   */
  useEffect(() => {
    if (
      horaAbierta &&
      !horarios.some(
        (horario) =>
          horario.horaSalida ===
          horaAbierta,
      )
    ) {
      setHoraAbierta("");
    }
  }, [
    horarios,
    horaAbierta,
  ]);

  const cambiarHorario = (
    horario: HorarioDisponible,
    elemento: HTMLButtonElement,
  ) => {
    if (bloqueado) {
      return;
    }

    botonAnterior.current = elemento;

    desplazamientoPendienteRef.current =
      true;

    setHoraAbierta(
      horario.horaSalida,
    );

    onSeleccionarHorario(
      horario.horaSalida,
    );
  };

  const volverHorarios = () => {
    if (bloqueado) {
      return;
    }

    desplazamientoPendienteRef.current =
      false;

    setHoraAbierta("");

    window.requestAnimationFrame(
      () => {
        const seccion =
          seccionHorariosRef.current;

        seccion?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        botonAnterior.current?.focus({
          preventScroll: true,
        });
      },
    );
  };

  const elegirVehiculo = (
    vehiculo: VehiculoDisponible,
    horaSalida: string,
  ) => {
    if (bloqueado) {
      return;
    }

    if (
      Number(
        vehiculo.asientosDisponibles,
      ) <= 0
    ) {
      return;
    }

    /*
     * El componente principal
     * ComprarReservar se encarga
     * de cargar y mostrar los asientos.
     */
    onSeleccionarVehiculo(
      vehiculo,
      horaSalida,
    );
  };

  if (cargando) {
    return (
      <div
        className={`${panel} mt-4`}
        role="status"
      >
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-700" />

          <div>
            <p className="font-bold text-emerald-900">
              Buscando salidas disponibles
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Consultando horarios y vehículos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!horarios.length) {
    return (
      <div
        className={`${panel} mt-4`}
        role="status"
      >
        <div className="flex items-center gap-3">
          <Clock3
            size={24}
            className="shrink-0 text-emerald-700"
          />

          <div>
            <p className="font-bold text-slate-800">
              No hay horarios disponibles
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona otra fecha o ruta
              para encontrar salidas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-4 min-w-0 space-y-3">
      {/* SELECCIÓN DE HORARIOS */}

      <div
        ref={seccionHorariosRef}
        className={
          panel +
          " scroll-mt-28 " +
          (verVehiculos
            ? "hidden lg:block"
            : "")
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Clock3 size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              Horarios disponibles
            </p>

            <h3 className="text-base font-black text-slate-900 sm:text-lg">
              ¿A qué hora quieres salir?
            </h3>
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
          Selecciona un horario para ver
          los vehículos disponibles.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {horarios.map(
            (horario) => {
              const elegido =
                horario.horaSalida ===
                horarioSeleccionado;

              return (
                <button
                  key={
                    horario.horaSalida
                  }
                  type="button"
                  disabled={bloqueado}
                  aria-pressed={elegido}
                  className={
                    boton +
                    estilo(elegido) +
                    " flex flex-col justify-center"
                  }
                  onClick={(
                    event,
                  ) => {
                    cambiarHorario(
                      horario,
                      event.currentTarget,
                    );
                  }}
                >
                  {elegido && (
                    <CheckCircle2
                      size={16}
                      className="absolute right-2 top-2 text-emerald-700"
                    />
                  )}

                  <strong className="block text-xl font-black tabular-nums sm:text-2xl">
                    {horario.horaSalida.slice(
                      0,
                      5,
                    )}
                  </strong>

                  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <BusFront
                      size={13}
                      className="shrink-0"
                    />

                    {horario.cantidadVehiculos}{" "}
                    {horario.cantidadVehiculos ===
                    1
                      ? "vehículo"
                      : "vehículos"}
                  </span>

                  {elegido && (
                    <span className="mt-2 text-[11px] font-black text-emerald-700">
                      Seleccionado
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* VEHÍCULOS DISPONIBLES */}

      {activo && (
        <div
          ref={seccionVehiculosRef}
          className={
            panel +
            " scroll-mt-28 " +
            (verVehiculos
              ? ""
              : " hidden lg:block")
          }
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BusFront size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Siguiente paso
              </p>

              <h3
                ref={tituloMovil}
                tabIndex={-1}
                className="text-base font-black text-slate-900 outline-none sm:text-lg"
              >
                Elige un vehículo
              </h3>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Salida:{" "}
                {activo.horaSalida.slice(
                  0,
                  5,
                )}
              </p>
            </div>
          </div>

          {/* VOLVER AL HORARIO */}

          <button
            type="button"
            disabled={bloqueado}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 lg:hidden"
            onClick={
              volverHorarios
            }
          >
            <ArrowLeft size={17} />
            Cambiar horario
          </button>

          {!activo.vehiculos.length && (
            <div
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              role="status"
            >
              Esta salida no tiene vehículos
              disponibles.
            </div>
          )}

          <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activo.vehiculos.map(
              (vehiculo) => {
                const elegido =
                  vehiculo.viajeId ===
                  vehiculoSeleccionadoId;

                const sinAsientos =
                  Number(
                    vehiculo.asientosDisponibles,
                  ) <= 0;

                const nombreVehiculo =
                  `${tipos[vehiculo.tipo] ??
                    vehiculo.tipo} · ${
                    vehiculo.marca
                  } ${
                    vehiculo.modelo
                  }`.trim();

                return (
                  <button
                    key={
                      vehiculo.viajeId
                    }
                    type="button"
                    disabled={
                      bloqueado ||
                      sinAsientos
                    }
                    aria-pressed={
                      elegido
                    }
                    className={
                      boton +
                      estilo(elegido) +
                      " w-full p-3 sm:p-4"
                    }
                    onClick={() =>
                      elegirVehiculo(
                        vehiculo,
                        activo.horaSalida,
                      )
                    }
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <BusFront
                          size={22}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <strong className="block break-words text-sm font-black leading-5 sm:text-base">
                          {nombreVehiculo}
                        </strong>

                        <span className="mt-1 block break-words text-xs text-slate-500">
                          Placa:{" "}
                          {vehiculo.placa}
                        </span>
                      </div>

                      {elegido && (
                        <CheckCircle2
                          size={20}
                          className="shrink-0 text-emerald-700"
                        />
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="min-w-0 rounded-lg bg-slate-50 p-2">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Users
                            size={13}
                          />

                          <span className="text-[10px] font-bold uppercase">
                            Disponibles
                          </span>
                        </div>

                        <strong className="mt-1 block text-sm font-black">
                          {
                            vehiculo.asientosDisponibles
                          }{" "}
                          /{" "}
                          {
                            vehiculo.capacidad
                          }
                        </strong>
                      </div>

                      <div className="min-w-0 rounded-lg bg-emerald-50 p-2">
                        <span className="block text-[10px] font-bold uppercase text-emerald-700">
                          Precio
                        </span>

                        <strong className="mt-1 block text-sm font-black text-emerald-800">
                          Bs{" "}
                          {precio.format(
                            Number(
                              vehiculo.precio ||
                                0,
                            ),
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        "mt-3 rounded-lg px-3 py-2 " +
                        "text-center text-xs font-black " +
                        (sinAsientos
                          ? "bg-slate-100 text-slate-400"
                          : elegido
                            ? "bg-emerald-700 text-white"
                            : "bg-emerald-50 text-emerald-800")
                      }
                    >
                      {sinAsientos
                        ? "Sin asientos disponibles"
                        : elegido
                          ? "Vehículo seleccionado"
                          : "Seleccionar vehículo"}
                    </div>
                  </button>
                );
              },
            )}
          </div>
        </div>
      )}
    </section>
  );
}
