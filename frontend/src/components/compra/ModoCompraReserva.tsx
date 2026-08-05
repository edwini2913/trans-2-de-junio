import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ShoppingCart,
} from "lucide-react";

export type ModoOperacion =
  | "COMPRA"
  | "RESERVA";

interface ModoCompraReservaProps {
  valor: ModoOperacion;
  bloqueado?: boolean;
  onCambiar: (
    valor: ModoOperacion,
  ) => void;
}

function ModoCompraReserva({
  valor,
  bloqueado = false,
  onCambiar,
}: ModoCompraReservaProps) {
  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-950/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
            <ShoppingCart size={23} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Modalidad
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
              ¿Qué deseas realizar?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Elige comprar ahora o reservar los asientos temporalmente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
        <button
          type="button"
          disabled={bloqueado}
          onClick={() =>
            onCambiar("COMPRA")
          }
          className={[
            "relative rounded-3xl border-2 p-5 text-left transition duration-200",
            "disabled:cursor-not-allowed disabled:opacity-60",
            valor === "COMPRA"
              ? "border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-900/10"
              : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40",
          ].join(" ")}
        >
          {valor === "COMPRA" && (
            <CheckCircle2
              size={22}
              className="absolute right-4 top-4 text-emerald-700"
            />
          )}

          <div
            className={[
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              valor === "COMPRA"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-100 text-emerald-700",
            ].join(" ")}
          >
            <CreditCard size={24} />
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-950">
            Comprar ahora
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Realiza el pago por QR, envía el comprobante y espera la aprobación administrativa.
          </p>
        </button>

        <button
          type="button"
          disabled={bloqueado}
          onClick={() =>
            onCambiar("RESERVA")
          }
          className={[
            "relative rounded-3xl border-2 p-5 text-left transition duration-200",
            "disabled:cursor-not-allowed disabled:opacity-60",
            valor === "RESERVA"
              ? "border-amber-500 bg-amber-50 shadow-lg shadow-amber-900/10"
              : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40",
          ].join(" ")}
        >
          {valor === "RESERVA" && (
            <CheckCircle2
              size={22}
              className="absolute right-4 top-4 text-amber-600"
            />
          )}

          <div
            className={[
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              valor === "RESERVA"
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700",
            ].join(" ")}
          >
            <CalendarClock size={24} />
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-950">
            Reservar por 2 horas
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Bloquea temporalmente los asientos y paga después desde Mis Reservas.
          </p>
        </button>
      </div>
    </section>
  );
}

export default ModoCompraReserva;
