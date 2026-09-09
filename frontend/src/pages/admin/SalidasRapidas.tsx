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
  publicarAvisoSalida,
  retirarAvisoSalida,
} from "../../services/salidas-rapidas.service";

import type {
  AvisoSalidaRapida,
  MotivoAvisoSalida,
  TipoServicioAviso,
  TurnoSalidaRapida,
  VehiculoRapido,
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
  }, [cargarDatos]);

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
        vehiculos.filter(
          (vehiculo) =>
            !idsVehiculosEnFila.has(
              vehiculo.id,
            ),
        ),
      [
        idsVehiculosEnFila,
        vehiculos,
      ],
    );

  const seleccionarVehiculo = (
    vehiculoId: string,
  ) => {
    setMensaje("");

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

      try {
        setAgregandoVehiculos(true);
        setMensaje("");

        for (const vehiculoId of
          vehiculosSeleccionados) {
          await agregarVehiculoFila({
            rutaId,
            fecha,
            vehiculoId,
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
