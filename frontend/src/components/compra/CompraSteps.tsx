import {
  Armchair,
  Check,
  Clock3,
  CreditCard,
  Route,
  TicketCheck,
} from "lucide-react";

interface CompraStepsProps {
  paso: number;
}

const pasos = [
  {
    numero: 1,
    nombre: "Ruta",
    descripcion: "Ruta y fecha",
    icono: Route,
  },
  {
    numero: 2,
    nombre: "Horario",
    descripcion: "Hora y vehículo",
    icono: Clock3,
  },
  {
    numero: 3,
    nombre: "Asiento",
    descripcion: "Seleccionar asiento",
    icono: Armchair,
  },
  {
    numero: 4,
    nombre: "Pago",
    descripcion: "Confirmar compra",
    icono: CreditCard,
  },
  {
    numero: 5,
    nombre: "Ticket",
    descripcion: "Ticket generado",
    icono: TicketCheck,
  },
];

function CompraSteps({
  paso,
}: CompraStepsProps) {
  const pasoActual = Math.min(
    Math.max(paso, 1),
    pasos.length,
  );

  return (
    <section className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-[0_15px_45px_rgba(0,83,42,0.1)]">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
          Proceso de compra
        </p>

        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
              Compra tu pasaje
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Completa los pasos para generar tu ticket
              electrónico.
            </p>
          </div>

          <div className="hidden rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-700 sm:block">
            Paso {pasoActual} de {pasos.length}
          </div>
        </div>
      </div>

      {/* VERSIÓN PARA COMPUTADORA */}

      <div className="hidden px-6 py-6 md:block">
        <div className="flex items-start">
          {pasos.map((item, indice) => {
            const Icono = item.icono;
            const completado =
              pasoActual > item.numero;
            const activo =
              pasoActual === item.numero;

            return (
              <div
                key={item.numero}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <div
                    className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                      completado
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                        : activo
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-700/15"
                          : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {completado ? (
                      <Check size={22} />
                    ) : (
                      <Icono size={21} />
                    )}
                  </div>

                  <p
                    className={`mt-3 text-sm font-black ${
                      completado || activo
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    {item.nombre}
                  </p>

                  <p className="mt-1 hidden text-xs text-slate-400 lg:block">
                    {item.descripcion}
                  </p>
                </div>

                {indice <
                  pasos.length - 1 && (
                  <div className="relative mt-6 h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full bg-emerald-600 transition-all duration-500 ${
                        pasoActual >
                        item.numero
                          ? "w-full"
                          : "w-0"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* VERSIÓN PARA CELULAR */}

      <div className="px-5 py-5 md:hidden">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
            {(() => {
              const Icono =
                pasos[pasoActual - 1].icono;

              return <Icono size={22} />;
            })()}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
              Paso {pasoActual} de{" "}
              {pasos.length}
            </p>

            <p className="mt-1 text-lg font-black text-slate-900">
              {
                pasos[pasoActual - 1]
                  .nombre
              }
            </p>

            <p className="text-xs text-slate-500">
              {
                pasos[pasoActual - 1]
                  .descripcion
              }
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {pasos.map((item) => (
            <div
              key={item.numero}
              className={`h-2 flex-1 rounded-full transition-all ${
                pasoActual >= item.numero
                  ? "bg-emerald-600"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CompraSteps;