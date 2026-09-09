import {
  BusFront,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  actualizarVehiculo,
  cambiarEstadoVehiculo,
  CAPACIDAD_POR_TIPO,
  crearVehiculo,
  eliminarVehiculo,
  listarVehiculos,
} from "../../services/catalogos.service";

import type {
  TipoVehiculo,
  Vehiculo,
} from "../../services/catalogos.service";

interface FormularioVehiculo {
  numeroFlota: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculo;
  estado: boolean;
}

const FORMULARIO_INICIAL:
  FormularioVehiculo = {
    numeroFlota: "",
    placa: "",
    marca: "",
    modelo: "",
    tipo: "NOAH",
    estado: true,
  };

const obtenerError = (
  error: unknown,
) => {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return "No se pudo completar la operación.";
};

export default function Vehiculos() {
  const [
    vehiculos,
    setVehiculos,
  ] = useState<Vehiculo[]>([]);

  const [
    formulario,
    setFormulario,
  ] = useState<FormularioVehiculo>(
    FORMULARIO_INICIAL,
  );

  const [
    vehiculoEditandoId,
    setVehiculoEditandoId,
  ] = useState<string | null>(null);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    procesandoId,
    setProcesandoId,
  ] = useState<string | null>(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    esError,
    setEsError,
  ] = useState(false);

  const capacidad =
    CAPACIDAD_POR_TIPO[
      formulario.tipo
    ];

  const cargandoEdicion =
    vehiculoEditandoId !== null;

  const cargarVehiculos =
    useCallback(
      async () => {
        try {
          setCargando(true);

          const respuesta =
            await listarVehiculos();

          setVehiculos(
            respuesta,
          );
        } catch (error) {
          setMensaje(
            obtenerError(error),
          );
          setEsError(true);
        } finally {
          setCargando(false);
        }
      },
      [],
    );

  useEffect(() => {
    void cargarVehiculos();
  }, [cargarVehiculos]);

  const cantidades =
    useMemo(
      () => ({
        total:
          vehiculos.length,

        flotas:
          vehiculos.filter(
            (vehiculo) =>
              vehiculo.tipo ===
              "FLOTA",
          ).length,

        noah:
          vehiculos.filter(
            (vehiculo) =>
              vehiculo.tipo ===
              "NOAH",
          ).length,

        hiace:
          vehiculos.filter(
            (vehiculo) =>
              vehiculo.tipo ===
              "HIACE",
          ).length,
      }),
      [vehiculos],
    );

  const cambiarCampo = (
    campo:
      keyof FormularioVehiculo,
    valor: string | boolean,
  ) => {
    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor,
      }),
    );

    setMensaje("");
  };

  const limpiarFormulario = () => {
    setFormulario(
      FORMULARIO_INICIAL,
    );

    setVehiculoEditandoId(
      null,
    );

    setMensaje("");
  };

  const editarVehiculo = (
    vehiculo: Vehiculo,
  ) => {
    setVehiculoEditandoId(
      vehiculo.id,
    );

    setFormulario({
      numeroFlota:
        vehiculo.numeroFlota ??
        "",

      placa:
        vehiculo.placa,

      marca:
        vehiculo.marca,

      modelo:
        vehiculo.modelo,

      tipo:
        vehiculo.tipo,

      estado:
        vehiculo.estado,
    });

    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const guardarVehiculo =
    async (
      evento: FormEvent,
    ) => {
      evento.preventDefault();

      if (
        !formulario.placa.trim() ||
        !formulario.marca.trim() ||
        !formulario.modelo.trim()
      ) {
        setMensaje(
          "Completa la placa, marca y modelo.",
        );
        setEsError(true);
        return;
      }

      try {
        setGuardando(true);
        setMensaje("");

        if (vehiculoEditandoId) {
          await actualizarVehiculo(
            vehiculoEditandoId,
            {
              numeroFlota:
                formulario
                  .numeroFlota ||
                null,

              placa:
                formulario.placa,

              marca:
                formulario.marca,

              modelo:
                formulario.modelo,

              tipo:
                formulario.tipo,

              estado:
                formulario.estado,
            },
          );

          setMensaje(
            "Vehículo actualizado correctamente.",
          );
        } else {
          await crearVehiculo({
            numeroFlota:
              formulario
                .numeroFlota ||
              null,

            placa:
              formulario.placa,

            marca:
              formulario.marca,

            modelo:
              formulario.modelo,

            tipo:
              formulario.tipo,

            estado:
              formulario.estado,
          });

          setMensaje(
            `${formulario.tipo} registrado correctamente con ${capacidad} asientos.`,
          );
        }

        setEsError(false);

        setFormulario(
          FORMULARIO_INICIAL,
        );

        setVehiculoEditandoId(
          null,
        );

        await cargarVehiculos();
      } catch (error) {
        setMensaje(
          obtenerError(error),
        );
        setEsError(true);
      } finally {
        setGuardando(false);
      }
    };

  const cambiarEstado =
    async (
      vehiculo: Vehiculo,
    ) => {
      try {
        setProcesandoId(
          vehiculo.id,
        );

        await cambiarEstadoVehiculo(
          vehiculo.id,
          !vehiculo.estado,
        );

        setMensaje(
          vehiculo.estado
            ? "Vehículo desactivado."
            : "Vehículo activado.",
        );

        setEsError(false);

        await cargarVehiculos();
      } catch (error) {
        setMensaje(
          obtenerError(error),
        );
        setEsError(true);
      } finally {
        setProcesandoId(null);
      }
    };

  const eliminar = async (
    vehiculo: Vehiculo,
  ) => {
    const confirmar =
      window.confirm(
        `¿Eliminar el vehículo ${vehiculo.placa}?`,
      );

    if (!confirmar) {
      return;
    }

    try {
      setProcesandoId(
        vehiculo.id,
      );

      await eliminarVehiculo(
        vehiculo.id,
      );

      setMensaje(
        "Vehículo eliminado correctamente.",
      );

      setEsError(false);

      await cargarVehiculos();
    } catch (error) {
      setMensaje(
        obtenerError(error),
      );
      setEsError(true);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="space-y-6 p-1">
      <header className="overflow-hidden rounded-[28px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-7 text-white shadow-xl shadow-emerald-900/15">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
              <BusFront size={30} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                Administración
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Gestión de vehículos
              </h1>

              <p className="mt-2 text-sm text-emerald-100">
                Registra flotas, Noah y
                vehículos Hiace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void cargarVehiculos()
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 font-black hover:bg-white/20"
          >
            <RefreshCw size={18} />
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
              <CheckCircle2
                size={19}
              />
            )}

            {mensaje}
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Resumen
          titulo="Total"
          valor={cantidades.total}
          color="slate"
        />

        <Resumen
          titulo="Flotas"
          valor={cantidades.flotas}
          color="emerald"
        />

        <Resumen
          titulo="Noah"
          valor={cantidades.noah}
          color="amber"
        />

        <Resumen
          titulo="Hiace"
          valor={cantidades.hiace}
          color="sky"
        />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 px-6 py-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {cargandoEdicion
              ? "Editar vehículo"
              : "Nuevo vehículo"}
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            {cargandoEdicion
              ? "Actualizar información"
              : "Registrar vehículo"}
          </h2>
        </div>

        <form
          onSubmit={guardarVehiculo}
          className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3"
        >
          <Campo
            etiqueta="Placa"
            valor={formulario.placa}
            placeholder="Ej.: HIACE-001"
            onChange={(valor) =>
              cambiarCampo(
                "placa",
                valor.toUpperCase(),
              )
            }
          />

          <Campo
            etiqueta="Número interno"
            valor={
              formulario.numeroFlota
            }
            placeholder="Opcional"
            onChange={(valor) =>
              cambiarCampo(
                "numeroFlota",
                valor,
              )
            }
          />

          <Campo
            etiqueta="Marca"
            valor={formulario.marca}
            placeholder="Ej.: Toyota"
            onChange={(valor) =>
              cambiarCampo(
                "marca",
                valor,
              )
            }
          />

          <Campo
            etiqueta="Modelo"
            valor={formulario.modelo}
            placeholder="Ej.: Hiace"
            onChange={(valor) =>
              cambiarCampo(
                "modelo",
                valor,
              )
            }
          />

          <label>
            <span className="text-sm font-black text-slate-700">
              Tipo de vehículo
            </span>

            <select
              value={formulario.tipo}
              onChange={(evento) =>
                cambiarCampo(
                  "tipo",
                  evento.target
                    .value as
                    TipoVehiculo,
                )
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500"
            >
              <option value="FLOTA">
                Flota — 40 asientos
              </option>

              <option value="NOAH">
                Noah — 7 asientos
              </option>

              <option value="HIACE">
                Hiace — 10 asientos
              </option>
            </select>
          </label>

          <div>
            <span className="text-sm font-black text-slate-700">
              Capacidad automática
            </span>

            <div className="mt-2 flex min-h-[54px] items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 font-black text-emerald-700">
              {capacidad} pasajeros
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <input
              type="checkbox"
              checked={
                formulario.estado
              }
              onChange={(evento) =>
                cambiarCampo(
                  "estado",
                  evento.target
                    .checked,
                )
              }
              className="h-5 w-5 accent-emerald-700"
            />

            <span className="font-black text-slate-700">
              Vehículo activo
            </span>
          </label>

          <div className="flex gap-3 md:col-span-2 xl:col-span-3">
            <button
              type="submit"
              disabled={guardando}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {guardando ? (
                <Loader2
                  size={19}
                  className="animate-spin"
                />
              ) : cargandoEdicion ? (
                <Save size={19} />
              ) : (
                <Plus size={19} />
              )}

              {cargandoEdicion
                ? "Guardar cambios"
                : "Registrar vehículo"}
            </button>

            {cargandoEdicion && (
              <button
                type="button"
                onClick={
                  limpiarFormulario
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 font-black text-slate-600"
              >
                <X size={19} />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
        <div className="border-b border-emerald-100 px-6 py-5">
          <h2 className="text-xl font-black text-slate-900">
            Vehículos registrados
          </h2>
        </div>

        {cargando ? (
          <div className="flex justify-center p-12">
            <Loader2
              size={38}
              className="animate-spin text-emerald-700"
            />
          </div>
        ) : vehiculos.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No existen vehículos registrados.
          </div>
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {vehiculos.map(
              (vehiculo) => (
                <article
                  key={vehiculo.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                      <BusFront
                        size={24}
                      />
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        vehiculo.estado
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {vehiculo.estado
                        ? "ACTIVO"
                        : "INACTIVO"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-900">
                    {vehiculo.tipo} ·{" "}
                    {vehiculo.placa}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {vehiculo.marca}{" "}
                    {vehiculo.modelo}
                  </p>

                  <p className="mt-3 text-sm font-black text-emerald-700">
                    {vehiculo.capacidad} asientos
                  </p>

                  {vehiculo.numeroFlota && (
                    <p className="mt-1 text-xs text-slate-500">
                      Número interno:{" "}
                      {vehiculo.numeroFlota}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        editarVehiculo(
                          vehiculo,
                        )
                      }
                      className="flex items-center justify-center rounded-xl bg-sky-100 p-3 text-sky-700"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      type="button"
                      disabled={
                        procesandoId ===
                        vehiculo.id
                      }
                      onClick={() =>
                        void cambiarEstado(
                          vehiculo,
                        )
                      }
                      className="rounded-xl bg-amber-100 p-3 text-xs font-black text-amber-700"
                    >
                      {vehiculo.estado
                        ? "Desactivar"
                        : "Activar"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        procesandoId ===
                        vehiculo.id
                      }
                      onClick={() =>
                        void eliminar(
                          vehiculo,
                        )
                      }
                      className="flex items-center justify-center rounded-xl bg-red-100 p-3 text-red-700"
                    >
                      {procesandoId ===
                      vehiculo.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={18}
                        />
                      )}
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  placeholder,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  placeholder: string;
  onChange: (
    valor: string,
  ) => void;
}) {
  return (
    <label>
      <span className="text-sm font-black text-slate-700">
        {etiqueta}
      </span>

      <input
        value={valor}
        placeholder={placeholder}
        onChange={(evento) =>
          onChange(
            evento.target.value,
          )
        }
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-emerald-500"
      />
    </label>
  );
}

function Resumen({
  titulo,
  valor,
  color,
}: {
  titulo: string;
  valor: number;
  color:
    | "slate"
    | "emerald"
    | "amber"
    | "sky";
}) {
  const colores = {
    slate:
      "border-slate-200 bg-white text-slate-800",

    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    amber:
      "border-amber-200 bg-amber-50 text-amber-700",

    sky:
      "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <article
      className={`rounded-2xl border p-5 ${colores[color]}`}
    >
      <p className="text-sm font-black">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black">
        {valor}
      </p>
    </article>
  );
}