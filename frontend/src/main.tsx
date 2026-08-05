import {
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "./index.css";
import App from "./App";

const actualizarServiceWorker = registerSW({
  immediate: true,

  onNeedRefresh() {
    const confirmarActualizacion = window.confirm(
      "Hay una nueva versión de Trans 2 de Junio disponible. ¿Deseas actualizar ahora?",
    );

    if (confirmarActualizacion) {
      actualizarServiceWorker(true);
    }
  },

  onOfflineReady() {
    console.log(
      "Trans 2 de Junio está listo para funcionar sin conexión.",
    );
  },

  onRegisteredSW(
    serviceWorkerUrl,
    registration,
  ) {
    console.log(
      "Service Worker registrado:",
      serviceWorkerUrl,
    );

    if (!registration) {
      return;
    }

    const intervaloActualizacion =
      window.setInterval(() => {
        registration
          .update()
          .catch((error) => {
            console.error(
              "No se pudo comprobar una actualización de la PWA:",
              error,
            );
          });
      }, 60 * 60 * 1000);

    window.addEventListener(
      "beforeunload",
      () => {
        window.clearInterval(
          intervaloActualizacion,
        );
      },
      {
        once: true,
      },
    );
  },

  onRegisterError(error) {
    console.error(
      "Error al registrar la PWA:",
      error,
    );
  },
});

function PantallaCarga() {
  const [visible, setVisible] =
    useState(true);

  const [saliendo, setSaliendo] =
    useState(false);

  useEffect(() => {
    const temporizadorSalida =
      window.setTimeout(() => {
        setSaliendo(true);
      }, 1800);

    const temporizadorOcultar =
      window.setTimeout(() => {
        setVisible(false);
      }, 2300);

    return () => {
      window.clearTimeout(
        temporizadorSalida,
      );

      window.clearTimeout(
        temporizadorOcultar,
      );
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[10000] flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-800 to-green-600 px-6 transition-all duration-500 ${
        saliendo
          ? "pointer-events-none scale-105 opacity-0"
          : "scale-100 opacity-100"
      }`}
    >
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-sm" />

      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full border border-emerald-200/10 bg-emerald-300/10 blur-sm" />

      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl" />

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex items-center gap-2 text-amber-300">
          <span className="text-xl">
            ★
          </span>

          <span className="text-2xl">
            ★
          </span>

          <span className="text-3xl">
            ★
          </span>

          <span className="text-2xl">
            ★
          </span>

          <span className="text-xl">
            ★
          </span>
        </div>

        <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
          <div className="absolute inset-3 rounded-full bg-emerald-200/20 blur-3xl" />

          <img
            src="/icons/icon-master-1024.png"
            alt="Trans 2 de Junio"
            draggable={false}
            className="relative block h-full w-full select-none object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.38)]"
          />
        </div>

        <h1 className="mt-7 text-3xl font-black uppercase tracking-tight text-white drop-shadow-lg sm:text-4xl">
          Trans 2 de Junio
        </h1>

        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100 sm:text-base">
          Venta y reserva de pasajes
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />

          <p className="text-sm font-bold tracking-wide text-white/90">
            Cargando aplicación...
          </p>
        </div>

        <p className="mt-10 text-xs font-medium text-emerald-100/80">
          Seguridad, puntualidad y
          confianza
        </p>
      </div>
    </div>
  );
}

function AplicacionPrincipal() {
  return (
    <>
      <PantallaCarga />
      <App />
    </>
  );
}

const rootElement =
  document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "No se encontró el elemento raíz con el identificador 'root'.",
  );
}

createRoot(rootElement).render(
  <AplicacionPrincipal />,
);