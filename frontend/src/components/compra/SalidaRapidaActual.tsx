import {
  BusFront,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Users,
} from "lucide-react";

import type {
  TurnoSalidaRapida,
} from "../../services/salidas-rapidas.service";

interface SalidaRapidaActualProps {
  actual: TurnoSalidaRapida;
  siguiente?: TurnoSalidaRapida | null;
  actualizando?: boolean;
  onSeleccionar: (
    turno: TurnoSalidaRapida,
  ) => void;
}

const obtenerNombreVehiculo = (
  turno: TurnoSalidaRapida,
) => {
  const numero =
    turno.vehiculo.numeroFlota
      ? ` ${turno.vehiculo.numeroFlota}`
      : "";

  return `${turno.vehiculo.tipo}${numero}`;
};

export default function SalidaRapidaActual({
  actual,
  siguiente = null,
  actualizando = false,
  onSeleccionar,
}: SalidaRapidaActualProps) {
  const porcentaje =
    Math.min(
      Math.max(
        actual.ocupacion.porcentaje,
        0,
      ),
      100,
    );

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_18px_50px_rgba(15,118,76,0.10)]">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20">
              <BusFront size={25} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                Vehículo disponible ahora
              </p>

              <h3 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
                {obtenerNombreVehiculo(actual)}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {actual.vehiculo.marca}{" "}
                {actual.vehiculo.modelo} · Placa{" "}
                <strong className="text-slate-700">
                  {actual.vehiculo.placa}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
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
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <Users
                size={19}
                className="text-emerald-700"
              />

              <p className="mt-3 text-2xl font-black text-slate-950">
                {actual.ocupacion.ocupados}
              </p>

              <p className="text-xs font-semibold text-slate-500">
                Seleccionados
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <CheckCircle2
                size={19}
                className="text-emerald-700"
              />

              <p className="mt-3 text-2xl font-black text-emerald-800">
                {actual.ocupacion.disponibles}
              </p>

              <p className="text-xs font-semibold text-emerald-700">
                Disponibles
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <Clock3
                size={19}
                className="text-amber-600"
              />

              <p className="mt-3 text-2xl font-black text-amber-700">
                {actual.ocupacion.faltan}
              </p>

              <p className="text-xs font-semibold text-amber-700">
                Faltan
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <BusFront
                size={19}
                className="text-emerald-300"
              />

              <p className="mt-3 text-2xl font-black">
                {actual.vehiculo.capacidad}
              </p>

              <p className="text-xs font-semibold text-slate-300">
                Capacidad
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-slate-700">
                Nivel de ocupación
              </span>

              <span className="text-sm font-black text-emerald-700">
                {porcentaje}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
                style={{
                  width: `${porcentaje}%`,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onSeleccionar(actual)
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            <BusFront size={19} />
            Elegir asientos y continuar
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Orden de salida
          </p>

          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase text-emerald-700">
                  Vendiendo ahora
                </span>

                <p className="mt-3 font-black text-slate-900">
                  {obtenerNombreVehiculo(actual)}
                </p>

                <p className="text-sm text-slate-500">
                  Placa {actual.vehiculo.placa}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                1
              </div>
            </div>
          </div>

          {siguiente ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black uppercase text-amber-700">
                    Siguiente
                  </span>

                  <p className="mt-3 font-black text-slate-900">
                    {obtenerNombreVehiculo(siguiente)}
                  </p>

                  <p className="text-sm text-slate-500">
                    Placa{" "}
                    {siguiente.vehiculo.placa}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 font-black text-amber-700">
                  2
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-semibold text-slate-500">
              No existe otro vehículo esperando.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}