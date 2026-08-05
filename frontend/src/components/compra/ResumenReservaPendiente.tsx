import {
  Armchair,
  CalendarClock,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface ResumenReservaPendienteProps {
  origen?: string;
  destino?: string;
  fecha?: string;
  hora?: string;
  numerosAsientos?: Array<
    string | number
  >;
  total: number;
  guardando?: boolean;
  onReservar: () => void;
}

function ResumenReservaPendiente({
  origen,
  destino,
  fecha,
  hora,
  numerosAsientos = [],
  total,
  guardando = false,
  onReservar,
}: ResumenReservaPendienteProps) {
  const asientos =
    numerosAsientos.length > 0
      ? numerosAsientos.join(", ")
      : "Sin seleccionar";

  return (
    <section className="overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-xl shadow-amber-950/5">
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-white to-lime-50 px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
              <CalendarClock size={28} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Reserva temporal
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Reserva tus asientos por 2 horas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Podrás completar el pago posteriormente desde Mis Reservas.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white px-5 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total a pagar
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-800">
              Bs. {Number(total || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DatoResumen
            icono={<MapPin size={20} />}
            etiqueta="Ruta"
            valor={`${origen || "Origen"} → ${destino || "Destino"}`}
          />
          <DatoResumen
            icono={<CalendarClock size={20} />}
            etiqueta="Fecha"
            valor={fecha || "No seleccionada"}
          />
          <DatoResumen
            icono={<Clock3 size={20} />}
            etiqueta="Hora"
            valor={hora || "No seleccionada"}
          />
          <DatoResumen
            icono={<Armchair size={20} />}
            etiqueta="Asientos"
            valor={asientos}
          />
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
          <ShieldCheck
            size={22}
            className="mt-0.5 shrink-0"
          />
          <div>
            <p className="font-black">
              Bloqueo temporal de asientos
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Al confirmar, nadie más podrá comprar estos asientos durante 2 horas. Si no realizas el pago a tiempo, se liberarán automáticamente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReservar}
          disabled={
            guardando ||
            numerosAsientos.length === 0
          }
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 px-6 py-4 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? (
            <RefreshCw
              size={21}
              className="animate-spin"
            />
          ) : (
            <CalendarClock size={22} />
          )}

          {guardando
            ? "Guardando reserva..."
            : "Confirmar reserva por 2 horas"}
        </button>
      </div>
    </section>
  );
}

function DatoResumen({
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-emerald-700">
        {icono}
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {etiqueta}
        </p>
      </div>
      <p className="mt-3 break-words font-black text-slate-900">
        {valor}
      </p>
    </div>
  );
}

export default ResumenReservaPendiente;
