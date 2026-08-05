import {
  CheckCircle2,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import qrPago from "../../assets/QR.png";

interface PagoQROficinaProps {
  mostrar: boolean;
  total: number;
  cantidadAsientos: number;
  procesando?: boolean;
  onConfirmarPago: () => void;
}

function PagoQROficina({
  mostrar,
  total,
  cantidadAsientos,
  procesando = false,
  onConfirmarPago,
}: PagoQROficinaProps) {
  const [pagoVerificado, setPagoVerificado] =
    useState(false);

  useEffect(() => {
    setPagoVerificado(false);
  }, [mostrar, total, cantidadAsientos]);

  if (!mostrar) {
    return null;
  }

  const totalSeguro = Number.isFinite(total)
    ? Math.max(total, 0)
    : 0;

  function confirmarPago() {
    if (!pagoVerificado || procesando) {
      return;
    }

    onConfirmarPago();
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-lg shadow-emerald-950/5">
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-lime-500 px-5 py-5 text-white sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <QrCode size={25} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
              Pago presencial mediante QR
            </p>

            <h3 className="mt-1 text-xl font-black sm:text-2xl">
              Escanea, verifica y registra la venta
            </h3>

            <p className="mt-1 text-sm text-emerald-50/90">
              El ticket se generará únicamente después de confirmar el pago.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[300px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-black text-slate-900">
            Código QR oficial
          </p>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            El pasajero debe pagar desde su aplicación bancaria.
          </p>

          <div className="mx-auto mt-4 flex aspect-square w-full max-w-[230px] items-center justify-center overflow-hidden rounded-3xl border-4 border-emerald-700 bg-white p-3 shadow-md">
            <img
              src={qrPago}
              alt="QR oficial para pagar el pasaje"
              className="h-full w-full object-contain"
            />
          </div>

          <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            Monto exacto
          </p>

          <p className="mt-1 text-4xl font-black text-emerald-800">
            Bs. {totalSeguro.toFixed(2)}
          </p>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            {cantidadAsientos}{" "}
            {cantidadAsientos === 1
              ? "asiento seleccionado"
              : "asientos seleccionados"}
          </p>
        </div>

        <div className="flex flex-col">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <ShieldCheck size={23} />
              </div>

              <div>
                <p className="font-black text-emerald-950">
                  Verificación obligatoria
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                  Comprueba en la aplicación bancaria que el monto fue recibido antes de registrar la venta y entregar el ticket.
                </p>
              </div>
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50">
            <input
              type="checkbox"
              checked={pagoVerificado}
              disabled={procesando}
              onChange={(event) =>
                setPagoVerificado(event.target.checked)
              }
              className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-emerald-700"
            />

            <span>
              <span className="block font-black text-slate-900">
                Confirmo que el pago fue recibido
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Revisé el monto de Bs. {totalSeguro.toFixed(2)} en la cuenta oficial.
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={confirmarPago}
            disabled={!pagoVerificado || procesando}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#008743] to-[#006c36] px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:from-[#00783c] hover:to-[#005b2d] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {procesando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Registrando venta...
              </>
            ) : (
              <>
                <CheckCircle2 size={21} />
                Confirmar pago recibido y registrar venta
              </>
            )}
          </button>

          {!pagoVerificado && (
            <p className="mt-3 text-center text-xs font-semibold text-amber-700">
              La confirmación permanecerá bloqueada hasta verificar el pago.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default PagoQROficina;
