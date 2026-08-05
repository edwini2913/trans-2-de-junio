import {
  BusFront,
  CarFront,
  CheckCircle2,
  Clock3,
  LoaderCircle,
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

  onSeleccionarHorario: (horaSalida: string) => void;

  onSeleccionarVehiculo: (
    vehiculo: VehiculoDisponible,
    horaSalida: string
  ) => void;
}

function formatearHora(hora?: string): string {
  if (!hora) return "--:--";
  return String(hora).substring(0, 5);
}

function formatearPrecio(precio?: number): string {
  const valor = Number(precio || 0);

  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function obtenerNombreTipo(tipo?: string): string {
  return tipo === "FLOTA" ? "Flota" : "Toyota Noah";
}

export default function HorariosSalida({
  horarios,
  horarioSeleccionado,
  vehiculoSeleccionadoId,
  cargando,
  bloqueado = false,
  onSeleccionarHorario,
  onSeleccionarVehiculo,
}: HorariosSalidaProps) {
  const horarioActivo =
    horarios.find(
      (horario) =>
        horario.horaSalida === horarioSeleccionado
    ) || null;

  if (cargando) {
    return (
      <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
        <div className="flex min-h-52 items-center justify-center px-6 py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>

            <div>
              <p className="text-base font-black text-slate-900">
                Buscando salidas disponibles
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Estamos consultando los horarios y vehículos para tu viaje.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (horarios.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
              <Clock3 size={25} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Horarios disponibles
              </p>

              <h3 className="mt-1 text-2xl font-black text-slate-900">
                Selecciona un horario
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cada horario puede contar con varias flotas o vehículos Toyota
                Noah.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {horarios.map((horario) => {
              const seleccionado =
                horario.horaSalida === horarioSeleccionado;

              return (
                <button
                  key={horario.horaSalida}
                  type="button"
                  disabled={bloqueado}
                  onClick={() =>
                    onSeleccionarHorario(horario.horaSalida)
                  }
                  className={[
                    "relative rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    seleccionado
                      ? "border-emerald-600 bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md",
                  ].join(" ")}
                >
                  {seleccionado && (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-100" />
                  )}

                  <span
                    className={[
                      "block text-xs font-black uppercase tracking-wider",
                      seleccionado
                        ? "text-emerald-100"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    Salida
                  </span>

                  <strong className="mt-1 block text-2xl font-black">
                    {formatearHora(horario.horaSalida)}
                  </strong>

                  <span
                    className={[
                      "mt-2 block text-xs font-bold",
                      seleccionado
                        ? "text-emerald-100"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {horario.cantidadVehiculos}{" "}
                    {horario.cantidadVehiculos === 1
                      ? "vehículo"
                      : "vehículos"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {horarioActivo && (
        <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Vehículos disponibles
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  Selecciona el vehículo
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Elige el vehículo que prefieras para continuar con la compra.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-sm">
                <Clock3 size={18} />
                Salida: {formatearHora(horarioActivo.horaSalida)}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {horarioActivo.vehiculos.map((vehiculo) => {
                const seleccionado =
                  vehiculoSeleccionadoId === vehiculo.viajeId;

                const esFlota = vehiculo.tipo === "FLOTA";
                const sinAsientos =
                  Number(vehiculo.asientosDisponibles) <= 0;

                return (
                  <button
                    key={vehiculo.viajeId}
                    type="button"
                    disabled={bloqueado || sinAsientos}
                    onClick={() =>
                      onSeleccionarVehiculo(
                        vehiculo,
                        horarioActivo.horaSalida
                      )
                    }
                    className={[
                      "relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-200",
                      "disabled:cursor-not-allowed disabled:opacity-55",
                      seleccionado
                        ? "border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-700/10"
                        : "border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "absolute inset-x-0 top-0 h-1.5",
                        esFlota
                          ? "bg-emerald-700"
                          : "bg-lime-500",
                      ].join(" ")}
                    />

                    {seleccionado && (
                      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1 text-xs font-black text-white shadow-sm">
                        <CheckCircle2 size={15} />
                        Elegido
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={[
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                          esFlota
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-lime-100 text-lime-700",
                        ].join(" ")}
                      >
                        {esFlota ? (
                          <BusFront size={30} />
                        ) : (
                          <CarFront size={30} />
                        )}
                      </div>

                      <div className="min-w-0 pr-16">
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-black",
                            esFlota
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-lime-100 text-lime-700",
                          ].join(" ")}
                        >
                          {obtenerNombreTipo(vehiculo.tipo)}
                        </span>

                        <h4 className="mt-3 truncate text-lg font-black text-slate-900">
                          {vehiculo.marca} {vehiculo.modelo}
                        </h4>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Placa: {vehiculo.placa}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Users size={16} />
                          <span className="text-xs font-bold">
                            Asientos
                          </span>
                        </div>

                        <strong className="mt-1 block text-lg font-black text-slate-900">
                          {vehiculo.asientosDisponibles} de{" "}
                          {vehiculo.capacidad}
                        </strong>
                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                        <span className="text-xs font-bold text-emerald-600">
                          Precio
                        </span>

                        <strong className="mt-1 block text-lg font-black text-emerald-800">
                          Bs {formatearPrecio(vehiculo.precio)}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={[
                        "mt-4 rounded-2xl px-4 py-3 text-center text-sm font-black transition",
                        seleccionado
                          ? "bg-emerald-700 text-white"
                          : sinAsientos
                            ? "bg-red-50 text-red-600"
                            : "bg-slate-900 text-white hover:bg-emerald-700",
                      ].join(" ")}
                    >
                      {seleccionado
                        ? "Vehículo seleccionado"
                        : sinAsientos
                          ? "Sin asientos disponibles"
                          : "Elegir este vehículo"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}