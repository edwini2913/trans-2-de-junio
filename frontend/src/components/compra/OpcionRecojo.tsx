import {
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Warehouse,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  solicitarRecojo as registrarRecojo,
} from "../../services/salidas-rapidas.service";

export type TipoAbordaje =
  | "TERMINAL"
  | "RECOJO";

interface OpcionRecojoProps {
  usuarioId: string;
  viajeId: string;
  telefonoInicial?: string;
  onTipoAbordajeChange?: (
    tipo: TipoAbordaje,
  ) => void;
  onRecojoRegistrado?: (
    solicitud: unknown,
  ) => void;
}

const obtenerMensajeError = (
  error: unknown,
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const errorHttp = error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    };

    const mensaje =
      errorHttp.response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(" ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo registrar el recojo.";
};

export default function OpcionRecojo({
  usuarioId,
  viajeId,
  telefonoInicial = "",
  onTipoAbordajeChange,
  onRecojoRegistrado,
}: OpcionRecojoProps) {
  const [
    tipoAbordaje,
    setTipoAbordaje,
  ] = useState<TipoAbordaje>(
    "TERMINAL",
  );

  const [
    referencia,
    setReferencia,
  ] = useState("");

  const [
    telefono,
    setTelefono,
  ] = useState(
    telefonoInicial,
  );

  const [
    observacion,
    setObservacion,
  ] = useState("");

  const [
    latitud,
    setLatitud,
  ] = useState<number | undefined>();

  const [
    longitud,
    setLongitud,
  ] = useState<number | undefined>();

  const [
    obteniendoUbicacion,
    setObteniendoUbicacion,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    mensaje,
    setMensaje,
  ] = useState<string | null>(null);

  const seleccionarTipo = (
    tipo: TipoAbordaje,
  ) => {
    setTipoAbordaje(tipo);
    setError(null);
    setMensaje(null);

    onTipoAbordajeChange?.(tipo);
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setError(
        "Este dispositivo no permite obtener la ubicación.",
      );
      return;
    }

    setObteniendoUbicacion(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setLatitud(
          posicion.coords.latitude,
        );

        setLongitud(
          posicion.coords.longitude,
        );

        setObteniendoUbicacion(false);

        setMensaje(
          "Ubicación obtenida correctamente.",
        );
      },
      () => {
        setObteniendoUbicacion(false);

        setError(
          "No se pudo obtener la ubicación. Puedes escribir solamente la referencia.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  const guardarRecojo = async (
    evento: FormEvent,
  ) => {
    evento.preventDefault();

    if (!usuarioId) {
      setError(
        "Debes iniciar sesión para solicitar un recojo.",
      );
      return;
    }

    if (!viajeId) {
      setError(
        "Primero debes seleccionar un vehículo.",
      );
      return;
    }

    if (
      referencia.trim().length < 5
    ) {
      setError(
        "Escribe una referencia de al menos 5 caracteres.",
      );
      return;
    }

    if (
      telefono.trim().length < 7
    ) {
      setError(
        "Introduce un teléfono válido.",
      );
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      setMensaje(null);

      const respuesta =
        await registrarRecojo({
          usuarioId,
          viajeId,
          referencia:
            referencia.trim(),
          telefono:
            telefono.trim(),
          observacion:
            observacion.trim() ||
            undefined,
          latitud,
          longitud,
        });

      setMensaje(
        respuesta.mensaje ??
          "Solicitud registrada correctamente.",
      );

      onRecojoRegistrado?.(
        respuesta.solicitud,
      );
    } catch (errorPeticion) {
      setError(
        obtenerMensajeError(
          errorPeticion,
        ),
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_16px_45px_rgba(15,118,76,0.08)]">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          Lugar de abordaje
        </p>

        <h3 className="mt-1 text-xl font-black text-slate-950">
          ¿Dónde deseas subir?
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Puedes abordar en la terminal o solicitar
          que el vehículo te recoja en el camino.
        </p>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              seleccionarTipo(
                "TERMINAL",
              )
            }
            className={`relative rounded-3xl border-2 p-5 text-left transition ${
              tipoAbordaje ===
              "TERMINAL"
                ? "border-emerald-600 bg-emerald-50 shadow-md"
                : "border-slate-200 bg-white hover:border-emerald-200"
            }`}
          >
            {tipoAbordaje ===
              "TERMINAL" && (
              <CheckCircle2
                size={20}
                className="absolute right-4 top-4 text-emerald-700"
              />
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Warehouse size={22} />
            </div>

            <p className="mt-4 font-black text-slate-950">
              Subir en la terminal
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Esperaré el vehículo en el punto
              principal de salida.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              seleccionarTipo(
                "RECOJO",
              )
            }
            className={`relative rounded-3xl border-2 p-5 text-left transition ${
              tipoAbordaje ===
              "RECOJO"
                ? "border-emerald-600 bg-emerald-50 shadow-md"
                : "border-slate-200 bg-white hover:border-emerald-200"
            }`}
          >
            {tipoAbordaje ===
              "RECOJO" && (
              <CheckCircle2
                size={20}
                className="absolute right-4 top-4 text-emerald-700"
              />
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <MapPin size={22} />
            </div>

            <p className="mt-4 font-black text-slate-950">
              Solicitar recojo
            </p>

            <p className="mt-1 text-sm text-slate-500">
              El conductor verá tu referencia
              y ubicación durante el recorrido.
            </p>
          </button>
        </div>

        {tipoAbordaje ===
          "RECOJO" && (
          <form
            onSubmit={guardarRecojo}
            className="mt-6 rounded-3xl border border-emerald-100 bg-slate-50 p-5"
          >
            <div>
              <label className="text-sm font-black text-slate-800">
                Referencia de recojo
              </label>

              <div className="relative mt-2">
                <MapPin
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                />

                <input
                  value={referencia}
                  onChange={(evento) =>
                    setReferencia(
                      evento.target.value,
                    )
                  }
                  placeholder="Ej.: Puente Chimoré, frente al surtidor"
                  maxLength={250}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-black text-slate-800">
                Teléfono de contacto
              </label>

              <div className="relative mt-2">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                />

                <input
                  value={telefono}
                  onChange={(evento) =>
                    setTelefono(
                      evento.target.value,
                    )
                  }
                  placeholder="Ej.: 70000000"
                  maxLength={20}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-black text-slate-800">
                Observación opcional
              </label>

              <textarea
                value={observacion}
                onChange={(evento) =>
                  setObservacion(
                    evento.target.value,
                  )
                }
                placeholder="Ej.: Llevo una mochila roja"
                maxLength={300}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <button
              type="button"
              onClick={
                obtenerUbicacion
              }
              disabled={
                obteniendoUbicacion
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {obteniendoUbicacion ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Navigation size={18} />
              )}

              {latitud !== undefined &&
              longitud !== undefined
                ? "Ubicación agregada"
                : "Usar mi ubicación actual"}
            </button>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={18} />
                {mensaje}
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Registrando...
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  Confirmar lugar de recojo
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}