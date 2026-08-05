import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BusFront,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Power,
  RefreshCw,
  Route as RouteIcon,
  Save,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  actualizarRuta,
  cambiarEstadoRuta,
  crearRuta,
  eliminarRuta,
  listarTodasLasRutas,
} from "../../../services/catalogos.service";

import type {
  CrearRutaPayload,
  Ruta,
} from "../../../services/catalogos.service";

interface FormularioRuta {
  origen: string;
  destino: string;
  distanciaKm: string;
  estado: boolean;
}

interface Mensaje {
  tipo: "exito" | "error";
  texto: string;
}

const FORMULARIO_INICIAL: FormularioRuta = {
  origen: "",
  destino: "",
  distanciaKm: "",
  estado: true,
};

function RutasPage() {
  const navigate = useNavigate();

  const [rutas, setRutas] = useState<Ruta[]>(
    [],
  );

  const [formulario, setFormulario] =
    useState<FormularioRuta>(
      FORMULARIO_INICIAL,
    );

  const [rutaEditandoId, setRutaEditandoId] =
    useState<string | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState<
      "TODAS" | "ACTIVAS" | "INACTIVAS"
    >("TODAS");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [accionandoId, setAccionandoId] =
    useState<string | null>(null);

  const [mensaje, setMensaje] =
    useState<Mensaje | null>(null);

  const cargarRutas =
    useCallback(async () => {
      try {
        setCargando(true);
        setMensaje(null);

        const datos =
          await listarTodasLasRutas();

        setRutas(datos);
      } catch (error) {
        setMensaje({
          tipo: "error",
          texto:
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las rutas.",
        });
      } finally {
        setCargando(false);
      }
    }, []);

  useEffect(() => {
    void cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    if (!mensaje) {
      return;
    }

    const temporizador = window.setTimeout(
      () => {
        setMensaje(null);
      },
      5000,
    );

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [mensaje]);

  const rutasFiltradas = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLocaleLowerCase();

    return rutas.filter((ruta) => {
      const coincideBusqueda =
        !texto ||
        ruta.origen
          .toLocaleLowerCase()
          .includes(texto) ||
        ruta.destino
          .toLocaleLowerCase()
          .includes(texto) ||
        `${ruta.origen} ${ruta.destino}`
          .toLocaleLowerCase()
          .includes(texto);

      const coincideEstado =
        filtroEstado === "TODAS" ||
        (filtroEstado === "ACTIVAS" &&
          ruta.estado) ||
        (filtroEstado === "INACTIVAS" &&
          !ruta.estado);

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });
  }, [
    busqueda,
    filtroEstado,
    rutas,
  ]);

  const totalActivas = useMemo(
    () =>
      rutas.filter((ruta) => ruta.estado)
        .length,
    [rutas],
  );

  const totalInactivas = useMemo(
    () =>
      rutas.filter((ruta) => !ruta.estado)
        .length,
    [rutas],
  );

  function manejarCambioFormulario(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value, checked, type } =
      event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function validarFormulario(): string | null {
    const origen =
      formulario.origen.trim();

    const destino =
      formulario.destino.trim();

    if (origen.length < 2) {
      return "El origen debe tener al menos 2 caracteres.";
    }

    if (destino.length < 2) {
      return "El destino debe tener al menos 2 caracteres.";
    }

    if (
      origen.toLocaleLowerCase() ===
      destino.toLocaleLowerCase()
    ) {
      return "El origen y el destino no pueden ser iguales.";
    }

    if (formulario.distanciaKm.trim()) {
      const distancia = Number(
        formulario.distanciaKm,
      );

      if (
        !Number.isFinite(distancia) ||
        distancia <= 0
      ) {
        return "La distancia debe ser mayor que cero.";
      }
    }

    return null;
  }

  async function manejarGuardar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const errorValidacion =
      validarFormulario();

    if (errorValidacion) {
      setMensaje({
        tipo: "error",
        texto: errorValidacion,
      });

      return;
    }

    const distancia =
      formulario.distanciaKm.trim()
        ? Number(formulario.distanciaKm)
        : null;

    const payload: CrearRutaPayload = {
      origen: formulario.origen.trim(),
      destino: formulario.destino.trim(),
      distanciaKm: distancia,
      estado: formulario.estado,
    };

    try {
      setGuardando(true);
      setMensaje(null);

      if (rutaEditandoId) {
        await actualizarRuta(
          rutaEditandoId,
          payload,
        );

        setMensaje({
          tipo: "exito",
          texto:
            "La ruta fue actualizada correctamente.",
        });
      } else {
        await crearRuta(payload);

        setMensaje({
          tipo: "exito",
          texto:
            "La ruta fue registrada correctamente.",
        });
      }

      limpiarFormulario();
      await cargarRutas();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la ruta.",
      });
    } finally {
      setGuardando(false);
    }
  }

  function seleccionarParaEditar(
    ruta: Ruta,
  ) {
    setRutaEditandoId(ruta.id);

    setFormulario({
      origen: ruta.origen,
      destino: ruta.destino,
      distanciaKm:
        ruta.distanciaKm === null
          ? ""
          : String(ruta.distanciaKm),
      estado: ruta.estado,
    });

    setMensaje(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function limpiarFormulario() {
    setRutaEditandoId(null);
    setFormulario(FORMULARIO_INICIAL);
  }

  async function manejarCambiarEstado(
    ruta: Ruta,
  ) {
    const nuevoEstado = !ruta.estado;

    const confirmar = window.confirm(
      nuevoEstado
        ? `¿Deseas activar la ruta ${ruta.origen} - ${ruta.destino}?`
        : `¿Deseas desactivar la ruta ${ruta.origen} - ${ruta.destino}?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      setAccionandoId(ruta.id);
      setMensaje(null);

      await cambiarEstadoRuta(
        ruta.id,
        nuevoEstado,
      );

      setMensaje({
        tipo: "exito",
        texto: nuevoEstado
          ? "La ruta fue activada correctamente."
          : "La ruta fue desactivada correctamente.",
      });

      await cargarRutas();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo cambiar el estado.",
      });
    } finally {
      setAccionandoId(null);
    }
  }

  async function manejarEliminar(
    ruta: Ruta,
  ) {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la ruta ${ruta.origen} - ${ruta.destino}?\n\nEsta acción no se puede deshacer.`,
    );

    if (!confirmar) {
      return;
    }

    try {
      setAccionandoId(ruta.id);
      setMensaje(null);

      await eliminarRuta(ruta.id);

      if (rutaEditandoId === ruta.id) {
        limpiarFormulario();
      }

      setMensaje({
        tipo: "exito",
        texto:
          "La ruta fue eliminada correctamente.",
      });

      await cargarRutas();
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar la ruta.",
      });
    } finally {
      setAccionandoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/viajes-rutas",
                )
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Volver"
            >
              <ArrowLeft size={21} />
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
              <RouteIcon size={30} />
            </div>

            <div>
              <p className="text-sm font-medium text-blue-400">
                Administración
              </p>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Gestión de rutas
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Registra, modifica y controla
                las rutas disponibles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void cargarRutas()
            }
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={
                cargando
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar
          </button>
        </header>

        {/* MENSAJE */}
        {mensaje && (
          <div
            className={`mb-6 flex items-start justify-between gap-4 rounded-2xl border p-4 ${
              mensaje.tipo === "exito"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {mensaje.tipo === "exito" ? (
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <XCircle
                  size={21}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p className="text-sm font-medium">
                {mensaje.texto}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setMensaje(null)
              }
              className="shrink-0 opacity-70 transition hover:opacity-100"
            >
              <X size={19} />
            </button>
          </div>
        )}

        {/* RESUMEN */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <TarjetaResumen
            titulo="Total de rutas"
            valor={rutas.length}
            icono={
              <RouteIcon size={23} />
            }
          />

          <TarjetaResumen
            titulo="Rutas activas"
            valor={totalActivas}
            icono={
              <CheckCircle2 size={23} />
            }
          />

          <TarjetaResumen
            titulo="Rutas inactivas"
            valor={totalInactivas}
            icono={
              <XCircle size={23} />
            }
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          {/* FORMULARIO */}
          <section className="h-fit rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                {rutaEditandoId ? (
                  <Edit3 size={22} />
                ) : (
                  <Plus size={22} />
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  {rutaEditandoId
                    ? "Editar ruta"
                    : "Registrar ruta"}
                </h2>

                <p className="text-sm text-slate-400">
                  Completa los datos
                  solicitados.
                </p>
              </div>
            </div>

            <form
              onSubmit={manejarGuardar}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="origen"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Origen
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="origen"
                    name="origen"
                    type="text"
                    value={formulario.origen}
                    onChange={
                      manejarCambioFormulario
                    }
                    maxLength={100}
                    placeholder="Ejemplo: Shinahota"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="destino"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Destino
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="destino"
                    name="destino"
                    type="text"
                    value={
                      formulario.destino
                    }
                    onChange={
                      manejarCambioFormulario
                    }
                    maxLength={100}
                    placeholder="Ejemplo: Cochabamba"
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="distanciaKm"
                  className="mb-2 block text-sm font-semibold text-slate-300"
                >
                  Distancia en kilómetros
                </label>

                <input
                  id="distanciaKm"
                  name="distanciaKm"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    formulario.distanciaKm
                  }
                  onChange={
                    manejarCambioFormulario
                  }
                  placeholder="Ejemplo: 180"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Este campo puede quedar vacío.
                </p>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div>
                  <p className="font-semibold text-slate-200">
                    Ruta activa
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Podrá utilizarse al
                    programar viajes.
                  </p>
                </div>

                <input
                  name="estado"
                  type="checkbox"
                  checked={formulario.estado}
                  onChange={
                    manejarCambioFormulario
                  }
                  className="h-5 w-5 accent-blue-500"
                />
              </label>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row xl:flex-col">
                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? (
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={19} />
                  )}

                  {guardando
                    ? "Guardando..."
                    : rutaEditandoId
                      ? "Actualizar ruta"
                      : "Registrar ruta"}
                </button>

                {rutaEditandoId && (
                  <button
                    type="button"
                    onClick={
                      limpiarFormulario
                    }
                    disabled={guardando}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <X size={19} />
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* LISTADO */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-xl">
            <div className="border-b border-white/10 p-5">
              <div className="mb-4">
                <h2 className="text-xl font-bold">
                  Rutas registradas
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Administra todas las rutas
                  del sistema.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value,
                      )
                    }
                    placeholder="Buscar por origen o destino..."
                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <select
                  value={filtroEstado}
                  onChange={(event) =>
                    setFiltroEstado(
                      event.target.value as
                        | "TODAS"
                        | "ACTIVAS"
                        | "INACTIVAS",
                    )
                  }
                  className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="TODAS">
                    Todas
                  </option>

                  <option value="ACTIVAS">
                    Activas
                  </option>

                  <option value="INACTIVAS">
                    Inactivas
                  </option>
                </select>
              </div>
            </div>

            {cargando ? (
              <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-slate-400">
                <Loader2
                  size={35}
                  className="animate-spin text-blue-500"
                />

                <p>Cargando rutas...</p>
              </div>
            ) : rutasFiltradas.length ===
              0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                  <BusFront size={32} />
                </div>

                <h3 className="text-lg font-bold text-slate-300">
                  No se encontraron rutas
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Registra una nueva ruta o
                  cambia los filtros de
                  búsqueda.
                </p>
              </div>
            ) : (
              <>
                {/* TABLA PARA COMPUTADORA */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px]">
                    <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">
                          Ruta
                        </th>

                        <th className="px-5 py-4">
                          Distancia
                        </th>

                        <th className="px-5 py-4">
                          Estado
                        </th>

                        <th className="px-5 py-4 text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5">
                      {rutasFiltradas.map(
                        (ruta) => (
                          <tr
                            key={ruta.id}
                            className="transition hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                  <RouteIcon
                                    size={20}
                                  />
                                </div>

                                <div>
                                  <p className="font-bold text-slate-200">
                                    {
                                      ruta.origen
                                    }
                                  </p>

                                  <p className="mt-1 text-sm text-slate-500">
                                    Destino:{" "}
                                    {
                                      ruta.destino
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-300">
                              {ruta.distanciaKm ===
                              null
                                ? "No especificada"
                                : `${ruta.distanciaKm.toLocaleString(
                                    "es-BO",
                                  )} km`}
                            </td>

                            <td className="px-5 py-4">
                              <EstadoRuta
                                estado={
                                  ruta.estado
                                }
                              />
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <BotonAccion
                                  titulo="Editar"
                                  onClick={() =>
                                    seleccionarParaEditar(
                                      ruta,
                                    )
                                  }
                                  deshabilitado={
                                    accionandoId ===
                                    ruta.id
                                  }
                                >
                                  <Edit3
                                    size={17}
                                  />
                                </BotonAccion>

                                <BotonAccion
                                  titulo={
                                    ruta.estado
                                      ? "Desactivar"
                                      : "Activar"
                                  }
                                  onClick={() =>
                                    void manejarCambiarEstado(
                                      ruta,
                                    )
                                  }
                                  deshabilitado={
                                    accionandoId ===
                                    ruta.id
                                  }
                                >
                                  {accionandoId ===
                                  ruta.id ? (
                                    <Loader2
                                      size={17}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Power
                                      size={
                                        17
                                      }
                                    />
                                  )}
                                </BotonAccion>

                                <BotonAccion
                                  titulo="Eliminar"
                                  onClick={() =>
                                    void manejarEliminar(
                                      ruta,
                                    )
                                  }
                                  deshabilitado={
                                    accionandoId ===
                                    ruta.id
                                  }
                                  peligro
                                >
                                  <Trash2
                                    size={17}
                                  />
                                </BotonAccion>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TARJETAS PARA CELULAR */}
                <div className="space-y-3 p-4 md:hidden">
                  {rutasFiltradas.map(
                    (ruta) => (
                      <article
                        key={ruta.id}
                        className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-200">
                              {ruta.origen}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                              {ruta.destino}
                            </p>
                          </div>

                          <EstadoRuta
                            estado={
                              ruta.estado
                            }
                          />
                        </div>

                        <div className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-400">
                          Distancia:{" "}
                          <span className="font-semibold text-slate-200">
                            {ruta.distanciaKm ===
                            null
                              ? "No especificada"
                              : `${ruta.distanciaKm.toLocaleString(
                                  "es-BO",
                                )} km`}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <BotonAccion
                            titulo="Editar"
                            onClick={() =>
                              seleccionarParaEditar(
                                ruta,
                              )
                            }
                            deshabilitado={
                              accionandoId ===
                              ruta.id
                            }
                          >
                            <Edit3
                              size={17}
                            />
                          </BotonAccion>

                          <BotonAccion
                            titulo={
                              ruta.estado
                                ? "Desactivar"
                                : "Activar"
                            }
                            onClick={() =>
                              void manejarCambiarEstado(
                                ruta,
                              )
                            }
                            deshabilitado={
                              accionandoId ===
                              ruta.id
                            }
                          >
                            <Power
                              size={17}
                            />
                          </BotonAccion>

                          <BotonAccion
                            titulo="Eliminar"
                            onClick={() =>
                              void manejarEliminar(
                                ruta,
                              )
                            }
                            deshabilitado={
                              accionandoId ===
                              ruta.id
                            }
                            peligro
                          >
                            <Trash2
                              size={17}
                            />
                          </BotonAccion>
                        </div>
                      </article>
                    ),
                  )}
                </div>
              </>
            )}

            {!cargando &&
              rutasFiltradas.length > 0 && (
                <footer className="border-t border-white/10 px-5 py-4 text-sm text-slate-500">
                  Mostrando{" "}
                  <span className="font-bold text-slate-300">
                    {rutasFiltradas.length}
                  </span>{" "}
                  de{" "}
                  <span className="font-bold text-slate-300">
                    {rutas.length}
                  </span>{" "}
                  rutas.
                </footer>
              )}
          </section>
        </div>
      </div>
    </main>
  );
}

interface TarjetaResumenProps {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
}

function TarjetaResumen({
  titulo,
  valor,
  icono,
}: TarjetaResumenProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        {icono}
      </div>

      <div>
        <p className="text-sm text-slate-400">
          {titulo}
        </p>

        <p className="mt-1 text-2xl font-black">
          {valor}
        </p>
      </div>
    </article>
  );
}

interface EstadoRutaProps {
  estado: boolean;
}

function EstadoRuta({
  estado,
}: EstadoRutaProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        estado
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          estado
            ? "bg-emerald-400"
            : "bg-red-400"
        }`}
      />

      {estado ? "Activa" : "Inactiva"}
    </span>
  );
}

interface BotonAccionProps {
  titulo: string;
  onClick: () => void;
  children: React.ReactNode;
  deshabilitado?: boolean;
  peligro?: boolean;
}

function BotonAccion({
  titulo,
  onClick,
  children,
  deshabilitado = false,
  peligro = false,
}: BotonAccionProps) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={deshabilitado}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        peligro
          ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}

      <span className="hidden xl:inline">
        {titulo}
      </span>
    </button>
  );
}

export default RutasPage;