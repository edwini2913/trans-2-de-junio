import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Route,
} from "lucide-react";

export type RutaBusqueda = {
  id: string;
  origen: string;
  destino: string;
};

interface BusquedaViajeProps {
  rutas?: RutaBusqueda[] | null;
  rutaId?: string;
  fecha?: string;
  fechaMinima?: string;
  cargandoRutas?: boolean;
  bloqueado?: boolean;
  onCambiarRuta?: (rutaId: string) => void;
  onCambiarFecha?: (fecha: string) => void;
}

function BusquedaViaje({
  rutas,
  rutaId = "",
  fecha = "",
  fechaMinima = "",
  cargandoRutas = false,
  bloqueado = false,
  onCambiarRuta,
  onCambiarFecha,
}: BusquedaViajeProps) {
  /*
   * Evita que el componente falle si la respuesta del backend todavía
   * no llegó o si rutas viene como undefined, null u otro valor.
   */
  const listaRutas: RutaBusqueda[] = Array.isArray(rutas)
    ? rutas
    : [];

  const rutaSeleccionada = listaRutas.find(
    (ruta) => String(ruta.id) === String(rutaId),
  );

  const seleccionCompleta = Boolean(rutaId) && Boolean(fecha);

  const manejarCambioRuta = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onCambiarRuta?.(event.target.value);
  };

  const manejarCambioFecha = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onCambiarFecha?.(event.target.value);
  };

  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Buscar viaje
            </p>

            <h3 className="mt-1 text-2xl font-black text-slate-900">
              1. Ruta y fecha
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Selecciona el destino y la fecha en la que deseas viajar.
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
              seleccionCompleta
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {seleccionCompleta ? (
              <CheckCircle2 size={18} />
            ) : (
              <Route size={18} />
            )}

            {seleccionCompleta
              ? "Selección completa"
              : "Completa ambos campos"}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="ruta-viaje"
              className="flex items-center gap-2 text-sm font-black text-slate-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MapPin size={17} />
              </span>

              Ruta de viaje
            </label>

            <div className="relative mt-3">
              <select
                id="ruta-viaje"
                value={rutaId}
                disabled={cargandoRutas || bloqueado}
                onChange={manejarCambioRuta}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pr-11 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {cargandoRutas
                    ? "Cargando rutas..."
                    : listaRutas.length === 0
                      ? "No hay rutas disponibles"
                      : "Elegir ruta..."}
                </option>

                {listaRutas.map((ruta) => (
                  <option
                    key={String(ruta.id)}
                    value={String(ruta.id)}
                  >
                    {ruta.origen} → {ruta.destino}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-emerald-700">
                <Route size={19} />
              </div>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Elige el origen y destino correspondiente a tu viaje.
            </p>

            {!cargandoRutas && listaRutas.length === 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                No se encontraron rutas disponibles. Intenta nuevamente más
                tarde.
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="fecha-viaje"
              className="flex items-center gap-2 text-sm font-black text-slate-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarDays size={17} />
              </span>

              Fecha de viaje
            </label>

            <div className="relative mt-3">
              <input
                id="fecha-viaje"
                type="date"
                value={fecha}
                min={fechaMinima || undefined}
                disabled={bloqueado}
                onChange={manejarCambioFecha}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Solo puedes seleccionar fechas disponibles desde hoy en
              adelante.
            </p>
          </div>
        </div>

        {rutaSeleccionada && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
                <Route size={23} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">
                  Ruta seleccionada
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {rutaSeleccionada.origen}{" "}
                  <span className="text-emerald-600">→</span>{" "}
                  {rutaSeleccionada.destino}
                </p>
              </div>
            </div>

            {fecha && (
              <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                <span className="text-slate-400">Fecha:</span>{" "}
                {formatearFecha(fecha)}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function formatearFecha(fecha: string): string {
  if (!fecha) {
    return "";
  }

  const partes = fecha.split("-");

  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes;

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

export default BusquedaViaje;