import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BusFront,
  CalendarDays,
  CheckCircle2,
  FileDown,
  MapPin,
  QrCode,
  Route,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Ticket,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { obtenerReporteVentas } from "../../services/ventas.service";

type DetallePasajero = {
  id: string;
  codigo: string;
  pasajero: string;
  ci: string;
  asientos: Array<string | number>;
  cantidad: number;
  metodoPago: "EFECTIVO" | "QR";
  referencia: string | null;
  monto: number;
  fecha: string;
};

type Liquidacion = {
  viajeId: string;
  numeroFlota: string | null;
  placa: string;
  vehiculo: string;
  rutaId: string | null;
  origen: string;
  destino: string;
  fecha: string;
  horaSalida: string;
  precioUnitario: number;
  capacidad: number;
  efectivo: {
    cantidad: number;
    monto: number;
  };
  qr: {
    cantidad: number;
    monto: number;
  };
  pendientes: number;
  disponibles: number;
  totalVendido: number;
  totalRecaudado: number;
  asientosContabilizados: number;
  diferenciaCapacidad: number;
  cuadreCorrecto: boolean;
  detallesPasajeros: DetallePasajero[];
};

type ReporteVentas = {
  resumen?: {
    totalVentas?: number;
    totalPasajes?: number;
    totalRecaudado?: number;
    totalEfectivo?: number;
    totalQr?: number;
  };
  liquidaciones?: Liquidacion[];
};

type Resumen = {
  totalPasajes: number;
  totalRecaudado: number;
  totalEfectivo: number;
  totalQr: number;
};

const RESUMEN_VACIO: Resumen = {
  totalPasajes: 0,
  totalRecaudado: 0,
  totalEfectivo: 0,
  totalQr: 0,
};

const FECHA_ACTUAL = obtenerFechaActual();

function Reportes() {
  const [reporte, setReporte] = useState<ReporteVentas>({
    liquidaciones: [],
  });
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState(FECHA_ACTUAL);
  const [fechaHasta, setFechaHasta] = useState(FECHA_ACTUAL);
  const [rutaId, setRutaId] = useState("");
  const [flota, setFlota] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState("");
  const [liquidacionDetalle, setLiquidacionDetalle] =
    useState<Liquidacion | null>(null);

  const cargarReporte = async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargando(true);
    }

    setMensaje("");

    try {
      const respuesta = (await obtenerReporteVentas()) as ReporteVentas;

      setReporte({
        ...respuesta,
        liquidaciones: Array.isArray(respuesta.liquidaciones)
          ? respuesta.liquidaciones
          : [],
      });
      setUltimaActualizacion(new Date().toLocaleString("es-BO"));
    } catch (error: unknown) {
      setMensaje(obtenerMensajeError(error));

      if (mostrarCarga) {
        setReporte({ liquidaciones: [] });
      }
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  };

  useEffect(() => {
    void cargarReporte();

    const intervalo = window.setInterval(() => {
      void cargarReporte(false);
    }, 30_000);

    return () => window.clearInterval(intervalo);
  }, []);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
    setRutaId("");
    setFlota("");
  };

  const mostrarSalidasDeHoy = () => {
    const hoy = obtenerFechaActual();

    setBusqueda("");
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    setRutaId("");
    setFlota("");
  };

  const liquidaciones = useMemo(
    () =>
      (reporte.liquidaciones || []).filter((item) => {
        const fecha = String(item.fecha || "").substring(0, 10);
        const texto = busqueda.trim().toLowerCase();
        const contenido = `${item.numeroFlota || ""} ${item.placa} ${
          item.vehiculo
        } ${item.origen} ${item.destino}`.toLowerCase();

        return (
          (!fechaDesde || fecha >= fechaDesde) &&
          (!fechaHasta || fecha <= fechaHasta) &&
          (!rutaId || item.rutaId === rutaId) &&
          (!flota || obtenerClaveFlota(item) === flota) &&
          (!texto || contenido.includes(texto))
        );
      }),
    [reporte.liquidaciones, busqueda, fechaDesde, fechaHasta, rutaId, flota],
  );

  const resumen = useMemo(
    () =>
      liquidaciones.reduce<Resumen>(
        (total, item) => ({
          totalPasajes: total.totalPasajes + Number(item.totalVendido || 0),
          totalRecaudado:
            total.totalRecaudado + Number(item.totalRecaudado || 0),
          totalEfectivo:
            total.totalEfectivo + Number(item.efectivo?.monto || 0),
          totalQr: total.totalQr + Number(item.qr?.monto || 0),
        }),
        RESUMEN_VACIO,
      ),
    [liquidaciones],
  );

  const rutas = useMemo(() => {
    const mapa = new Map<string, string>();

    for (const item of reporte.liquidaciones || []) {
      if (item.rutaId) {
        mapa.set(item.rutaId, `${item.origen} → ${item.destino}`);
      }
    }

    return Array.from(mapa, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }, [reporte.liquidaciones]);

  const flotas = useMemo(() => {
    const mapa = new Map<string, string>();

    for (const item of reporte.liquidaciones || []) {
      mapa.set(obtenerClaveFlota(item), obtenerNombreFlota(item));
    }

    return Array.from(mapa, ([id, nombre]) => ({ id, nombre })).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, undefined, { numeric: true }),
    );
  }, [reporte.liquidaciones]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5faf7] text-slate-900">
      <div className="pointer-events-none absolute -left-24 top-[720px] h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-[560px] h-80 w-80 rounded-full bg-lime-100/50 blur-3xl" />

      <section className="relative mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 px-6 pb-28 pt-7 text-white shadow-2xl shadow-emerald-950/20 sm:px-9 sm:pb-32 sm:pt-9 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1.2px,transparent_1.2px)] [background-size:22px_22px]" />
          <div className="pointer-events-none absolute -right-20 -top-32 h-[430px] w-[430px] rounded-full border-[34px] border-white/10" />
          <div className="pointer-events-none absolute -right-6 -top-20 h-[330px] w-[330px] rounded-full border-[22px] border-lime-300/25" />
          <div className="pointer-events-none absolute right-[22%] top-8 h-5 w-5 rounded-full border-2 border-emerald-200/50" />
          <div className="pointer-events-none absolute right-[31%] top-28 h-3 w-3 rounded-full bg-lime-300/70" />

          <div className="pointer-events-none absolute -bottom-24 right-[-4%] h-52 w-[58%] rotate-[-7deg] rounded-[50%] border-[18px] border-white/90" />
          <div className="pointer-events-none absolute -bottom-20 right-[-5%] h-52 w-[58%] rotate-[-7deg] rounded-[50%] border-[5px] border-dashed border-emerald-200/90" />
          <div className="pointer-events-none absolute -bottom-32 right-[-6%] h-52 w-[60%] rotate-[-7deg] rounded-[50%] border-[7px] border-lime-300/80" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
              Administración
                </p>
                <Sparkles size={18} className="text-lime-300" />
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Reportes de ventas
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium text-emerald-50/90 sm:text-base">
                Liquidación por flota, salida y método de pago.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white px-5 py-3.5 font-black text-emerald-800 shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                <FileDown size={20} />
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={() => void cargarReporte()}
                disabled={cargando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/50 bg-emerald-600/70 px-5 py-3.5 font-black text-white shadow-lg shadow-emerald-950/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={20}
                  className={cargando ? "animate-spin" : ""}
                />
                {cargando ? "Actualizando..." : "Actualizar reporte"}
              </button>
            </div>
          </div>
        </header>

        <section className="relative z-20 mx-3 -mt-20 rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-emerald-950/10 backdrop-blur sm:mx-7 sm:p-6 lg:mx-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CampoBusqueda valor={busqueda} onCambiar={setBusqueda} />
            <CampoFecha
              etiqueta="Desde"
              valor={fechaDesde}
              onCambiar={setFechaDesde}
            />
            <CampoFecha
              etiqueta="Hasta"
              valor={fechaHasta}
              onCambiar={setFechaHasta}
            />
            <div className="grid grid-cols-2 gap-3">
              <Selector
                etiqueta="Ruta"
                valor={rutaId}
                onCambiar={setRutaId}
                opciones={rutas}
                textoTodos="Todas"
              />
              <Selector
                etiqueta="Flota"
                valor={flota}
                onCambiar={setFlota}
                opciones={flotas}
                textoTodos="Todas"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <RefreshCw size={14} />
              </span>
              El reporte se actualiza automáticamente cada 30 segundos.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={mostrarSalidasDeHoy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              >
                <CalendarDays size={18} />
                Ver salidas de hoy
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                <RotateCcw size={18} />
                Limpiar filtros
              </button>
            </div>
          </div>
        </section>

        {mensaje && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
            {mensaje}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TarjetaResumen
            icono={<Wallet size={27} />}
            titulo="Total recaudado"
            valor={formatearMonto(resumen.totalRecaudado)}
            color="emerald"
          />
          <TarjetaResumen
            icono={<Ticket size={27} />}
            titulo="Pasajes vendidos"
            valor={String(resumen.totalPasajes)}
            color="blue"
          />
          <TarjetaResumen
            icono={<Banknote size={27} />}
            titulo="Efectivo"
            valor={formatearMonto(resumen.totalEfectivo)}
            color="green"
          />
          <TarjetaResumen
            icono={<QrCode size={27} />}
            titulo="QR"
            valor={formatearMonto(resumen.totalQr)}
            color="purple"
          />
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Control de ingresos y asientos
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Liquidación por flota y salida
              </h2>
            </div>
            <p className="text-sm font-bold text-slate-500">
              {liquidaciones.length} salida
              {liquidaciones.length === 1 ? "" : "s"} encontrada
              {liquidaciones.length === 1 ? "" : "s"}
            </p>
          </div>

          {cargando ? (
            <EstadoReporte
              icono={<RefreshCw size={34} className="animate-spin" />}
              titulo="Calculando liquidaciones"
              descripcion="Estamos consolidando ventas, pagos QR y asientos."
            />
          ) : liquidaciones.length === 0 ? (
            <EstadoReporte
              icono={<BusFront size={34} />}
              titulo="No hay resultados"
              descripcion="Prueba cambiando las fechas, la ruta o la flota seleccionada."
              decorado
            />
          ) : (
            <div className="mt-5 space-y-5">
              {liquidaciones.map((item) => (
                <TarjetaLiquidacion
                  key={item.viajeId}
                  item={item}
                  onVerDetalle={() => setLiquidacionDetalle(item)}
                />
              ))}
            </div>
          )}
        </section>

        {ultimaActualizacion && (
          <p className="mt-6 text-right text-xs text-slate-400">
            Última actualización: {ultimaActualizacion}
          </p>
        )}
      </section>

      {liquidacionDetalle && (
        <ModalPasajeros
          liquidacion={liquidacionDetalle}
          onCerrar={() => setLiquidacionDetalle(null)}
        />
      )}
    </main>
  );
}

function TarjetaLiquidacion({
  item,
  onVerDetalle,
}: {
  item: Liquidacion;
  onVerDetalle: () => void;
}) {
  const capacidad = Math.max(1, Number(item.capacidad || 0));
  const porcentaje = (cantidad: number) =>
    `${Math.max(0, (Number(cantidad || 0) / capacidad) * 100)}%`;

  return (
    <article className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-lg shadow-emerald-950/5">
      <div className="grid gap-6 p-5 lg:grid-cols-[250px_1fr_230px] lg:items-center lg:p-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <BusFront size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black">
                {obtenerNombreFlota(item)}
              </h3>
              <p className="text-sm font-bold text-slate-500">
                Placa {item.placa}
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 font-black">
            <MapPin size={18} className="text-emerald-600" />
            {item.origen} → {item.destino}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={17} />
            {formatearFecha(item.fecha)} · {item.horaSalida}
          </p>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Metrica titulo="Capacidad" valor={item.capacidad} />
            <Metrica
              titulo="Efectivo"
              valor={`${item.efectivo.cantidad} · ${formatearMonto(
                item.efectivo.monto,
              )}`}
              color="text-emerald-700"
            />
            <Metrica
              titulo="QR"
              valor={`${item.qr.cantidad} · ${formatearMonto(item.qr.monto)}`}
              color="text-purple-700"
            />
            <Metrica
              titulo="Pendientes"
              valor={item.pendientes}
              color="text-amber-600"
            />
            <Metrica titulo="Disponibles" valor={item.disponibles} />
            <Metrica
              titulo="Total vendido"
              valor={item.totalVendido}
              color="text-emerald-700"
            />
          </div>

          <div className="mt-5 flex h-9 overflow-hidden rounded-xl bg-slate-200 text-sm font-black text-white">
            <Barra cantidad={item.efectivo.cantidad} ancho={porcentaje(item.efectivo.cantidad)} clase="bg-emerald-700" />
            <Barra cantidad={item.qr.cantidad} ancho={porcentaje(item.qr.cantidad)} clase="bg-purple-600" />
            <Barra cantidad={item.pendientes} ancho={porcentaje(item.pendientes)} clase="bg-amber-500" />
            <Barra cantidad={item.disponibles} ancho={porcentaje(item.disponibles)} clase="bg-slate-300 text-slate-700" />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
            <Leyenda clase="bg-emerald-700" texto={`Efectivo (${item.efectivo.cantidad})`} />
            <Leyenda clase="bg-purple-600" texto={`QR (${item.qr.cantidad})`} />
            <Leyenda clase="bg-amber-500" texto={`Pendientes (${item.pendientes})`} />
            <Leyenda clase="bg-slate-300" texto={`Disponibles (${item.disponibles})`} />
          </div>

          <div
            className={`mt-4 flex items-center gap-2 text-xs font-black ${
              item.cuadreCorrecto ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {item.cuadreCorrecto ? (
              <CheckCircle2 size={17} />
            ) : (
              <AlertTriangle size={17} />
            )}
            {item.cuadreCorrecto
              ? "La cantidad de asientos coincide con la capacidad."
              : `Revisar diferencia de ${Math.abs(item.diferenciaCapacidad)} asiento(s).`}
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-5 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total recaudado
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-800">
            {formatearMonto(item.totalRecaudado)}
          </p>
          <button
            type="button"
            onClick={onVerDetalle}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            <Users size={18} />
            Ver detalle de pasajeros
          </button>
        </div>
      </div>
    </article>
  );
}

function ModalPasajeros({
  liquidacion,
  onCerrar,
}: {
  liquidacion: Liquidacion;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-5 border-b border-emerald-100 bg-emerald-50 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
              {obtenerNombreFlota(liquidacion)} · {liquidacion.placa}
            </p>
            <h2 className="mt-1 text-2xl font-black">Detalle de pasajeros</h2>
            <p className="mt-1 text-sm text-slate-500">
              {liquidacion.origen} → {liquidacion.destino} · {formatearFecha(liquidacion.fecha)} · {liquidacion.horaSalida}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600"
          >
            <X size={22} />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-auto p-6">
          {liquidacion.detallesPasajeros?.length ? (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4">Pasajero</th>
                  <th className="p-4">CI</th>
                  <th className="p-4">Asientos</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Referencia</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {liquidacion.detallesPasajeros.map((detalle) => (
                  <tr key={detalle.id} className="border-b border-slate-100">
                    <td className="p-4 font-black">{detalle.pasajero}</td>
                    <td className="p-4">{detalle.ci}</td>
                    <td className="p-4 font-black">
                      {detalle.asientos?.length
                        ? detalle.asientos.join(", ")
                        : `${detalle.cantidad} asiento(s)`}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ${
                          detalle.metodoPago === "QR"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {detalle.metodoPago}
                      </span>
                    </td>
                    <td className="p-4">{detalle.referencia || "---"}</td>
                    <td className="p-4 font-black text-emerald-700">
                      {formatearMonto(detalle.monto)}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {formatearFechaHora(detalle.fecha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EstadoReporte
              icono={<Users size={34} />}
              titulo="No hay pasajeros registrados"
              descripcion="Todavía no existen pagos asociados a esta salida."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function CampoBusqueda({
  valor,
  onCambiar,
}: {
  valor: string;
  onCambiar: (valor: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
        Buscar
      </span>
      <div className="relative mt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value)}
          placeholder="Salida, ruta, placa o flota..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
    </label>
  );
}

function CampoFecha({
  etiqueta,
  valor,
  onCambiar,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
        {etiqueta}
      </span>
      <input
        type="date"
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function Selector({
  etiqueta,
  valor,
  onCambiar,
  opciones,
  textoTodos,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  opciones: Array<{ id: string; nombre: string }>;
  textoTodos: string;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
        {etiqueta}
      </span>
      <select
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">{textoTodos}</option>
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>
            {opcion.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

function TarjetaResumen({
  icono,
  titulo,
  valor,
  color,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  color: "emerald" | "blue" | "green" | "purple";
}) {
  const estilos = {
    emerald: {
      icono: "bg-emerald-100 text-emerald-700",
      borde: "before:bg-emerald-600",
      marca: "text-emerald-100",
    },
    blue: {
      icono: "bg-blue-100 text-blue-700",
      borde: "before:bg-blue-500",
      marca: "text-blue-100",
    },
    green: {
      icono: "bg-green-100 text-green-700",
      borde: "before:bg-green-500",
      marca: "text-green-100",
    },
    purple: {
      icono: "bg-purple-100 text-purple-700",
      borde: "before:bg-purple-500",
      marca: "text-purple-100",
    },
  }[color];

  return (
    <article
      className={`relative flex min-h-28 items-center gap-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 before:absolute before:inset-x-0 before:top-0 before:h-1 ${estilos.borde}`}
    >
      <div
        className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${estilos.icono}`}
      >
        {icono}
      </div>
      <div className="relative z-10">
        <p className="text-sm text-slate-500">{titulo}</p>
        <p className="mt-1 text-2xl font-black">{valor}</p>
      </div>
      <div
        className={`pointer-events-none absolute -bottom-6 -right-4 opacity-70 ${estilos.marca}`}
      >
        {color === "emerald" ? (
          <Wallet size={82} strokeWidth={1.4} />
        ) : color === "blue" ? (
          <Users size={82} strokeWidth={1.4} />
        ) : color === "green" ? (
          <Banknote size={82} strokeWidth={1.4} />
        ) : (
          <QrCode size={82} strokeWidth={1.4} />
        )}
      </div>
    </article>
  );
}

function Metrica({
  titulo,
  valor,
  color = "text-slate-900",
}: {
  titulo: string;
  valor: string | number;
  color?: string;
}) {
  return (
    <div className="border-l border-slate-200 pl-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>
      <p className={`mt-2 break-words text-sm font-black ${color}`}>{valor}</p>
    </div>
  );
}

function Barra({
  cantidad,
  ancho,
  clase,
}: {
  cantidad: number;
  ancho: string;
  clase: string;
}) {
  if (!cantidad) return null;

  return (
    <span className={`flex items-center justify-center ${clase}`} style={{ width: ancho }}>
      {cantidad}
    </span>
  );
}

function Leyenda({ clase, texto }: { clase: string; texto: string }) {
  return (
    <span className="flex items-center gap-2">
      <i className={`h-3 w-3 rounded-sm ${clase}`} />
      {texto}
    </span>
  );
}

function EstadoReporte({
  icono,
  titulo,
  descripcion,
  decorado = false,
}: {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  decorado?: boolean;
}) {
  if (decorado) {
    return (
      <div className="relative mt-5 min-h-[300px] overflow-hidden rounded-[30px] border border-dashed border-emerald-300 bg-gradient-to-br from-white via-emerald-50/40 to-white px-6 py-12">
        <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full border-[22px] border-emerald-100/80" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full border-[24px] border-lime-100/80" />
        <div className="pointer-events-none absolute left-0 top-1/2 w-[42%] -translate-y-1/2 border-t-2 border-dashed border-emerald-200" />
        <div className="pointer-events-none absolute right-0 top-1/2 w-[42%] -translate-y-1/2 border-t-2 border-dashed border-emerald-200" />

        <div className="pointer-events-none absolute left-[8%] top-[44%] text-emerald-500">
          <MapPin size={34} fill="currentColor" className="text-emerald-100" />
        </div>
        <div className="pointer-events-none absolute right-[8%] top-[44%] text-emerald-500">
          <MapPin size={34} fill="currentColor" className="text-emerald-100" />
        </div>
        <Sparkles className="pointer-events-none absolute left-[18%] top-[25%] text-emerald-300" size={20} />
        <Zap className="pointer-events-none absolute right-[20%] top-[24%] text-lime-400" size={23} fill="currentColor" />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-emerald-100 to-lime-50 text-emerald-700 shadow-xl shadow-emerald-900/10">
            <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-md">
              <Route size={20} />
            </div>
            <BusFront size={58} strokeWidth={1.8} />
          </div>
          <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            {icono}
          </div>
          <h3 className="mt-4 text-xl font-black">{titulo}</h3>
          <p className="mt-2 text-sm text-slate-500">{descripcion}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[26px] border border-dashed border-emerald-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {icono}
      </div>
      <h3 className="mt-4 text-xl font-black">{titulo}</h3>
      <p className="mt-2 text-sm text-slate-500">{descripcion}</p>
    </div>
  );
}

function obtenerNombreFlota(item: Liquidacion): string {
  return item.numeroFlota ? `FLOTA ${item.numeroFlota}` : `FLOTA ${item.placa}`;
}

function obtenerClaveFlota(item: Liquidacion): string {
  return String(item.numeroFlota || item.placa || item.viajeId);
}

function formatearMonto(valor: number): string {
  return `Bs. ${Number(valor || 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatearFecha(fecha: string): string {
  if (!fecha) return "---";

  const [anio, mes, dia] = fecha.substring(0, 10).split("-").map(Number);
  const valor = new Date(anio, mes - 1, dia);

  return Number.isNaN(valor.getTime())
    ? fecha
    : new Intl.DateTimeFormat("es-BO").format(valor);
}

function formatearFechaHora(fecha: string): string {
  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? "---"
    : new Intl.DateTimeFormat("es-BO", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(valor);
}

function obtenerFechaActual(): string {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerMensajeError(error: unknown): string {
  const errorHttp = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const mensaje = errorHttp.response?.data?.message;

  if (Array.isArray(mensaje)) return mensaje.join(", ");
  if (typeof mensaje === "string" && mensaje.trim()) return mensaje;
  if (typeof errorHttp.message === "string" && errorHttp.message.trim()) {
    return errorHttp.message;
  }

  return "No se pudo cargar el reporte de ventas.";
}

export default Reportes;
