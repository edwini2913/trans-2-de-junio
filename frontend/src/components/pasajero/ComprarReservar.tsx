import type { FechaDisponible } from "../../services/viajes.service";

interface SelectorFechaDisponibleProps {
  fechas?: FechaDisponible[] | null;
  fechaSeleccionada?: string;
  cargando?: boolean;
  deshabilitado?: boolean;
  onSeleccionar?: (fecha: string) => void;
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

  const anioNumero = Number(anio);
  const mesNumero = Number(mes);
  const diaNumero = Number(dia);

  if (
    !Number.isInteger(anioNumero) ||
    !Number.isInteger(mesNumero) ||
    !Number.isInteger(diaNumero)
  ) {
    return fecha;
  }

  const fechaLocal = new Date(
    anioNumero,
    mesNumero - 1,
    diaNumero,
  );

  if (Number.isNaN(fechaLocal.getTime())) {
    return fecha;
  }

  const fechaFormateada = new Intl.DateTimeFormat("es-BO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fechaLocal);

  return (
    fechaFormateada.charAt(0).toUpperCase() +
    fechaFormateada.slice(1)
  );
}

export default function SelectorFechaDisponible({
  fechas,
  fechaSeleccionada = "",
  cargando = false,
  deshabilitado = false,
  onSeleccionar,
}: SelectorFechaDisponibleProps) {
  const listaFechas: FechaDisponible[] = Array.isArray(fechas)
    ? fechas
    : [];

  const selectorDeshabilitado =
    deshabilitado ||
    cargando ||
    listaFechas.length === 0;

  const manejarSeleccion = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    onSeleccionar?.(event.target.value);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="fechaDisponible"
        className="block text-sm font-semibold text-slate-700"
      >
        Fecha disponible
      </label>

      <select
        id="fechaDisponible"
        value={fechaSeleccionada}
        disabled={selectorDeshabilitado}
        onChange={manejarSeleccion}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        <option value="">
          {cargando
            ? "Cargando fechas..."
            : listaFechas.length === 0
              ? "No hay fechas disponibles"
              : "Seleccione una fecha"}
        </option>

        {listaFechas.map((item, indice) => {
          const fechaItem =
            typeof item?.fecha === "string"
              ? item.fecha
              : "";

          const cantidadViajes = Number(
            item?.cantidadViajes ?? 0,
          );

          if (!fechaItem) {
            return null;
          }

          return (
            <option
              key={`${fechaItem}-${indice}`}
              value={fechaItem}
            >
              {formatearFecha(fechaItem)} —{" "}
              {cantidadViajes}{" "}
              {cantidadViajes === 1
                ? "viaje"
                : "viajes"}
            </option>
          );
        })}
      </select>

      {!cargando &&
        listaFechas.length === 0 &&
        !deshabilitado && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            La administradora todavía no programó viajes para esta ruta.
          </p>
        )}
    </div>
  );
}