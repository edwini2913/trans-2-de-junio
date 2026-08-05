import {
  CarFront,
  CircleGauge,
  DoorOpen,
} from "lucide-react";

import AsientoBoton from "./AsientoBoton";

import type {
  Asiento,
  PropsMapaAsientos,
} from "./asiento.types";

export default function MapaAsientosNoah({
  viaje,
  asientos,
  asientoSeleccionado,
  onSeleccionar,
}: PropsMapaAsientos) {
  const obtenerAsiento = (numero: number): Asiento => {
    const asientoEncontrado = asientos.find(
      (asiento) => Number(asiento.numero) === numero,
    );

    return (
      asientoEncontrado || {
        id: `asiento-temporal-${numero}`,
        numero,
        estado: "DISPONIBLE",
        bloqueadoPor: null,
        bloqueadoHasta: null,
      }
    );
  };

  const renderizarAsiento = (numero: number) => {
    const asiento = obtenerAsiento(numero);

    return (
      <AsientoBoton
        key={asiento.id}
        asiento={asiento}
        seleccionado={
          asientoSeleccionado?.id === asiento.id
        }
        onClick={() => onSeleccionar(asiento)}
      />
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
            Vehículo seleccionado
          </p>

          <h4 className="mt-1 text-2xl font-black text-white">
            Noah
          </h4>

          <p className="mt-1 text-sm text-slate-400">
            {viaje.vehiculo.placa} ·{" "}
            {viaje.vehiculo.modelo}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b1020] px-5 py-3">
          <p className="text-xs text-slate-500">
            Capacidad
          </p>

          <p className="text-xl font-black text-white">
            7 pasajeros
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="relative overflow-hidden rounded-[3rem] border-8 border-slate-700 bg-[#0b1020] px-4 pb-10 pt-5 shadow-2xl sm:px-10">
          <div className="mb-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2 text-xs font-black uppercase tracking-widest text-white">
              <CarFront size={16} />
              Parte delantera
            </div>
          </div>

          <div className="mb-8 h-10 rounded-t-[2rem] border border-blue-300/20 bg-gradient-to-b from-blue-300/20 to-slate-900" />

          <div className="mb-12 grid grid-cols-2 items-center gap-6 sm:gap-16">
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border-2 border-blue-400 bg-blue-500/20 text-blue-300 sm:h-20 sm:w-20">
                <CircleGauge size={26} />

                <span className="mt-1 text-[10px] font-black">
                  CHOFER
                </span>
              </div>

              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                No seleccionable
              </span>
            </div>

            <div className="flex justify-center">
              {renderizarAsiento(1)}
            </div>
          </div>

          <div className="mb-10 border-t-2 border-dashed border-slate-700" />

          <div className="mb-4 text-center">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
              FILA DEL MEDIO
            </span>
          </div>

          <div className="mb-14 grid grid-cols-3 place-items-center gap-3 sm:gap-8">
            {renderizarAsiento(2)}
            {renderizarAsiento(3)}
            {renderizarAsiento(4)}
          </div>

          <div className="mb-4 text-center">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
              FILA TRASERA
            </span>
          </div>

          <div className="grid grid-cols-3 place-items-center gap-3 sm:gap-8">
            {renderizarAsiento(5)}
            {renderizarAsiento(6)}
            {renderizarAsiento(7)}
          </div>

          <div className="mt-12 flex justify-end">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">
              <DoorOpen size={16} />
              Ingreso
            </div>
          </div>

          <div className="mt-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Parte trasera
          </div>
        </div>
      </div>
    </div>
  );
}
