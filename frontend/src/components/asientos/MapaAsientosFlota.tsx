import {
  BusFront,
  CircleGauge,
  DoorOpen,
} from "lucide-react";

import AsientoBoton from "./AsientoBoton";

import type {
  Asiento,
  PropsMapaAsientos,
} from "./asiento.types";

export default function MapaAsientosFlota({
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
        id: `temporal-${numero}`,
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

  const filas: number[][] = [];

  for (let i = 1; i <= viaje.vehiculo.capacidad; i += 4) {
    filas.push([i, i + 1, i + 2, i + 3]);
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-yellow-400">
            Vehículo seleccionado
          </p>

          <h4 className="mt-1 text-2xl font-black text-white">
            Flota
          </h4>

          <p className="mt-1 text-sm text-slate-400">
            {viaje.vehiculo.placa} · {viaje.vehiculo.modelo}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b1020] px-5 py-3">
          <p className="text-xs text-slate-500">
            Capacidad
          </p>

          <p className="text-xl font-black text-white">
            {viaje.vehiculo.capacidad} pasajeros
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="rounded-[3rem] border-8 border-slate-700 bg-[#0b1020] p-8 shadow-2xl">

          <div className="mb-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2 text-xs font-black uppercase tracking-widest text-white">
              <BusFront size={16} />
              Parte delantera
            </div>
          </div>

          <div className="mb-8 flex justify-between items-center">

            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-blue-400 bg-blue-500/20">
                <CircleGauge size={26} />
              </div>

              <span className="mt-2 text-[10px] text-slate-500 font-bold">
                CHOFER
              </span>
            </div>

            <div className="rounded-xl border border-white/10 px-5 py-3 text-slate-300 text-sm">
              PASILLO
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">
              <DoorOpen size={16} />
              Entrada
            </div>

          </div>

          <div className="space-y-6">

            {filas.map((fila) => (
              <div
                key={fila[0]}
                className="grid grid-cols-5 place-items-center gap-4"
              >
                {renderizarAsiento(fila[0])}

                {renderizarAsiento(fila[1])}

                <div />

                {fila[2] <= viaje.vehiculo.capacidad
                  ? renderizarAsiento(fila[2])
                  : <div />}

                {fila[3] <= viaje.vehiculo.capacidad
                  ? renderizarAsiento(fila[3])
                  : <div />}
              </div>
            ))}

          </div>

          <div className="mt-10 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Parte trasera
          </div>

        </div>
      </div>
    </div>
  );
}
