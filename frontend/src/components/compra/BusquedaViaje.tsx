
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export type RutaBusqueda = {
  id: string;
  origen: string;
  destino: string;
};

interface BusquedaViajeProps {
  rutas?: RutaBusqueda[] | null;
  rutaId?: string;
  fecha?: string;
  fechaMinima?: string;
  cargandoRutas?: boolean;
  bloqueado?: boolean;
  onCambiarRuta?: (rutaId: string) => void;
  onCambiarFecha?: (fecha: string) => void;
  campoMovil?: "ruta" | "fecha";
  onUsarRuta?: () => void;
  onUsarFecha?: () => void;
}

const estiloCampo =
  "mt-2 min-h-12 w-full min-w-0 max-w-full rounded-xl border " +
  "border-slate-300 bg-white px-3 text-base text-slate-900 " +
  "focus:border-emerald-600 focus:outline-none focus:ring-2 " +
  "focus:ring-emerald-200 disabled:bg-slate-100";

const estiloBoton =
  "mt-3 min-h-11 w-full rounded-xl bg-emerald-700 px-4 py-2 " +
  "font-bold text-white transition hover:bg-emerald-800 " +
  "disabled:cursor-not-allowed disabled:opacity-50 lg:hidden";

export default function BusquedaViaje({
  rutas,
  rutaId = "",
  fecha = "",
  fechaMinima = "",
  cargandoRutas = false,
  bloqueado = false,
  campoMovil,
  onCambiarRuta,
  onCambiarFecha,
  onUsarRuta,
  onUsarFecha,
}: BusquedaViajeProps) {
  const listaRutas: RutaBusqueda[] =
    Array.isArray(rutas) ? rutas : [];

  const ruta = listaRutas.find(
    (opcion) =>
      String(opcion.id) ===
      String(rutaId),
  );

  const fechaVisible =
    fecha.split("-").reverse().join("/");

  const fechaPermitida =
    Boolean(fecha) &&
    (!fechaMinima || fecha >= fechaMinima);

  /*
   * Navegación automática para celulares.
   * Si el padre proporciona campoMovil,
   * se respeta ese valor.
   */
  const [
    pasoInterno,
    setPasoInterno,
  ] = useState<"ruta" | "fecha">(
    rutaId ? "fecha" : "ruta",
  );

  const pasoActual =
    campoMovil ?? pasoInterno;

  const seccionRef =
    useRef<HTMLElement | null>(null);

  const fechaRef =
    useRef<HTMLInputElement | null>(null);

  const rutaRef =
    useRef<HTMLSelectElement | null>(null);

  const desplazamientoRef =
    useRef<"ruta" | "fecha" | null>(
      null,
    );

  /*
   * Cuando una selección externa borra
   * la ruta, vuelve al primer paso.
   */
  useEffect(() => {
    if (!rutaId) {
      setPasoInterno("ruta");
    }
  }, [rutaId]);

  /*
   * Desplazamiento dentro del formulario.
   * No se ejecuta en computadoras.
   */
  const enfocarPaso = (
    destino: "ruta" | "fecha",
  ) => {
    desplazamientoRef.current =
      destino;

    window.requestAnimationFrame(() => {
      if (
        !window.matchMedia(
          "(max-width: 1023px)",
        ).matches
      ) {
        desplazamientoRef.current =
          null;
        return;
      }

      seccionRef.current?.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  };

  /*
   * Enfoca el control del siguiente
   * paso cuando React termina de pintar.
   *
   * No abre el teclado ni cambia
   * datos de la reserva.
   */
  useEffect(() => {
    if (
      !desplazamientoRef.current ||
      desplazamientoRef.current !==
        pasoActual
    ) {
      return;
    }

    desplazamientoRef.current = null;

    const animacion =
      window.requestAnimationFrame(() => {
        if (
          pasoActual === "fecha"
        ) {
          fechaRef.current?.focus({
            preventScroll: true,
          });
        } else {
          rutaRef.current?.focus({
            preventScroll: true,
          });
        }
      });

    return () =>
      window.cancelAnimationFrame(
        animacion,
      );
  }, [pasoActual]);

  const seleccionarRuta = (
    nuevaRutaId: string,
  ) => {
    if (
      bloqueado ||
      cargandoRutas
    ) {
      return;
    }

    onCambiarRuta?.(nuevaRutaId);

    if (nuevaRutaId) {
      if (campoMovil) {
        /*
         * El componente padre controla
         * el paso cuando proporciona
         * campoMovil y onUsarRuta.
         */
        if (onUsarRuta) {
          return;
        }
      }

      setPasoInterno("fecha");
      enfocarPaso("fecha");
    } else {
      setPasoInterno("ruta");
    }
  };

  const seleccionarFecha = (
    nuevaFecha: string,
  ) => {
    if (bloqueado) {
      return;
    }

    onCambiarFecha?.(nuevaFecha);

    /*
     * Los horarios se actualizan desde
     * ComprarReservar y useCompraViaje.
     * No generamos una reserva aquí.
     */
  };

  const volverRuta = () => {
    if (bloqueado) {
      return;
    }

    setPasoInterno("ruta");
    enfocarPaso("ruta");
  };

  const usarRuta = () => {
    if (
      bloqueado ||
      !ruta
    ) {
      return;
    }

    if (onUsarRuta) {
      onUsarRuta();
    } else {
      setPasoInterno("fecha");
      enfocarPaso("fecha");
    }
  };

  const usarFecha = () => {
    if (
      bloqueado ||
      !ruta ||
      !fechaPermitida
    ) {
      return;
    }

    onUsarFecha?.();
  };

  const mostrarRuta =
    pasoActual !== "fecha";

  const mostrarFecha =
    pasoActual !== "ruta";

  return (
    <section
      ref={seccionRef}
      className="mt-3 min-w-0 scroll-mt-28 rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-5 lg:mt-8 lg:p-7"
    >
      {/* ENCABEZADO */}

      <div className="mb-4 flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          {pasoActual === "fecha" ? (
            <CalendarDays size={23} />
          ) : (
            <MapPin size={23} />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 lg:hidden">
            {pasoActual === "fecha"
              ? "Paso 2 · Fecha"
              : "Paso 1 · Ruta"}
          </p>

          <h3 className="text-base font-black text-emerald-900 sm:text-lg">
            <span className="lg:hidden">
              {pasoActual === "fecha"
                ? "¿Qué día viajas?"
                : "¿Qué ruta vas a tomar?"}
            </span>

            <span className="hidden lg:inline">
              Ruta y fecha
            </span>
          </h3>
        </div>
      </div>

      {/* PROGRESO EN CELULARES */}

      <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
        <div
          className={
            "h-1.5 rounded-full " +
            (ruta
              ? "bg-emerald-600"
              : "bg-emerald-300")
          }
        />

        <div
          className={
            "h-1.5 rounded-full " +
            (fechaPermitida
              ? "bg-emerald-600"
              : "bg-slate-200")
          }
        />
      </div>

      {/* RESUMEN DE RUTA EN PASO FECHA */}

      {pasoActual === "fecha" && ruta && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 lg:hidden">
          <div className="flex items-start gap-2">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-700"
            />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-700">
                Ruta seleccionada
              </p>

              <p className="mt-1 break-words text-sm font-black text-emerald-950">
                {ruta.origen} → {ruta.destino}
              </p>
            </div>
          </div>

          {!campoMovil && (
            <button
              type="button"
              disabled={bloqueado}
              onClick={volverRuta}
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-800 disabled:opacity-50"
            >
              <ArrowLeft size={15} />
              Cambiar ruta
            </button>
          )}
        </div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        {/* RUTA */}

        <div
          className={
            mostrarRuta
              ? "min-w-0"
              : "hidden min-w-0 lg:block"
          }
        >
          <label
            htmlFor="ruta-viaje"
            className="flex items-center gap-2 text-sm font-bold text-slate-800"
          >
            <MapPin
              size={18}
              className="text-emerald-700"
            />

            Ruta de viaje
          </label>

          <select
            ref={rutaRef}
            id="ruta-viaje"
            className={estiloCampo}
            value={rutaId}
            disabled={
              cargandoRutas ||
              bloqueado
            }
            onChange={(event) =>
              seleccionarRuta(
                event.currentTarget.value,
              )
            }
          >
            <option value="">
              {cargandoRutas
                ? "Cargando rutas…"
                : listaRutas.length
                  ? "Elegir ruta…"
                  : "No hay rutas disponibles"}
            </option>

            {listaRutas.map(
              (opcion) => (
                <option
                  key={opcion.id}
                  value={String(
                    opcion.id,
                  )}
                >
                  {opcion.origen} →{" "}
                  {opcion.destino}
                </option>
              ),
            )}
          </select>

          {!cargandoRutas &&
            listaRutas.length === 0 && (
              <p
                role="status"
                className="mt-2 text-xs text-amber-700"
              >
                No hay rutas disponibles.
                Intenta más tarde.
              </p>
            )}

          {pasoActual === "ruta" &&
            ruta &&
            onUsarRuta && (
              <button
                type="button"
                className={estiloBoton}
                disabled={
                  bloqueado ||
                  cargandoRutas
                }
                onClick={usarRuta}
              >
                Usar esta ruta
              </button>
            )}
        </div>

        {/* FECHA */}

        <div
          className={
            mostrarFecha
              ? "min-w-0"
              : "hidden min-w-0 lg:block"
          }
        >
          <label
            htmlFor="fecha-viaje"
            className="flex items-center gap-2 text-sm font-bold text-slate-800"
          >
            <CalendarDays
              size={18}
              className="text-emerald-700"
            />

            Fecha de viaje
          </label>

          <input
            ref={fechaRef}
            id="fecha-viaje"
            type="date"
            className={estiloCampo}
            value={fecha}
            min={
              fechaMinima ||
              undefined
            }
            disabled={bloqueado}
            onChange={(event) =>
              seleccionarFecha(
                event.currentTarget.value,
              )
            }
          />

          {pasoActual === "fecha" &&
            onUsarFecha &&
            fechaPermitida && (
              <button
                type="button"
                className={estiloBoton}
                disabled={
                  bloqueado || !ruta
                }
                onClick={usarFecha}
              >
                {fecha === fechaMinima
                  ? "Viajar hoy"
                  : "Usar esta fecha"}

                {" · "}
                {fechaVisible}
              </button>
            )}

          {fecha &&
            !fechaPermitida && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold text-red-600"
              >
                Selecciona una fecha
                permitida.
              </p>
            )}
        </div>
      </div>

      {/* RESUMEN PARA COMPUTADORAS */}

      {ruta && (
        <p className="mt-4 hidden break-words rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900 lg:block">
          {ruta.origen} → {ruta.destino}

          {fecha && (
            <span>
              {" · "}
              {fechaVisible}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
