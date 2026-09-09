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
    <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
            <CarFront size={25} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Sector de transporte
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-950">
              ¿En qué sector deseas viajar?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Elige el tipo de servicio para realizar tu compra o reserva.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-2">
        <BotonSector
          seleccionado={valor === "FLOTA"}
          bloqueado={bloqueado}
          titulo="Sector Flotas"
          descripcion="Viajes programados con horario y asiento asignado."
          icono={<BusFront size={36} />}
          onClick={() => onCambiar("FLOTA")}
        />

        <BotonSector
          seleccionado={valor === "RAPIDO"}
          bloqueado={bloqueado}
          titulo="Sector Noah y Hiace"
          descripcion="Salidas rápidas en vehículos de 7 y 10 pasajeros."
          icono={<CarFront size={36} />}
          onClick={() => onCambiar("RAPIDO")}
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
  icono: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={bloqueado}
      onClick={onClick}
      aria-pressed={seleccionado}
      className={[
        "relative flex min-h-[142px] items-center gap-5 rounded-3xl border-2 p-5 text-left",
        "transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        seleccionado
          ? "border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg shadow-emerald-900/10"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl",
          seleccionado
            ? "bg-emerald-600 text-white"
            : "bg-emerald-100 text-emerald-700",
        ].join(" ")}
      >
        {icono}
      </div>

      <div className="pr-8">
        <h3 className="text-lg font-black text-slate-950">
          {titulo}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {descripcion}
        </p>
      </div>

      {seleccionado && (
        <CheckCircle2
          size={23}
          className="absolute right-5 top-5 text-emerald-600"
        />
      )}
    </button>
  );
}

export default SectorTransporte;
