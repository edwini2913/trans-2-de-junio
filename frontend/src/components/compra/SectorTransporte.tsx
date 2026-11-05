
import type {
  ReactNode,
} from "react";

import {
  BusFront,
  CarFront,
  CheckCircle2,
} from "lucide-react";

export type SectorTransporteTipo =
  | "FLOTA"
  | "RAPIDO";

interface SectorTransporteProps {
  valor: SectorTransporteTipo;
  bloqueado?: boolean;
  onCambiar: (
    sector: SectorTransporteTipo,
  ) => void;
}

function SectorTransporte({
  valor,
  bloqueado = false,
  onCambiar,
}: SectorTransporteProps) {
  return (
    <section className="mt-6 w-full min-w-0 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-3 py-4 sm:px-7 sm:py-5">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 sm:h-12 sm:w-12">
            <CarFront size={25} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600 sm:text-xs sm:tracking-[0.2em]">
              Sector de transporte
            </p>

            <h2 className="mt-1 break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">
              ¿En qué sector deseas viajar?
            </h2>

            <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
              Elige el tipo de servicio para realizar tu compra o reserva.
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-7 lg:grid-cols-2">
        <BotonSector
          seleccionado={
            valor === "FLOTA"
          }
          bloqueado={bloqueado}
          titulo="Sector Flotas"
          descripcion="Viajes programados con horario y asiento asignado."
          icono={
            <BusFront size={36} />
          }
          onClick={() =>
            onCambiar("FLOTA")
          }
        />

        <BotonSector
          seleccionado={
            valor === "RAPIDO"
          }
          bloqueado={bloqueado}
          titulo="Sector Noah y Hiace"
          descripcion="Salidas rápidas en vehículos de 7 y 10 pasajeros."
          icono={
            <CarFront size={36} />
          }
          onClick={() =>
            onCambiar("RAPIDO")
          }
        />
      </div>
    </section>
  );
}

function BotonSector({
  seleccionado,
  bloqueado,
  titulo,
  descripcion,
  icono,
  onClick,
}: {
  seleccionado: boolean;
  bloqueado: boolean;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={bloqueado}
      onClick={onClick}
      aria-pressed={seleccionado}
      className={[
        "relative flex min-h-[110px] w-full min-w-0 items-center gap-3 rounded-2xl border-2 p-3 text-left sm:min-h-[142px] sm:gap-5 sm:rounded-3xl sm:p-5",
        "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        seleccionado
          ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg shadow-emerald-900/10"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg lg:hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 sm:rounded-2xl",
          seleccionado
            ? "bg-emerald-600 text-white"
            : "bg-emerald-100 text-emerald-700",
        ].join(" ")}
      >
        <div className="[&>svg]:h-7 [&>svg]:w-7 sm:[&>svg]:h-9 sm:[&>svg]:w-9">
          {icono}
        </div>
      </div>

      <div className="min-w-0 flex-1 pr-5 sm:pr-8">
        <h3 className="break-words text-sm font-black leading-5 text-slate-950 sm:text-lg">
          {titulo}
        </h3>

        <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-relaxed">
          {descripcion}
        </p>
      </div>

      {seleccionado && (
        <CheckCircle2
          size={23}
          className="absolute right-3 top-3 shrink-0 text-emerald-600 sm:right-5 sm:top-5"
        />
      )}
    </button>
  );
}

export default SectorTransporte;
