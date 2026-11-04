import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  RefreshCw,
  Warehouse,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  actualizarMiRecojo,
  obtenerMensajeErrorRecojo,
  obtenerMiRecojo,
  solicitarRecojo as registrarRecojo,
} from "../../services/salidas-rapidas.service";

import type {
  EstadoSolicitudRecojo,
  MiSolicitudRecojo,
} from "../../services/salidas-rapidas.service";

// ==========================================
// TIPOS
// ==========================================

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

type EstadoConsulta =
  | "INICIAL"
  | "CARGANDO"
  | "LISTO"
  | "ERROR";

interface ResultadoConsulta {
  clave: string;
  estado: EstadoConsulta;
  solicitud: MiSolicitudRecojo | null;
  error: string | null;
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

const ESTADOS_ACTIVOS:
  EstadoSolicitudRecojo[] = [
    "PENDIENTE",
    "CONFIRMADA",
  ];

const ETIQUETAS_ESTADOS: Record<
  EstadoSolicitudRecojo,
  string
> = {
  PENDIENTE: "Pendiente de confirmación",
  CONFIRMADA: "Recojo confirmado",
  RECOGIDO: "Pasajero recogido",
  CANCELADA: "Recojo cancelado",
  NO_ENCONTRADO: "Pasajero no encontrado",
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function obtenerEstadoHttp(
  error: unknown,
): number | null {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return null;
  }

  const datos = error as {
    estado?: unknown;
    status?: unknown;

    response?: {
      status?: unknown;
    };
  };

  const codigo =
    datos.response?.status ??
    datos.estado ??
    datos.status;

  if (
    codigo === undefined ||
    codigo === null
  ) {
    return null;
  }

  const numero = Number(codigo);

  return Number.isInteger(numero)
    ? numero
    : null;
}

function obtenerEnlaceMapa(
  solicitud: MiSolicitudRecojo,
): string | null {
  const latitud = solicitud.latitud;
  const longitud = solicitud.longitud;

  if (
    latitud === null ||
    longitud === null ||
    latitud === undefined ||
    longitud === undefined ||
    String(latitud).trim() === "" ||
    String(longitud).trim() === ""
  ) {
    return null;
  }

  const lat = Number(latitud);
  const lng = Number(longitud);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  const coordenadas =
    encodeURIComponent(`${lat},${lng}`);

  return (
    "https://www.google.com/maps/search/" +
    `?api=1&query=${coordenadas}`
  );
}

function formatearEstado(
  estado: EstadoSolicitudRecojo,
): string {
  return (
    ETIQUETAS_ESTADOS[estado] ??
    estado
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function OpcionRecojo({
  usuarioId,
  viajeId,
  telefonoInicial = "",
  onTipoAbordajeChange,
  onRecojoRegistrado,
}: OpcionRecojoProps) {

  // ========================================
  // ESTADOS DEL FORMULARIO
  // ========================================

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

  const [editando, setEditando] = useState(false);
  const [quitarGps, setQuitarGps] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    mensaje,
    setMensaje,
  ] = useState<string | null>(null);

  // ========================================
  // ESTADOS DE CONSULTA
  // ========================================

  const [
    resultadoConsulta,
    setResultadoConsulta,
  ] = useState<ResultadoConsulta>({
    clave: "",
    estado: "INICIAL",
    solicitud: null,
    error: null,
  });

  const [
    versionConsulta,
    setVersionConsulta,
  ] = useState(0);

  // Impide dos POST simultáneos.
  const enviandoRef = useRef(false);

  // Después de registrar, nunca repetir
  // POST para ese usuario y viaje hasta
  // que se compruebe su situación.
  const [
    claveRegistrada,
    setClaveRegistrada,
  ] = useState<string | null>(null);

  const claveActual =
    `${usuarioId}:${viajeId}`;

  const consultaActual =
    resultadoConsulta.clave === claveActual;

  const solicitudExistente =
    consultaActual
      ? resultadoConsulta.solicitud
      : null;

  const consultaLista =
    consultaActual &&
    resultadoConsulta.estado === "LISTO";

  const consultaError =
    consultaActual &&
    resultadoConsulta.estado === "ERROR";

  const consultando =
    tipoAbordaje === "RECOJO" &&
    Boolean(usuarioId && viajeId) &&
    (
      !consultaActual ||
      resultadoConsulta.estado === "INICIAL" ||
      resultadoConsulta.estado === "CARGANDO"
    );

  const solicitudActiva =
    solicitudExistente !== null &&
    ESTADOS_ACTIVOS.includes(
      solicitudExistente.estado,
    );

  const registroBloqueado =
    claveRegistrada === claveActual &&
    !solicitudExistente;

  const puedeEditar =
    solicitudExistente?.estado === "PENDIENTE";

  const enlaceMapa =
    solicitudExistente
      ? obtenerEnlaceMapa(
          solicitudExistente,
        )
      : null;

  // ========================================
  // CONSULTAR EL RECOJO EXISTENTE
  // ========================================

  useEffect(() => {
    if (
      tipoAbordaje !== "RECOJO"
    ) {
      return;
    }

    if (
      !usuarioId ||
      !viajeId
    ) {
      setResultadoConsulta({
        clave: claveActual,
        estado: "INICIAL",
        solicitud: null,
        error: null,
      });

      return;
    }

    let vigente = true;

    const consultarRecojo = async () => {
      setResultadoConsulta({
        clave: claveActual,
        estado: "CARGANDO",
        solicitud: null,
        error: null,
      });

      try {
        const solicitud =
          await obtenerMiRecojo(viajeId);

        if (!vigente) {
          return;
        }

        setResultadoConsulta({
          clave: claveActual,
          estado: "LISTO",
          solicitud,
          error: null,
        });

        if (
          solicitud &&
          ESTADOS_ACTIVOS.includes(
            solicitud.estado,
          )
        ) {
          setClaveRegistrada(claveActual);
        } else {
          setClaveRegistrada((anterior) =>
            anterior === claveActual ? null : anterior,
          );
        }

        if (solicitud?.estado !== "PENDIENTE") {
          setEditando(false);
        }
      } catch (errorPeticion) {
        if (!vigente) {
          return;
        }

        setResultadoConsulta({
          clave: claveActual,
          estado: "ERROR",
          solicitud: null,
          error:
            obtenerMensajeErrorRecojo(
              errorPeticion,
            ),
        });
      }
    };

    void consultarRecojo();

    return () => {
      vigente = false;
    };
  }, [
    usuarioId,
    viajeId,
    tipoAbordaje,
    versionConsulta,
    claveActual,
  ]);

  // ========================================
  // LIMPIAR AL CAMBIAR DE VIAJE
  // ========================================

  useEffect(() => {
    setReferencia("");
    setTelefono(telefonoInicial);
    setObservacion("");

    setLatitud(undefined);
    setLongitud(undefined);

    setError(null);
    setMensaje(null);

    setObteniendoUbicacion(false);
    setEditando(false);
    setQuitarGps(false);
    setClaveRegistrada(null);
  }, [
    usuarioId,
    viajeId,
    telefonoInicial,
  ]);

  // ========================================
  // VOLVER A CONSULTAR
  // ========================================

  const recargarSolicitud =
    useCallback(() => {
      setError(null);
      setVersionConsulta(
        (actual) => actual + 1,
      );
    }, []);

  // ========================================
  // SELECCIONAR TIPO DE ABORDAJE
  // ========================================

  const seleccionarTipo = (
    tipo: TipoAbordaje,
  ) => {
    setTipoAbordaje(tipo);

    setError(null);
    setMensaje(null);

    onTipoAbordajeChange?.(tipo);
  };

  // ========================================
  // EDITAR RECOJO PENDIENTE
  // ========================================

  const iniciarEdicion = () => {
    if (!solicitudExistente || !puedeEditar) return;

    setReferencia(solicitudExistente.referencia);
    setTelefono(solicitudExistente.telefono);
    setObservacion(solicitudExistente.observacion ?? "");
    setLatitud(undefined);
    setLongitud(undefined);
    setQuitarGps(false);
    setError(null);
    setMensaje(null);
    setEditando(true);
  };

  const cancelarEdicion = () => {
    if (guardando) return;
    setEditando(false);
    setQuitarGps(false);
    setLatitud(undefined);
    setLongitud(undefined);
    setError(null);
    setMensaje(null);
  };

  // ========================================
  // OBTENER GPS
  // ========================================

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setError(
        "Este dispositivo no permite " +
        "obtener la ubicación GPS.",
      );

      return;
    }

    setObteniendoUbicacion(true);
    setError(null);
    setMensaje(null);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setLatitud(
          posicion.coords.latitude,
        );

        setLongitud(
          posicion.coords.longitude,
        );
        setQuitarGps(false);

        setObteniendoUbicacion(false);

        setMensaje(
          "Ubicación GPS agregada correctamente.",
        );
      },

      (errorGps) => {
        setObteniendoUbicacion(false);

        if (errorGps.code === 1) {
          setError(
            "Debes permitir el acceso " +
            "a la ubicación desde tu celular.",
          );
        } else if (errorGps.code === 3) {
          setError(
            "La ubicación tardó demasiado. " +
            "Inténtalo nuevamente.",
          );
        } else {
          setError(
            "No se pudo obtener tu ubicación. " +
            "Puedes escribir una referencia.",
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  // ========================================
  // REGISTRAR RECOJO
  // ========================================

  const guardarRecojo = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    if (
      enviandoRef.current ||
      guardando ||
      (solicitudActiva && !editando) ||
      (registroBloqueado && !editando)
    ) {
      return;
    }

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

    if (!consultaLista) {
      setError(
        "Primero debemos comprobar " +
        "si ya tienes un recojo registrado.",
      );
      return;
    }

    const referenciaLimpia =
      referencia.trim();

    const telefonoLimpio =
      telefono.trim();

    const observacionLimpia =
      observacion.trim();

    if (
      referenciaLimpia.length < 5 ||
      referenciaLimpia.length > 250
    ) {
      setError(
        "La referencia debe tener " +
        "entre 5 y 250 caracteres.",
      );
      return;
    }

    if (
      telefonoLimpio.length < 7 ||
      telefonoLimpio.length > 20
    ) {
      setError(
        "El teléfono debe tener " +
        "entre 7 y 20 caracteres.",
      );
      return;
    }

    if (
      observacionLimpia.length > 300
    ) {
      setError(
        "La observación no debe " +
        "superar los 300 caracteres.",
      );
      return;
    }

    enviandoRef.current = true;
    setGuardando(true);
    setError(null);
    setMensaje(null);

    try {
      if (editando) {
        if (!solicitudExistente || !puedeEditar) {
          throw new Error("El recojo ya no se puede editar.");
        }

        if ((latitud === undefined) !== (longitud === undefined)) {
          throw new Error("Debes indicar las dos coordenadas GPS.");
        }

        const coordenadas = quitarGps
          ? { latitud: null, longitud: null }
          : latitud !== undefined && longitud !== undefined
            ? { latitud, longitud }
            : {};

        const respuesta = await actualizarMiRecojo(
          solicitudExistente.id,
          {
            referencia: referenciaLimpia,
            telefono: telefonoLimpio,
            observacion: observacionLimpia,
            ...coordenadas,
          },
        );

        setEditando(false);
        setMensaje(
          respuesta.mensaje || "Lugar de recojo actualizado correctamente.",
        );
        recargarSolicitud();
      } else {
        const respuesta = await registrarRecojo({
          usuarioId,
          viajeId,
          referencia: referenciaLimpia,
          telefono: telefonoLimpio,
          observacion: observacionLimpia || undefined,
          latitud,
          longitud,
        });

        setClaveRegistrada(claveActual);
        setMensaje(
          respuesta.mensaje || "Solicitud registrada correctamente.",
        );
        onRecojoRegistrado?.(respuesta.solicitud);
        recargarSolicitud();
      }

    } catch (errorPeticion) {
      const estado =
        obtenerEstadoHttp(
          errorPeticion,
        );

      if (!editando && estado === 409) {
        // El servidor informa que ya existe una solicitud activa.
        // No repetimos el POST: recuperamos la solicitud del pasajero.
        setClaveRegistrada(claveActual);
        setResultadoConsulta({
          clave: claveActual,
          estado: "CARGANDO",
          solicitud: null,
          error: null,
        });

        try {
          const existente = await obtenerMiRecojo(viajeId);

          if (
            existente &&
            ESTADOS_ACTIVOS.includes(existente.estado)
          ) {
            setResultadoConsulta({
              clave: claveActual,
              estado: "LISTO",
              solicitud: existente,
              error: null,
            });
            setEditando(false);
            setError(null);
            setMensaje(
              "Ya tenías un recojo registrado para este viaje. " +
              "Te mostramos la información guardada.",
            );
          } else {
            // Una respuesta inconsistente no debe permitir otro POST
            // hasta que se vuelva a comprobar el estado en el servidor.
            setResultadoConsulta({
              clave: claveActual,
              estado: "LISTO",
              solicitud: existente,
              error: null,
            });
            setError(
              "El servidor indica que ya tienes una solicitud activa, " +
              "pero no fue posible recuperarla. Actualiza la consulta " +
              "antes de volver a intentarlo.",
            );
          }
        } catch (errorConsulta) {
          setResultadoConsulta({
            clave: claveActual,
            estado: "ERROR",
            solicitud: null,
            error: obtenerMensajeErrorRecojo(errorConsulta),
          });
          setError(
            "El recojo ya existe, pero no se pudo consultar. " +
            "Presiona Volver a consultar para verlo.",
          );
        }
      } else {
        setError(
          obtenerMensajeErrorRecojo(errorPeticion),
        );
      }
    } finally {
      enviandoRef.current = false;
      setGuardando(false);
    }
  };

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_16px_45px_rgba(15,118,76,0.08)]">

      {/* ENCABEZADO */}

      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-4 py-5 sm:px-7">

        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
          Lugar de abordaje
        </p>

        <h3 className="mt-1 text-xl font-black text-slate-950">
          ¿Dónde deseas subir?
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Puedes abordar en la terminal
          o solicitar que el vehículo
          te recoja en el camino.
        </p>
      </div>

      <div className="p-4 sm:p-7">

        {/* OPCIONES */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">

          {/* TERMINAL */}

          <button
            type="button"
            onClick={() =>
              seleccionarTipo(
                "TERMINAL",
              )
            }
            className={`relative rounded-3xl border-2 p-4 text-left transition sm:p-5 ${
              tipoAbordaje === "TERMINAL"
                ? "border-emerald-600 bg-emerald-50 shadow-md"
                : "border-slate-200 bg-white hover:border-emerald-200"
            }`}
          >
            {tipoAbordaje === "TERMINAL" && (
              <CheckCircle2
                size={20}
                className="absolute right-4 top-4 text-emerald-700"
              />
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Warehouse size={22} />
            </div>

            <p className="mt-3 font-black text-slate-950 sm:mt-4">
              Subir en la terminal
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Esperaré el vehículo en
              el punto principal de salida.
            </p>
          </button>

          {/* RECOJO */}

          <button
            type="button"
            onClick={() =>
              seleccionarTipo(
                "RECOJO",
              )
            }
            className={`relative rounded-3xl border-2 p-4 text-left transition sm:p-5 ${
              tipoAbordaje === "RECOJO"
                ? "border-emerald-600 bg-emerald-50 shadow-md"
                : "border-slate-200 bg-white hover:border-emerald-200"
            }`}
          >
            {tipoAbordaje === "RECOJO" && (
              <CheckCircle2
                size={20}
                className="absolute right-4 top-4 text-emerald-700"
              />
            )}

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <MapPin size={22} />
            </div>

            <p className="mt-3 font-black text-slate-950 sm:mt-4">
              Solicitar recojo
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Indica el lugar donde deseas
              abordar durante el recorrido.
            </p>
          </button>
        </div>

        {/* CONTENIDO DE RECOJO */}

        {tipoAbordaje === "RECOJO" && (
          <div className="mt-5 rounded-3xl border border-emerald-100 bg-slate-50 p-4 sm:mt-6 sm:p-5">

            {/* FALTA SESIÓN O VIAJE */}

            {(!usuarioId || !viajeId) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                {!usuarioId
                  ? "Debes iniciar sesión para solicitar un recojo."
                  : "Selecciona primero el viaje y el vehículo."}
              </div>
            )}

            {/* CARGANDO */}

            {consultando && (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">

                <Loader2
                  size={28}
                  className="animate-spin text-emerald-700"
                />

                <p className="text-sm font-bold text-slate-700">
                  Consultando tu solicitud de recojo...
                </p>
              </div>
            )}

            {/* ERROR DE CONSULTA */}

            {consultaError && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">

                <div className="flex items-start gap-2">

                  <AlertCircle
                    size={20}
                    className="shrink-0 text-amber-700"
                  />

                  <div className="min-w-0">

                    <p className="font-black text-amber-900">
                      No se pudo consultar tu recojo
                    </p>

                    <p className="mt-1 break-words text-sm text-amber-800">
                      {resultadoConsulta.error}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={recargarSolicitud}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-sm font-bold text-white"
                >
                  <RefreshCw size={17} />
                  Volver a consultar
                </button>
              </div>
            )}

            {/* SOLICITUD EXISTENTE */}

            {consultaLista &&
              solicitudActiva &&
              solicitudExistente &&
              !editando && (

              <div className="space-y-4">

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                  <CheckCircle2
                    size={23}
                    className="shrink-0 text-emerald-700"
                  />

                  <div className="min-w-0">

                    <h4 className="font-black text-emerald-900">
                      Ya tienes un recojo registrado
                    </h4>

                    <p className="mt-1 text-sm text-emerald-800">
                      Tu solicitud está guardada.
                      No necesitas registrarla nuevamente.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">

                  {/* ESTADO */}

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <span className="text-sm text-slate-500">
                      Estado
                    </span>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                      {formatearEstado(
                        solicitudExistente.estado,
                      )}
                    </span>
                  </div>

                  {/* REFERENCIA */}

                  <div className="border-t border-slate-100 pt-3">

                    <p className="text-xs font-bold uppercase text-slate-500">
                      Referencia de recojo
                    </p>

                    <p className="mt-1 break-words font-black text-slate-900">
                      {solicitudExistente.referencia}
                    </p>
                  </div>

                  {/* TELÉFONO */}

                  <div className="flex items-start gap-2 border-t border-slate-100 pt-3">

                    <Phone
                      size={17}
                      className="shrink-0 text-emerald-700"
                    />

                    <div className="min-w-0">

                      <p className="text-xs text-slate-500">
                        Teléfono
                      </p>

                      <p className="break-words text-sm font-bold text-slate-900">
                        {solicitudExistente.telefono}
                      </p>
                    </div>
                  </div>

                  {/* OBSERVACIÓN */}

                  {solicitudExistente.observacion && (

                    <div className="border-t border-slate-100 pt-3">

                      <p className="text-xs text-slate-500">
                        Observación
                      </p>

                      <p className="mt-1 break-words text-sm text-slate-800">
                        {solicitudExistente.observacion}
                      </p>
                    </div>
                  )}

                  {/* VEHÍCULO */}

                  {solicitudExistente.viaje && (

                    <div className="border-t border-slate-100 pt-3">

                      <p className="text-xs text-slate-500">
                        Vehículo
                      </p>

                      <p className="mt-1 font-bold text-slate-900">

                        {/* CORRECCIÓN TS2339:
                            usamos placa, que sí
                            existe en ViajeRecojo. */}

                        Vehículo —{" "}
                        {solicitudExistente.viaje.vehiculo?.placa ??
                          "Sin placa"}
                      </p>

                      <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">

                        <Clock3 size={14} />

                        {solicitudExistente.viaje.fecha}

                        {" · "}

                        {solicitudExistente.viaje.horaSalida}
                      </p>
                    </div>
                  )}
                </div>

                {/* MAPA */}

                {enlaceMapa ? (

                  <a
                    href={enlaceMapa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3.5 text-center text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <MapPin size={18} />

                    Ver mi ubicación en Google Maps

                    <ExternalLink size={15} />
                  </a>

                ) : (

                  <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Este recojo tiene una referencia
                    escrita, pero no tiene coordenadas
                    GPS registradas.
                  </p>
                )}

                <button
                  type="button"
                  onClick={recargarSolicitud}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <RefreshCw size={17} />
                  Actualizar información
                </button>

                {puedeEditar ? (
                  <button
                    type="button"
                    onClick={iniciarEdicion}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3.5 text-sm font-black text-white transition hover:bg-emerald-800"
                  >
                    <Pencil size={18} />
                    Editar lugar de recojo
                  </button>
                ) : (
                  <p className="text-center text-xs text-slate-500">
                    El recojo confirmado ya no se puede modificar.
                  </p>
                )}
              </div>
            )}

            {/* HISTORIAL */}

            {consultaLista &&
              solicitudExistente &&
              !solicitudActiva &&
              !editando && (

              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">

                <p className="font-bold text-slate-800">
                  Último recojo registrado
                </p>

                <p className="mt-1 break-words text-sm text-slate-600">
                  {solicitudExistente.referencia}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {formatearEstado(
                    solicitudExistente.estado,
                  )}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Esta solicitud ya no está activa.
                </p>
              </div>
            )}

            {/* FORMULARIO */}

            {consultaLista &&
              (editando || (!solicitudActiva && !registroBloqueado)) && (

              <form
                onSubmit={guardarRecojo}
                className="space-y-4"
              >
                {editando && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm font-black text-emerald-900">
                      Editar mi lugar de recojo
                    </p>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      disabled={guardando}
                      className="flex items-center gap-1 text-sm font-bold text-slate-600 disabled:opacity-60"
                    >
                      <X size={17} /> Cancelar
                    </button>
                  </div>
                )}

                {/* REFERENCIA */}

                <div>

                  <label
                    htmlFor="recojo-referencia"
                    className="text-sm font-black text-slate-800"
                  >
                    Referencia de recojo
                  </label>

                  <div className="relative mt-2">

                    <MapPin
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                    />

                    <input
                      id="recojo-referencia"
                      type="text"
                      required
                      minLength={5}
                      maxLength={250}
                      value={referencia}
                      onChange={(evento) =>
                        setReferencia(
                          evento.target.value,
                        )
                      }
                      placeholder="Ej.: Puente Chimoré, frente al surtidor"
                      className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                {/* TELÉFONO */}

                <div>

                  <label
                    htmlFor="recojo-telefono"
                    className="text-sm font-black text-slate-800"
                  >
                    Teléfono de contacto
                  </label>

                  <div className="relative mt-2">

                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
                    />

                    <input
                      id="recojo-telefono"
                      type="tel"
                      required
                      minLength={7}
                      maxLength={20}
                      value={telefono}
                      onChange={(evento) =>
                        setTelefono(
                          evento.target.value,
                        )
                      }
                      placeholder="Ej.: 70000000"
                      className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                {/* OBSERVACIÓN */}

                <div>

                  <label
                    htmlFor="recojo-observacion"
                    className="text-sm font-black text-slate-800"
                  >
                    Observación opcional
                  </label>

                  <textarea
                    id="recojo-observacion"
                    value={observacion}
                    onChange={(evento) =>
                      setObservacion(
                        evento.target.value,
                      )
                    }
                    placeholder="Ej.: Llevo una mochila roja"
                    rows={3}
                    maxLength={300}
                    className="mt-2 w-full min-w-0 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                {/* UBICACIÓN GPS */}

                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  disabled={
                    obteniendoUbicacion ||
                    guardando
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                    ? "Ubicación GPS agregada"
                    : "Usar mi ubicación actual"}
                </button>

                {editando && (
                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                    {solicitudExistente?.latitud != null &&
                      solicitudExistente?.longitud != null &&
                      latitud === undefined && !quitarGps && (
                        <p className="text-xs text-slate-600">
                          Conservaremos tu ubicación GPS anterior si no eliges una nueva.
                        </p>
                      )}
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={quitarGps}
                        disabled={guardando}
                        onChange={(evento) => {
                          setQuitarGps(evento.target.checked);
                          if (evento.target.checked) {
                            setLatitud(undefined);
                            setLongitud(undefined);
                          }
                        }}
                      />
                      Quitar mi ubicación GPS guardada
                    </label>
                  </div>
                )}

                {/* MENSAJE GPS */}

                {latitud !== undefined &&
                  longitud !== undefined && (

                  <p className="text-center text-xs font-semibold text-emerald-700">
                    Ubicación lista para enviarse
                    con tu solicitud.
                  </p>
                )}

                {/* ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >

                    <AlertCircle
                      size={18}
                      className="shrink-0"
                    />

                    <span>{error}</span>
                  </div>
                )}

                {/* MENSAJE CORRECTO */}

                {mensaje && (
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                  >

                    <CheckCircle2
                      size={18}
                      className="shrink-0"
                    />

                    <span>{mensaje}</span>
                  </div>
                )}

                {/* CONFIRMAR */}

                <button
                  type="submit"
                  disabled={
                    guardando ||
                    consultando ||
                    obteniendoUbicacion
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {guardando ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      {editando ? "Guardando cambios..." : "Registrando recojo..."}
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />

                      {editando ? "Guardar cambios" : "Confirmar lugar de recojo"}
                    </>
                  )}
                </button>
              </form>
            )}

            {consultaLista && !editando && solicitudActiva && error && (
              <p role="alert" className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}

            {consultaLista && !editando && solicitudActiva && mensaje && (
              <p role="status" className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                {mensaje}
              </p>
            )}

            {/* SOLICITUD GUARDADA,
                ESPERANDO CONSULTA */}

            {consultaLista &&
              registroBloqueado &&
              !solicitudActiva &&
              !editando && (

              <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

                <div className="flex items-center gap-2">

                  <CheckCircle2
                    size={20}
                    className="text-emerald-700"
                  />

                  <p className="font-black text-emerald-900">
                    La solicitud ya fue registrada
                  </p>
                </div>

                <p className="text-sm text-emerald-800">
                  No se enviará otro registro.
                  Actualiza la información
                  para consultar su estado.
                </p>

                <button
                  type="button"
                  onClick={recargarSolicitud}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-700"
                >
                  <RefreshCw size={17} />

                  Consultar mi solicitud
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}