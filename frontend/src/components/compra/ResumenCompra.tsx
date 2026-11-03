
import {
  Armchair,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  UserRound,
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

function formatearFecha(
  fecha?: string,
): string {
  const partes = fecha
    ?.slice(0, 10)
    .match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  return partes
    ? `${partes[3]}/${partes[2]}/${partes[1]}`
    : "---";
}

const formatoMoneda =
  new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatearMonto(
  monto: number,
): string {
  return formatoMoneda.format(
    Number.isFinite(monto) ? monto : 0,
  );
}

export default function ResumenCompra({
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
  const cantidad = asientos.length;

  const total =
    cantidad * precioUnitario;

  const puedeContinuar =
    !deshabilitado &&
    cantidad > 0 &&
    Number.isFinite(precioUnitario) &&
    precioUnitario > 0;

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-md shadow-emerald-950/5 sm:rounded-3xl">
      {/* ENCABEZADO COMPACTO */}

      <header className="border-b border-emerald-100 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 px-3 py-4 text-white sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-14 sm:w-14">
            <Ticket
              size={25}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 sm:text-xs">
              Confirma tu viaje
            </p>

            <h2 className="mt-1 text-lg font-black leading-tight sm:text-2xl">
              Resumen de compra
            </h2>
          </div>

          <CheckCircle2
            size={23}
            className="shrink-0 text-lime-200"
            aria-hidden="true"
          />
        </div>
      </header>

      <div className="space-y-4 p-3 sm:space-y-5 sm:p-6">
        {/* RUTA SELECCIONADA */}

        <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                Ruta seleccionada
              </p>

              <p className="mt-1 break-words text-base font-black leading-snug text-slate-900 sm:text-xl">
                {origen || "---"}
                <span className="mx-2 text-emerald-600">
                  →
                </span>
                {destino || "---"}
              </p>
            </div>
          </div>
        </div>

        {/* DATOS DEL PASAJERO */}

        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 sm:px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
            <UserRound
              size={19}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Pasajero
            </p>

            <p className="mt-0.5 break-words text-sm font-black text-slate-900 sm:text-base">
              {pasajero || "Pasajero"}
            </p>
          </div>
        </div>

        {/* FECHA Y HORA */}

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <CalendarDays
                size={17}
                className="shrink-0"
                aria-hidden="true"
              />

              <span className="text-xs font-bold text-slate-500">
                Fecha
              </span>
            </div>

            <p className="mt-2 break-words text-sm font-black tabular-nums text-slate-900 sm:text-base">
              {formatearFecha(fecha)}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Clock3
                size={17}
                className="shrink-0"
                aria-hidden="true"
              />

              <span className="text-xs font-bold text-slate-500">
                Hora de salida
              </span>
            </div>

            <p className="mt-2 break-words text-sm font-black tabular-nums text-slate-900 sm:text-base">
              {hora?.slice(0, 5) || "--:--"}
            </p>
          </div>
        </div>

        {/* ASIENTOS SELECCIONADOS */}

        <div className="min-w-0 rounded-xl border border-amber-100 bg-amber-50/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Armchair
                size={19}
                className="text-amber-700"
                aria-hidden="true"
              />

              <h3 className="text-sm font-black text-slate-900">
                Asientos seleccionados
              </h3>
            </div>

            <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900">
              {cantidad}{" "}
              {cantidad === 1
                ? "asiento"
                : "asientos"}
            </span>
          </div>

          {cantidad > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {asientos.map(
                (asiento) => (
                  <li
                    key={asiento.id}
                    className="flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-black text-amber-900 shadow-sm"
                  >
                    <Armchair
                      size={15}
                      aria-hidden="true"
                    />

                    <span>
                      {asiento.numero}
                    </span>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Selecciona al menos un
              asiento para continuar.
            </p>
          )}
        </div>

        {/* PRECIO Y TOTAL */}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-700 sm:text-sm">
            <span>
              {cantidad}{" "}
              {cantidad === 1
                ? "pasaje"
                : "pasajes"}
              {" × "}
              Bs.{" "}
              {formatearMonto(
                precioUnitario,
              )}
            </span>

            <span className="font-bold">
              Bs. {formatearMonto(total)}
            </span>
          </div>

          <div className="my-3 h-px bg-emerald-200" />

          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Total a pagar
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Bolivianos
              </p>
            </div>

            <strong className="break-words text-2xl font-black tabular-nums text-emerald-900 sm:text-3xl">
              Bs. {formatearMonto(total)}
            </strong>
          </div>
        </div>

        {/* INFORMACIÓN DEL TICKET */}

        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-white p-3">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-emerald-700"
            aria-hidden="true"
          />

          <p className="text-xs leading-5 text-slate-600 sm:text-sm">
            Recibirás{" "}
            <strong>
              un solo ticket QR
            </strong>{" "}
            con todos tus asientos
            cuando se apruebe el pago.
          </p>
        </div>

        {/* BOTÓN DE PAGO */}

        <div className="sticky bottom-0 z-10 -mx-3 border-t border-emerald-100 bg-white/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <button
            type="button"
            onClick={onGenerarPagoQR}
            disabled={!puedeContinuar}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-md shadow-emerald-900/15 transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            <QrCode
              size={22}
              className="shrink-0"
              aria-hidden="true"
            />

            Generar pago por QR
          </button>
        </div>
      </div>
    </section>
  );
}
