import {
  BusFront,
  CarFront,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

import {
  useState,
} from "react";

import VentaSectorFlota from "../../components/venta-oficina/VentaSectorFlota";
import VentaSectorRapido from "../../components/venta-oficina/VentaSectorRapido";

type SectorVenta =
  | "FLOTA"
  | "RAPIDO";

export default function VentaOficina() {
  const [sector, setSector] =
    useState<SectorVenta>("FLOTA");

  return (
    <main className="min-h-[calc(100vh-77px)] bg-[#f2f8f4] p-4 text-slate-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-[#005f31] via-[#007c40] to-[#00a052] px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-96 rotate-[-10deg] rounded-[50%] bg-lime-300/10" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm sm:flex">
              <CreditCard size={31} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                Administración
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Venta en oficina
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50 sm:text-base">
                Selecciona el sector de transporte y registra la venta presencial con bloqueo de asientos en tiempo real.
              </p>
            </div>
          </div>
        </header>

        <section className="mb-7 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_12px_35px_rgba(0,83,42,0.08)]">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-6 py-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Sector de transporte
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              ¿Dónde realizarás la venta?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              La selección cambia el tipo de vehículo, las salidas disponibles y el mapa de asientos.
            </p>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <button
              type="button"
              aria-pressed={sector === "FLOTA"}
              onClick={() =>
                setSector("FLOTA")
              }
              className={`relative rounded-3xl border-2 p-5 text-left transition-all duration-200 sm:p-6 ${
                sector === "FLOTA"
                  ? "border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-700/10 ring-4 ring-emerald-100"
                  : "border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              }`}
            >
              {sector === "FLOTA" && (
                <CheckCircle2
                  size={22}
                  className="absolute right-5 top-5 text-emerald-700"
                />
              )}

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  sector === "FLOTA"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <BusFront size={29} />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900">
                Sector Flotas
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Venta de viajes programados con fecha, horario y flota asignada.
              </p>

              <span className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-emerald-700">
                Flotas de 40 asientos
              </span>
            </button>

            <button
              type="button"
              aria-pressed={sector === "RAPIDO"}
              onClick={() =>
                setSector("RAPIDO")
              }
              className={`relative rounded-3xl border-2 p-5 text-left transition-all duration-200 sm:p-6 ${
                sector === "RAPIDO"
                  ? "border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-700/10 ring-4 ring-emerald-100"
                  : "border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
              }`}
            >
              {sector === "RAPIDO" && (
                <CheckCircle2
                  size={22}
                  className="absolute right-5 top-5 text-emerald-700"
                />
              )}

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  sector === "RAPIDO"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <CarFront size={29} />
              </div>

              <h3 className="mt-4 text-xl font-black text-slate-900">
                Sector Noah y Hiace
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Venta en los vehículos de la fila rápida habilitada por administración.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-amber-700">
                  Noah · 7 asientos
                </span>

                <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-sky-700">
                  Hiace · 10 asientos
                </span>
              </div>
            </button>
          </div>
        </section>

        <section key={sector}>
          {sector === "FLOTA" ? (
            <VentaSectorFlota />
          ) : (
            <VentaSectorRapido />
          )}
        </section>
      </div>
    </main>
  );
}
