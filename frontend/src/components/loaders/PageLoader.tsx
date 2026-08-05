import { Loader2 } from "lucide-react";

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f8f4] px-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-200/50 blur-xl" />

          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-700 bg-white shadow-xl">
            <img
              src="/icons/icon-192.png"
              alt="Trans 2 de Junio"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <Loader2
          size={34}
          className="mt-6 animate-spin text-emerald-700"
        />

        <h2 className="mt-4 text-lg font-black text-slate-900">
          Cargando módulo
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Preparando Trans 2 de Junio...
        </p>
      </div>
    </div>
  );
}

export default PageLoader;