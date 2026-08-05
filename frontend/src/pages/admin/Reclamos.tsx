import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareWarning,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Ticket,
  User,
  X,
} from "lucide-react";

import {
  actualizarEstadoReclamo,
  marcarMensajesLeidos,
  obtenerReclamoPorId,
  obtenerResumenReclamos,
  obtenerTodosLosReclamos,
  responderReclamo,
} from "../../services/reclamos.service";

import {
  EstadoReclamo,
  PrioridadReclamo,
  TipoAutorMensaje,
} from "../../types/reclamo";

import type {
  Reclamo,
  ResumenReclamos,
} from "../../types/reclamo";

type FiltroEstado =
  | EstadoReclamo
  | "TODOS";

interface MensajePagina {
  tipo: "exito" | "error";
  texto: string;
}

const RESUMEN_INICIAL: ResumenReclamos = {
  total: 0,
  pendientes: 0,
  enRevision: 0,
  respondidos: 0,
  cerrados: 0,
};

export default function Reclamos() {
  const navigate = useNavigate();

  const {
    reclamoId,
  } = useParams<{
    reclamoId?: string;
  }>();

  const [
    reclamos,
    setReclamos,
  ] = useState<Reclamo[]>([]);

  const [
    reclamoSeleccionado,
    setReclamoSeleccionado,
  ] = useState<Reclamo | null>(
    null,
  );

  const [
    resumen,
    setResumen,
  ] = useState<ResumenReclamos>(
    RESUMEN_INICIAL,
  );

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>(
    "TODOS",
  );

  const [
    textoBusqueda,
    setTextoBusqueda,
  ] = useState("");

  const [
    respuesta,
    setRespuesta,
  ] = useState("");

  const [
    nuevoEstado,
    setNuevoEstado,
  ] = useState<EstadoReclamo>(
    EstadoReclamo.PENDIENTE,
  );

  const [
    cargandoLista,
    setCargandoLista,
  ] = useState(true);

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false);

  const [
    enviandoRespuesta,
    setEnviandoRespuesta,
  ] = useState(false);

  const [
    actualizandoEstado,
    setActualizandoEstado,
  ] = useState(false);

  const [
    mensajePagina,
    setMensajePagina,
  ] = useState<MensajePagina | null>(
    null,
  );

  const cargarResumen =
    useCallback(async () => {
      try {
        const datos =
          await obtenerResumenReclamos();

        setResumen(datos);
      } catch {
        setResumen(
          RESUMEN_INICIAL,
        );
      }
    }, []);

  const cargarLista =
    useCallback(async () => {
      try {
        setCargandoLista(true);

        const estado =
          filtroEstado === "TODOS"
            ? undefined
            : filtroEstado;

        const datos =
          await obtenerTodosLosReclamos(
            estado,
          );

        setReclamos(
          Array.isArray(datos)
            ? datos
            : [],
        );
      } catch (error) {
        setMensajePagina({
          tipo: "error",

          texto:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los reclamos.",
        });
      } finally {
        setCargandoLista(false);
      }
    }, [filtroEstado]);

  const cargarDetalle =
    useCallback(
      async (
        id: string,
        mostrarCarga = true,
      ) => {
        try {
          if (mostrarCarga) {
            setCargandoDetalle(true);
          }

          const reclamo =
            await obtenerReclamoPorId(
              id,
            );

          setReclamoSeleccionado(
            reclamo,
          );

          setNuevoEstado(
            reclamo.estado,
          );

          await marcarMensajesLeidos(
            id,
          );
        } catch (error) {
          setReclamoSeleccionado(
            null,
          );

          setMensajePagina({
            tipo: "error",

            texto:
              error instanceof Error
                ? error.message
                : "No se pudo abrir el reclamo.",
          });
        } finally {
          setCargandoDetalle(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void Promise.all([
      cargarLista(),
      cargarResumen(),
    ]);
  }, [
    cargarLista,
    cargarResumen,
  ]);

  useEffect(() => {
    if (reclamoId) {
      void cargarDetalle(
        reclamoId,
      );
    } else {
      setReclamoSeleccionado(
        null,
      );
    }
  }, [
    reclamoId,
    cargarDetalle,
  ]);

  useEffect(() => {
    if (!mensajePagina) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        setMensajePagina(null);
      }, 6000);

    return () => {
      window.clearTimeout(
        temporizador,
      );
    };
  }, [mensajePagina]);

  const reclamosFiltrados =
    useMemo(() => {
      const busqueda =
        textoBusqueda
          .trim()
          .toLocaleLowerCase();

      if (!busqueda) {
        return reclamos;
      }

      return reclamos.filter(
        (reclamo) => {
          const usuario =
            `${reclamo.usuario?.nombre ?? ""} ${
              reclamo.usuario?.apellido ??
              ""
            }`;

          const contenido = [
            reclamo.codigo,
            reclamo.asunto,
            reclamo.descripcion,
            reclamo.categoria,
            reclamo.tipo,
            usuario,
            reclamo.usuario?.email ??
              "",
          ]
            .join(" ")
            .toLocaleLowerCase();

          return contenido.includes(
            busqueda,
          );
        },
      );
    }, [
      reclamos,
      textoBusqueda,
    ]);

  function seleccionarReclamo(
    reclamo: Reclamo,
  ) {
    setMensajePagina(null);

    navigate(
      `/admin/reclamos/${reclamo.id}`,
    );
  }

  function cerrarDetalle() {
    setRespuesta("");

    navigate(
      "/admin/reclamos",
    );
  }

  async function actualizarTodo() {
    await Promise.all([
      cargarLista(),
      cargarResumen(),
    ]);

    if (reclamoSeleccionado) {
      await cargarDetalle(
        reclamoSeleccionado.id,
        false,
      );
    }
  }

  async function enviarRespuesta() {
    if (!reclamoSeleccionado) {
      return;
    }

    const mensaje =
      respuesta.trim();

    if (mensaje.length < 2) {
      setMensajePagina({
        tipo: "error",
        texto:
          "Escribe una respuesta antes de enviarla.",
      });

      return;
    }

    try {
      setEnviandoRespuesta(
        true,
      );

      const resultado =
        await responderReclamo(
          reclamoSeleccionado.id,
          {
            mensaje,
          },
        );

      setRespuesta("");

      setReclamoSeleccionado(
        resultado.reclamo,
      );

      setMensajePagina({
        tipo: "exito",
        texto:
          "Respuesta enviada correctamente. El pasajero recibirá una notificación.",
      });

      await Promise.all([
        cargarLista(),
        cargarResumen(),
      ]);
    } catch (error) {
      setMensajePagina({
        tipo: "error",

        texto:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la respuesta.",
      });
    } finally {
      setEnviandoRespuesta(
        false,
      );
    }
  }

  async function cambiarEstado() {
    if (!reclamoSeleccionado) {
      return;
    }

    if (
      nuevoEstado ===
      reclamoSeleccionado.estado
    ) {
      setMensajePagina({
        tipo: "error",
        texto:
          "Selecciona un estado diferente.",
      });

      return;
    }

    try {
      setActualizandoEstado(
        true,
      );

      const resultado =
        await actualizarEstadoReclamo(
          reclamoSeleccionado.id,
          {
            estado:
              nuevoEstado,
          },
        );

      setReclamoSeleccionado(
        resultado.reclamo,
      );

      setNuevoEstado(
        resultado.reclamo.estado,
      );

      setMensajePagina({
        tipo: "exito",
        texto:
          "Estado actualizado correctamente. El pasajero recibirá una notificación.",
      });

      await Promise.all([
        cargarLista(),
        cargarResumen(),
      ]);
    } catch (error) {
      setMensajePagina({
        tipo: "error",

        texto:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el estado.",
      });
    } finally {
      setActualizandoEstado(
        false,
      );
    }
  }
    return (
    <main className="min-h-full bg-[#f2f8f4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
          <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[42px] border-white/10" />

          <div className="absolute bottom-0 right-52 h-28 w-28 rounded-full bg-lime-300/10" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                <MessageSquareWarning
                  size={29}
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                  Atención al pasajero
                </p>

                <h1 className="mt-1 text-3xl font-black">
                  Reclamos y consultas
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90">
                  Revisa, responde y realiza el seguimiento de las solicitudes enviadas por los pasajeros.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void actualizarTodo()
              }
              disabled={
                cargandoLista
              }
              className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/20 disabled:opacity-60 lg:self-center"
            >
              <RefreshCw
                size={19}
                className={
                  cargandoLista
                    ? "animate-spin"
                    : ""
                }
              />

              Actualizar
            </button>
          </div>
        </section>

        {mensajePagina && (
          <div
            className={`mt-5 flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-sm ${
              mensajePagina.tipo ===
              "exito"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3">
              {mensajePagina.tipo ===
              "exito" ? (
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <AlertCircle
                  size={21}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p className="text-sm font-bold leading-6">
                {mensajePagina.texto}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMensajePagina(null)
              }
              className="shrink-0 opacity-70 transition hover:opacity-100"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <TarjetaResumen
            titulo="Total"
            cantidad={resumen.total}
            color="slate"
            activo={
              filtroEstado ===
              "TODOS"
            }
            onClick={() =>
              setFiltroEstado(
                "TODOS",
              )
            }
          />

          <TarjetaResumen
            titulo="Pendientes"
            cantidad={
              resumen.pendientes
            }
            color="amber"
            activo={
              filtroEstado ===
              EstadoReclamo.PENDIENTE
            }
            onClick={() =>
              setFiltroEstado(
                EstadoReclamo.PENDIENTE,
              )
            }
          />

          <TarjetaResumen
            titulo="En revisión"
            cantidad={
              resumen.enRevision
            }
            color="sky"
            activo={
              filtroEstado ===
              EstadoReclamo.EN_REVISION
            }
            onClick={() =>
              setFiltroEstado(
                EstadoReclamo.EN_REVISION,
              )
            }
          />

          <TarjetaResumen
            titulo="Respondidos"
            cantidad={
              resumen.respondidos
            }
            color="emerald"
            activo={
              filtroEstado ===
              EstadoReclamo.RESPONDIDO
            }
            onClick={() =>
              setFiltroEstado(
                EstadoReclamo.RESPONDIDO,
              )
            }
          />

          <TarjetaResumen
            titulo="Cerrados"
            cantidad={
              resumen.cerrados
            }
            color="violet"
            activo={
              filtroEstado ===
              EstadoReclamo.CERRADO
            }
            onClick={() =>
              setFiltroEstado(
                EstadoReclamo.CERRADO,
              )
            }
            claseAdicional="col-span-2 lg:col-span-1"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                  Bandeja administrativa
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Solicitudes recibidas
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={
                      textoBusqueda
                    }
                    onChange={(event) =>
                      setTextoBusqueda(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Buscar código, usuario o asunto..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                  />

                  <select
                    value={filtroEstado}
                    onChange={(event) =>
                      setFiltroEstado(
                        event.target
                          .value as FiltroEstado,
                      )
                    }
                    className="w-full appearance-none rounded-2xl border border-emerald-200 bg-emerald-50 py-3 pl-11 pr-10 text-sm font-black text-emerald-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:w-auto"
                  >
                    <option value="TODOS">
                      Todos
                    </option>

                    <option
                      value={
                        EstadoReclamo.PENDIENTE
                      }
                    >
                      Pendientes
                    </option>

                    <option
                      value={
                        EstadoReclamo.EN_REVISION
                      }
                    >
                      En revisión
                    </option>

                    <option
                      value={
                        EstadoReclamo.RESPONDIDO
                      }
                    >
                      Respondidos
                    </option>

                    <option
                      value={
                        EstadoReclamo.CERRADO
                      }
                    >
                      Cerrados
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-[650px] xl:grid-cols-[420px_1fr]">
            <div className="border-b border-emerald-100 xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <p className="text-xs font-bold text-slate-500">
                  {
                    reclamosFiltrados.length
                  }{" "}
                  {reclamosFiltrados.length ===
                  1
                    ? "resultado"
                    : "resultados"}
                </p>

                {cargandoLista && (
                  <Loader2
                    size={17}
                    className="animate-spin text-emerald-700"
                  />
                )}
              </div>

              <div className="max-h-[650px] overflow-y-auto">
                {cargandoLista &&
                reclamos.length ===
                  0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <Loader2
                      size={35}
                      className="animate-spin text-emerald-700"
                    />

                    <p className="mt-4 text-sm font-bold text-slate-500">
                      Cargando reclamos...
                    </p>
                  </div>
                ) : reclamosFiltrados.length ===
                  0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <MessageCircle
                        size={30}
                      />
                    </div>

                    <h3 className="mt-4 font-black text-slate-900">
                      No existen reclamos
                    </h3>

                    <p className="mt-2 max-w-60 text-sm leading-6 text-slate-500">
                      No se encontraron solicitudes con los filtros seleccionados.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reclamosFiltrados.map(
                      (reclamo) => (
                        <TarjetaReclamo
                          key={
                            reclamo.id
                          }
                          reclamo={
                            reclamo
                          }
                          seleccionado={
                            reclamoSeleccionado?.id ===
                            reclamo.id
                          }
                          onSeleccionar={
                            seleccionarReclamo
                          }
                        />
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0">
              {cargandoDetalle ? (
                <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center">
                  <Loader2
                    size={39}
                    className="animate-spin text-emerald-700"
                  />

                  <p className="mt-4 font-bold text-slate-500">
                    Abriendo reclamo...
                  </p>
                </div>
              ) : !reclamoSeleccionado ? (
                <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                    <MessageSquareWarning
                      size={38}
                    />
                  </div>

                  <h3 className="mt-5 text-xl font-black text-slate-950">
                    Selecciona un reclamo
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Selecciona una solicitud de la lista para revisar los datos del pasajero y responder.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="border-b border-emerald-100 bg-emerald-50/40 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <button
                          type="button"
                          onClick={
                            cerrarDetalle
                          }
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 transition hover:bg-emerald-50 xl:hidden"
                        >
                          <ArrowLeft
                            size={19}
                          />
                        </button>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-black text-white">
                              {
                                reclamoSeleccionado.codigo
                              }
                            </span>

                            <EstadoReclamoEtiqueta
                              estado={
                                reclamoSeleccionado.estado
                              }
                            />

                            <PrioridadEtiqueta
                              prioridad={
                                reclamoSeleccionado.prioridad
                              }
                            />
                          </div>

                          <h2 className="mt-3 text-xl font-black leading-tight text-slate-950 sm:text-2xl">
                            {
                              reclamoSeleccionado.asunto
                            }
                          </h2>

                          <p className="mt-2 text-sm text-slate-500">
                            Registrado{" "}
                            {formatearFechaHora(
                              reclamoSeleccionado.fechaRegistro,
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={
                          cerrarDetalle
                        }
                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 xl:flex"
                      >
                        <X size={19} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
                    <div className="min-w-0">
                      <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                          Descripción inicial
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                          {
                            reclamoSeleccionado.descripcion
                          }
                        </p>
                      </section>

                      <section className="mt-5 overflow-hidden rounded-2xl border border-emerald-100">
                        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                          <div className="flex items-center gap-2">
                            <MessageCircle
                              size={19}
                              className="text-emerald-700"
                            />

                            <h3 className="font-black text-slate-900">
                              Conversación
                            </h3>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                            {
                              reclamoSeleccionado.mensajes?.length ??
                              0
                            }{" "}
                            mensajes
                          </span>
                        </div>

                        <div className="max-h-[430px] space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-5">
                          {reclamoSeleccionado.mensajes?.map(
                            (mensaje) => (
                              <BurbujaMensaje
                                key={
                                  mensaje.id
                                }
                                mensaje={
                                  mensaje
                                }
                              />
                            ),
                          )}
                        </div>

                        {reclamoSeleccionado.estado !==
                        EstadoReclamo.CERRADO ? (
                          <div className="border-t border-emerald-100 bg-white p-4 sm:p-5">
                            <label
                              htmlFor="respuesta-reclamo"
                              className="text-sm font-black text-slate-700"
                            >
                              Responder al pasajero
                            </label>

                            <textarea
                              id="respuesta-reclamo"
                              value={
                                respuesta
                              }
                              onChange={(
                                event,
                              ) =>
                                setRespuesta(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              rows={4}
                              maxLength={
                                3000
                              }
                              placeholder="Escribe una respuesta clara para el pasajero..."
                              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                            />

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className="text-xs text-slate-400">
                                {
                                  respuesta.length
                                }
                                /3000
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  void enviarRespuesta()
                                }
                                disabled={
                                  enviandoRespuesta ||
                                  respuesta.trim()
                                    .length <
                                    2
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                              >
                                {enviandoRespuesta ? (
                                  <Loader2
                                    size={
                                      18
                                    }
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Send
                                    size={
                                      18
                                    }
                                  />
                                )}

                                {enviandoRespuesta
                                  ? "Enviando..."
                                  : "Enviar respuesta"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 border-t border-emerald-100 bg-slate-100 px-5 py-4 text-slate-600">
                            <CheckCircle2
                              size={20}
                            />

                            <p className="text-sm font-bold">
                              Este reclamo está cerrado y ya no admite respuestas.
                            </p>
                          </div>
                        )}
                      </section>
                    </div>
                                        <aside className="space-y-5">
                      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                            <User size={21} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                              Pasajero
                            </p>

                            <p className="mt-1 truncate font-black text-slate-950">
                              {`${reclamoSeleccionado.usuario?.nombre ?? ""} ${
                                reclamoSeleccionado.usuario?.apellido ??
                                ""
                              }`.trim() ||
                                "Usuario"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 space-y-3">
                          <DatoUsuario
                            icono={
                              <Mail
                                size={17}
                              />
                            }
                            etiqueta="Correo"
                            valor={
                              reclamoSeleccionado.usuario?.email ??
                              "No registrado"
                            }
                          />

                          <DatoUsuario
                            icono={
                              <Phone
                                size={17}
                              />
                            }
                            etiqueta="Teléfono"
                            valor={
                              reclamoSeleccionado.usuario?.telefono ??
                              "No registrado"
                            }
                          />

                          <DatoUsuario
                            icono={
                              <ShieldAlert
                                size={17}
                              />
                            }
                            etiqueta="Carnet"
                            valor={
                              reclamoSeleccionado.usuario?.ci ??
                              "No registrado"
                            }
                          />
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Clasificación
                        </p>

                        <div className="mt-4 space-y-4">
                          <DatoClasificacion
                            etiqueta="Tipo"
                            valor={formatearTextoEnum(
                              reclamoSeleccionado.tipo,
                            )}
                          />

                          <DatoClasificacion
                            etiqueta="Categoría"
                            valor={formatearTextoEnum(
                              reclamoSeleccionado.categoria,
                            )}
                          />

                          <DatoClasificacion
                            etiqueta="Prioridad"
                            valor={formatearTextoEnum(
                              reclamoSeleccionado.prioridad,
                            )}
                          />
                        </div>
                      </section>

                      {reclamoSeleccionado.ticket && (
                        <section className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-700 text-white">
                              <Ticket
                                size={19}
                              />
                            </div>

                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-sky-600">
                                Ticket relacionado
                              </p>

                              <p className="mt-1 font-black text-slate-900">
                                {reclamoSeleccionado.ticket
                                  .codigoTicket ??
                                  reclamoSeleccionado.ticket
                                    .numeroTicket ??
                                  "Ticket registrado"}
                              </p>
                            </div>
                          </div>

                          {reclamoSeleccionado.ticket
                            .reserva
                            ?.codigoReserva && (
                            <p className="mt-4 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                              Reserva:{" "}
                              <span className="text-sky-700">
                                {
                                  reclamoSeleccionado
                                    .ticket.reserva
                                    .codigoReserva
                                }
                              </span>
                            </p>
                          )}
                        </section>
                      )}

                      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                          Gestión del reclamo
                        </p>

                        <label
                          htmlFor="estado-reclamo"
                          className="mt-4 block text-sm font-black text-slate-700"
                        >
                          Cambiar estado
                        </label>

                        <select
                          id="estado-reclamo"
                          value={
                            nuevoEstado
                          }
                          onChange={(
                            event,
                          ) =>
                            setNuevoEstado(
                              event.target
                                .value as EstadoReclamo,
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        >
                          <option
                            value={
                              EstadoReclamo.PENDIENTE
                            }
                          >
                            Pendiente
                          </option>

                          <option
                            value={
                              EstadoReclamo.EN_REVISION
                            }
                          >
                            En revisión
                          </option>

                          <option
                            value={
                              EstadoReclamo.RESPONDIDO
                            }
                          >
                            Respondido
                          </option>

                          <option
                            value={
                              EstadoReclamo.CERRADO
                            }
                          >
                            Cerrado
                          </option>
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            void cambiarEstado()
                          }
                          disabled={
                            actualizandoEstado ||
                            nuevoEstado ===
                              reclamoSeleccionado.estado
                          }
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {actualizandoEstado ? (
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={18}
                            />
                          )}

                          {actualizandoEstado
                            ? "Actualizando..."
                            : "Guardar estado"}
                        </button>

                        <p className="mt-3 text-xs leading-5 text-slate-400">
                          El pasajero recibirá una notificación cuando cambies el estado.
                        </p>
                      </section>
                    </aside>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface TarjetaResumenProps {
  titulo: string;
  cantidad: number;

  color:
    | "slate"
    | "amber"
    | "sky"
    | "emerald"
    | "violet";

  activo: boolean;
  onClick: () => void;
  claseAdicional?: string;
}

function TarjetaResumen({
  titulo,
  cantidad,
  color,
  activo,
  onClick,
  claseAdicional = "",
}: TarjetaResumenProps) {
  const colores = {
    slate: {
      fondo: "bg-slate-50",
      texto: "text-slate-700",
      borde: "border-slate-200",
      activo:
        "border-slate-700 ring-slate-700/10",
    },

    amber: {
      fondo: "bg-amber-50",
      texto: "text-amber-700",
      borde: "border-amber-200",
      activo:
        "border-amber-500 ring-amber-500/10",
    },

    sky: {
      fondo: "bg-sky-50",
      texto: "text-sky-700",
      borde: "border-sky-200",
      activo:
        "border-sky-500 ring-sky-500/10",
    },

    emerald: {
      fondo: "bg-emerald-50",
      texto: "text-emerald-700",
      borde: "border-emerald-200",
      activo:
        "border-emerald-600 ring-emerald-600/10",
    },

    violet: {
      fondo: "bg-violet-50",
      texto: "text-violet-700",
      borde: "border-violet-200",
      activo:
        "border-violet-500 ring-violet-500/10",
    },
  };

  const estilo =
    colores[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        activo
          ? `${estilo.activo} ring-4`
          : estilo.borde
      } ${claseAdicional}`}
    >
      <div
        className={`inline-flex rounded-xl px-3 py-1 text-xs font-black ${estilo.fondo} ${estilo.texto}`}
      >
        {titulo}
      </div>

      <p className="mt-3 text-3xl font-black text-slate-950">
        {cantidad}
      </p>
    </button>
  );
}

interface TarjetaReclamoProps {
  reclamo: Reclamo;
  seleccionado: boolean;

  onSeleccionar: (
    reclamo: Reclamo,
  ) => void;
}

function TarjetaReclamo({
  reclamo,
  seleccionado,
  onSeleccionar,
}: TarjetaReclamoProps) {
  const nombreUsuario =
    `${reclamo.usuario?.nombre ?? ""} ${
      reclamo.usuario?.apellido ??
      ""
    }`.trim() || "Usuario";

  const mensajesNoLeidos =
    reclamo.mensajes?.filter(
      (mensaje) =>
        mensaje.tipoAutor ===
          TipoAutorMensaje.USUARIO &&
        !mensaje.leido,
    ).length ?? 0;

  return (
    <button
      type="button"
      onClick={() =>
        onSeleccionar(reclamo)
      }
      className={`relative w-full px-5 py-4 text-left transition ${
        seleccionado
          ? "bg-emerald-50"
          : "bg-white hover:bg-slate-50"
      }`}
    >
      {seleccionado && (
        <span className="absolute inset-y-0 left-0 w-1 bg-emerald-600" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-emerald-700">
              {reclamo.codigo}
            </span>

            <PrioridadEtiqueta
              prioridad={
                reclamo.prioridad
              }
              pequena
            />
          </div>

          <h3 className="mt-2 line-clamp-1 font-black text-slate-900">
            {reclamo.asunto}
          </h3>

          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
            {nombreUsuario}
          </p>
        </div>

        {mensajesNoLeidos > 0 && (
          <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black text-white">
            {mensajesNoLeidos}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <EstadoReclamoEtiqueta
          estado={reclamo.estado}
          pequena
        />

        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <Clock3 size={12} />

          {formatearFechaHora(
            reclamo.fechaRegistro,
          )}
        </span>
      </div>
    </button>
  );
}

function EstadoReclamoEtiqueta({
  estado,
  pequena = false,
}: {
  estado: EstadoReclamo;
  pequena?: boolean;
}) {
  const configuracion = {
    [EstadoReclamo.PENDIENTE]: {
      texto: "Pendiente",
      clase:
        "bg-amber-100 text-amber-700",
    },

    [EstadoReclamo.EN_REVISION]: {
      texto: "En revisión",
      clase:
        "bg-sky-100 text-sky-700",
    },

    [EstadoReclamo.RESPONDIDO]: {
      texto: "Respondido",
      clase:
        "bg-emerald-100 text-emerald-700",
    },

    [EstadoReclamo.CERRADO]: {
      texto: "Cerrado",
      clase:
        "bg-slate-200 text-slate-700",
    },
  }[estado];

  return (
    <span
      className={`inline-flex rounded-full font-black uppercase tracking-wide ${configuracion.clase} ${
        pequena
          ? "px-2 py-1 text-[9px]"
          : "px-3 py-1 text-[10px]"
      }`}
    >
      {configuracion.texto}
    </span>
  );
}

function PrioridadEtiqueta({
  prioridad,
  pequena = false,
}: {
  prioridad: PrioridadReclamo;
  pequena?: boolean;
}) {
  const configuracion = {
    [PrioridadReclamo.BAJA]: {
      texto: "Baja",
      clase:
        "bg-slate-100 text-slate-600",
    },

    [PrioridadReclamo.NORMAL]: {
      texto: "Normal",
      clase:
        "bg-emerald-100 text-emerald-700",
    },

    [PrioridadReclamo.ALTA]: {
      texto: "Alta",
      clase:
        "bg-orange-100 text-orange-700",
    },

    [PrioridadReclamo.URGENTE]: {
      texto: "Urgente",
      clase:
        "bg-red-100 text-red-700",
    },
  }[prioridad];

  return (
    <span
      className={`inline-flex rounded-full font-black uppercase tracking-wide ${configuracion.clase} ${
        pequena
          ? "px-2 py-1 text-[9px]"
          : "px-3 py-1 text-[10px]"
      }`}
    >
      {configuracion.texto}
    </span>
  );
}

function BurbujaMensaje({
  mensaje,
}: {
  mensaje: NonNullable<
    Reclamo["mensajes"]
  >[number];
}) {
  const esAdministrador =
    mensaje.tipoAutor ===
    TipoAutorMensaje.ADMINISTRADOR;

  const nombreAutor =
    `${mensaje.usuario?.nombre ?? ""} ${
      mensaje.usuario?.apellido ??
      ""
    }`.trim() ||
    (esAdministrador
      ? "Administración"
      : "Pasajero");

  return (
    <div
      className={`flex ${
        esAdministrador
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
          esAdministrador
            ? "rounded-br-md bg-emerald-700 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
        }`}
      >
        <p
          className={`text-[10px] font-black uppercase tracking-wide ${
            esAdministrador
              ? "text-emerald-100"
              : "text-emerald-700"
          }`}
        >
          {nombreAutor}
        </p>

        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
          {mensaje.mensaje}
        </p>

        <p
          className={`mt-2 text-right text-[9px] ${
            esAdministrador
              ? "text-emerald-100"
              : "text-slate-400"
          }`}
        >
          {formatearFechaHora(
            mensaje.fechaRegistro,
          )}
        </p>
      </div>
    </div>
  );
}

function DatoUsuario({
  icono,
  etiqueta,
  valor,
}: {
  icono: ReactNode;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-emerald-700">
        {icono}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </p>

        <p className="mt-0.5 break-words text-sm font-bold text-slate-700">
          {valor}
        </p>
      </div>
    </div>
  );
}

function DatoClasificacion({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold text-slate-500">
        {etiqueta}
      </span>

      <span className="text-right text-xs font-black text-slate-800">
        {valor}
      </span>
    </div>
  );
}

function formatearTextoEnum(
  valor: string,
): string {
  const texto = valor
    .replaceAll("_", " ")
    .toLocaleLowerCase();

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}

function formatearFechaHora(
  fecha: string,
): string {
  const fechaConvertida =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaConvertida.getTime(),
    )
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(fechaConvertida);
}