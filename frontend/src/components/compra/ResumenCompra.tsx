import type { ReactNode } from "react";

import {
  Armchair,
  CalendarDays,
  Clock,
  MapPin,
  QrCode,
  Ticket,
  User,
} from "lucide-react";

type AsientoSeleccionado = {
  id: string;
  numero: number | string;
};

interface Props {
  pasajero: string;
  origen?: string;
  destino?: string;
  fecha?: string;
  hora?: string;
  asientos: AsientoSeleccionado[];
  precioUnitario: number;
  deshabilitado?: boolean;
  onGenerarPagoQR: () => void;
}

function ResumenCompra({
  pasajero,
  origen,
  destino,
  fecha,
  hora,
  asientos,
  precioUnitario,
  deshabilitado = false,
  onGenerarPagoQR,
}: Props) {
  const cantidadAsientos = asientos.length;
  const total = precioUnitario * cantidadAsientos;

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 px-5 py-6 text-white sm:px-7 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
            <Ticket size={28} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
              Resumen de compra
            </p>

            <h2 className="mt-1 text-3xl font-black leading-tight">
              Verifica tus datos
            </h2>

            <p className="mt-2 text-sm font-medium text-emerald-50/90">
              Revisa la información antes de generar el pago por QR.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DatoResumen
            icono={<User size={21} />}
            titulo="Pasajero"
            valor={pasajero || "Pasajero"}
          />

          <DatoResumen
            icono={<MapPin size={21} />}
            titulo="Ruta"
            valor={`${origen || "---"} → ${destino || "---"}`}
          />

          <DatoResumen
            icono={<CalendarDays size={21} />}
            titulo="Fecha"
            valor={formatearFecha(fecha)}
          />

          <DatoResumen
            icono={<Clock size={21} />}
            titulo="Hora"
            valor={formatearHora(hora)}
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_310px]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Armchair size={23} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                  Selección
                </p>

                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Asientos seleccionados
                </h3>
              </div>
            </div>

            {asientos.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {asientos.map((asiento) => (
                  <span
                    key={asiento.id}
                    className="flex min-w-[66px] items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-lg font-black text-amber-900 shadow-sm"
                  >
                    #{asiento.numero}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center">
                <Armchair
                  size={38}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-bold text-slate-600">
                  Todavía no seleccionaste ningún asiento.
                </p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 shadow-sm">
            <div className="bg-emerald-700 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-white">
              Total de la compra
            </div>

            <div className="space-y-4 p-5">
              <FilaPrecio
                titulo="Cantidad"
                valor={`${cantidadAsientos} ${
                  cantidadAsientos === 1 ? "pasaje" : "pasajes"
                }`}
              />

              <FilaPrecio
                titulo="Precio unitario"
                valor={`Bs. ${precioUnitario.toFixed(2)}`}
              />

              <div className="border-t border-emerald-200 pt-4">
                <p className="text-sm font-semibold text-emerald-700">
                  Total a pagar
                </p>

                <p className="mt-1 break-words text-4xl font-black text-emerald-800">
                  Bs. {total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-medium leading-relaxed text-emerald-800">
            Se generará un único ticket electrónico con todos los asientos
            seleccionados.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerarPagoQR}
          disabled={deshabilitado || asientos.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <QrCode size={23} />
          Generar pago por QR
        </button>
      </div>
    </section>
  );
}

function DatoResumen({
  icono,
  titulo,
  valor,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
        {icono}
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-[0.13em] text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 break-words font-black text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function FilaPrecio({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-slate-500">
        {titulo}
      </span>

      <strong className="text-right text-slate-900">
        {valor}
      </strong>
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

export default ResumenCompra;