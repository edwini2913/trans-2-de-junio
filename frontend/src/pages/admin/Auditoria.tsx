import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  obtenerAuditorias,
  type AuditoriaRegistro,
  type ResultadoAuditoria,
} from "../../services/auditoria.service";

type FiltrosFormulario = {
  busqueda: string;
  modulo: string;
  accion: string;
  resultado: "" | ResultadoAuditoria;
  fechaDesde: string;
  fechaHasta: string;
};

const FILTROS_INICIALES: FiltrosFormulario = {
  busqueda: "",
  modulo: "",
  accion: "",
  resultado: "",
  fechaDesde: "",
  fechaHasta: "",
};

const MODULOS = [
  "AUTENTICACION",
  "USUARIOS",
  "RESERVAS",
  "PAGOS",
  "TICKETS",
  "BLOCKCHAIN",
  "VENTAS",
  "RECLAMOS",
];

function Auditoria() {
  const [registros, setRegistros] = useState<AuditoriaRegistro[]>([]);
  const [filtros, setFiltros] =
    useState<FiltrosFormulario>(FILTROS_INICIALES);

  const [pagina, setPagina] = useState(1);
  const [limite] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const cargarAuditoria = useCallback(
    async (mostrarCargaCompleta = false) => {
      try {
        if (mostrarCargaCompleta) {
          setCargando(true);
        } else {
          setActualizando(true);
        }

        setError("");

        const respuesta = await obtenerAuditorias({
          modulo: filtros.modulo || undefined,
          accion: filtros.accion.trim() || undefined,
          resultado: filtros.resultado || undefined,
          fechaDesde: filtros.fechaDesde || undefined,
          fechaHasta: filtros.fechaHasta || undefined,
          pagina,
          limite,
        });

        setRegistros(respuesta.registros);
        setTotal(respuesta.total);
        setTotalPaginas(Math.max(1, respuesta.totalPaginas));
      } catch (errorDesconocido: unknown) {
        setError(obtenerMensaje(errorDesconocido));
        setRegistros([]);
        setTotal(0);
        setTotalPaginas(1);
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [
      filtros.accion,
      filtros.fechaDesde,
      filtros.fechaHasta,
      filtros.modulo,
      filtros.resultado,
      limite,
      pagina,
    ],
  );

  useEffect(() => {
    void cargarAuditoria(true);
  }, [cargarAuditoria]);

  const registrosVisibles = useMemo(() => {
    const texto = filtros.busqueda.trim().toLocaleLowerCase();

    if (!texto) {
      return registros;
    }

    return registros.filter((registro) => {
      const contenido = [
        registro.usuarioNombre,
        registro.usuarioEmail,
        registro.usuarioRol,
        registro.accion,
        registro.modulo,
        registro.descripcion,
        registro.entidad,
        registro.entidadId,
        registro.resultado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();

      return contenido.includes(texto);
    });
  }, [filtros.busqueda, registros]);

  const resumen = useMemo(() => {
    const exitosos = registros.filter(
      (registro) => registro.resultado === "EXITOSO",
    ).length;

    const fallidos = registros.filter(
      (registro) => registro.resultado === "FALLIDO",
    ).length;

    const usuarios = new Set(
      registros
        .map((registro) => registro.usuarioEmail || registro.usuarioId)
        .filter(Boolean),
    ).size;

    return {
      exitosos,
      fallidos,
      usuarios,
    };
  }, [registros]);

  function actualizarFiltro(
    campo: keyof FiltrosFormulario,
    valor: string,
  ) {
    setFiltros((estadoAnterior) => ({
      ...estadoAnterior,
      [campo]: valor,
    }));

    if (campo !== "busqueda") {
      setPagina(1);
    }
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
  }

  return (
    <main className="min-h-full bg-[#f2f8f4] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-7">
        <section className="overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-lime-600 p-6 text-white shadow-xl shadow-emerald-950/15 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-200">
                Seguridad y trazabilidad
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Auditoría del sistema
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-50 sm:text-base">
                Consulta los accesos, compras, reservas, pagos, tickets y
                verificaciones blockchain registradas en el sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void cargarAuditoria()}
              disabled={actualizando || cargando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 px-5 py-3 font-black text-white backdrop-blur-sm transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={19}
                className={actualizando ? "animate-spin" : ""}
              />
              Actualizar
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TarjetaResumen
            titulo="Registros encontrados"
            valor={total}
            icono={<Activity size={24} />}
            clase="bg-emerald-100 text-emerald-700"
          />

          <TarjetaResumen
            titulo="Acciones exitosas"
            valor={resumen.exitosos}
            icono={<CheckCircle2 size={24} />}
            clase="bg-teal-100 text-teal-700"
          />

          <TarjetaResumen
            titulo="Acciones fallidas"
            valor={resumen.fallidos}
            icono={<XCircle size={24} />}
            clase="bg-red-100 text-red-700"
          />

          <TarjetaResumen
            titulo="Usuarios visibles"
            valor={resumen.usuarios}
            icono={<UserRound size={24} />}
            clase="bg-sky-100 text-sky-700"
          />
        </section>

        <section className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-950/5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Filter size={21} />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                Filtros de auditoría
              </h2>
              <p className="text-sm text-slate-500">
                Refina la información por módulo, acción, resultado o fecha.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <CampoBusqueda
              valor={filtros.busqueda}
              onChange={(valor) => actualizarFiltro("busqueda", valor)}
            />

            <select
              value={filtros.modulo}
              onChange={(evento) =>
                actualizarFiltro("modulo", evento.target.value)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Todos los módulos</option>
              {MODULOS.map((modulo) => (
                <option key={modulo} value={modulo}>
                  {modulo}
                </option>
              ))}
            </select>

            <input
              value={filtros.accion}
              onChange={(evento) =>
                actualizarFiltro("accion", evento.target.value)
              }
              placeholder="Acción: COMPRAR..."
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />

            <select
              value={filtros.resultado}
              onChange={(evento) =>
                actualizarFiltro("resultado", evento.target.value)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Todos los resultados</option>
              <option value="EXITOSO">Exitoso</option>
              <option value="FALLIDO">Fallido</option>
            </select>

            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(evento) =>
                actualizarFiltro("fechaDesde", evento.target.value)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />

            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(evento) =>
                actualizarFiltro("fechaHasta", evento.target.value)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle size={21} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-black">No se pudo cargar la auditoría</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
          <div className="flex flex-col gap-3 border-b border-emerald-100 bg-emerald-50/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-black text-slate-950">
                Historial de actividad
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Mostrando {registrosVisibles.length} registros de esta página.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm">
              <ShieldCheck size={16} />
              Registro protegido
            </div>
          </div>

          {cargando ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-10">
              <RefreshCw
                size={34}
                className="animate-spin text-emerald-700"
              />
              <p className="mt-4 font-bold text-slate-500">
                Cargando auditoría...
              </p>
            </div>
          ) : registrosVisibles.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Activity size={30} />
              </div>
              <h3 className="mt-4 font-black text-slate-900">
                No existen registros
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Prueba limpiando los filtros o realiza una nueva acción en el
                sistema.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Acción</th>
                      <th className="px-6 py-4">Módulo</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4">Resultado</th>
                      <th className="px-6 py-4">Fecha</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {registrosVisibles.map((registro) => (
                      <FilaAuditoria key={registro.id} registro={registro} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {registrosVisibles.map((registro) => (
                  <TarjetaAuditoria key={registro.id} registro={registro} />
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 border-t border-emerald-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-slate-500">
              Página {pagina} de {totalPaginas}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1 || cargando}
                onClick={() =>
                  setPagina((paginaActual) =>
                    Math.max(1, paginaActual - 1),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Anterior
              </button>

              <button
                type="button"
                disabled={pagina >= totalPaginas || cargando}
                onClick={() =>
                  setPagina((paginaActual) =>
                    Math.min(totalPaginas, paginaActual + 1),
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  icono,
  clase,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
  clase: string;
}) {
  return (
    <article className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-950/5">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${clase}`}
      >
        {icono}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-3xl font-black text-slate-950">{valor}</p>
    </article>
  );
}

function CampoBusqueda({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className="relative md:col-span-2 xl:col-span-1">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <input
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder="Buscar usuario..."
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function FilaAuditoria({
  registro,
}: {
  registro: AuditoriaRegistro;
}) {
  return (
    <tr className="align-top transition hover:bg-emerald-50/40">
      <td className="px-6 py-5">
        <p className="font-black text-slate-900">
          {registro.usuarioNombre || "Usuario no identificado"}
        </p>
        <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
          {registro.usuarioEmail || registro.usuarioId || "Sin correo"}
        </p>
      </td>

      <td className="px-6 py-5">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[11px] font-black uppercase text-sky-700">
          {registro.accion}
        </span>
      </td>

      <td className="px-6 py-5">
        <span className="font-black text-emerald-700">
          {registro.modulo}
        </span>
      </td>

      <td className="max-w-md px-6 py-5">
        <p className="text-sm font-semibold leading-6 text-slate-700">
          {registro.descripcion}
        </p>

        {registro.mensajeError && (
          <p className="mt-2 text-xs font-bold text-red-600">
            {registro.mensajeError}
          </p>
        )}
      </td>

      <td className="px-6 py-5">
        <Estado resultado={registro.resultado} />
      </td>

      <td className="whitespace-nowrap px-6 py-5">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Clock3 size={16} className="text-emerald-600" />
          {formatearFecha(registro.fechaRegistro)}
        </p>
      </td>
    </tr>
  );
}

function TarjetaAuditoria({
  registro,
}: {
  registro: AuditoriaRegistro;
}) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-slate-900">
            {registro.usuarioNombre || "Usuario no identificado"}
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {registro.usuarioEmail || registro.usuarioId || "Sin correo"}
          </p>
        </div>

        <Estado resultado={registro.resultado} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase text-sky-700">
          {registro.accion}
        </span>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
          {registro.modulo}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
        {registro.descripcion}
      </p>

      {registro.mensajeError && (
        <p className="mt-2 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
          {registro.mensajeError}
        </p>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
        <Clock3 size={15} />
        {formatearFecha(registro.fechaRegistro)}
      </p>
    </article>
  );
}

function Estado({
  resultado,
}: {
  resultado: ResultadoAuditoria;
}) {
  const exitoso = resultado === "EXITOSO";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
        exitoso
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {exitoso ? (
        <CheckCircle2 size={13} />
      ) : (
        <XCircle size={13} />
      )}

      {resultado}
    </span>
  );
}

function formatearFecha(fecha: string): string {
  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fechaConvertida);
}

function obtenerMensaje(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error
  ) {
    const mensaje = (error as { mensaje?: unknown }).mensaje;

    if (typeof mensaje === "string" && mensaje.trim()) {
      return mensaje;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "No se pudieron obtener los registros de auditoría.";
}

export default Auditoria;
