import {
  Download,
  Smartphone,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

interface EventoInstalacionPWA
  extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function InstalarPWA() {
  const [
    eventoInstalacion,
    setEventoInstalacion,
  ] =
    useState<EventoInstalacionPWA | null>(
      null,
    );

  const [
    mostrarBanner,
    setMostrarBanner,
  ] = useState(false);

  const [
    aplicacionInstalada,
    setAplicacionInstalada,
  ] = useState(false);

  useEffect(() => {
    const comprobarInstalacion = () => {
      const navegadorIOS =
        window.navigator as Navigator & {
          standalone?: boolean;
        };

      const instalada =
        window.matchMedia(
          "(display-mode: standalone)",
        ).matches ||
        navegadorIOS.standalone === true;

      setAplicacionInstalada(instalada);
    };

    const manejarAntesDeInstalar = (
      event: Event,
    ) => {
      event.preventDefault();

      setEventoInstalacion(
        event as EventoInstalacionPWA,
      );

      setMostrarBanner(true);
    };

    const manejarInstalacion = () => {
      setAplicacionInstalada(true);
      setMostrarBanner(false);
      setEventoInstalacion(null);
    };

    comprobarInstalacion();

    window.addEventListener(
      "beforeinstallprompt",
      manejarAntesDeInstalar,
    );

    window.addEventListener(
      "appinstalled",
      manejarInstalacion,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        manejarAntesDeInstalar,
      );

      window.removeEventListener(
        "appinstalled",
        manejarInstalacion,
      );
    };
  }, []);

  const instalarAplicacion =
    async () => {
      if (!eventoInstalacion) {
        return;
      }

      await eventoInstalacion.prompt();

      const resultado =
        await eventoInstalacion.userChoice;

      if (
        resultado.outcome ===
        "accepted"
      ) {
        setMostrarBanner(false);
      }

      setEventoInstalacion(null);
    };

  if (
    aplicacionInstalada ||
    !mostrarBanner ||
    !eventoInstalacion
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-xl">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-emerald-950/20">
        <button
          type="button"
          onClick={() =>
            setMostrarBanner(false)
          }
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Cerrar aviso de instalación"
        >
          <X size={19} />
        </button>

        <div className="flex items-center gap-4 pr-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-700 shadow-lg">
            <img
              src="/icons/icon-192.png"
              alt="Trans 2 de Junio"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-emerald-700">
              <Smartphone size={17} />

              <span className="text-xs font-extrabold uppercase tracking-[0.15em]">
                Aplicación PWA
              </span>
            </div>

            <h2 className="text-base font-black text-slate-900 sm:text-lg">
              Instalar Trans 2 de Junio
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              Instala la aplicación en tu
              dispositivo para acceder más
              rápido desde la pantalla de
              inicio.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={instalarAplicacion}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 active:scale-[0.98]"
        >
          <Download size={19} />

          Instalar aplicación
        </button>
      </div>
    </div>
  );
}

export default InstalarPWA;