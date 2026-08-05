import {useCallback,useEffect,useMemo,useRef,useState,type ReactNode,} from "react";

import {NavLink,Outlet,useLocation,useNavigate,} from "react-router-dom";

import {
  AlertCircle,
  BarChart3,
  Bell,
  Blocks,
  BusFront,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Loader2,
  LogOut,
  Menu,
  MessageSquareWarning,
  RefreshCw,
  ReceiptText,
  ScanLine,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import logo from "../assets/logo.png";

import {
  contarNotificacionesNoLeidasAdministrador,
  marcarNotificacionComoLeida,
  marcarTodasLasNotificacionesComoLeidas,
  obtenerNotificacionesAdministrador,
} from "../services/notificaciones.service";

import type {
  Notificacion,
} from "../services/notificaciones.service";

import {
  obtenerTodosLosPagos,
} from "../services/pagos.service";

interface UsuarioLocal {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
}

interface OpcionMenu {
  texto: string;
  ruta: string;
  icono: ReactNode;
  rutasRelacionadas?: string[];
}

const OPCIONES_MENU: OpcionMenu[] = [
  {
    texto: "Dashboard",
    ruta: "/admin",
    icono: <BarChart3 size={21} />,
  },
  {
    texto: "Usuarios",
    ruta: "/admin/usuarios",
    icono: <Users size={21} />,
  },
  {
    texto: "Venta en oficina",
    ruta: "/admin/venta-oficina",
    icono: <CreditCard size={21} />,
  },
  {
    texto: "Reportes",
    ruta: "/admin/reportes",
    icono: <BarChart3 size={21} />,
  },
{
  texto: "Blockchain",
  ruta: "/admin/blockchain",
  icono: <Blocks size={21} />,
},

{
  texto: "Auditoría",
  ruta: "/admin/auditoria",
icono: <ShieldCheck size={21} />,},

{
  texto: "Viajes y rutas",
  ruta: "/admin/viajes-rutas",
  icono: <BusFront size={21} />,
  rutasRelacionadas: [
    "/admin/viajes-rutas",
    "/admin/viajes-rutas/rutas",
    "/admin/viajes-rutas/vehiculos",
    "/admin/viajes-rutas/viajes",
  ],
},
];

function obtenerUsuario(): UsuarioLocal {
  const usuarioGuardado =
    localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    return {};
  }

  try {
    const resultado: unknown =
      JSON.parse(usuarioGuardado);

    return resultado &&
      typeof resultado === "object"
      ? (resultado as UsuarioLocal)
      : {};
  } catch {
    return {};
  }
}

function formatearFechaActual(): string {
  const fechaFormateada =
    new Intl.DateTimeFormat(
      "es-BO",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    ).format(new Date());

  return (
    fechaFormateada
      .charAt(0)
      .toUpperCase() +
    fechaFormateada.slice(1)
  );
}

function formatearFechaNotificacion(
  fecha: string,
): string {
  const fechaNotificacion =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaNotificacion.getTime(),
    )
  ) {
    return "";
  }

  const ahora = new Date();

  const diferencia =
    ahora.getTime() -
    fechaNotificacion.getTime();

  const minutos = Math.floor(
    diferencia / 60000,
  );

  if (minutos < 1) {
    return "Ahora";
  }

  if (minutos < 60) {
    return `Hace ${minutos} min`;
  }

  const horas = Math.floor(
    minutos / 60,
  );

  if (horas < 24) {
    return `Hace ${horas} ${
      horas === 1
        ? "hora"
        : "horas"
    }`;
  }

  const dias = Math.floor(
    horas / 24,
  );

  if (dias < 7) {
    return `Hace ${dias} ${
      dias === 1
        ? "día"
        : "días"
    }`;
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
  ).format(fechaNotificacion);
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const panelNotificacionesRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
  ] = useState(false);

  const [
    menuReducido,
    setMenuReducido,
  ] = useState(false);

  const [
    panelNotificacionesAbierto,
    setPanelNotificacionesAbierto,
  ] = useState(false);

  const [
    notificaciones,
    setNotificaciones,
  ] = useState<Notificacion[]>(
    [],
  );

  const [
    cantidadNoLeidas,
    setCantidadNoLeidas,
  ] = useState(0);

  const [
    cantidadPagosPendientes,
    setCantidadPagosPendientes,
  ] = useState(0);

  const [
    cargandoNotificaciones,
    setCargandoNotificaciones,
  ] = useState(false);

  const [
    actualizandoNotificaciones,
    setActualizandoNotificaciones,
  ] = useState(false);

  const [
    errorNotificaciones,
    setErrorNotificaciones,
  ] = useState("");

  const [
    marcandoTodas,
    setMarcandoTodas,
  ] = useState(false);

  const usuario = useMemo(
    () => obtenerUsuario(),
    [],
  );

  const nombreCompleto =
    `${usuario.nombre ?? ""} ${
      usuario.apellido ?? ""
    }`.trim() || "Administrador";

  const inicial =
    nombreCompleto
      .charAt(0)
      .toLocaleUpperCase() || "A";

  const cargarNotificaciones =
    useCallback(
      async (
        mostrarCarga = false,
      ) => {
        try {
          if (mostrarCarga) {
            setCargandoNotificaciones(
              true,
            );
          } else {
            setActualizandoNotificaciones(
              true,
            );
          }

          setErrorNotificaciones("");

          const [
            lista,
            cantidad,
            pagosPendientes,
          ] = await Promise.all([
            obtenerNotificacionesAdministrador(
              30,
            ),

            contarNotificacionesNoLeidasAdministrador(),

            usuario.rol ===
            "ADMINISTRADOR"
              ? obtenerTodosLosPagos(
                  "PENDIENTE",
                )
              : Promise.resolve([]),
          ]);

          setNotificaciones(lista);
          setCantidadNoLeidas(
            cantidad,
          );
          setCantidadPagosPendientes(
            pagosPendientes.length,
          );
        } catch (error) {
          setErrorNotificaciones(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las notificaciones.",
          );
        } finally {
          setCargandoNotificaciones(
            false,
          );

          setActualizandoNotificaciones(
            false,
          );
        }
      },
      [usuario.rol],
    );

  useEffect(() => {
    setMenuMovilAbierto(false);
    setPanelNotificacionesAbierto(
      false,
    );
  }, [location.pathname]);

  useEffect(() => {
    void cargarNotificaciones(true);

    const intervalo =
      window.setInterval(() => {
        void cargarNotificaciones();
      }, 15000);

    const actualizarAlRegresar =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void cargarNotificaciones();
        }
      };

    document.addEventListener(
      "visibilitychange",
      actualizarAlRegresar,
    );

    window.addEventListener(
      "focus",
      actualizarAlRegresar,
    );

    return () => {
      window.clearInterval(
        intervalo,
      );

      document.removeEventListener(
        "visibilitychange",
        actualizarAlRegresar,
      );

      window.removeEventListener(
        "focus",
        actualizarAlRegresar,
      );
    };
  }, [cargarNotificaciones]);

  useEffect(() => {
    function cerrarAlPresionarFuera(
      event: MouseEvent,
    ) {
      if (
        panelNotificacionesRef
          .current &&
        !panelNotificacionesRef.current.contains(
          event.target as Node,
        )
      ) {
        setPanelNotificacionesAbierto(
          false,
        );
      }
    }

    document.addEventListener(
      "mousedown",
      cerrarAlPresionarFuera,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        cerrarAlPresionarFuera,
      );
    };
  }, []);

  function cerrarSesion() {
    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "access_token",
    );

    localStorage.removeItem(
      "usuario",
    );

    localStorage.removeItem(
      "ultimoTicket",
    );

    navigate("/login", {
      replace: true,
    });
  }

  async function abrirNotificacion(
    notificacion: Notificacion,
  ) {
    try {
      if (!notificacion.leida) {
        await marcarNotificacionComoLeida(
          notificacion.id,
        );

        setNotificaciones(
          (estadoAnterior) =>
            estadoAnterior.map(
              (item) =>
                item.id ===
                notificacion.id
                  ? {
                      ...item,
                      leida: true,
                      fechaLectura:
                        new Date().toISOString(),
                    }
                  : item,
            ),
        );

        setCantidadNoLeidas(
          (cantidadAnterior) =>
            Math.max(
              0,
              cantidadAnterior - 1,
            ),
        );
      }

      setPanelNotificacionesAbierto(
        false,
      );

      if (
        notificacion.rutaDestino
      ) {
        navigate(
          notificacion.rutaDestino,
        );
      }
    } catch (error) {
      setErrorNotificaciones(
        error instanceof Error
          ? error.message
          : "No se pudo abrir la notificación.",
      );
    }
  }

  async function marcarTodasLeidas() {
    if (
      cantidadNoLeidas === 0 ||
      marcandoTodas
    ) {
      return;
    }

    try {
      setMarcandoTodas(true);
      setErrorNotificaciones("");

      await marcarTodasLasNotificacionesComoLeidas();

      const fechaLectura =
        new Date().toISOString();

      setNotificaciones(
        (estadoAnterior) =>
          estadoAnterior.map(
            (notificacion) => ({
              ...notificacion,
              leida: true,
              fechaLectura:
                notificacion.fechaLectura ??
                fechaLectura,
            }),
          ),
      );

      setCantidadNoLeidas(0);
    } catch (error) {
      setErrorNotificaciones(
        error instanceof Error
          ? error.message
          : "No se pudieron marcar las notificaciones.",
      );
    } finally {
      setMarcandoTodas(false);
    }
  }

  function alternarNotificaciones() {
    setPanelNotificacionesAbierto(
      (estado) => !estado,
    );

    if (
      !panelNotificacionesAbierto
    ) {
      void cargarNotificaciones(
        notificaciones.length === 0,
      );
    }
  }
  return (
    <div className="min-h-screen bg-[#f2f8f4]">
      {menuMovilAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() =>
            setMenuMovilAbierto(false)
          }
          className="fixed inset-0 z-40 bg-emerald-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-gradient-to-b from-[#005f30] via-[#007239] to-[#004a25] text-white shadow-2xl shadow-emerald-950/30 transition-all duration-300 lg:translate-x-0 ${
          menuMovilAbierto
            ? "translate-x-0"
            : "-translate-x-full"
        } ${
          menuReducido
            ? "lg:w-24"
            : "lg:w-72"
        }`}
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" />

        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-lime-300/5" />

        <div className="relative z-10 border-b border-white/15 px-5 py-6">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() =>
              setMenuMovilAbierto(false)
            }
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
          >
            <X size={20} />
          </button>

          <div
            className={`flex items-center ${
              menuReducido
                ? "justify-center"
                : "gap-4"
            }`}
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-lg">
              <img
                src={logo}
                alt="Logo de Trans 2 de Junio"
                className="h-full w-full scale-[1.35] object-contain"
              />
            </div>

            {!menuReducido && (
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black text-white">
                  ADMINISTRADOR
                </h1>

                <p className="mt-1 text-sm font-medium text-emerald-100">
                  Trans 2 de Junio
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="relative z-10 flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {!menuReducido && (
            <p className="mb-4 px-3 text-xs font-black uppercase tracking-[0.2em] text-lime-200">
              Panel de control
            </p>
          )}

          {OPCIONES_MENU.map(
            (opcion) => (
              <OpcionNavegacion
                key={opcion.ruta}
                opcion={opcion}
                reducido={menuReducido}
              />
            ),
          )}

          <div className="my-5 border-t border-white/15" />

          {usuario.rol ===
            "ADMINISTRADOR" && (
            <NavLink
              to="/admin/pagos"
              title={
                menuReducido
                  ? "Pagos QR"
                  : undefined
              }
              className={({ isActive }) =>
                `relative flex items-center rounded-xl px-4 py-3.5 font-bold transition ${
                  menuReducido
                    ? "justify-center"
                    : "gap-4"
                } ${
                  isActive
                    ? "bg-white text-emerald-800 shadow-lg"
                    : "text-emerald-50 hover:bg-white/15 hover:text-white"
                }`
              }
            >
              <ReceiptText
                size={21}
                className="shrink-0"
              />

              {!menuReducido && (
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span>Pagos QR</span>

                  {cantidadPagosPendientes >
                    0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-300 px-1.5 text-[10px] font-black text-amber-950">
                      {cantidadPagosPendientes >
                      99
                        ? "99+"
                        : cantidadPagosPendientes}
                    </span>
                  )}
                </span>
              )}

              {menuReducido &&
                cantidadPagosPendientes >
                  0 && (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-emerald-800 bg-amber-300" />
                )}
            </NavLink>
          )}

          <NavLink
            to="/admin/reclamos"
            title={
              menuReducido
                ? "Reclamos"
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center rounded-xl px-4 py-3.5 font-bold transition ${
                menuReducido
                  ? "justify-center"
                  : "gap-4"
              } ${
                isActive
                  ? "bg-white text-emerald-800 shadow-lg"
                  : "text-emerald-50 hover:bg-white/15 hover:text-white"
              }`
            }
          >
            <MessageSquareWarning
              size={21}
              className="shrink-0"
            />

            {!menuReducido && (
              <span className="flex flex-1 items-center justify-between gap-2">
                <span>Reclamos</span>

                {cantidadNoLeidas >
                  0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-lime-300 px-1.5 text-[10px] font-black text-emerald-950">
                    {cantidadNoLeidas >
                    99
                      ? "99+"
                      : cantidadNoLeidas}
                  </span>
                )}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/chofer/escanear-ticket"
            title={
              menuReducido
                ? "Escanear tickets"
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center rounded-xl px-4 py-3.5 font-bold transition ${
                menuReducido
                  ? "justify-center"
                  : "gap-4"
              } ${
                isActive
                  ? "bg-white text-emerald-800 shadow-lg"
                  : "text-emerald-50 hover:bg-white/15 hover:text-white"
              }`
            }
          >
            <ScanLine
              size={21}
              className="shrink-0"
            />

            {!menuReducido && (
              <span>
                Escanear tickets
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/configuracion"
            title={
              menuReducido
                ? "Configuración"
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center rounded-xl px-4 py-3.5 font-bold transition ${
                menuReducido
                  ? "justify-center"
                  : "gap-4"
              } ${
                isActive
                  ? "bg-white text-emerald-800 shadow-lg"
                  : "text-emerald-50 hover:bg-white/15 hover:text-white"
              }`
            }
          >
            <Settings
              size={21}
              className="shrink-0"
            />

            {!menuReducido && (
              <span>
                Configuración
              </span>
            )}
          </NavLink>
        </nav>

        <div className="relative z-10 border-t border-white/15 p-4">
          <button
            type="button"
            onClick={cerrarSesion}
            title={
              menuReducido
                ? "Cerrar sesión"
                : undefined
            }
            className={`flex w-full items-center rounded-xl border border-red-300/30 bg-red-600 px-4 py-3.5 font-black text-white shadow-lg transition hover:bg-red-700 ${
              menuReducido
                ? "justify-center"
                : "gap-4"
            }`}
          >
            <LogOut
              size={21}
              className="shrink-0"
            />

            {!menuReducido && (
              <span>
                Cerrar sesión
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() =>
            setMenuReducido(
              (estado) => !estado,
            )
          }
          title={
            menuReducido
              ? "Expandir menú"
              : "Reducir menú"
          }
          className="absolute -right-4 top-28 z-20 hidden h-9 w-9 items-center justify-center rounded-full border-4 border-[#f2f8f4] bg-emerald-700 text-white shadow-lg transition hover:bg-emerald-600 lg:flex"
        >
          {menuReducido ? (
            <ChevronRight
              size={17}
            />
          ) : (
            <ChevronLeft
              size={17}
            />
          )}
        </button>
      </aside>

      <div
        className={`min-h-screen transition-all duration-300 ${
          menuReducido
            ? "lg:pl-24"
            : "lg:pl-72"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                aria-label="Abrir menú"
                onClick={() =>
                  setMenuMovilAbierto(true)
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 lg:hidden"
              >
                <Menu size={23} />
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                  Bienvenido,{" "}
                  <span className="text-emerald-700">
                    {nombreCompleto}
                  </span>
                </h2>

                <p className="mt-1 hidden text-sm text-slate-500 sm:block">
                  {formatearFechaActual()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                ref={
                  panelNotificacionesRef
                }
                className="relative"
              >
                <button
                  type="button"
                  title="Notificaciones"
                  aria-label="Abrir notificaciones"
                  aria-expanded={
                    panelNotificacionesAbierto
                  }
                  onClick={
                    alternarNotificaciones
                  }
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                    panelNotificacionesAbierto
                      ? "border-emerald-600 bg-emerald-700 text-white shadow-md shadow-emerald-700/20"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {cargandoNotificaciones ? (
                    <Loader2
                      size={21}
                      className="animate-spin"
                    />
                  ) : (
                    <Bell size={21} />
                  )}

                  {cantidadNoLeidas >
                    0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-black text-white shadow-sm">
                      {cantidadNoLeidas >
                      99
                        ? "99+"
                        : cantidadNoLeidas}
                    </span>
                  )}
                </button>

                {panelNotificacionesAbierto && (
                  <div className="fixed inset-x-3 top-[76px] z-50 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl shadow-emerald-950/20 sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-[420px]">
                    <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-800 to-emerald-600 px-5 py-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                            <Bell size={21} />
                          </div>

                          <div>
                            <h3 className="font-black">
                              Notificaciones
                            </h3>

                            <p className="mt-0.5 text-xs text-emerald-100">
                              {cantidadNoLeidas ===
                              0
                                ? "No tienes avisos pendientes"
                                : `${cantidadNoLeidas} ${
                                    cantidadNoLeidas ===
                                    1
                                      ? "aviso sin leer"
                                      : "avisos sin leer"
                                  }`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            void cargarNotificaciones()
                          }
                          disabled={
                            actualizandoNotificaciones
                          }
                          title="Actualizar notificaciones"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
                        >
                          <RefreshCw
                            size={18}
                            className={
                              actualizandoNotificaciones
                                ? "animate-spin"
                                : ""
                            }
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/60 px-5 py-3">
                      <p className="text-xs font-bold text-slate-500">
                        Actividad reciente
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          void marcarTodasLeidas()
                        }
                        disabled={
                          cantidadNoLeidas ===
                            0 ||
                          marcandoTodas
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 transition hover:text-emerald-900 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {marcandoTodas ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <CheckCheck
                            size={15}
                          />
                        )}

                        Marcar todas como leídas
                      </button>
                    </div>
                    {errorNotificaciones && (
                      <div className="m-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle
                          size={19}
                          className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-black">
                            No se pudo actualizar
                          </p>

                          <p className="mt-1 text-xs leading-5">
                            {errorNotificaciones}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="max-h-[min(520px,65vh)] overflow-y-auto">
                      {cargandoNotificaciones ? (
                        <div className="flex flex-col items-center justify-center px-5 py-14">
                          <Loader2
                            size={34}
                            className="animate-spin text-emerald-700"
                          />

                          <p className="mt-4 text-sm font-bold text-slate-500">
                            Cargando notificaciones...
                          </p>
                        </div>
                      ) : notificaciones.length ===
                        0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <Bell size={30} />
                          </div>

                          <h4 className="mt-4 font-black text-slate-900">
                            No hay notificaciones
                          </h4>

                          <p className="mt-2 max-w-64 text-sm leading-6 text-slate-500">
                            Las compras y los reclamos nuevos aparecerán aquí.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notificaciones.map(
                            (
                              notificacion,
                            ) => (
                              <ElementoNotificacion
                                key={
                                  notificacion.id
                                }
                                notificacion={
                                  notificacion
                                }
                                onAbrir={
                                  abrirNotificacion
                                }
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-emerald-100 bg-slate-50 px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-400">
                          Se actualiza automáticamente cada 15 segundos
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setPanelNotificacionesAbierto(
                              false,
                            )
                          }
                          className="text-xs font-black text-emerald-700 hover:text-emerald-900"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-2 py-1.5 shadow-sm sm:px-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-black text-white shadow-md shadow-emerald-700/20">
                  {inicial}
                </div>

                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-40 truncate text-sm font-black text-slate-900">
                    {nombreCompleto}
                  </p>

                  <p className="max-w-40 truncate text-xs text-slate-500">
                    {usuario.email ??
                      "Administrador"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-[calc(100vh-77px)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function OpcionNavegacion({
  opcion,
  reducido,
}: {
  opcion: OpcionMenu;
  reducido: boolean;
}) {
  const location = useLocation();

  const estaActivo =
    opcion.ruta === "/admin"
      ? location.pathname ===
        "/admin"
      : opcion.rutasRelacionadas
        ? opcion.rutasRelacionadas.some(
            (ruta) =>
              location.pathname ===
                ruta ||
              location.pathname.startsWith(
                `${ruta}/`,
              ),
          )
        : location.pathname ===
              opcion.ruta ||
          location.pathname.startsWith(
            `${opcion.ruta}/`,
          );

  return (
    <NavLink
      to={opcion.ruta}
      end={
        opcion.ruta === "/admin"
      }
      title={
        reducido
          ? opcion.texto
          : undefined
      }
      className={`flex items-center rounded-xl px-4 py-3.5 font-bold transition ${
        reducido
          ? "justify-center"
          : "gap-4"
      } ${
        estaActivo
          ? "bg-white text-emerald-800 shadow-lg shadow-emerald-950/15"
          : "text-emerald-50 hover:bg-white/15 hover:text-white"
      }`}
    >
      <span className="shrink-0">
        {opcion.icono}
      </span>

      {!reducido && (
        <span>
          {opcion.texto}
        </span>
      )}
    </NavLink>
  );
}

interface ElementoNotificacionProps {
  notificacion: Notificacion;

  onAbrir: (
    notificacion: Notificacion,
  ) => Promise<void>;
}

function ElementoNotificacion({
  notificacion,
  onAbrir,
}: ElementoNotificacionProps) {
  const configuracion =
    obtenerConfiguracionNotificacion(
      notificacion,
    );

  return (
    <button
      type="button"
      onClick={() =>
        void onAbrir(
          notificacion,
        )
      }
      className={`relative flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-emerald-50/70 ${
        notificacion.leida
          ? "bg-white"
          : "bg-emerald-50/40"
      }`}
    >
      {!notificacion.leida && (
        <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-sm shadow-emerald-600/40" />
      )}

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${configuracion.claseIcono}`}
      >
        {configuracion.icono}
      </div>

      <div className="min-w-0 flex-1 pr-3">
        <div className="flex items-start gap-2">
          <h4
            className={`line-clamp-1 text-sm ${
              notificacion.leida
                ? "font-bold text-slate-700"
                : "font-black text-slate-950"
            }`}
          >
            {notificacion.titulo}
          </h4>

          {notificacion.prioridad ===
            "URGENTE" && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase text-red-700">
              <CircleAlert
                size={10}
              />
              Urgente
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
          {notificacion.mensaje}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${configuracion.claseEtiqueta}`}
          >
            {configuracion.etiqueta}
          </span>

          <span className="text-[10px] font-semibold text-slate-400">
            {formatearFechaNotificacion(
              notificacion.fechaRegistro,
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function obtenerConfiguracionNotificacion(
  notificacion: Notificacion,
): {
  icono: ReactNode;
  etiqueta: string;
  claseIcono: string;
  claseEtiqueta: string;
} {
  const tipoNotificacion =
    String(notificacion.tipo);

  switch (tipoNotificacion) {
    case "NUEVA_COMPRA":
    case "NUEVA_RESERVA":
      return {
        icono: (
          <ShoppingBag
            size={21}
          />
        ),

        etiqueta:
          notificacion.tipo ===
          "NUEVA_COMPRA"
            ? "Nueva compra"
            : "Nueva reserva",

        claseIcono:
          "bg-emerald-100 text-emerald-700",

        claseEtiqueta:
          "bg-emerald-100 text-emerald-700",
      };

    case "NUEVO_COMPROBANTE_PAGO":
      return {
        icono: (
          <ReceiptText
            size={21}
          />
        ),

        etiqueta:
          "Comprobante de pago",

        claseIcono:
          "bg-amber-100 text-amber-700",

        claseEtiqueta:
          "bg-amber-100 text-amber-700",
      };

    case "PAGO_APROBADO":
      return {
        icono: (
          <CheckCheck
            size={21}
          />
        ),

        etiqueta:
          "Pago aprobado",

        claseIcono:
          "bg-emerald-100 text-emerald-700",

        claseEtiqueta:
          "bg-emerald-100 text-emerald-700",
      };

    case "PAGO_RECHAZADO":
      return {
        icono: (
          <CircleAlert
            size={21}
          />
        ),

        etiqueta:
          "Pago rechazado",

        claseIcono:
          "bg-red-100 text-red-700",

        claseEtiqueta:
          "bg-red-100 text-red-700",
      };

    case "NUEVO_RECLAMO":
      return {
        icono: (
          <MessageSquareWarning
            size={21}
          />
        ),

        etiqueta:
          "Nuevo reclamo",

        claseIcono:
          notificacion.prioridad ===
          "URGENTE"
            ? "bg-red-100 text-red-700"
            : notificacion.prioridad ===
                "ALTA"
              ? "bg-amber-100 text-amber-700"
              : "bg-orange-100 text-orange-700",

        claseEtiqueta:
          notificacion.prioridad ===
          "URGENTE"
            ? "bg-red-100 text-red-700"
            : notificacion.prioridad ===
                "ALTA"
              ? "bg-amber-100 text-amber-700"
              : "bg-orange-100 text-orange-700",
      };

    case "MENSAJE_RECLAMO":
    case "RECLAMO_RESPONDIDO":
      return {
        icono: (
          <MessageSquareWarning
            size={21}
          />
        ),

        etiqueta:
          "Mensaje de reclamo",

        claseIcono:
          "bg-sky-100 text-sky-700",

        claseEtiqueta:
          "bg-sky-100 text-sky-700",
      };

    case "TICKET_UTILIZADO":
      return {
        icono: (
          <CheckCheck
            size={21}
          />
        ),

        etiqueta:
          "Ticket utilizado",

        claseIcono:
          "bg-teal-100 text-teal-700",

        claseEtiqueta:
          "bg-teal-100 text-teal-700",
      };

    case "TICKET_CANCELADO":
      return {
        icono: (
          <CircleAlert
            size={21}
          />
        ),

        etiqueta:
          "Ticket cancelado",

        claseIcono:
          "bg-red-100 text-red-700",

        claseEtiqueta:
          "bg-red-100 text-red-700",
      };

    default:
      return {
        icono: (
          <Bell size={21} />
        ),

        etiqueta:
          "Información",

        claseIcono:
          "bg-slate-100 text-slate-600",

        claseEtiqueta:
          "bg-slate-100 text-slate-600",
      };
  }
}
