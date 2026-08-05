import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  Armchair,
  Banknote,
  Blocks,
  BusFront,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MessageSquareWarning,
  RefreshCw,
  Route,
  ShieldCheck,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import {
  obtenerResumenAdmin,
  obtenerUltimasReservas,
  type ReservaAdmin,
  type ResumenAdmin,
} from "../../services/admin.service";

import { eliminarReserva } from "../../services/reservas.service";

const RESUMEN_INICIAL: ResumenAdmin = {
  usuarios: 0,
  rutas: 0,
  vehiculos: 0,
  viajes: 0,
  reservas: 0,

  asientosDisponibles: 0,
  asientosOcupados: 0,
  totalAsientos: 0,
  porcentajeOcupacion: 0,

  pagosPendientes: 0,
  pagosEnRevision: 0,
  pagosAprobados: 0,
  pagosRechazados: 0,

  ingresosHoy: 0,
  ingresosMes: 0,
  ingresosTotales: 0,

  tickets: 0,
  ticketsValidos: 0,
  ticketsUtilizados: 0,
  ticketsCancelados: 0,
  ticketsHoy: 0,

  blockchainProtegidos: 0,
  bloquesHoy: 0,

  reclamosPendientes: 0,
  reclamosTotal: 0,

  fechaActualizacion: "",
};

type VarianteCard =
  | "verde"
  | "azul"
  | "amarillo"
  | "rojo"
  | "morado"
  | "gris";

interface CardIndicadorProps {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: ReactNode;
  variante?: VarianteCard;
  etiqueta?: string;
}

function DashboardAdmin() {
  const [resumen, setResumen] =
    useState<ResumenAdmin>(RESUMEN_INICIAL);

  const [reservas, setReservas] =
    useState<ReservaAdmin[]>([]);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);

  const cargarDatos = useCallback(
    async (cargaInicial = false) => {
      try {
        if (cargaInicial) {
          setCargando(true);
        } else {
          setActualizando(true);
        }

        setMensaje("");

        const [dataResumen, dataReservas] =
          await Promise.all([
            obtenerResumenAdmin(),
            obtenerUltimasReservas(),
          ]);

        setResumen(dataResumen);
        setReservas(
          Array.isArray(dataReservas)
            ? dataReservas
            : [],
        );
      } catch (error: unknown) {
        setMensajeExito(false);
        setMensaje(obtenerMensajeError(error));
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [],
  );

  useEffect(() => {
    void cargarDatos(true);
  }, [cargarDatos]);

  const porcentajeBlockchain = useMemo(() => {
    if (resumen.tickets <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Number(
        (
          (resumen.blockchainProtegidos /
            resumen.tickets) *
          100
        ).toFixed(1),
      ),
    );
  }, [resumen.blockchainProtegidos, resumen.tickets]);

  const pagosTotales =
    resumen.pagosPendientes +
    resumen.pagosEnRevision +
    resumen.pagosAprobados +
    resumen.pagosRechazados;

  async function borrarReserva(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta reserva? Los asientos volverán a estar disponibles.",
    );

    if (!confirmar) {
      return;
    }

    try {
      setEliminandoId(id);
      setMensaje("");

      await eliminarReserva(id);

      setMensajeExito(true);
      setMensaje("Reserva eliminada correctamente.");

      await cargarDatos();
    } catch (error: unknown) {
      setMensajeExito(false);
      setMensaje(obtenerMensajeError(error));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <main className="min-h-full bg-[#f2f8f4] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1700px] space-y-7">
        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-r from-[#006331] via-[#008140] to-[#59b300] px-6 py-7 text-white shadow-xl shadow-emerald-950/20 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[48px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-[460px] rotate-[-9deg] rounded-[50%] bg-lime-200/10" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm sm:flex">
                <BusFront size={32} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-200">
                  Resumen ejecutivo
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Panel General del Administrador
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50 sm:text-base">
                  Control en tiempo real de ingresos, pagos, tickets,
                  blockchain, reclamos, usuarios y operaciones de transporte.
                </p>

                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-100">
                  <Clock3 size={15} />
                  Última actualización:{" "}
                  {formatearFechaHora(
                    resumen.fechaActualizacion,
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void cargarDatos()}
              disabled={actualizando || cargando}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={20}
                className={
                  actualizando ? "animate-spin" : ""
                }
              />

              {actualizando
                ? "Actualizando..."
                : "Actualizar panel"}
            </button>
          </div>
        </section>

        {mensaje && (
          <div
            role="alert"
            className={`flex items-start gap-3 rounded-2xl border p-4 font-bold shadow-sm ${
              mensajeExito
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {mensajeExito ? (
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

            <span>{mensaje}</span>
          </div>
        )}

        {cargando ? (
          <CargandoDashboard />
        ) : (
          <>
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <CardIndicador
                icono={<CircleDollarSign size={25} />}
                titulo="Ingresos de hoy"
                valor={formatearBolivianos(resumen.ingresosHoy)}
                descripcion="Pagos QR aprobados durante el día"
                variante="verde"
                etiqueta="Hoy"
              />

              <CardIndicador
                icono={<TrendingUp size={25} />}
                titulo="Ingresos del mes"
                valor={formatearBolivianos(resumen.ingresosMes)}
                descripcion="Total confirmado durante el mes"
                variante="azul"
                etiqueta="Mes"
              />

              <CardIndicador
                icono={<Banknote size={25} />}
                titulo="Ingresos acumulados"
                valor={formatearBolivianos(resumen.ingresosTotales)}
                descripcion="Total histórico de pagos aprobados"
                variante="morado"
                etiqueta="Total"
              />

              <CardIndicador
                icono={<MessageSquareWarning size={25} />}
                titulo="Reclamos pendientes"
                valor={formatearNumero(resumen.reclamosPendientes)}
                descripcion={`${resumen.reclamosTotal} reclamos registrados`}
                variante={
                  resumen.reclamosPendientes > 0
                    ? "amarillo"
                    : "verde"
                }
                etiqueta="Atención"
              />
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <CardIndicador
                icono={<Ticket size={25} />}
                titulo="Tickets emitidos"
                valor={formatearNumero(resumen.tickets)}
                descripcion={`${resumen.ticketsHoy} generados hoy`}
                variante="verde"
                etiqueta="Tickets"
              />

              <CardIndicador
                icono={<ShieldCheck size={25} />}
                titulo="Tickets válidos"
                valor={formatearNumero(resumen.ticketsValidos)}
                descripcion={`${resumen.ticketsUtilizados} utilizados`}
                variante="azul"
                etiqueta="QR"
              />

              <CardIndicador
                icono={<Blocks size={25} />}
                titulo="Protegidos en blockchain"
                valor={formatearNumero(
                  resumen.blockchainProtegidos,
                )}
                descripcion={`${porcentajeBlockchain}% de los tickets`}
                variante="morado"
                etiqueta="SHA-256"
              />

              <CardIndicador
                icono={<XCircle size={25} />}
                titulo="Tickets cancelados"
                valor={formatearNumero(
                  resumen.ticketsCancelados,
                )}
                descripcion={`${resumen.bloquesHoy} bloques creados hoy`}
                variante={
                  resumen.ticketsCancelados > 0
                    ? "rojo"
                    : "gris"
                }
                etiqueta="Control"
              />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <article className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                      Ocupación de asientos
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      Disponibilidad general
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-emerald-100 px-5 py-3 text-center text-emerald-800">
                    <p className="text-xs font-black uppercase">
                      Ocupación
                    </p>
                    <p className="text-2xl font-black">
                      {resumen.porcentajeOcupacion.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="mt-7">
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            resumen.porcentajeOcupacion,
                          ),
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <MiniIndicador
                      titulo="Total"
                      valor={resumen.totalAsientos}
                      icono={<Armchair size={20} />}
                    />

                    <MiniIndicador
                      titulo="Disponibles"
                      valor={resumen.asientosDisponibles}
                      icono={<CheckCircle2 size={20} />}
                      positivo
                    />

                    <MiniIndicador
                      titulo="Ocupados"
                      valor={resumen.asientosOcupados}
                      icono={<Ticket size={20} />}
                    />
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  Estado de pagos QR
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Comprobantes
                </h2>

                <div className="mt-6 space-y-4">
                  <FilaEstado
                    texto="Aprobados"
                    valor={resumen.pagosAprobados}
                    total={pagosTotales}
                    clase="bg-emerald-500"
                  />

                  <FilaEstado
                    texto="Pendientes"
                    valor={resumen.pagosPendientes}
                    total={pagosTotales}
                    clase="bg-amber-400"
                  />

                  <FilaEstado
                    texto="En revisión"
                    valor={resumen.pagosEnRevision}
                    total={pagosTotales}
                    clase="bg-sky-500"
                  />

                  <FilaEstado
                    texto="Rechazados"
                    valor={resumen.pagosRechazados}
                    total={pagosTotales}
                    clase="bg-red-500"
                  />
                </div>
              </article>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <CardIndicador
                icono={<Users size={25} />}
                titulo="Usuarios registrados"
                valor={formatearNumero(resumen.usuarios)}
                descripcion="Pasajeros y administradores"
                variante="verde"
              />

              <CardIndicador
                icono={<BusFront size={25} />}
                titulo="Vehículos registrados"
                valor={formatearNumero(resumen.vehiculos)}
                descripcion="Unidades disponibles en el sistema"
                variante="azul"
              />

              <CardIndicador
                icono={<Route size={25} />}
                titulo="Rutas disponibles"
                valor={formatearNumero(resumen.rutas)}
                descripcion="Destinos configurados"
                variante="morado"
              />

              <CardIndicador
                icono={<CalendarDays size={25} />}
                titulo="Viajes programados"
                valor={formatearNumero(resumen.viajes)}
                descripcion={`${resumen.reservas} reservas registradas`}
                variante="amarillo"
              />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
              <div className="flex flex-col gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                    Actividad reciente
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                    Últimas reservas
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Las 10 operaciones más recientes registradas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void cargarDatos()}
                  disabled={actualizando}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  <RefreshCw
                    size={18}
                    className={
                      actualizando ? "animate-spin" : ""
                    }
                  />
                  Actualizar
                </button>
              </div>

              {reservas.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Ticket size={30} />
                  </div>

                  <h3 className="mt-4 font-black text-slate-900">
                    No hay reservas recientes
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Las nuevas compras y reservas aparecerán aquí.
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-full">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-4">Código</th>
                          <th className="px-6 py-4">Pasajero</th>
                          <th className="px-6 py-4">Ruta</th>
                          <th className="px-6 py-4">Viaje</th>
                          <th className="px-6 py-4">Asientos</th>
                          <th className="px-6 py-4">Monto</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4">Acciones</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {reservas.map((reserva) => (
                          <FilaReserva
                            key={reserva.id}
                            reserva={reserva}
                            eliminando={
                              eliminandoId === reserva.id
                            }
                            onEliminar={borrarReserva}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-slate-100 lg:hidden">
                    {reservas.map((reserva) => (
                      <TarjetaReserva
                        key={reserva.id}
                        reserva={reserva}
                        eliminando={
                          eliminandoId === reserva.id
                        }
                        onEliminar={borrarReserva}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function CargandoDashboard() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-emerald-100 bg-white p-10 shadow-xl shadow-emerald-950/5">
      <RefreshCw
        size={38}
        className="animate-spin text-emerald-700"
      />

      <p className="mt-4 font-black text-slate-700">
        Cargando el panel administrativo...
      </p>
    </div>
  );
}

function CardIndicador({
  titulo,
  valor,
  descripcion,
  icono,
  variante = "verde",
  etiqueta = "Activo",
}: CardIndicadorProps) {
  const estilos = obtenerEstilosCard(variante);

  return (
    <article className="group relative overflow-hidden rounded-[25px] border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${estilos.fondoDecoracion}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${estilos.icono}`}
        >
          {icono}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${estilos.etiqueta}`}
        >
          {etiqueta}
        </span>
      </div>

      <p className="relative mt-5 text-sm font-bold text-slate-500">
        {titulo}
      </p>

      <h3 className="relative mt-2 text-3xl font-black text-slate-950">
        {valor}
      </h3>

      <p className="relative mt-2 text-xs leading-5 text-slate-400">
        {descripcion}
      </p>

      <div
        className={`relative mt-5 h-1 w-14 rounded-full transition-all group-hover:w-24 ${estilos.barra}`}
      />
    </article>
  );
}

function MiniIndicador({
  titulo,
  valor,
  icono,
  positivo = false,
}: {
  titulo: string;
  valor: number;
  icono: ReactNode;
  positivo?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          positivo
            ? "bg-emerald-100 text-emerald-700"
            : "bg-sky-100 text-sky-700"
        }`}
      >
        {icono}
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-950">
        {formatearNumero(valor)}
      </p>
    </div>
  );
}

function FilaEstado({
  texto,
  valor,
  total,
  clase,
}: {
  texto: string;
  valor: number;
  total: number;
  clase: string;
}) {
  const porcentaje =
    total > 0 ? (valor / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-600">
          {texto}
        </p>

        <p className="font-black text-slate-950">
          {valor}
        </p>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${clase}`}
          style={{
            width: `${Math.min(100, porcentaje)}%`,
          }}
        />
      </div>
    </div>
  );
}

function FilaReserva({
  reserva,
  eliminando,
  onEliminar,
}: {
  reserva: ReservaAdmin;
  eliminando: boolean;
  onEliminar: (id: string) => Promise<void>;
}) {
  return (
    <tr className="align-top transition hover:bg-emerald-50/40">
      <td className="px-6 py-5">
        <span className="inline-flex rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800">
          {reserva.codigoReserva || "SIN CÓDIGO"}
        </span>
      </td>

      <td className="px-6 py-5">
        <p className="font-black text-slate-900">
          {obtenerNombreUsuario(reserva)}
        </p>

        <p className="mt-1 max-w-52 truncate text-xs text-slate-400">
          {reserva.usuario?.email || "Sin correo"}
        </p>
      </td>

      <td className="px-6 py-5 font-semibold text-slate-700">
        {obtenerRuta(reserva)}
      </td>

      <td className="px-6 py-5 text-sm text-slate-600">
        <p className="font-bold">
          {formatearFechaViaje(reserva.viaje?.fecha)}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {reserva.viaje?.horaSalida || "Sin horario"}
        </p>
      </td>

      <td className="px-6 py-5">
        <div className="flex max-w-48 flex-wrap gap-2">
          {obtenerAsientos(reserva).map((asiento) => (
            <span
              key={asiento}
              className="inline-flex min-w-9 justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-700"
            >
              {asiento}
            </span>
          ))}
        </div>
      </td>

      <td className="px-6 py-5 font-black text-emerald-700">
        {formatearMontoReserva(reserva)}
      </td>

      <td className="px-6 py-5">
        <EstadoReserva estado={reserva.estado} />
      </td>

      <td className="px-6 py-5">
        <button
          type="button"
          onClick={() => void onEliminar(reserva.id)}
          disabled={eliminando}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {eliminando ? (
            <RefreshCw
              size={17}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={17} />
          )}

          Eliminar
        </button>
      </td>
    </tr>
  );
}

function TarjetaReserva({
  reserva,
  eliminando,
  onEliminar,
}: {
  reserva: ReservaAdmin;
  eliminando: boolean;
  onEliminar: (id: string) => Promise<void>;
}) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-slate-900">
            {obtenerNombreUsuario(reserva)}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {reserva.codigoReserva || "Sin código"}
          </p>
        </div>

        <EstadoReserva estado={reserva.estado} />
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
        <DatoReserva
          titulo="Ruta"
          valor={obtenerRuta(reserva)}
        />

        <DatoReserva
          titulo="Fecha"
          valor={formatearFechaViaje(
            reserva.viaje?.fecha,
          )}
        />

        <DatoReserva
          titulo="Asientos"
          valor={obtenerAsientos(reserva).join(", ")}
        />

        <DatoReserva
          titulo="Monto"
          valor={formatearMontoReserva(reserva)}
        />
      </div>

      <button
        type="button"
        onClick={() => void onEliminar(reserva.id)}
        disabled={eliminando}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
      >
        {eliminando ? (
          <RefreshCw
            size={17}
            className="animate-spin"
          />
        ) : (
          <Trash2 size={17} />
        )}

        Eliminar reserva
      </button>
    </article>
  );
}

function DatoReserva({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-bold text-slate-400">
        {titulo}
      </span>

      <span className="text-right font-black text-slate-700">
        {valor}
      </span>
    </div>
  );
}

function EstadoReserva({
  estado,
}: {
  estado?: string;
}) {
  const estadoNormalizado = String(
    estado || "SIN ESTADO",
  ).toUpperCase();

  const clases =
    estadoNormalizado === "CONFIRMADA"
      ? "bg-emerald-100 text-emerald-700"
      : estadoNormalizado === "PENDIENTE"
        ? "bg-amber-100 text-amber-700"
        : estadoNormalizado === "CANCELADA"
          ? "bg-red-100 text-red-700"
          : estadoNormalizado === "VENCIDA"
            ? "bg-slate-200 text-slate-700"
            : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${clases}`}
    >
      {estadoNormalizado}
    </span>
  );
}

function obtenerEstilosCard(
  variante: VarianteCard,
) {
  const estilos = {
    verde: {
      icono: "bg-emerald-100 text-emerald-700",
      etiqueta: "bg-emerald-50 text-emerald-700",
      fondoDecoracion: "bg-emerald-50",
      barra: "bg-emerald-600",
    },
    azul: {
      icono: "bg-sky-100 text-sky-700",
      etiqueta: "bg-sky-50 text-sky-700",
      fondoDecoracion: "bg-sky-50",
      barra: "bg-sky-600",
    },
    amarillo: {
      icono: "bg-amber-100 text-amber-700",
      etiqueta: "bg-amber-50 text-amber-700",
      fondoDecoracion: "bg-amber-50",
      barra: "bg-amber-500",
    },
    rojo: {
      icono: "bg-red-100 text-red-700",
      etiqueta: "bg-red-50 text-red-700",
      fondoDecoracion: "bg-red-50",
      barra: "bg-red-600",
    },
    morado: {
      icono: "bg-violet-100 text-violet-700",
      etiqueta: "bg-violet-50 text-violet-700",
      fondoDecoracion: "bg-violet-50",
      barra: "bg-violet-600",
    },
    gris: {
      icono: "bg-slate-100 text-slate-600",
      etiqueta: "bg-slate-50 text-slate-600",
      fondoDecoracion: "bg-slate-50",
      barra: "bg-slate-500",
    },
  };

  return estilos[variante];
}

function obtenerNombreUsuario(
  reserva: ReservaAdmin,
): string {
  const nombre =
    `${reserva.usuario?.nombre ?? ""} ${
      reserva.usuario?.apellido ?? ""
    }`.trim();

  return nombre || "Pasajero no identificado";
}

function obtenerRuta(
  reserva: ReservaAdmin,
): string {
  const origen =
    reserva.viaje?.ruta?.origen || "---";

  const destino =
    reserva.viaje?.ruta?.destino || "---";

  return `${origen} → ${destino}`;
}

function obtenerAsientos(
  reserva: ReservaAdmin,
): string[] {
  const detalles = Array.isArray(reserva.detalles)
    ? reserva.detalles
    : [];

  const asientos = detalles
    .map((detalle) =>
      String(detalle.asientoViaje?.numero ?? ""),
    )
    .filter(Boolean);

  return asientos.length > 0
    ? asientos
    : ["---"];
}

function formatearMontoReserva(
  reserva: ReservaAdmin,
): string {
  const montoDirecto = Number(reserva.montoTotal);

  if (Number.isFinite(montoDirecto) && montoDirecto > 0) {
    return formatearBolivianos(montoDirecto);
  }

  const totalDetalles = (
    Array.isArray(reserva.detalles)
      ? reserva.detalles
      : []
  ).reduce(
    (acumulado, detalle) =>
      acumulado + Number(detalle.precio || 0),
    0,
  );

  return formatearBolivianos(totalDetalles);
}

function formatearBolivianos(
  valor: number,
): string {
  return `Bs. ${Number(valor || 0).toLocaleString(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

function formatearNumero(
  valor: number,
): string {
  return Number(valor || 0).toLocaleString("es-BO");
}

function formatearFechaHora(
  fecha?: string,
): string {
  if (!fecha) {
    return "Sin actualización";
  }

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return "Sin actualización";
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fechaConvertida);
}

function formatearFechaViaje(
  fecha?: string,
): string {
  if (!fecha) {
    return "---";
  }

  const valorFecha = String(fecha).substring(0, 10);
  const fechaLocal = new Date(
    `${valorFecha}T00:00:00`,
  );

  if (Number.isNaN(fechaLocal.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fechaLocal);
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error
  ) {
    const mensaje = (
      error as {
        mensaje?: unknown;
      }
    ).mensaje;

    if (
      typeof mensaje === "string" &&
      mensaje.trim()
    ) {
      return mensaje;
    }
  }

  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "No se pudieron cargar los datos del panel administrativo.";
}

export default DashboardAdmin;
