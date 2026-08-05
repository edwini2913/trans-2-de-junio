import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  BusFront,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  Send,
  Ticket,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import {
  listarRutas,
  listarVehiculos,
} from "../../services/catalogos.service";

import type {
  Ruta,
  Vehiculo,
} from "../../services/catalogos.service";

import {
  crearViaje,
} from "../../services/viajes.service";

import type {
  CrearViajePayload,
} from "../../services/viajes.service";

type TipoMensaje =
  | "exito"
  | "error"
  | "informacion";

interface Mensaje {
  tipo: TipoMensaje;
  texto: string;
}

const FORMULARIO_INICIAL: CrearViajePayload = {
  rutaId: "",
  vehiculoId: "",
  fecha: "",
  horaSalida: "",
  precio: 0,
};

function obtenerFechaActual(): string {
  const fechaActual = new Date();

  const anio =
    fechaActual.getFullYear();

  const mes = String(
    fechaActual.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    fechaActual.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(
  fecha: string,
): string {
  if (!fecha) {
    return "Sin seleccionar";
  }

  const [anio, mes, dia] =
    fecha.split("-");

  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia}/${mes}/${anio}`;
}

function formatearPrecio(
  precio: number,
): string {
  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(precio);
}

export default function ViajesRutas() {
  const navigate = useNavigate();

  const [rutas, setRutas] =
    useState<Ruta[]>([]);

  const [vehiculos, setVehiculos] =
    useState<Vehiculo[]>([]);

  const [formulario, setFormulario] =
    useState<CrearViajePayload>(
      FORMULARIO_INICIAL,
    );

  const [
    cargandoDatos,
    setCargandoDatos,
  ] = useState(true);

  const [publicando, setPublicando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState<Mensaje | null>(null);

  const [viajeCreado, setViajeCreado] =
    useState(false);

  const fechaMinima = useMemo(
    () => obtenerFechaActual(),
    [],
  );

  const rutaSeleccionada = useMemo(
    () =>
      rutas.find(
        (ruta) =>
          String(ruta.id) ===
          String(formulario.rutaId),
      ) ?? null,
    [formulario.rutaId, rutas],
  );

  const vehiculoSeleccionado = useMemo(
    () =>
      vehiculos.find(
        (vehiculo) =>
          String(vehiculo.id) ===
          String(formulario.vehiculoId),
      ) ?? null,
    [
      formulario.vehiculoId,
      vehiculos,
    ],
  );

  const formularioCompleto = Boolean(
    formulario.rutaId &&
      formulario.vehiculoId &&
      formulario.fecha &&
      formulario.horaSalida &&
      formulario.precio > 0,
  );

  const pasoActual = useMemo(() => {
    if (!formulario.rutaId) {
      return 1;
    }

    if (!formulario.vehiculoId) {
      return 2;
    }

    if (
      !formulario.fecha ||
      !formulario.horaSalida ||
      formulario.precio <= 0
    ) {
      return 3;
    }

    return 4;
  }, [formulario]);

  async function cargarCatalogos() {
    try {
      setCargandoDatos(true);
      setMensaje(null);

      const [
        respuestaRutas,
        respuestaVehiculos,
      ] = await Promise.all([
        listarRutas(),
        listarVehiculos(),
      ]);

      const listaRutas = Array.isArray(
        respuestaRutas,
      )
        ? respuestaRutas
        : [];

      const listaVehiculos = Array.isArray(
        respuestaVehiculos,
      )
        ? respuestaVehiculos
        : [];

      setRutas(
        listaRutas.filter(
          (ruta) => ruta.estado,
        ),
      );

      setVehiculos(
        listaVehiculos.filter(
          (vehiculo) =>
            vehiculo.estado,
        ),
      );
    } catch (error) {
      setRutas([]);
      setVehiculos([]);

      setMensaje({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las rutas y los vehículos.",
      });
    } finally {
      setCargandoDatos(false);
    }
  }

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  useEffect(() => {
    if (!mensaje) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        setMensaje(null);
      }, 7000);

    return () => {
      window.clearTimeout(
        temporizador,
      );
    };
  }, [mensaje]);

  function manejarCambioSelect(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const { name, value } =
      event.target;

    setViajeCreado(false);

    setFormulario(
      (estadoAnterior) => ({
        ...estadoAnterior,
        [name]: value,
      }),
    );
  }

  function manejarCambioInput(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } =
      event.target;

    setViajeCreado(false);

    setFormulario(
      (estadoAnterior) => ({
        ...estadoAnterior,
        [name]:
          name === "precio"
            ? Number(value)
            : value,
      }),
    );
  }

  function validarFormulario():
    | string
    | null {
    if (!formulario.rutaId) {
      return "Debe seleccionar una ruta.";
    }

    if (!formulario.vehiculoId) {
      return "Debe seleccionar un vehículo.";
    }

    if (!formulario.fecha) {
      return "Debe seleccionar la fecha del viaje.";
    }

    if (
      formulario.fecha < fechaMinima
    ) {
      return "La fecha del viaje no puede ser anterior a la fecha actual.";
    }

    if (!formulario.horaSalida) {
      return "Debe seleccionar la hora de salida.";
    }

    if (
      !Number.isFinite(
        formulario.precio,
      ) ||
      formulario.precio <= 0
    ) {
      return "El precio debe ser mayor que cero.";
    }

    return null;
  }

  async function manejarPublicar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensaje(null);
    setViajeCreado(false);

    const errorValidacion =
      validarFormulario();

    if (errorValidacion) {
      setMensaje({
        tipo: "error",
        texto: errorValidacion,
      });

      return;
    }

    const confirmar =
      window.confirm(
        [
          "¿Deseas publicar este viaje?",
          "",
          `Ruta: ${
            rutaSeleccionada?.origen ??
            ""
          } → ${
            rutaSeleccionada?.destino ??
            ""
          }`,
          `Fecha: ${formatearFecha(
            formulario.fecha,
          )}`,
          `Hora: ${
            formulario.horaSalida
          }`,
          `Precio: Bs ${formatearPrecio(
            formulario.precio,
          )}`,
          `Vehículo: ${
            vehiculoSeleccionado?.placa ??
            ""
          }`,
          `Asientos: ${
            vehiculoSeleccionado?.capacidad ??
            0
          }`,
        ].join("\n"),
      );

    if (!confirmar) {
      return;
    }

    try {
      setPublicando(true);

      const viaje =
        await crearViaje({
          rutaId: formulario.rutaId,
          vehiculoId:
            formulario.vehiculoId,
          fecha: formulario.fecha,
          horaSalida:
            formulario.horaSalida,
          precio: Number(
            formulario.precio,
          ),
        });

      const cantidadAsientos =
        viaje.asientosDisponibles ??
        vehiculoSeleccionado?.capacidad ??
        0;

      setViajeCreado(true);

      setMensaje({
        tipo: "exito",
        texto: `Viaje publicado correctamente. Se generaron ${cantidadAsientos} asientos y ya está disponible para los pasajeros.`,
      });

      setFormulario(
        FORMULARIO_INICIAL,
      );
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo publicar el viaje.",
      });
    } finally {
      setPublicando(false);
    }
  }

  function limpiarFormulario() {
    setFormulario(
      FORMULARIO_INICIAL,
    );

    setMensaje(null);
    setViajeCreado(false);
  }

  if (cargandoDatos) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4fbf7] px-5">
        <div className="rounded-3xl border border-emerald-100 bg-white px-10 py-9 text-center shadow-xl shadow-emerald-900/10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <Loader2
              size={34}
              className="animate-spin text-emerald-700"
            />
          </div>

          <p className="mt-5 font-black text-slate-900">
            Cargando viajes y rutas
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Preparando rutas y vehículos...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4fbf7] text-slate-900">
      <header className="border-b border-emerald-100 bg-white px-4 py-4 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                navigate("/admin")
              }
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
              title="Volver al panel"
            >
              <ArrowLeft size={21} />
            </button>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-700/20">
              <CalendarDays size={27} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Administración
              </p>

              <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
                Viajes y rutas
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Programa nuevas salidas para los pasajeros.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/viajes-rutas/rutas"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              <RouteIcon size={18} />
              Administrar rutas
            </Link>

            <button
              type="button"
              onClick={() =>
                void cargarCatalogos()
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800"
            >
              <RefreshCw size={18} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-7 md:px-8">
        <div className="relative mb-7 overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[35px] border-white/10" />
          <div className="absolute bottom-0 right-44 h-24 w-24 rounded-full bg-lime-300/10" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                Centro de programación
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Programar nuevo viaje
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90">
                Selecciona la ruta, asigna un vehículo y define la fecha,
                hora y precio del pasaje.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CabeceraDato
                icono={<RouteIcon size={19} />}
                etiqueta="Rutas activas"
                valor={String(rutas.length)}
              />

              <CabeceraDato
                icono={<BusFront size={19} />}
                etiqueta="Vehículos"
                valor={String(
                  vehiculos.length,
                )}
              />

              <CabeceraDato
                icono={<CheckCircle2 size={19} />}
                etiqueta="Estado"
                valor="Disponible"
                claseAdicional="col-span-2 sm:col-span-1"
              />
            </div>
          </div>
        </div>

        {mensaje && (
          <div
            className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-sm ${
              mensaje.tipo === "exito"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : mensaje.tipo === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-sky-200 bg-sky-50 text-sky-700"
            }`}
          >
            <div className="flex items-start gap-3">
              {mensaje.tipo === "exito" ? (
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <AlertCircle
                  size={22}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p className="text-sm font-bold leading-6">
                {mensaje.texto}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMensaje(null)
              }
              className="shrink-0 opacity-70 transition hover:opacity-100"
              aria-label="Cerrar mensaje"
            >
              <X size={19} />
            </button>
          </div>
        )}
                <section className="mb-6 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-900/5">
          <div className="grid gap-3 md:grid-cols-4">
            <IndicadorPaso
              numero={1}
              titulo="Ruta"
              descripcion="Selecciona el recorrido"
              activo={pasoActual === 1}
              completado={pasoActual > 1}
            />

            <IndicadorPaso
              numero={2}
              titulo="Vehículo"
              descripcion="Asigna el transporte"
              activo={pasoActual === 2}
              completado={pasoActual > 2}
            />

            <IndicadorPaso
              numero={3}
              titulo="Salida"
              descripcion="Fecha, hora y precio"
              activo={pasoActual === 3}
              completado={pasoActual > 3}
            />

            <IndicadorPaso
              numero={4}
              titulo="Publicar"
              descripcion="Revisa la información"
              activo={pasoActual === 4}
              completado={viajeCreado}
            />
          </div>
        </section>

        <form onSubmit={manejarPublicar}>
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1fr_0.95fr]">
            <PanelPaso
              numero={1}
              titulo="Seleccionar ruta"
              descripcion="Elige el origen y destino."
              icono={<MapPin size={21} />}
            >
              <label
                htmlFor="rutaId"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                Ruta disponible
              </label>

              <select
                id="rutaId"
                name="rutaId"
                value={formulario.rutaId}
                onChange={manejarCambioSelect}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">
                  Seleccione una ruta
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

              {rutas.length === 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    No existen rutas activas.
                  </p>
                </div>
              )}

              <Link
                to="/admin/viajes-rutas/rutas"
                className="mt-4 inline-flex items-center gap-2 text-sm font-black text-emerald-700 transition hover:text-emerald-900"
              >
                <RouteIcon size={17} />
                Registrar nueva ruta
              </Link>

              <div className="mt-6 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <DatoResumen
                  icono={<MapPin size={18} />}
                  etiqueta="Origen"
                  valor={
                    rutaSeleccionada?.origen ??
                    "No seleccionado"
                  }
                />

                <DatoResumen
                  icono={
                    <RouteIcon size={18} />
                  }
                  etiqueta="Destino"
                  valor={
                    rutaSeleccionada?.destino ??
                    "No seleccionado"
                  }
                />

                <DatoResumen
                  icono={
                    <RouteIcon size={18} />
                  }
                  etiqueta="Distancia"
                  valor={
                    rutaSeleccionada?.distanciaKm
                      ? `${rutaSeleccionada.distanciaKm} km`
                      : "No especificada"
                  }
                />
              </div>
            </PanelPaso>

            <PanelPaso
              numero={2}
              titulo="Asignar vehículo"
              descripcion="Selecciona el transporte."
              icono={<BusFront size={21} />}
            >
              <label
                htmlFor="vehiculoId"
                className="mb-2 block text-sm font-black text-slate-700"
              >
                Vehículo disponible
              </label>

              <select
                id="vehiculoId"
                name="vehiculoId"
                value={
                  formulario.vehiculoId
                }
                onChange={
                  manejarCambioSelect
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="">
                  Seleccione un vehículo
                </option>

                {vehiculos.map(
                  (vehiculo) => (
                    <option
                      key={vehiculo.id}
                      value={vehiculo.id}
                    >
                      {vehiculo.placa} —{" "}
                      {vehiculo.marca}{" "}
                      {vehiculo.modelo} —{" "}
                      {vehiculo.capacidad}{" "}
                      asientos
                    </option>
                  ),
                )}
              </select>

              {vehiculos.length === 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    No existen vehículos activos.
                  </p>
                </div>
              )}

              <div className="relative mt-6 flex min-h-36 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/40" />

                <div className="relative text-center">
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl shadow-md ${
                      vehiculoSeleccionado
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-slate-300"
                    }`}
                  >
                    <BusFront size={46} />
                  </div>

                  <p className="mt-3 text-xs font-black uppercase tracking-widest text-emerald-700">
                    Vehículo asignado
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <DatoResumen
                  icono={<Ticket size={18} />}
                  etiqueta="Placa"
                  valor={
                    vehiculoSeleccionado?.placa ??
                    "No seleccionado"
                  }
                />

                <DatoResumen
                  icono={
                    <BusFront size={18} />
                  }
                  etiqueta="Vehículo"
                  valor={
                    vehiculoSeleccionado
                      ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`
                      : "No seleccionado"
                  }
                />

                <DatoResumen
                  icono={<Users size={18} />}
                  etiqueta="Capacidad"
                  valor={
                    vehiculoSeleccionado
                      ? `${vehiculoSeleccionado.capacidad} pasajeros`
                      : "No seleccionada"
                  }
                />
              </div>
            </PanelPaso>

            <PanelPaso
              numero={3}
              titulo="Programar salida"
              descripcion="Define fecha, hora y precio."
              icono={
                <CalendarDays size={21} />
              }
            >
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="fecha"
                    className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"
                  >
                    <CalendarDays
                      size={17}
                      className="text-emerald-700"
                    />
                    Fecha de salida
                  </label>

                  <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    min={fechaMinima}
                    value={formulario.fecha}
                    onChange={
                      manejarCambioInput
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="horaSalida"
                    className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"
                  >
                    <Clock3
                      size={17}
                      className="text-emerald-700"
                    />
                    Hora de salida
                  </label>

                  <input
                    id="horaSalida"
                    name="horaSalida"
                    type="time"
                    value={
                      formulario.horaSalida
                    }
                    onChange={
                      manejarCambioInput
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="precio"
                    className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"
                  >
                    <WalletCards
                      size={17}
                      className="text-emerald-700"
                    />
                    Precio del pasaje
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-700">
                      Bs
                    </span>

                    <input
                      id="precio"
                      name="precio"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        formulario.precio ||
                        ""
                      }
                      onChange={
                        manejarCambioInput
                      }
                      placeholder="Ejemplo: 50"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                  <Users size={18} />
                </div>

                <p className="text-sm leading-6 text-emerald-800">
                  Los asientos se generarán
                  automáticamente según la
                  capacidad del vehículo.
                </p>
              </div>
            </PanelPaso>

            <PanelPaso
              numero={4}
              titulo="Revisar y publicar"
              descripcion="Confirma los datos."
              icono={<Send size={21} />}
            >
              <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60">
                <div className="border-b border-emerald-100 bg-emerald-700 px-4 py-3 text-white">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-100">
                    Resumen del viaje
                  </p>
                </div>

                <div className="space-y-4 p-4">
                  <ResumenFinal
                    etiqueta="Ruta"
                    valor={
                      rutaSeleccionada
                        ? `${rutaSeleccionada.origen} → ${rutaSeleccionada.destino}`
                        : "Sin seleccionar"
                    }
                  />

                  <ResumenFinal
                    etiqueta="Vehículo"
                    valor={
                      vehiculoSeleccionado
                        ? `${vehiculoSeleccionado.placa} — ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}`
                        : "Sin seleccionar"
                    }
                  />

                  <ResumenFinal
                    etiqueta="Fecha"
                    valor={formatearFecha(
                      formulario.fecha,
                    )}
                  />

                  <ResumenFinal
                    etiqueta="Hora"
                    valor={
                      formulario.horaSalida ||
                      "Sin seleccionar"
                    }
                  />

                  <ResumenFinal
                    etiqueta="Precio"
                    valor={
                      formulario.precio > 0
                        ? `Bs ${formatearPrecio(
                            formulario.precio,
                          )}`
                        : "Sin definir"
                    }
                  />

                  <ResumenFinal
                    etiqueta="Asientos"
                    valor={
                      vehiculoSeleccionado
                        ? `${vehiculoSeleccionado.capacidad} asientos`
                        : "Sin definir"
                    }
                  />
                </div>
              </div>

              <div
                className={`mt-5 flex items-center gap-3 rounded-2xl border p-4 ${
                  formularioCompleto
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {formularioCompleto ? (
                  <CheckCircle2 size={21} />
                ) : (
                  <AlertCircle size={21} />
                )}

                <p className="text-sm font-black">
                  {formularioCompleto
                    ? "Listo para publicar"
                    : "Complete todos los campos"}
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  publicando ||
                  !formularioCompleto
                }
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 px-5 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:from-emerald-800 hover:to-emerald-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {publicando ? (
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={20} />
                )}

                {publicando
                  ? "Publicando viaje..."
                  : "Publicar viaje"}
              </button>

              <button
                type="button"
                onClick={limpiarFormulario}
                disabled={publicando}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
              >
                Limpiar formulario
              </button>
            </PanelPaso>
          </div>
        </form>

        <section className="mt-6 overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <AlertCircle size={23} />
            </div>

            <div>
              <h3 className="font-black text-slate-900">
                Publicación automática
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Al publicar el viaje, el sistema registrará la salida,
                generará los asientos del vehículo y permitirá que los
                pasajeros encuentren el viaje en la fecha seleccionada.
              </p>
            </div>
          </div>

          <div className="h-2 bg-gradient-to-r from-emerald-700 via-green-500 to-lime-400" />
        </section>
      </section>
    </main>
  );
}
interface CabeceraDatoProps {
  icono: ReactNode;
  etiqueta: string;
  valor: string;
  claseAdicional?: string;
}

function CabeceraDato({
  icono,
  etiqueta,
  valor,
  claseAdicional = "",
}: CabeceraDatoProps) {
  return (
    <div
      className={`min-w-[130px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm ${claseAdicional}`}
    >
      <div className="flex items-center gap-2 text-emerald-100">
        {icono}

        <p className="text-[10px] font-black uppercase tracking-wider">
          {etiqueta}
        </p>
      </div>

      <p className="mt-2 text-lg font-black text-white">
        {valor}
      </p>
    </div>
  );
}

interface IndicadorPasoProps {
  numero: number;
  titulo: string;
  descripcion: string;
  activo: boolean;
  completado: boolean;
}

function IndicadorPaso({
  numero,
  titulo,
  descripcion,
  activo,
  completado,
}: IndicadorPasoProps) {
  return (
    <div
      className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 transition ${
        activo
          ? "border-emerald-300 bg-emerald-50 shadow-sm"
          : completado
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      {activo && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-700 to-lime-400" />
      )}

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black transition ${
          completado
            ? "bg-emerald-700 text-white"
            : activo
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-slate-400 shadow-sm"
        }`}
      >
        {completado ? (
          <Check size={20} />
        ) : (
          numero
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`font-black ${
            activo || completado
              ? "text-emerald-800"
              : "text-slate-600"
          }`}
        >
          {titulo}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500">
          {descripcion}
        </p>
      </div>
    </div>
  );
}

interface PanelPasoProps {
  numero: number;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  children: ReactNode;
}

function PanelPaso({
  numero,
  titulo,
  descripcion,
  icono,
  children,
}: PanelPasoProps) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
            {icono}

            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-lime-400 text-[11px] font-black text-emerald-950">
              {numero}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Paso {numero}
            </p>

            <h3 className="mt-0.5 font-black text-slate-950">
              {titulo}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {descripcion}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

interface DatoResumenProps {
  icono: ReactNode;
  etiqueta: string;
  valor: string;
}

function DatoResumen({
  icono,
  etiqueta,
  valor,
}: DatoResumenProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
        {icono}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {etiqueta}
        </p>

        <p className="mt-0.5 truncate text-sm font-black text-slate-800">
          {valor}
        </p>
      </div>
    </div>
  );
}

interface ResumenFinalProps {
  etiqueta: string;
  valor: string;
}

function ResumenFinal({
  etiqueta,
  valor,
}: ResumenFinalProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-3 last:border-b-0 last:pb-0">
      <p className="shrink-0 text-xs font-semibold text-slate-500">
        {etiqueta}
      </p>

      <p className="text-right text-sm font-black leading-5 text-slate-800">
        {valor}
      </p>
    </div>
  );
}