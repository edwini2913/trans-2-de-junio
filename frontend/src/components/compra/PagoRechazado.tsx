import {
  AlertTriangle,
  ArrowLeft,
  FileWarning,
  Hash,
  RefreshCcw,
  ShieldX,
  UploadCloud,
} from "lucide-react";

export interface PagoRechazadoProps {
  motivo?: string | null;
  referencia?: string | null;
  procesando?: boolean;
  onCorregirDatos: () => void;
  onSubirNuevoComprobante: () => void;
  onVolverInicio?: () => void;
}

function PagoRechazado({
  motivo,
  referencia,
  procesando = false,
  onCorregirDatos,
  onSubirNuevoComprobante,
  onVolverInicio,
}: PagoRechazadoProps) {
  const motivoVisible =
    motivo?.trim() ||
    "El comprobante no coincide con la información registrada. Revisa la referencia, el monto y la imagen enviada.";

  const referenciaVisible =
    referencia?.trim() ||
    "No disponible";

  return (
    <section className="mt-6 overflow-hidden rounded-[30px] border border-red-200 bg-white shadow-2xl shadow-red-950/10">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#4b1014] via-[#7f1d1d] to-[#b91c1c] px-5 py-8 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[38px] border-white/[0.07]" />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border-[28px] border-red-300/[0.08]" />

        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rotate-45 rounded-[22px] border-4 border-red-200/70 bg-black/20 shadow-2xl" />

            <AlertTriangle
              size={53}
              strokeWidth={2.2}
              className="relative z-10 text-red-100"
            />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.26em] text-red-100">
            Verificación administrativa
          </p>

          <h2 className="mt-2 text-3xl font-black sm:text-4xl">
            ¡Comprobante rechazado!
          </h2>

          <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-red-100/90 sm:text-base">
            La administradora no pudo
            confirmar tu pago. Revisa
            la información indicada y
            vuelve a intentarlo.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-5 sm:p-8">
        <div className="overflow-hidden rounded-[26px] border border-red-200 bg-red-50">
          <div className="flex items-center gap-3 border-b border-red-200 bg-red-100/70 px-5 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white">
              <FileWarning size={23} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-red-600">
                Detalles del rechazo
              </p>

              <h3 className="mt-1 font-black text-slate-900">
                Motivo informado por
                la administradora
              </h3>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-red-200 bg-white px-5 py-4">
              <p className="text-sm font-semibold leading-7 text-slate-700">
                {motivoVisible}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-white p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <Hash size={18} />

                  <p className="text-xs font-black uppercase tracking-wide">
                    Referencia enviada
                  </p>
                </div>

                <p className="mt-2 break-words font-black text-slate-900">
                  {referenciaVisible}
                </p>
              </div>

              <div className="rounded-2xl border border-red-100 bg-white p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <ShieldX size={18} />

                  <p className="text-xs font-black uppercase tracking-wide">
                    Estado del pago
                  </p>
                </div>

                <p className="mt-2 font-black text-red-700">
                  Rechazado
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <RefreshCcw size={22} />
            </div>

            <div>
              <p className="font-black text-amber-950">
                Acción requerida
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-amber-900/80">
                Comprueba el número de
                referencia, el monto y
                la imagen. Después
                puedes corregir los
                datos o cargar un nuevo
                comprobante.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCorregirDatos}
            disabled={procesando}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-white px-5 py-4 font-black text-red-700 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={20} />
            Verificar datos y reintentar
          </button>

          <button
            type="button"
            onClick={
              onSubirNuevoComprobante
            }
            disabled={procesando}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud size={21} />
            Subir nuevo comprobante
          </button>
        </div>

        {onVolverInicio && (
          <button
            type="button"
            onClick={onVolverInicio}
            disabled={procesando}
            className="mx-auto mt-6 flex items-center justify-center gap-2 text-sm font-black text-slate-600 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft size={18} />
            Cancelar y volver al inicio
          </button>
        )}
      </div>
    </section>
  );
}

export default PagoRechazado;