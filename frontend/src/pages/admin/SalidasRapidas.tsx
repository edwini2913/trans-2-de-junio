import {
  ArrowDown,
  ArrowUp,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  MapPinned,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Megaphone,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  agregarVehiculoFila,
  autorizarSalidaRapida,
  crearFilaSalida,
  obtenerAvisoSalidaActivo,
  obtenerFilaSalida,
  obtenerVehiculosRapidos,
  obtenerChoferesActivos,
  publicarAvisoSalida,
  retirarAvisoSalida,
  obtenerRecojosPorViaje,
  actualizarEstadoRecojo,
  obtenerEnlaceMapaRecojo,
} from "../../services/salidas-rapidas.service";

import type {
  AvisoSalidaRapida,
  MotivoAvisoSalida,
  TipoServicioAviso,
  TurnoSalidaRapida,
  VehiculoRapido,
  ChoferDisponible,
  SolicitudRecojo,
  EstadoSolicitudRecojo,
} from "../../services/salidas-rapidas.service";

import {
  obtenerRutas,
} from "../../services/rutas.service";

import {
  obtenerUsuarioLocal,
} from "../../utils/compra/compra.utils";

interface RutaDisponible {
  id: string;
  origen: string;
  destino: string;
  estado?: boolean;
}

const fechaActual = () => {
  const fecha = new Date();
  const compensacion =
    fecha.getTimezoneOffset() *
    60_000;

  return new Date(
    fecha.getTime() -
      compensacion,
  )
    .toISOString()
    .substring(0, 10);
};

const obtenerHoraBolivia = () =>
  new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone:
        "America/La_Paz",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  ).format(new Date());

const sumarMinutos = (
  hora: string,
  minutosAgregar: number,
) => {
  const [horas, minutos] =
    hora.split(":").map(Number);

  const total =
    ((horas * 60 +
      minutos +
      minutosAgregar) %
      1440 +
      1440) %
    1440;

  return `${String(
    Math.floor(total / 60),
  ).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
};

const obtenerError = (
  error: unknown,
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const respuesta = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(respuesta)) {
      return respuesta.join(" ");
    }

    if (typeof respuesta === "string") {
      return respuesta;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
};

/**
 * Recojos pertenecientes al viaje elegido.
 * Se consulta solo cuando administracion abre el detalle.
 * La ruta del backend requiere JWT + rol administrativo.
 */
function RecojosPorViaje({
  viajeId,
  administradorId,
}: {
  viajeId: string;
  administradorId: string;
}) {
  const [solicitudes, setSolicitudes] = useState<SolicitudRecojo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    void obtenerRecojosPorViaje(viajeId)
      .then((respuesta) => {
        if (vigente) setSolicitudes(respuesta);
      })
      .catch((fallo: unknown) => {
        if (vigente) setError(obtenerError(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => { vigente = false; };
  }, [viajeId, revision]);

  const cambiarEstado = async (
    solicitud: SolicitudRecojo,
    estado: EstadoSolicitudRecojo,
  ) => {
    if (!administradorId || actualizandoId) return;
    const accion = estado === "CONFIRMADA" ? "confirmar" : "cancelar";
    if (!window.confirm(`¿Deseas ${accion} el recojo de ${solicitud.usuario.nombre} ${solicitud.usuario.apellido}?`)) return;

    try {
      setActualizandoId(solicitud.id);
      setError("");
      setMensaje("");
      await actualizarEstadoRecojo(solicitud.id, {
        estado,
        administradorId,
      });
      setMensaje(`Solicitud ${estado === "CONFIRMADA" ? "confirmada" : "cancelada"} correctamente.`);
      setRevision((anterior) => anterior + 1);
    } catch (fallo) {
      setError(obtenerError(fallo));
    } finally {
      setActualizandoId(null);
    }
  };

  const pendientes = solicitudes.filter((r) => r.estado === "PENDIENTE").length;
  const confirmadas = solicitudes.filter((r) => r.estado === "CONFIRMADA").length;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-slate-900">Solicitudes de recojo</h4>
          <p className="mt-1 text-xs text-slate-500">
            {pendientes} pendientes · {confirmadas} confirmadas · {solicitudes.length} en total
          </p>
        </div>
        <button
          type="button"
          disabled={cargando || Boolean(actualizandoId)}
          onClick={() => setRevision((anterior) => anterior + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50"
        >
          <RefreshCw size={15} className={cargando ? "animate-spin" : ""} />
          Actualizar recojos
        </button>
      </div>

      {mensaje && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{mensaje}</p>}
      {error && <p role="alert" className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</p>}
      {cargando ? (
        <div className="mt-4 flex items-center gap-2 py-5 text-sm font-semibold text-emerald-700">
          <Loader2 size={18} className="animate-spin" /> Consultando solicitudes...
        </div>
      ) : solicitudes.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Este vehículo todavía no tiene solicitudes de recojo.</p>
      ) : (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {solicitudes.map((solicitud) => {
            const urlMapa = obtenerEnlaceMapaRecojo(solicitud, "VER");
            return (
              <article key={solicitud.id} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-black text-slate-900">
                      {solicitud.usuario.nombre} {solicitud.usuario.apellido}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><Phone size={14} />{solicitud.telefono}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${solicitud.estado === "PENDIENTE" ? "bg-amber-100 text-amber-800" : solicitud.estado === "CONFIRMADA" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                    {solicitud.estado.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-3 break-words text-sm text-slate-800"><span className="font-black">Referencia:</span> {solicitud.referencia}</p>
                {solicitud.observacion && (
                  <p className="mt-1 break-words text-sm text-slate-600"><span className="font-bold">Observación:</span> {solicitud.observacion}</p>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  {urlMapa ? (
                    <a href={urlMapa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-bold text-emerald-700">
                      <MapPin size={16} /> Ver ubicación <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Sin GPS: usar referencia escrita</span>
                  )}
                  {solicitud.estado === "PENDIENTE" && (
                    <>
                      <button type="button" disabled={Boolean(actualizandoId)} onClick={() => void cambiarEstado(solicitud, "CONFIRMADA")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-black text-white disabled:opacity-50">
                        {actualizandoId === solicitud.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Confirmar
                      </button>
                      <button type="button" disabled={Boolean(actualizandoId)} onClick={() => void cambiarEstado(solicitud, "CANCELADA")} className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">Cancelar</button>
                    </>
                  )}
                  {solicitud.estado === "CONFIRMADA" && (
                    <button type="button" disabled={Boolean(actualizandoId)} onClick={() => void cambiarEstado(solicitud, "CANCELADA")} className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">Cancelar recojo</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SalidasRapidas() {
  const usuario =
    obtenerUsuarioLocal();

  const [
    rutas,
    setRutas,
  ] = useState<RutaDisponible[]>([]);

  const [
    vehiculos,
    setVehiculos,
  ] = useState<VehiculoRapido[]>([]);

  const [choferes, setChoferes] = useState<ChoferDisponible[]>([]);
  const [choferesPorVehiculo, setChoferesPorVehiculo] = useState<Record<string, string>>({});
  const [busquedaPlaca, setBusquedaPlaca] = useState("");
  const [cargandoChoferes, setCargandoChoferes] = useState(false);
  const [errorChoferes, setErrorChoferes] = useState("");

  const [
    vehiculosSeleccionados,
    setVehiculosSeleccionados,
  ] = useState<string[]>([]);

  const [
    rutaId,
    setRutaId,
  ] = useState("");

  const [
    fecha,
    setFecha,
  ] = useState(
    fechaActual(),
  );

  const [
    intervaloMinutos,
    setIntervaloMinutos,
  ] = useState(30);

  const [
    precio,
    setPrecio,
  ] = useState("");

  const [
    fila,
    setFila,
  ] = useState<TurnoSalidaRapida[]>([]);

  const [viajeRecojosAbierto, setViajeRecojosAbierto] = useState<string | null>(null);

  const [
    avisoActivo,
    setAvisoActivo,
  ] = useState<AvisoSalidaRapida | null>(
    null,
  );

  const [
    motivoAviso,
    setMotivoAviso,
  ] = useState<MotivoAvisoSalida>(
    "SIN_VEHICULOS",
  );

  const [
    tipoServicioAviso,
    setTipoServicioAviso,
  ] = useState<TipoServicioAviso>(
    "SUSPENSION_TOTAL",
  );

  const [
    puntoLlegadaTemporal,
    setPuntoLlegadaTemporal,
  ] = useState("");

  const [
    tituloAviso,
    setTituloAviso,
  ] = useState(
    "No hay movilidades disponibles",
  );

  const [
    textoAviso,
    setTextoAviso,
  ] = useState(
    "Administración informa que actualmente no existen vehículos Noah o Hiace disponibles para esta ruta.",
  );

  const [
    guardandoAviso,
    setGuardandoAviso,
  ] = useState(false);

  const [
    agregandoVehiculos,
    setAgregandoVehiculos,
  ] = useState(false);

  const [
    cargandoDatos,
    setCargandoDatos,
  ] = useState(true);

  const [
    cargandoFila,
    setCargandoFila,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    autorizandoId,
    setAutorizandoId,
  ] = useState<string | null>(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    esError,
    setEsError,
  ] = useState(false);

  const cargarDatos =
    useCallback(
      async () => {
        try {
          setCargandoDatos(true);

          const [
            respuestaRutas,
            respuestaVehiculos,
          ] = await Promise.all([
            obtenerRutas(),
            obtenerVehiculosRapidos(),
          ]);

          setRutas(
            Array.isArray(respuestaRutas)
              ? respuestaRutas
              : [],
          );

          setVehiculos(
            Array.isArray(
              respuestaVehiculos,
            )
              ? respuestaVehiculos
              : [],
          );
        } catch (error) {
          setMensaje(
            obtenerError(error),
          );
          setEsError(true);
        } finally {
          setCargandoDatos(false);
        }
      },
      [],
    );

  const cargarChoferes = useCallback(async () => {
    try {
      setCargandoChoferes(true);
      setErrorChoferes("");
      const lista = await obtenerChoferesActivos();
      setChoferes(lista);
    } catch (error) {
      setChoferes([]);
      setErrorChoferes(obtenerError(error));
    } finally {
      setCargandoChoferes(false);
    }
  }, []);

  const consultarFila =
    useCallback(
      async (
        mostrarCarga = false,
      ) => {
        if (!rutaId || !fecha) {
          setFila([]);
          setAvisoActivo(null);
          return;
        }

        try {
          if (mostrarCarga) {
            setCargandoFila(true);
          }

          const [
            respuesta,
            aviso,
          ] = await Promise.all([
            obtenerFilaSalida(
              rutaId,
              fecha,
            ),
            obtenerAvisoSalidaActivo(
              rutaId,
              fecha,
            ),
          ]);

          setFila(respuesta);
          setAvisoActivo(aviso);
        } catch (error) {
          setMensaje(
            obtenerError(error),
          );
          setEsError(true);
        } finally {
          setCargandoFila(false);
        }
      },
      [
        fecha,
        rutaId,
      ],
    );

  useEffect(() => {
    void cargarDatos();
    void cargarChoferes();
  }, [cargarDatos, cargarChoferes]);

  useEffect(() => {
    if (!rutaId || !fecha) {
      setFila([]);
      return;
    }

    void consultarFila(true);

    const intervalo =
      window.setInterval(
        () => {
          void consultarFila(false);
        },
        3000,
      );

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, [
    consultarFila,
    fecha,
    rutaId,
  ]);

  const seleccionados =
    useMemo(
      () =>
        vehiculosSeleccionados
          .map((id) =>
            vehiculos.find(
              (vehiculo) =>
                vehiculo.id === id,
            ),
          )
          .filter(
            (
              vehiculo,
            ): vehiculo is VehiculoRapido =>
              Boolean(vehiculo),
          ),
      [
        vehiculos,
        vehiculosSeleccionados,
      ],
    );

  const idsVehiculosEnFila =
    useMemo(
      () =>
        new Set(
          fila.map(
            (turno) =>
              turno.vehiculo.id,
          ),
        ),
      [fila],
    );

  const vehiculosParaSeleccionar =
    useMemo(
      () =>
        vehiculos.filter((vehiculo) =>
          !idsVehiculosEnFila.has(vehiculo.id) &&
          (vehiculo.placa.toUpperCase().includes(busquedaPlaca.trim().toUpperCase()) ||
            vehiculosSeleccionados.includes(vehiculo.id)),
        ),
      [idsVehiculosEnFila, vehiculos, busquedaPlaca, vehiculosSeleccionados],
    );

  const seleccionarVehiculo = (
    vehiculoId: string,
  ) => {
    setMensaje("");

    // Al seleccionar una placa, sugerir su chofer habitual.
    // No sobrescribir una elección manual ni asignar un chofer
    // inactivo o ya elegido para otro vehículo de esta fila.
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    const habitual = vehiculo?.choferHabitual;
    if (
      habitual &&
      choferes.some((c) => c.id === habitual.id) &&
      !vehiculosSeleccionados.includes(vehiculoId)
    ) {
      setChoferesPorVehiculo((actual) => {
        if (actual[vehiculoId]) return actual;
        const usado = vehiculosSeleccionados.some(
          (id) => actual[id] === habitual.id,
        );
        return usado
          ? actual
          : { ...actual, [vehiculoId]: habitual.id };
      });
    }

    setVehiculosSeleccionados(
      (actuales) => {
        if (
          actuales.includes(
            vehiculoId,
          )
        ) {
          return actuales.filter(
            (id) =>
              id !== vehiculoId,
          );
        }

        return [
          ...actuales,
          vehiculoId,
        ];
      },
    );
  };

  const moverVehiculo = (
    indice: number,
    direccion: -1 | 1,
  ) => {
    setVehiculosSeleccionados(
      (actuales) => {
        const nuevoIndice =
          indice + direccion;

        if (
          nuevoIndice < 0 ||
          nuevoIndice >=
            actuales.length
        ) {
          return actuales;
        }

        const copia = [
          ...actuales,
        ];

        [
          copia[indice],
          copia[nuevoIndice],
        ] = [
          copia[nuevoIndice],
          copia[indice],
        ];

        return copia;
      },
    );
  };

  const crearFila = async () => {
    if (!usuario.id) {
      setMensaje(
        "No se encontró al administrador o secretaria.",
      );
      setEsError(true);
      return;
    }

    if (
      !rutaId ||
      !fecha ||
      !precio
    ) {
      setMensaje(
        "Completa la ruta, fecha y precio.",
      );
      setEsError(true);
      return;
    }

    if (
      vehiculosSeleccionados.length ===
      0
    ) {
      setMensaje(
        "Selecciona al menos un Noah o Hiace.",
      );
      setEsError(true);
      return;
    }

    const asignacionesChoferes = vehiculosSeleccionados.map((vehiculoId) => ({
      vehiculoId,
      choferId: choferesPorVehiculo[vehiculoId] || "",
    }));
    if (asignacionesChoferes.some((asignacion) => !asignacion.choferId)) {
      setMensaje("Selecciona un chofer para cada vehículo antes de habilitar la fila.");
      setEsError(true);
      return;
    }
    if (new Set(asignacionesChoferes.map((asignacion) => asignacion.choferId)).size !== asignacionesChoferes.length) {
      setMensaje("Un mismo chofer no puede conducir dos vehículos de la misma fila.");
      setEsError(true);
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const respuesta =
        await crearFilaSalida({
          rutaId,
          fecha,
          intervaloMinutos,
          precio:
            Number(precio),
          vehiculoIds:
            vehiculosSeleccionados,
          asignacionesChoferes,
          habilitadoPor:
            usuario.id,
        });

      setMensaje(
        respuesta.mensaje ??
          "Fila creada correctamente.",
      );
      setEsError(false);

      setFila(
        Array.isArray(
          respuesta.fila,
        )
          ? respuesta.fila
          : [],
      );

      setVehiculosSeleccionados(
        [],
      );
    } catch (error) {
      setMensaje(
        obtenerError(error),
      );
      setEsError(true);
    } finally {
      setGuardando(false);
    }
  };

  const agregarVehiculosAFila =
    async () => {
      if (!usuario.id) {
        setMensaje(
          "No se encontró al administrador o secretaria.",
        );
        setEsError(true);
        return;
      }

      if (!rutaId || !fecha) {
        setMensaje(
          "Selecciona la ruta y la fecha.",
        );
        setEsError(true);
        return;
      }

      if (
        vehiculosSeleccionados.length ===
        0
      ) {
        setMensaje(
          "Selecciona al menos un vehículo para agregar.",
        );
        setEsError(true);
        return;
      }

      if (vehiculosSeleccionados.some((id) => !choferesPorVehiculo[id])) {
        setMensaje("Debes seleccionar el chofer de cada vehículo que llega.");
        setEsError(true);
        return;
      }
      const asignados = vehiculosSeleccionados.map((id) => choferesPorVehiculo[id]);
      if (new Set(asignados).size !== asignados.length) {
        setMensaje("No puedes asignar el mismo chofer a dos vehículos de esta llegada.");
        setEsError(true);
        return;
      }
      const ocupados = new Set(fila.filter((turno) => turno.activo &&
        !["FINALIZADO", "CANCELADO"].includes(turno.estado))
        .map((turno) => turno.chofer?.id).filter(Boolean));
      if (asignados.some((id) => ocupados.has(id))) {
        setMensaje("Uno de los choferes ya tiene otro turno activo en esta fila.");
        setEsError(true);
        return;
      }

      try {
        setAgregandoVehiculos(true);
        setMensaje("");

        for (const vehiculoId of
          vehiculosSeleccionados) {
          await agregarVehiculoFila({
            rutaId,
            fecha,
            vehiculoId,
            choferId: choferesPorVehiculo[vehiculoId],
            intervaloMinutos,
            administradorId:
              usuario.id,
          });
        }

        setVehiculosSeleccionados([]);
        setMensaje(
          "Los vehículos fueron agregados al final de la fila.",
        );
        setEsError(false);

        await consultarFila(true);
      } catch (error) {
        setMensaje(
          obtenerError(error),
        );
        setEsError(true);
      } finally {
        setAgregandoVehiculos(false);
      }
    };

  const publicarAviso = async () => {
    if (!usuario.id) {
      setMensaje(
        "No se encontró al administrador o secretaria.",
      );
      setEsError(true);
      return;
    }

    if (!rutaId || !fecha) {
      setMensaje(
        "Selecciona la ruta y la fecha del aviso.",
      );
      setEsError(true);
      return;
    }

    if (
      tituloAviso.trim().length < 5 ||
      textoAviso.trim().length < 10
    ) {
      setMensaje(
        "Escribe un título y un mensaje completos.",
      );
      setEsError(true);
      return;
    }

    if (
      tipoServicioAviso ===
        "SERVICIO_PARCIAL" &&
      puntoLlegadaTemporal.trim().length < 3
    ) {
      setMensaje(
        "Indica hasta qué punto llegará temporalmente el vehículo.",
      );
      setEsError(true);
      return;
    }

    try {
      setGuardandoAviso(true);
      setMensaje("");

      const respuesta =
        await publicarAvisoSalida({
          rutaId,
          fecha,
          motivo: motivoAviso,
          tipoServicio:
            tipoServicioAviso,
          permiteCompra:
            tipoServicioAviso !==
            "SUSPENSION_TOTAL",
          puntoLlegadaTemporal:
            tipoServicioAviso ===
            "SERVICIO_PARCIAL"
              ? puntoLlegadaTemporal.trim()
              : undefined,
          titulo:
            tituloAviso.trim(),
          mensaje:
            textoAviso.trim(),
          publicadoPor:
            usuario.id,
        });

      setAvisoActivo(
        respuesta.aviso,
      );
      setMensaje(
        respuesta.mensaje,
      );
      setEsError(false);
    } catch (error) {
      setMensaje(
        obtenerError(error),
      );
      setEsError(true);
    } finally {
      setGuardandoAviso(false);
    }
  };

  const retirarAviso = async () => {
    if (!usuario.id || !avisoActivo) {
      return;
    }

    try {
      setGuardandoAviso(true);
      setMensaje("");

      const respuesta =
        await retirarAvisoSalida(
          avisoActivo.id,
          usuario.id,
        );

      setAvisoActivo(null);
      setMensaje(
        respuesta.mensaje,
      );
      setEsError(false);
    } catch (error) {
      setMensaje(
        obtenerError(error),
      );
      setEsError(true);
    } finally {
      setGuardandoAviso(false);
    }
  };

  const autorizarSalida = async (
    turno: TurnoSalidaRapida,
  ) => {
    if (!usuario.id) {
      setMensaje(
        "No se encontró al administrador o secretaria.",
      );
      setEsError(true);
      return;
    }

    const confirmar =
      window.confirm(
        `¿Autorizar la salida del ${turno.vehiculo.tipo} con placa ${turno.vehiculo.placa}?`,
      );

    if (!confirmar) {
      return;
    }

    try {
      setAutorizandoId(
        turno.id,
      );
      setMensaje("");

      const respuesta =
        await autorizarSalidaRapida(
          turno.id,
          usuario.id,
        );

      setMensaje(
        respuesta.mensaje ??
          "Salida autorizada correctamente.",
      );
      setEsError(false);

      await consultarFila();
    } catch (error) {
      setMensaje(
        obtenerError(error),
      );
      setEsError(true);
    } finally {
      setAutorizandoId(null);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={42}
            className="mx-auto animate-spin text-emerald-700"
          />

          <p className="mt-4 font-black text-slate-800">
            Cargando salidas rápidas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <header className="overflow-hidden rounded-[28px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-7 text-white shadow-xl shadow-emerald-900/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
              <BusFront size={29} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                Sector Noah y Hiace
              </p>

              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                Control de salidas rápidas
              </h1>

              <p className="mt-2 text-sm text-emerald-100">
                Organiza todos los vehículos necesarios y
                observa las ventas en tiempo real.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void consultarFila(true)
            }
            disabled={
              cargandoFila ||
              !rutaId
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={
                cargandoFila
                  ? "animate-spin"
                  : ""
              }
            />
            Actualizar
          </button>
        </div>
      </header>

      {mensaje && (
        <div
          className={`rounded-2xl border px-5 py-4 font-bold ${
            esError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {!esError && (
              <CheckCircle2 size={19} />
            )}

            {mensaje}
          </div>
        </div>
      )}

      <section className="rounded-[28px] border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Configuración diaria
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            Preparar fila de vehículos
          </h2>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Ruta
            </span>

            <select
              value={rutaId}
              onChange={(evento) => {
                setRutaId(
                  evento.target.value,
                );
                setMensaje("");
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">
                Elegir ruta...
              </option>

              {rutas.map((ruta) => (
                <option
                  key={ruta.id}
                  value={ruta.id}
                >
                  {ruta.origen} →{" "}
                  {ruta.destino}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Fecha
            </span>

            <div className="relative mt-2">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
              />

              <input
                type="date"
                value={fecha}
                min={fechaActual()}
                onChange={(evento) =>
                  setFecha(
                    evento.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Precio por asiento
            </span>

            <input
              type="number"
              min="0.01"
              step="0.50"
              value={precio}
              onChange={(evento) =>
                setPrecio(
                  evento.target.value,
                )
              }
              placeholder="Ej.: 30"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">
              Intervalo aproximado
            </span>

            <div className="relative mt-2">
              <Clock3
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
              />

              <select
                value={intervaloMinutos}
                onChange={(evento) =>
                  setIntervaloMinutos(
                    Number(
                      evento.target.value,
                    ),
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-emerald-500"
              >
                <option value={20}>
                  Cada 20 minutos
                </option>
                <option value={30}>
                  Cada 30 minutos
                </option>
                <option value={45}>
                  Cada 45 minutos
                </option>
                <option value={60}>
                  Cada 60 minutos
                </option>
              </select>
            </div>
          </label>
        </div>
      </section>

      {rutaId && fecha && (
        <section className="rounded-[28px] border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-emerald-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Megaphone size={23} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Comunicación oficial
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Aviso para pasajeros
                </h2>
              </div>
            </div>
          </div>

          {avisoActivo ? (
            <div className="p-6">
              <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 shrink-0 text-amber-700" />

                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-700">
                      {avisoActivo.tipoServicio.replaceAll(
                        "_",
                        " ",
                      )} · {avisoActivo.motivo.replaceAll(
                        "_",
                        " ",
                      )}
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      {avisoActivo.titulo}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {avisoActivo.mensaje}
                    </p>

                    {avisoActivo.tipoServicio ===
                      "SERVICIO_PARCIAL" &&
                      avisoActivo.puntoLlegadaTemporal && (
                        <div className="mt-4 rounded-2xl border border-amber-300 bg-white px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">
                            Llegada temporal
                          </p>
                          <p className="mt-1 font-black text-slate-900">
                            El vehículo llegará hasta {avisoActivo.puntoLlegadaTemporal}
                          </p>
                        </div>
                      )}

                    <p className="mt-3 text-xs font-bold text-slate-500">
                      {avisoActivo.permiteCompra
                        ? "Las compras y reservas permanecen habilitadas."
                        : "Las compras y reservas están temporalmente pausadas."}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={guardandoAviso}
                onClick={() =>
                  void retirarAviso()
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-600 bg-white px-5 py-3.5 font-black text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                {guardandoAviso && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                Retirar aviso y reactivar disponibilidad
              </button>
            </div>
          ) : (
            <div className="grid gap-5 p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Tipo de atención
                  </span>

                  <select
                    value={tipoServicioAviso}
                    onChange={(evento) => {
                      const tipo =
                        evento.target
                          .value as TipoServicioAviso;

                      setTipoServicioAviso(tipo);

                      if (
                        tipo ===
                        "SUSPENSION_TOTAL"
                      ) {
                        setTituloAviso(
                          "No hay movilidades disponibles",
                        );
                        setPuntoLlegadaTemporal("");
                      } else if (
                        tipo ===
                        "SERVICIO_PARCIAL"
                      ) {
                        setTituloAviso(
                          "Servicio disponible hasta un punto temporal",
                        );
                      } else {
                        setTituloAviso(
                          "Comunicado de administración",
                        );
                        setPuntoLlegadaTemporal("");
                      }
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500"
                  >
                    <option value="SUSPENSION_TOTAL">
                      Suspensión total — no permite comprar
                    </option>
                    <option value="SERVICIO_PARCIAL">
                      Servicio parcial — permite comprar
                    </option>
                    <option value="INFORMATIVO">
                      Solo informativo — permite comprar
                    </option>
                  </select>

                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    {tipoServicioAviso ===
                    "SUSPENSION_TOTAL"
                      ? "El pasajero verá el servicio suspendido y no podrá seleccionar asientos."
                      : tipoServicioAviso ===
                          "SERVICIO_PARCIAL"
                        ? "El pasajero podrá comprar después de aceptar que el vehículo llegará solamente hasta el punto indicado."
                        : "El comunicado se mostrará sin interrumpir la compra o reserva."}
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Motivo
                  </span>

                  <select
                    value={motivoAviso}
                    onChange={(evento) =>
                      setMotivoAviso(
                        evento.target
                          .value as MotivoAvisoSalida,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500"
                  >
                    <option value="SIN_VEHICULOS">
                      No hay movilidades disponibles
                    </option>
                    <option value="BLOQUEO">
                      Bloqueo en la carretera
                    </option>
                    <option value="DERRUMBE">
                      Derrumbe
                    </option>
                    <option value="MAL_TIEMPO">
                      Mal tiempo
                    </option>
                    <option value="MANTENIMIENTO">
                      Mantenimiento
                    </option>
                    <option value="OTRO">
                      Otro motivo
                    </option>
                  </select>
                </label>

                {tipoServicioAviso ===
                  "SERVICIO_PARCIAL" && (
                    <label className="block">
                      <span className="text-sm font-black text-slate-700">
                        Punto temporal de llegada
                      </span>

                      <input
                        type="text"
                        maxLength={180}
                        required
                        value={puntoLlegadaTemporal}
                        onChange={(evento) =>
                          setPuntoLlegadaTemporal(
                            evento.target.value,
                          )
                        }
                        placeholder="Ej.: Puente Locotal"
                        className="mt-2 w-full rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 outline-none focus:border-amber-500"
                      />

                      <span className="mt-2 block text-xs text-amber-700">
                        Este punto se mostrará claramente antes de que el pasajero continúe con la compra.
                      </span>
                    </label>
                  )}

                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Título del aviso
                  </span>

                  <input
                    type="text"
                    maxLength={150}
                    value={tituloAviso}
                    onChange={(evento) =>
                      setTituloAviso(
                        evento.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Mensaje para pasajeros
                </span>

                <textarea
                  rows={6}
                  maxLength={500}
                  value={textoAviso}
                  onChange={(evento) =>
                    setTextoAviso(
                      evento.target.value,
                    )
                  }
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500"
                />

                <span className="mt-1 block text-right text-xs text-slate-400">
                  {textoAviso.length}/500
                </span>
              </label>

              <button
                type="button"
                disabled={guardandoAviso}
                onClick={() =>
                  void publicarAviso()
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white hover:bg-emerald-800 disabled:opacity-60 lg:col-span-2"
              >
                {guardandoAviso ? (
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Megaphone size={19} />
                )}

                Publicar aviso para pasajeros
              </button>
            </div>
          )}
        </section>
      )}

      {fila.length === 0 ? (
        <>
          <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Vehículos disponibles
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Selecciona los Noah o Hiace necesarios
                </h2>
              </div>

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                {vehiculosSeleccionados.length} seleccionados
              </span>
            </div>

            <label className="mb-4 block">
              <span className="text-sm font-black text-slate-700">Buscar por placa</span>
              <input
                type="search"
                value={busquedaPlaca}
                onChange={(evento) => setBusquedaPlaca(evento.target.value)}
                placeholder="Escribe la placa del Noah o Hiace"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
              />
            </label>
            {errorChoferes && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                No se pudieron cargar los choferes: {errorChoferes}
                <button type="button" onClick={() => void cargarChoferes()} className="ml-2 underline">Reintentar</button>
              </p>
            )}

            {vehiculosParaSeleccionar.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                No existen vehículos Noah o Hiace activos.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {vehiculosParaSeleccionar.map(
                  (vehiculo) => {
                    const seleccionado =
                      vehiculosSeleccionados.includes(
                        vehiculo.id,
                      );

                    return (
                      <button
                        type="button"
                        key={vehiculo.id}
                        onClick={() =>
                          seleccionarVehiculo(
                            vehiculo.id,
                          )
                        }
                        className={`relative rounded-3xl border-2 p-5 text-left transition ${
                          seleccionado
                            ? "border-emerald-600 bg-emerald-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-emerald-300"
                        }`}
                      >
                        {seleccionado && (
                          <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                            {vehiculosSeleccionados.indexOf(
                              vehiculo.id,
                            ) + 1}
                          </span>
                        )}

                        <BusFront
                          size={28}
                          className="text-emerald-700"
                        />

                        <p className="mt-4 font-black text-slate-900">
                          {vehiculo.tipo}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {vehiculo.marca}{" "}
                          {vehiculo.modelo}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          Placa: {vehiculo.placa}
                        </p>

                        <p className="mt-3 text-xs font-black text-emerald-700">
                          {vehiculo.capacidad} asientos
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {seleccionados.length > 0 && (
            <section className="rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                Orden de salida
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                El vehículo número 1 será el primero
                en recibir pasajeros.
              </p>

              <div className="mt-5 space-y-3">
                {seleccionados.map(
                  (
                    vehiculo,
                    indice,
                  ) => (
                    <div
                      key={vehiculo.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 font-black text-white">
                          {indice + 1}
                        </span>

                        <div>
                          <p className="font-black text-slate-900">
                            {vehiculo.tipo} ·{" "}
                            {vehiculo.placa}
                          </p>

                          <p className="text-sm text-slate-500">
                            {vehiculo.capacidad} asientos
                          </p>
                          <label className="mt-3 block text-sm font-bold text-slate-700">
                            Chofer de esta salida
                            <select
                              value={choferesPorVehiculo[vehiculo.id] || ""}
                              onChange={(evento) => setChoferesPorVehiculo((actual) => ({...actual, [vehiculo.id]: evento.target.value}))}
                              disabled={cargandoChoferes}
                              className="mt-1 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <option value="">Seleccionar chofer...</option>
                              {choferes.map((chofer) => (
                                <option key={chofer.id} value={chofer.id}>
                                  {chofer.nombre} {chofer.apellido}
                                </option>
                              ))}
                            </select>
                          </label>

                          <p className="mt-1 text-xs font-black text-emerald-700">
                            {indice === 0
                              ? "Disponible ahora"
                              : "Salida aproximada"}
                            {" · "}
                            {sumarMinutos(
                              obtenerHoraBolivia(),
                              indice *
                                intervaloMinutos,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={
                            indice === 0
                          }
                          onClick={() =>
                            moverVehiculo(
                              indice,
                              -1,
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 disabled:opacity-30"
                        >
                          <ArrowUp size={18} />
                        </button>

                        <button
                          type="button"
                          disabled={
                            indice ===
                            seleccionados.length -
                              1
                          }
                          onClick={() =>
                            moverVehiculo(
                              indice,
                              1,
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 disabled:opacity-30"
                        >
                          <ArrowDown size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            seleccionarVehiculo(
                              vehiculo.id,
                            )
                          }
                          className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void crearFila()
                }
                disabled={guardando}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {guardando ? (
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={19} />
                )}

                {guardando
                  ? "Creando fila..."
                  : "Habilitar fila de salida"}
              </button>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Ampliar fila actual
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Agregar más vehículos
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Selecciona todos los Noah o Hiace que necesites agregar al final.
                </p>
              </div>

              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                {vehiculosSeleccionados.length} seleccionados
              </span>
            </div>

            <label className="mb-4 block">
              <span className="text-sm font-black text-slate-700">Buscar por placa</span>
              <input
                type="search"
                value={busquedaPlaca}
                onChange={(evento) => setBusquedaPlaca(evento.target.value)}
                placeholder="Escribe la placa del Noah o Hiace"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-emerald-500"
              />
            </label>
            {errorChoferes && (
              <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                No se pudieron cargar los choferes: {errorChoferes}
                <button type="button" onClick={() => void cargarChoferes()} className="ml-2 underline">Reintentar</button>
              </p>
            )}

            {vehiculosParaSeleccionar.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                Todos los vehículos disponibles ya pertenecen a esta fila.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {vehiculosParaSeleccionar.map(
                  (vehiculo) => {
                    const seleccionado =
                      vehiculosSeleccionados.includes(
                        vehiculo.id,
                      );

                    return (
                      <button
                        type="button"
                        key={vehiculo.id}
                        onClick={() =>
                          seleccionarVehiculo(
                            vehiculo.id,
                          )
                        }
                        className={`relative rounded-3xl border-2 p-5 text-left transition ${
                          seleccionado
                            ? "border-emerald-600 bg-emerald-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-emerald-300"
                        }`}
                      >
                        {seleccionado && (
                          <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                            {vehiculosSeleccionados.indexOf(
                              vehiculo.id,
                            ) + 1}
                          </span>
                        )}

                        <BusFront
                          size={27}
                          className="text-emerald-700"
                        />

                        <p className="mt-3 font-black text-slate-900">
                          {vehiculo.tipo} · {vehiculo.placa}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {vehiculo.marca} {vehiculo.modelo}
                        </p>

                        <p className="mt-2 text-xs font-black text-emerald-700">
                          {vehiculo.capacidad} asientos
                        </p>
                      </button>
                    );
                  },
                )}
              </div>
            )}

            {vehiculosSeleccionados.length > 0 && (
              <div className="mt-5 space-y-3">
                {seleccionados.map((vehiculo) => (
                  <label key={vehiculo.id} className="block rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-slate-700">
                    {vehiculo.tipo} · Placa {vehiculo.placa} — Chofer que llega
                    <select
                      value={choferesPorVehiculo[vehiculo.id] || ""}
                      onChange={(evento) => setChoferesPorVehiculo((actual) => ({...actual, [vehiculo.id]: evento.target.value}))}
                      disabled={cargandoChoferes}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <option value="">Seleccionar chofer...</option>
                      {choferes.map((chofer) => (
                        <option key={chofer.id} value={chofer.id}>{chofer.nombre} {chofer.apellido}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            )}

            {vehiculosSeleccionados.length > 0 && (
              <button
                type="button"
                disabled={agregandoVehiculos}
                onClick={() =>
                  void agregarVehiculosAFila()
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {agregandoVehiculos ? (
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={19} />
                )}

                {agregandoVehiculos
                  ? "Agregando vehículos..."
                  : "Agregar vehículos a la fila actual"}
              </button>
            )}
          </section>

          <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <MapPinned className="text-emerald-700" />

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Seguimiento en tiempo real
              </p>

              <h2 className="text-xl font-black text-slate-900">
                Fila habilitada
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {fila.map((turno) => (
              <div
                key={turno.id}
                className={`rounded-3xl border-2 p-5 ${
                  turno.estado ===
                  "VENDIENDO"
                    ? "border-emerald-500 bg-emerald-50"
                    : turno.estado ===
                      "SIGUIENTE"
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
                      {turno.posicion}
                    </span>

                    <div>
                      <p className="font-black text-slate-900">
                        {turno.vehiculo.tipo} ·{" "}
                        {turno.vehiculo.placa}
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        Estado: {turno.estado}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Chofer: {turno.chofer ? `${turno.chofer.nombre} ${turno.chofer.apellido}` : "Sin asignar"}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-emerald-700">
                        <Clock3 size={15} />
                        {turno.estado ===
                        "VENDIENDO"
                          ? "Disponible ahora"
                          : "Hora aproximada"}
                        :{" "}
                        {String(
                          turno.viaje
                            .horaSalida,
                        ).substring(0, 5)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white px-4 py-3 text-center">
                      <Users
                        size={16}
                        className="mx-auto text-emerald-700"
                      />

                      <p className="mt-1 font-black">
                        {turno.ocupacion.ocupados}
                      </p>

                      <p className="text-[10px] text-slate-500">
                        Ocupados
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3 text-center">
                      <p className="font-black text-emerald-700">
                        {turno.ocupacion.disponibles}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        Disponibles
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-4 py-3 text-center">
                      <p className="font-black text-amber-700">
                        {turno.ocupacion.faltan}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        Faltan
                      </p>
                    </div>
                  </div>

                  {(turno.estado ===
                    "VENDIENDO" ||
                    turno.estado ===
                      "COMPLETO") && (
                    <button
                      type="button"
                      onClick={() =>
                        void autorizarSalida(
                          turno,
                        )
                      }
                      disabled={
                        autorizandoId ===
                        turno.id
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {autorizandoId ===
                      turno.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Play size={18} />
                      )}

                      Autorizar salida
                    </button>
                  )}
                </div>

                {/* Recojos asociados a este viaje / vehículo */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setViajeRecojosAbierto((actual) => actual === turno.viaje.id ? null : turno.viaje.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-left text-sm font-black text-emerald-800 hover:bg-emerald-50 sm:w-auto"
                    aria-expanded={viajeRecojosAbierto === turno.viaje.id}
                  >
                    <span className="flex items-center gap-2"><MapPin size={18} /> Solicitudes de recojo</span>
                    {viajeRecojosAbierto === turno.viaje.id ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                  </button>
                  {viajeRecojosAbierto === turno.viaje.id && usuario.id && (
                    <RecojosPorViaje
                      viajeId={turno.viaje.id}
                      administradorId={usuario.id}
                    />
                  )}
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all"
                    style={{
                      width: `${turno.ocupacion.porcentaje}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          </section>
        </>
      )}
    </div>
  );
}