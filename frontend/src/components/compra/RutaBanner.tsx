import type { ReactNode } from "react";
import {
  BusFront,
  CalendarDays,
  Clock,
  DollarSign,
  MapPin,
  Users,
} from "lucide-react";

type Ruta = {
  origen?: string;
  destino?: string;
};

type Vehiculo = {
  marca?: string;
  modelo?: string;
  placa?: string;
};

type Viaje = {
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;
  asientosDisponibles?: number;
  ruta?: Ruta;
  vehiculo?: Vehiculo;
};

interface Props {
  viaje: Viaje | null;
}

function RutaBanner({ viaje }: Props) {
  if (!viaje) {
    return null;
  }

  const nombreVehiculo =
    `${viaje.vehiculo?.marca || ""} ${
      viaje.vehiculo?.modelo || ""
    }`.trim() || "Vehículo no asignado";

  return (
    <section className="mb-8 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 px-5 py-6 text-white sm:px-7 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur-sm">
            <MapPin size={28} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
              Viaje seleccionado
            </p>

            <h2 className="mt-2 break-words text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              {viaje.ruta?.origen || "---"}

              <span className="mx-2 text-lime-200 sm:mx-3">
                →
              </span>

              {viaje.ruta?.destino || "---"}
            </h2>

            <p className="mt-3 text-sm font-medium text-emerald-50/90">
              Revisa los datos del viaje antes de seleccionar tus asientos.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Info
            icono={<CalendarDays size={23} />}
            titulo="Fecha"
            valor={formatearFecha(viaje.fecha)}
          />

          <Info
            icono={<Clock size={23} />}
            titulo="Hora"
            valor={formatearHora(viaje.horaSalida)}
          />

          <Info
            icono={<BusFront size={23} />}
            titulo="Vehículo"
            valor={nombreVehiculo}
          />

          <Info
            icono={<Users size={23} />}
            titulo="Disponibles"
            valor={`${viaje.asientosDisponibles ?? 0} asientos`}
          />

          <Info
            icono={<DollarSign size={23} />}
            titulo="Precio"
            valor={`Bs. ${Number(viaje.precio || 0).toFixed(2)}`}
            destacado
          />
        </div>
      </div>
    </section>
  );
}

function Info({
  icono,
  titulo,
  valor,
  destacado = false,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        destacado
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl",
          destacado
            ? "bg-emerald-700 text-white"
            : "bg-white text-emerald-700 shadow-sm",
        ].join(" ")}
      >
        {icono}
      </div>

      <p
        className={[
          "mt-3 text-xs font-black uppercase tracking-[0.14em]",
          destacado ? "text-emerald-600" : "text-slate-400",
        ].join(" ")}
      >
        {titulo}
      </p>

      <h3
        className={[
          "mt-1 break-words text-base font-black sm:text-lg",
          destacado ? "text-emerald-800" : "text-slate-900",
        ].join(" ")}
      >
        {valor}
      </h3>
    </div>
  );
}

function formatearHora(hora?: string): string {
  if (!hora) {
    return "--:--";
  }

  return String(hora).substring(0, 5);
}

function formatearFecha(fecha?: string): string {
  if (!fecha) {
    return "---";
  }

  const fechaTexto = String(fecha).substring(0, 10);

  return new Date(
    `${fechaTexto}T00:00:00`
  ).toLocaleDateString("es-BO");
}

export default RutaBanner;