import {
  Armchair,
  BusFront,
  CarFront,
  Check,
  CircleGauge,
  DoorOpen,
  Info,
  Users,
} from "lucide-react";

export type AsientoCompra = {
  id: string;
  numero: number | string;
  estado: string;
};

export type VehiculoCompra = {
  id?: string;
  marca?: string;
  modelo?: string;
  placa?: string;
  capacidad?: number;
  tipo?: string;
};

interface Props {
  vehiculo?: VehiculoCompra;
  asientos: AsientoCompra[];
  seleccionados: string[];
  bloqueado?: boolean;
  onSeleccionar: (asiento: AsientoCompra) => void;
}

type FilaBus = {
  izquierda1: AsientoCompra | null;
  izquierda2: AsientoCompra | null;
  derecha1: AsientoCompra | null;
  derecha2: AsientoCompra | null;
};

function SeatMap({
  vehiculo,
  asientos,
  seleccionados,
  bloqueado = false,
  onSeleccionar,
}: Props) {
  const asientosSeleccionados = asientos
    .filter((asiento) =>
      seleccionados.includes(asiento.id)
    )
    .sort(
      (a, b) =>
        Number(a.numero) - Number(b.numero)
    );

  const disponibles = asientos.filter(
    (asiento) =>
      normalizarEstado(asiento.estado) ===
      "DISPONIBLE"
  ).length;

  const ocupados = asientos.filter(
    (asiento) =>
      normalizarEstado(asiento.estado) !==
      "DISPONIBLE"
  ).length;

  const esNoah = identificarNoah(vehiculo);

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 px-5 py-6 text-white sm:px-7 md:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
              <Armchair size={29} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                Selección de asientos
              </p>

              <h2 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">
                Elija sus asientos
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-medium text-emerald-50/90 sm:text-base">
                Seleccione uno o varios asientos
                disponibles para continuar con su
                compra.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Leyenda
              color="bg-emerald-500"
              texto={`Disponibles (${disponibles})`}
            />

            <Leyenda
              color="bg-red-500"
              texto={`Ocupados (${ocupados})`}
            />

            <Leyenda
              color="bg-amber-400"
              texto={`Seleccionados (${seleccionados.length})`}
            />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 md:p-8">
        {vehiculo && (
          <div className="mb-7 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                  {esNoah ? (
                    <CarFront size={24} />
                  ) : (
                    <BusFront size={24} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">
                    Vehículo asignado
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    {obtenerNombreVehiculo(
                      vehiculo,
                      esNoah
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <DatoVehiculo
                  titulo="Tipo"
                  valor={
                    esNoah
                      ? "Toyota Noah"
                      : vehiculo.tipo || "Flota"
                  }
                />

                {vehiculo.placa && (
                  <DatoVehiculo
                    titulo="Placa"
                    valor={vehiculo.placa}
                  />
                )}

                {vehiculo.capacidad && (
                  <DatoVehiculo
                    titulo="Capacidad"
                    valor={`${vehiculo.capacidad} pasajeros`}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div
          className={[
            "grid gap-7",
            esNoah
              ? "xl:grid-cols-[minmax(390px,650px)_310px]"
              : "xl:grid-cols-[minmax(520px,760px)_310px]",
            "xl:justify-center",
          ].join(" ")}
        >
          <div className="overflow-x-auto pb-3">
            {esNoah ? (
              <MapaNoah
                asientos={asientos}
                seleccionados={seleccionados}
                bloqueado={bloqueado}
                onSeleccionar={onSeleccionar}
              />
            ) : (
              <MapaFlota
                asientos={asientos}
                seleccionados={seleccionados}
                bloqueado={bloqueado}
                onSeleccionar={onSeleccionar}
              />
            )}
          </div>

          <ResumenSeleccion
            asientosSeleccionados={
              asientosSeleccionados
            }
            bloqueado={bloqueado}
            onSeleccionar={onSeleccionar}
          />
        </div>
      </div>
    </section>
  );
}

function MapaNoah({
  asientos,
  seleccionados,
  bloqueado,
  onSeleccionar,
}: {
  asientos: AsientoCompra[];
  seleccionados: string[];
  bloqueado: boolean;
  onSeleccionar: (
    asiento: AsientoCompra
  ) => void;
}) {
  const obtenerAsiento = (
    numero: number
  ): AsientoCompra | null => {
    return (
      asientos.find(
        (asiento) =>
          Number(asiento.numero) === numero
      ) || null
    );
  };

  return (
    <div className="mx-auto min-w-[390px] max-w-[580px] px-1">
      <div className="relative overflow-hidden rounded-[95px_95px_38px_38px] border-[5px] border-slate-300 bg-gradient-to-b from-slate-100 via-white to-slate-100 p-4 shadow-[0_25px_65px_rgba(15,23,42,0.18)]">
        <div className="rounded-[68px_68px_24px_24px] border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white px-6 pb-6 pt-8 shadow-inner">
          <div className="mb-6 flex items-center justify-center gap-3 text-emerald-800">
            <CarFront size={29} />

            <span className="text-sm font-black uppercase tracking-[0.14em]">
              Parte delantera
            </span>
          </div>

          <div className="grid grid-cols-2 items-end gap-8">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                <CircleGauge size={35} />
              </div>

              <div className="mt-3 text-slate-700">
                <Armchair size={58} />
              </div>

              <span className="mt-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                Chofer
              </span>
            </div>

            <div className="flex justify-center">
              <AsientoBoton
                asiento={obtenerAsiento(1)}
                seleccionado={estaSeleccionado(
                  obtenerAsiento(1),
                  seleccionados
                )}
                bloqueado={bloqueado}
                onSeleccionar={onSeleccionar}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white px-5 pb-7 pt-6 shadow-inner">
          <div className="space-y-7">
            <FilaNoah
              asientos={[
                obtenerAsiento(2),
                obtenerAsiento(3),
                obtenerAsiento(4),
              ]}
              seleccionados={seleccionados}
              bloqueado={bloqueado}
              onSeleccionar={onSeleccionar}
            />

            <FilaNoah
              asientos={[
                obtenerAsiento(5),
                obtenerAsiento(6),
                obtenerAsiento(7),
              ]}
              seleccionados={seleccionados}
              bloqueado={bloqueado}
              onSeleccionar={onSeleccionar}
            />
          </div>

          <div className="mt-7 flex justify-center">
            <div className="rounded-xl bg-emerald-700 px-6 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Parte trasera
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilaNoah({
  asientos,
  seleccionados,
  bloqueado,
  onSeleccionar,
}: {
  asientos: Array<AsientoCompra | null>;
  seleccionados: string[];
  bloqueado: boolean;
  onSeleccionar: (
    asiento: AsientoCompra
  ) => void;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-5">
      {asientos.map((asiento, indice) => (
        <AsientoBoton
          key={asiento?.id || `vacio-${indice}`}
          asiento={asiento}
          seleccionado={estaSeleccionado(
            asiento,
            seleccionados
          )}
          bloqueado={bloqueado}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </div>
  );
}
function MapaFlota({
  asientos,
  seleccionados,
  bloqueado,
  onSeleccionar,
}: {
  asientos: AsientoCompra[];
  seleccionados: string[];
  bloqueado: boolean;
  onSeleccionar: (
    asiento: AsientoCompra
  ) => void;
}) {
  const filas = crearFilasBus(asientos);

  return (
    <div className="mx-auto min-w-[520px] max-w-[700px] px-1">
      <div className="relative overflow-hidden rounded-[105px_105px_40px_40px] border-[5px] border-slate-300 bg-gradient-to-b from-slate-100 via-white to-slate-100 p-4 shadow-[0_25px_65px_rgba(15,23,42,0.18)]">
        <div className="rounded-[78px_78px_24px_24px] border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white px-8 pb-6 pt-8 shadow-inner">
          <div className="mb-5 flex items-center justify-center gap-3 text-emerald-800">
            <BusFront size={30} />

            <span className="text-sm font-black uppercase tracking-[0.14em]">
              Parte delantera
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                <CircleGauge size={36} />
              </div>

              <div className="mt-3 text-slate-700">
                <Armchair size={64} />
              </div>

              <span className="mt-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                Operador
              </span>
            </div>

            <div className="flex flex-col items-end justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-emerald-800">
                <DoorOpen size={27} />

                <span className="text-sm font-black uppercase tracking-wide">
                  Ingreso
                </span>
              </div>

              <div className="mt-4 h-24 w-24 rounded-t-2xl border-4 border-slate-300 bg-gradient-to-b from-slate-50 to-slate-200 shadow-inner" />
            </div>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white px-3 pb-6 pt-4 shadow-inner">
          <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-20 -translate-x-1/2 bg-gradient-to-b from-emerald-100 via-emerald-50 to-emerald-100" />

          <div className="relative z-10 space-y-4">
            {filas.length > 0 ? (
              filas.map((fila, indice) => (
                <div
                  key={indice}
                  className="grid grid-cols-[1fr_1fr_74px_1fr_1fr] items-center gap-3"
                >
                  <AsientoBoton
                    asiento={fila.izquierda1}
                    seleccionado={estaSeleccionado(
                      fila.izquierda1,
                      seleccionados
                    )}
                    bloqueado={bloqueado}
                    onSeleccionar={onSeleccionar}
                  />

                  <AsientoBoton
                    asiento={fila.izquierda2}
                    seleccionado={estaSeleccionado(
                      fila.izquierda2,
                      seleccionados
                    )}
                    bloqueado={bloqueado}
                    onSeleccionar={onSeleccionar}
                  />

                  <div className="flex h-full items-center justify-center">
                    <span className="rounded-lg bg-emerald-700 px-2 py-2 text-center text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
                      Fila {indice + 1}
                    </span>
                  </div>

                  <AsientoBoton
                    asiento={fila.derecha1}
                    seleccionado={estaSeleccionado(
                      fila.derecha1,
                      seleccionados
                    )}
                    bloqueado={bloqueado}
                    onSeleccionar={onSeleccionar}
                  />

                  <AsientoBoton
                    asiento={fila.derecha2}
                    seleccionado={estaSeleccionado(
                      fila.derecha2,
                      seleccionados
                    )}
                    bloqueado={bloqueado}
                    onSeleccionar={onSeleccionar}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Armchair
                  size={38}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-bold text-slate-600">
                  No hay asientos registrados
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10 mt-6 flex justify-center">
            <div className="rounded-xl bg-emerald-700 px-8 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-md shadow-emerald-900/10">
              Parte trasera
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumenSeleccion({
  asientosSeleccionados,
  bloqueado,
  onSeleccionar,
}: {
  asientosSeleccionados: AsientoCompra[];
  bloqueado: boolean;
  onSeleccionar: (
    asiento: AsientoCompra
  ) => void;
}) {
  return (
    <aside className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg shadow-emerald-950/5">
        <div className="border-b border-emerald-100 bg-emerald-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Users size={23} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                Resumen
              </p>

              <h3 className="mt-1 text-xl font-black text-slate-900">
                Asientos seleccionados
              </h3>
            </div>
          </div>
        </div>

        <div className="p-6">
          {asientosSeleccionados.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3">
                {asientosSeleccionados.map(
                  (asiento) => (
                    <button
                      key={asiento.id}
                      type="button"
                      disabled={bloqueado}
                      onClick={() =>
                        onSeleccionar(asiento)
                      }
                      title={`Quitar asiento ${asiento.numero}`}
                      className="group flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-black text-amber-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check size={17} />

                      <span>
                        Asiento #{asiento.numero}
                      </span>

                      <span className="text-amber-600 transition-transform group-hover:scale-125">
                        ×
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">
                  Cantidad seleccionada
                </p>

                <div className="mt-2 flex items-end justify-between gap-4">
                  <p className="text-5xl font-black leading-none text-emerald-800">
                    {asientosSeleccionados.length}
                  </p>

                  <span className="rounded-xl bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-700 shadow-sm">
                    {asientosSeleccionados.length === 1
                      ? "Asiento"
                      : "Asientos"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <Armchair
                size={42}
                className="mx-auto text-slate-400"
              />

              <p className="mt-4 font-black text-slate-700">
                Ningún asiento seleccionado
              </p>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Seleccione un asiento disponible en
                el mapa para agregarlo a su compra.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Info size={21} />
          </div>

          <div>
            <p className="font-black text-emerald-900">
              Cómo seleccionar
            </p>

            <p className="mt-2 text-sm leading-relaxed text-emerald-800/80">
              Presione un asiento disponible para
              seleccionarlo. Vuelva a presionarlo
              para quitarlo de la selección.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AsientoBoton({
  asiento,
  seleccionado,
  bloqueado,
  onSeleccionar,
}: {
  asiento: AsientoCompra | null;
  seleccionado: boolean;
  bloqueado: boolean;
  onSeleccionar: (
    asiento: AsientoCompra
  ) => void;
}) {
  if (!asiento) {
    return (
      <div className="h-[74px] min-w-[66px] rounded-[18px_18px_13px_13px] border-2 border-dashed border-slate-200 bg-slate-50 opacity-70" />
    );
  }

  const ocupado =
    normalizarEstado(asiento.estado) !==
    "DISPONIBLE";

  const clasesEstado = ocupado
    ? "cursor-not-allowed border-red-300 bg-gradient-to-b from-red-400 to-red-600 text-white opacity-75"
    : seleccionado
      ? "scale-105 border-amber-300 bg-gradient-to-b from-amber-300 to-amber-500 text-slate-900 shadow-amber-500/30"
      : "border-emerald-300 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 text-white hover:scale-105 hover:border-emerald-400 hover:shadow-emerald-500/25";

  return (
    <button
      type="button"
      disabled={ocupado || bloqueado}
      onClick={() => onSeleccionar(asiento)}
      title={
        ocupado
          ? `Asiento ${asiento.numero} ocupado`
          : seleccionado
            ? `Quitar asiento ${asiento.numero}`
            : `Seleccionar asiento ${asiento.numero}`
      }
      aria-label={
        ocupado
          ? `Asiento ${asiento.numero} ocupado`
          : seleccionado
            ? `Quitar asiento ${asiento.numero}`
            : `Seleccionar asiento ${asiento.numero}`
      }
      className={[
        "group relative h-[74px] min-w-[66px] rounded-[18px_18px_13px_13px] border-[3px] font-black",
        "shadow-[0_8px_14px_rgba(15,23,42,0.2)] transition-all duration-200",
        clasesEstado,
        "disabled:cursor-not-allowed",
      ].join(" ")}
    >
      <span className="absolute -left-2 top-4 h-10 w-3 rounded-l-lg bg-slate-600 shadow-sm" />

      <span className="absolute -right-2 top-4 h-10 w-3 rounded-r-lg bg-slate-600 shadow-sm" />

      <span className="absolute bottom-[-7px] left-2 right-2 h-4 rounded-lg bg-slate-700 shadow-md" />

      <span className="relative z-10 flex h-full items-center justify-center text-2xl">
        {seleccionado ? (
          <Check
            size={27}
            strokeWidth={3}
          />
        ) : (
          asiento.numero
        )}
      </span>

      {!ocupado && !seleccionado && (
        <span className="pointer-events-none absolute inset-0 rounded-[15px] bg-white/0 transition group-hover:bg-white/10" />
      )}
    </button>
  );
}

function crearFilasBus(
  asientos: AsientoCompra[]
): FilaBus[] {
  const mapa = new Map<
    number,
    AsientoCompra
  >();

  asientos.forEach((asiento) => {
    const numero = Number(asiento.numero);

    if (Number.isFinite(numero)) {
      mapa.set(numero, asiento);
    }
  });

  const numerosValidos = asientos
    .map((asiento) =>
      Number(asiento.numero)
    )
    .filter((numero) =>
      Number.isFinite(numero)
    );

  const numeroMaximo =
    numerosValidos.length > 0
      ? Math.max(...numerosValidos)
      : 0;

  const filas: FilaBus[] = [];

  for (
    let numero = 1;
    numero <= numeroMaximo;
    numero += 4
  ) {
    filas.push({
      izquierda1: mapa.get(numero) || null,
      izquierda2:
        mapa.get(numero + 1) || null,
      derecha1:
        mapa.get(numero + 2) || null,
      derecha2:
        mapa.get(numero + 3) || null,
    });
  }

  return filas;
}

function estaSeleccionado(
  asiento: AsientoCompra | null,
  seleccionados: string[]
): boolean {
  if (!asiento) {
    return false;
  }

  return seleccionados.includes(asiento.id);
}

function identificarNoah(
  vehiculo?: VehiculoCompra
): boolean {
  if (!vehiculo) {
    return false;
  }

  const descripcion = [
    vehiculo.tipo,
    vehiculo.marca,
    vehiculo.modelo,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return descripcion.includes("NOAH");
}

function normalizarEstado(
  estado?: string
): string {
  return String(estado || "")
    .trim()
    .toUpperCase();
}

function obtenerNombreVehiculo(
  vehiculo: VehiculoCompra,
  esNoah: boolean
): string {
  const nombre = [
    vehiculo.marca,
    vehiculo.modelo,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (nombre) {
    return nombre;
  }

  if (esNoah) {
    return "Toyota Noah";
  }

  return vehiculo.tipo || "Vehículo asignado";
}

function DatoVehiculo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white px-4 py-2 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </span>

      <p className="mt-1 font-black text-slate-800">
        {valor}
      </p>
    </div>
  );
}

function Leyenda({
  color,
  texto,
}: {
  color: string;
  texto: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white shadow-sm backdrop-blur-sm">
      <span
        className={`h-4 w-4 shrink-0 rounded-md border border-white/30 ${color}`}
      />

      <span>{texto}</span>
    </div>
  );
}

export default SeatMap;
