import type { FechaDisponible } from '../../services/viajes.service';

interface SelectorFechaDisponibleProps {
  fechas: FechaDisponible[];
  fechaSeleccionada: string;
  cargando: boolean;
  deshabilitado?: boolean;
  onSeleccionar: (fecha: string) => void;
}

function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');

  const fechaLocal = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
  );

  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fechaLocal);
}

export default function SelectorFechaDisponible({
  fechas,
  fechaSeleccionada,
  cargando,
  deshabilitado = false,
  onSeleccionar,
}: SelectorFechaDisponibleProps) {
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
        disabled={
          deshabilitado ||
          cargando ||
          fechas.length === 0
        }
        onChange={(event) =>
          onSeleccionar(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">
          {cargando
            ? 'Cargando fechas...'
            : fechas.length === 0
              ? 'No hay fechas disponibles'
              : 'Seleccione una fecha'}
        </option>

        {fechas.map((item) => (
          <option
            key={item.fecha}
            value={item.fecha}
          >
            {formatearFecha(item.fecha)} —{' '}
            {item.cantidadViajes}{' '}
            {item.cantidadViajes === 1
              ? 'viaje'
              : 'viajes'}
          </option>
        ))}
      </select>

      {!cargando &&
        fechas.length === 0 &&
        !deshabilitado && (
          <p className="text-sm text-amber-700">
            La administradora todavía no
            programó viajes para esta ruta.
          </p>
        )}
    </div>
  );
}