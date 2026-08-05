import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileImage,
  Filter,
  Hash,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  obtenerComprobantePago,
  obtenerTodosLosPagos,
  revisarPago,
} from "../../services/pagos.service";

import type {
  EstadoPago,
  Pago,
} from "../../services/pagos.service";

type FiltroPago =
  | "TODOS"
  | EstadoPago;

type UsuarioSesion = {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
};

function obtenerUsuarioSesion():
  UsuarioSesion {
  const claves = [
    "usuario",
    "user",
    "auth",
    "sesion",
    "session",
  ];

  for (const clave of claves) {
    const valor =
      localStorage.getItem(clave);

    if (!valor) {
      continue;
    }

    try {
      const datos =
        JSON.parse(valor) as
          | UsuarioSesion
          | {
              usuario?:
                UsuarioSesion;
              user?:
                UsuarioSesion;
            };

      if (
        "id" in datos &&
        datos.id
      ) {
        return datos;
      }

      if (
        "usuario" in datos &&
        datos.usuario?.id
      ) {
        return datos.usuario;
      }

      if (
        "user" in datos &&
        datos.user?.id
      ) {
        return datos.user;
      }
    } catch {
      /*
       * Continúa con la siguiente
       * posible clave de sesión.
       */
    }
  }

  return {};
}

function Pagos() {
  const navigate = useNavigate();

  const {
    pagoId,
  } = useParams<{
    pagoId?: string;
  }>();

  const usuarioSesion =
    useMemo(
      () =>
        obtenerUsuarioSesion(),
      [],
    );

  const [
    pagos,
    setPagos,
  ] = useState<Pago[]>([]);

  const [
    seleccionadoId,
    setSeleccionadoId,
  ] = useState("");

  const [
    filtro,
    setFiltro,
  ] = useState<FiltroPago>(
    "TODOS",
  );

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    observacion,
    setObservacion,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    comprobanteUrl,
    setComprobanteUrl,
  ] = useState("");

  const [
    cargandoComprobante,
    setCargandoComprobante,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    esError,
    setEsError,
  ] = useState(false);

  const cargarPagos =
    useCallback(
      async (
        mostrarCargaInicial =
          false,
      ) => {
        if (mostrarCargaInicial) {
          setCargando(true);
        } else {
          setActualizando(true);
        }

        setMensaje("");
        setEsError(false);

        try {
          const datos =
            await obtenerTodosLosPagos();

          setPagos(datos);

          setSeleccionadoId(
            (actual) => {
              if (
                actual &&
                datos.some(
                  (pago) =>
                    pago.id ===
                    actual,
                )
              ) {
                return actual;
              }

              return (
                datos.find(
                  (pago) =>
                    pago.estado ===
                    "PENDIENTE",
                )?.id ??
                datos[0]?.id ??
                ""
              );
            },
          );
        } catch (error) {
          setPagos([]);
          setSeleccionadoId("");
          setEsError(true);
          setMensaje(
            obtenerMensajeError(
              error,
            ),
          );
        } finally {
          setCargando(false);
          setActualizando(false);
        }
      },
      [],
    );

  useEffect(() => {
    void cargarPagos(true);
  }, [cargarPagos]);

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        void cargarPagos(false);
      }, 15000);

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, [cargarPagos]);

  useEffect(() => {
    if (cargando) {
      return;
    }

    if (pagoId) {
      const pagoEncontrado =
        pagos.find(
          (pago) =>
            pago.id === pagoId,
        );

      if (pagoEncontrado) {
        setSeleccionadoId(
          pagoEncontrado.id,
        );
        return;
      }

      setSeleccionadoId("");
      setEsError(true);
      setMensaje(
        "El comprobante solicitado no existe o ya no está disponible.",
      );
      return;
    }

    setSeleccionadoId(
      (seleccionActual) => {
        if (
          seleccionActual &&
          pagos.some(
            (pago) =>
              pago.id ===
              seleccionActual,
          )
        ) {
          return seleccionActual;
        }

        return (
          pagos.find(
            (pago) =>
              pago.estado ===
              "PENDIENTE",
          )?.id ??
          pagos[0]?.id ??
          ""
        );
      },
    );
  }, [
    cargando,
    pagoId,
    pagos,
  ]);

  const pagoSeleccionado =
    useMemo(
      () =>
        pagos.find(
          (pago) =>
            pago.id ===
            seleccionadoId,
        ) ?? null,
      [
        pagos,
        seleccionadoId,
      ],
    );

  useEffect(() => {
    let urlTemporal = "";
    let cancelado = false;

    setComprobanteUrl("");

    if (!pagoSeleccionado) {
      return;
    }

    const cargarComprobante =
      async () => {
        setCargandoComprobante(
          true,
        );

        try {
          const archivo =
            await obtenerComprobantePago(
              pagoSeleccionado.id,
            );

          if (cancelado) {
            return;
          }

          urlTemporal =
            URL.createObjectURL(
              archivo,
            );

          setComprobanteUrl(
            urlTemporal,
          );
        } catch (error) {
          if (!cancelado) {
            setEsError(true);
            setMensaje(
              obtenerMensajeError(
                error,
              ),
            );
          }
        } finally {
          if (!cancelado) {
            setCargandoComprobante(
              false,
            );
          }
        }
      };

    void cargarComprobante();

    return () => {
      cancelado = true;

      if (urlTemporal) {
        URL.revokeObjectURL(
          urlTemporal,
        );
      }
    };
  }, [pagoSeleccionado]);

  const resumen =
    useMemo(
      () => ({
        total: pagos.length,
        pendientes:
          pagos.filter(
            (pago) =>
              pago.estado ===
              "PENDIENTE",
          ).length,
        revision:
          pagos.filter(
            (pago) =>
              pago.estado ===
              "EN_REVISION",
          ).length,
        aprobados:
          pagos.filter(
            (pago) =>
              pago.estado ===
              "APROBADO",
          ).length,
        rechazados:
          pagos.filter(
            (pago) =>
              pago.estado ===
              "RECHAZADO",
          ).length,
      }),
      [pagos],
    );

  const pagosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return pagos.filter(
        (pago) => {
          if (
            filtro !== "TODOS" &&
            pago.estado !== filtro
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const nombre =
            `${pago.usuario?.nombre ?? ""} ${
              pago.usuario?.apellido ??
              ""
            }`.toLowerCase();

          const ruta =
            `${pago.viaje?.ruta?.origen ?? ""} ${
              pago.viaje?.ruta?.destino ??
              ""
            }`.toLowerCase();

          return (
            pago.referencia
              .toLowerCase()
              .includes(texto) ||
            nombre.includes(texto) ||
            (
              pago.usuario?.email ??
              ""
            )
              .toLowerCase()
              .includes(texto) ||
            ruta.includes(texto)
          );
        },
      );
    }, [
      pagos,
      filtro,
      busqueda,
    ]);

  const seleccionarPago = (
    pagoId: string,
  ) => {
    setSeleccionadoId(pagoId);
    setObservacion("");
    setMensaje("");
    setEsError(false);

    navigate(
      `/admin/pagos/${pagoId}`,
    );
  };

  const procesarDecision =
    async (
      decision:
        "APROBAR" |
        "RECHAZAR",
    ) => {
      if (!pagoSeleccionado) {
        return;
      }

      if (!usuarioSesion.id) {
        setEsError(true);
        setMensaje(
          "No se encontró la sesión del administrador. Cierra sesión e inicia nuevamente.",
        );
        return;
      }

      const motivo =
        observacion.trim();

      if (
        decision ===
          "RECHAZAR" &&
        !motivo
      ) {
        setEsError(true);
        setMensaje(
          "Escribe el motivo del rechazo antes de continuar.",
        );
        return;
      }

      const pregunta =
        decision === "APROBAR"
          ? "¿Confirmas que revisaste el comprobante y que el pago es correcto?"
          : "¿Confirmas que deseas rechazar este comprobante y liberar los asientos?";

      if (
        !window.confirm(
          pregunta,
        )
      ) {
        return;
      }

      setProcesando(true);
      setMensaje("");
      setEsError(false);

      try {
        const respuesta =
          await revisarPago(
            pagoSeleccionado.id,
            usuarioSesion.id,
            {
              decision,
              observacion:
                motivo ||
                undefined,
            },
          );

        setObservacion("");

        await cargarPagos();

        setEsError(false);
        setMensaje(
          respuesta.mensaje,
        );
      } catch (error) {
        setEsError(true);
        setMensaje(
          obtenerMensajeError(
            error,
          ),
        );
      } finally {
        setProcesando(false);
      }
    };

  return (
    <main className="min-h-full bg-[#f2f8f4] px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-500 px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
        <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[38px] border-white/[0.08]" />

        <div className="pointer-events-none absolute bottom-4 right-[25%] h-16 w-16 rounded-full bg-lime-300/10" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
              <CreditCard size={28} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                Control de pagos
              </p>

              <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                Comprobantes QR
              </h1>

              <p className="mt-2 text-sm text-emerald-50/90">
                Revisa, aprueba o rechaza los pagos enviados por los pasajeros.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void cargarPagos()
            }
            disabled={
              actualizando ||
              procesando
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-5 py-3 font-black text-white backdrop-blur-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={19}
              className={
                actualizando
                  ? "animate-spin"
                  : ""
              }
            />
            Actualizar
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TarjetaResumen
          titulo="Total"
          valor={resumen.total}
          color="slate"
          icono={
            <CreditCard
              size={21}
            />
          }
        />

        <TarjetaResumen
          titulo="Pendientes"
          valor={
            resumen.pendientes
          }
          color="amber"
          icono={
            <Clock3 size={21} />
          }
        />

        <TarjetaResumen
          titulo="En revisión"
          valor={resumen.revision}
          color="blue"
          icono={
            <Search size={21} />
          }
        />

        <TarjetaResumen
          titulo="Aprobados"
          valor={
            resumen.aprobados
          }
          color="emerald"
          icono={
            <CheckCircle2
              size={21}
            />
          }
        />

        <TarjetaResumen
          titulo="Rechazados"
          valor={
            resumen.rechazados
          }
          color="red"
          icono={
            <XCircle size={21} />
          }
        />
      </section>

      {mensaje && (
        <div
          className={[
            "mt-6 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm font-bold",
            esError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          ].join(" ")}
        >
          {esError ? (
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={20}
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 shrink-0"
              size={20}
            />
          )}

          <span>{mensaje}</span>
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Bandeja administrativa
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Pagos recibidos
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block min-w-0 sm:w-72">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={busqueda}
                  onChange={(
                    event,
                  ) =>
                    setBusqueda(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Buscar referencia o pasajero..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <label className="relative block sm:w-48">
                <Filter
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                />

                <select
                  value={filtro}
                  onChange={(
                    event,
                  ) =>
                    setFiltro(
                      event.target
                        .value as FiltroPago,
                    )
                  }
                  className="w-full appearance-none rounded-2xl border border-emerald-200 bg-emerald-50 py-3 pl-11 pr-4 text-sm font-black text-emerald-800 outline-none"
                >
                  <option value="TODOS">
                    Todos
                  </option>
                  <option value="PENDIENTE">
                    Pendientes
                  </option>
                  <option value="EN_REVISION">
                    En revisión
                  </option>
                  <option value="APROBADO">
                    Aprobados
                  </option>
                  <option value="RECHAZADO">
                    Rechazados
                  </option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex min-h-[430px] flex-col items-center justify-center px-6 text-center">
            <LoaderCircle
              size={48}
              className="animate-spin text-emerald-700"
            />

            <p className="mt-4 text-lg font-black text-slate-900">
              Cargando pagos...
            </p>
          </div>
        ) : pagosFiltrados.length ===
          0 ? (
          <div className="flex min-h-[430px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <FileImage
                size={37}
              />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-900">
              No hay pagos
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              No existen comprobantes que coincidan con el filtro o la búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid min-h-[650px] xl:grid-cols-[390px_1fr]">
            <div className="border-b border-emerald-100 xl:border-b-0 xl:border-r">
              <div className="border-b border-slate-100 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-400">
                {
                  pagosFiltrados.length
                }{" "}
                resultados
              </div>

              <div className="max-h-[650px] overflow-y-auto">
                {pagosFiltrados.map(
                  (pago) => (
                    <button
                      key={pago.id}
                      type="button"
                      onClick={() =>
                        seleccionarPago(
                          pago.id,
                        )
                      }
                      className={[
                        "w-full border-b border-slate-100 px-5 py-5 text-left transition",
                        pago.id ===
                        seleccionadoId
                          ? "bg-emerald-50"
                          : "bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-emerald-700">
                            {
                              pago.referencia
                            }
                          </p>

                          <p className="mt-2 truncate font-black text-slate-900">
                            {obtenerNombreUsuario(
                              pago,
                            )}
                          </p>
                        </div>

                        <EstadoPagoBadge
                          estado={
                            pago.estado
                          }
                        />
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="min-w-0 text-xs text-slate-500">
                          <p className="truncate">
                            {obtenerRuta(
                              pago,
                            )}
                          </p>

                          <p className="mt-1">
                            {formatearFechaHora(
                              pago.fechaRegistro,
                            )}
                          </p>
                        </div>

                        <p className="shrink-0 text-lg font-black text-emerald-800">
                          Bs.{" "}
                          {pago.monto.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="min-w-0 bg-[#fbfdfb] p-5 sm:p-7">
              {pagoSeleccionado ? (
                <DetallePago
                  pago={
                    pagoSeleccionado
                  }
                  comprobanteUrl={
                    comprobanteUrl
                  }
                  cargandoComprobante={
                    cargandoComprobante
                  }
                  observacion={
                    observacion
                  }
                  setObservacion={
                    setObservacion
                  }
                  procesando={
                    procesando
                  }
                  onAprobar={() =>
                    void procesarDecision(
                      "APROBAR",
                    )
                  }
                  onRechazar={() =>
                    void procesarDecision(
                      "RECHAZAR",
                    )
                  }
                />
              ) : (
                <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center">
                  <CreditCard
                    size={50}
                    className="text-emerald-200"
                  />

                  <h3 className="mt-4 text-xl font-black text-slate-900">
                    Selecciona un pago
                  </h3>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function DetallePago({
  pago,
  comprobanteUrl,
  cargandoComprobante,
  observacion,
  setObservacion,
  procesando,
  onAprobar,
  onRechazar,
}: {
  pago: Pago;
  comprobanteUrl: string;
  cargandoComprobante: boolean;
  observacion: string;
  setObservacion: (
    valor: string,
  ) => void;
  procesando: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
}) {
  const pagoPendiente =
    pago.estado ===
    "PENDIENTE";

  const esPdf =
    pago.comprobanteTipo ===
    "application/pdf";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
            Detalle del pago
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-900">
            {pago.referencia}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Recibido{" "}
            {formatearFechaHora(
              pago.fechaRegistro,
            )}
          </p>
        </div>

        <EstadoPagoBadge
          estado={pago.estado}
          grande
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DatoPago
          icono={
            <UserRound size={20} />
          }
          etiqueta="Pasajero"
          valor={obtenerNombreUsuario(
            pago,
          )}
        />

        <DatoPago
          icono={
            <MapPin size={20} />
          }
          etiqueta="Ruta"
          valor={obtenerRuta(
            pago,
          )}
        />

        <DatoPago
          icono={
            <Ticket size={20} />
          }
          etiqueta="Asientos"
          valor={`${pago.asientoIds.length} ${
            pago.asientoIds.length ===
            1
              ? "asiento"
              : "asientos"
          }`}
        />

        <DatoPago
          icono={
            <Banknote size={20} />
          }
          etiqueta="Monto"
          valor={`Bs. ${pago.monto.toFixed(
            2,
          )}`}
          destacado
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <FileImage
                size={21}
                className="text-emerald-700"
              />

              <div>
                <p className="font-black text-slate-900">
                  Comprobante
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {pago.comprobanteNombre ??
                    "Archivo enviado"}
                </p>
              </div>
            </div>

            {comprobanteUrl && (
              <a
                href={
                  comprobanteUrl
                }
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100"
              >
                Abrir
              </a>
            )}
          </div>

          <div className="flex min-h-[460px] items-center justify-center bg-slate-100 p-4">
            {cargandoComprobante ? (
              <div className="text-center">
                <LoaderCircle
                  size={42}
                  className="mx-auto animate-spin text-emerald-700"
                />

                <p className="mt-3 text-sm font-bold text-slate-500">
                  Cargando comprobante...
                </p>
              </div>
            ) : comprobanteUrl ? (
              esPdf ? (
                <iframe
                  src={
                    comprobanteUrl
                  }
                  title="Comprobante de pago"
                  className="h-[520px] w-full rounded-2xl bg-white"
                />
              ) : (
                <img
                  src={
                    comprobanteUrl
                  }
                  alt="Comprobante de pago"
                  className="max-h-[560px] max-w-full rounded-2xl object-contain shadow-lg"
                />
              )
            ) : (
              <div className="text-center text-slate-400">
                <AlertCircle
                  size={42}
                  className="mx-auto"
                />

                <p className="mt-3 font-bold">
                  No se pudo mostrar el archivo
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <ShieldCheck
                  size={22}
                />
              </div>

              <div>
                <p className="font-black text-slate-900">
                  Verificación
                </p>

                <p className="text-xs text-slate-500">
                  Revisión administrativa
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <LineaDato
                icono={
                  <Hash size={16} />
                }
                etiqueta="Referencia"
                valor={
                  pago.referencia
                }
              />

              <LineaDato
                icono={
                  <CalendarDays
                    size={16}
                  />
                }
                etiqueta="Fecha"
                valor={formatearFechaHora(
                  pago.fechaRegistro,
                )}
              />

              <LineaDato
                icono={
                  <Banknote
                    size={16}
                  />
                }
                etiqueta="Monto"
                valor={`Bs. ${pago.monto.toFixed(
                  2,
                )}`}
              />
            </div>
          </div>

          {pagoPendiente ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <label className="font-black text-slate-900">
                Observación
              </label>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Es obligatoria cuando rechazas el pago.
              </p>

              <textarea
                value={observacion}
                onChange={(
                  event,
                ) =>
                  setObservacion(
                    event.target
                      .value,
                  )
                }
                maxLength={500}
                rows={5}
                placeholder="Ejemplo: el monto o la referencia no coinciden..."
                className="mt-3 w-full resize-none rounded-2xl border border-amber-200 bg-white p-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {
                  observacion.length
                }
                /500
              </p>

              <button
                type="button"
                onClick={onAprobar}
                disabled={procesando}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {procesando ? (
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={20}
                  />
                )}
                Aprobar pago
              </button>

              <button
                type="button"
                onClick={onRechazar}
                disabled={procesando}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-4 font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={20} />
                Rechazar pago
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="font-black text-slate-900">
                Revisión finalizada
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {pago.observacionAdministrador ||
                  (pago.estado ===
                  "APROBADO"
                    ? "El comprobante fue aprobado y el ticket fue generado."
                    : "El comprobante fue procesado.")}
              </p>

              {pago.reserva?.codigoReserva && (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
                    Reserva generada
                  </p>

                  <p className="mt-1 font-black text-emerald-900">
                    {
                      pago.reserva
                        .codigoReserva
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  icono,
  color,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  color:
    | "slate"
    | "amber"
    | "blue"
    | "emerald"
    | "red";
}) {
  const colores = {
    slate:
      "bg-slate-50 text-slate-700 border-slate-200",
    amber:
      "bg-amber-50 text-amber-700 border-amber-200",
    blue:
      "bg-blue-50 text-blue-700 border-blue-200",
    emerald:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    red:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <article className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-md shadow-emerald-900/5">
      <div
        className={[
          "flex h-11 w-11 items-center justify-center rounded-2xl border",
          colores[color],
        ].join(" ")}
      >
        {icono}
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-3xl font-black text-slate-900">
        {valor}
      </p>
    </article>
  );
}

function EstadoPagoBadge({
  estado,
  grande = false,
}: {
  estado: EstadoPago;
  grande?: boolean;
}) {
  const estilos:
    Record<
      EstadoPago,
      {
        texto: string;
        clase: string;
      }
    > = {
    PENDIENTE: {
      texto: "Pendiente",
      clase:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
    EN_REVISION: {
      texto: "En revisión",
      clase:
        "border-blue-200 bg-blue-50 text-blue-700",
    },
    APROBADO: {
      texto: "Aprobado",
      clase:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    RECHAZADO: {
      texto: "Rechazado",
      clase:
        "border-red-200 bg-red-50 text-red-700",
    },
  };

  const estilo =
    estilos[estado];

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border font-black",
        grande
          ? "px-4 py-2 text-sm"
          : "px-2.5 py-1 text-[10px]",
        estilo.clase,
      ].join(" ")}
    >
      {estilo.texto}
    </span>
  );
}

function DatoPago({
  icono,
  etiqueta,
  valor,
  destacado = false,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        destacado
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div
        className={
          destacado
            ? "text-emerald-700"
            : "text-slate-400"
        }
      >
        {icono}
      </div>

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
        {etiqueta}
      </p>

      <p
        className={[
          "mt-1 truncate font-black",
          destacado
            ? "text-emerald-800"
            : "text-slate-900",
        ].join(" ")}
        title={valor}
      >
        {valor}
      </p>
    </div>
  );
}

function LineaDato({
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <span className="mt-0.5 text-emerald-700">
        {icono}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {etiqueta}
        </p>

        <p className="mt-0.5 break-words font-bold text-slate-800">
          {valor}
        </p>
      </div>
    </div>
  );
}

function obtenerNombreUsuario(
  pago: Pago,
): string {
  return (
    `${pago.usuario?.nombre ?? ""} ${
      pago.usuario?.apellido ?? ""
    }`.trim() ||
    pago.usuario?.email ||
    "Pasajero"
  );
}

function obtenerRuta(
  pago: Pago,
): string {
  const origen =
    pago.viaje?.ruta?.origen;

  const destino =
    pago.viaje?.ruta?.destino;

  if (origen && destino) {
    return `${origen} → ${destino}`;
  }

  return "Ruta no disponible";
}

function formatearFechaHora(
  fecha?: string | null,
): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const valor =
    new Date(fecha);

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return fecha;
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(valor);
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object"
  ) {
    const posible =
      error as {
        message?: string;
        response?: {
          data?: {
            message?:
              | string
              | string[];
            mensaje?: string;
          };
        };
      };

    const mensajeBackend =
      posible.response?.data
        ?.message;

    if (
      Array.isArray(
        mensajeBackend,
      )
    ) {
      return mensajeBackend.join(
        ", ",
      );
    }

    if (
      typeof mensajeBackend ===
      "string"
    ) {
      return mensajeBackend;
    }

    if (
      posible.response?.data
        ?.mensaje
    ) {
      return posible.response
        .data.mensaje;
    }

    if (posible.message) {
      return posible.message;
    }
  }

  return "No se pudo completar la operación.";
}

export default Pagos;