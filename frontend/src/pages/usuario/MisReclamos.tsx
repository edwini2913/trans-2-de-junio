import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileQuestion,
  Headphones,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";

import {
  buscarReclamoPorCodigo,
  crearReclamo,
  marcarMensajesLeidos,
  obtenerMensajeError,
  obtenerMisReclamos,
  responderReclamo,
} from "../../services/reclamos.service";

import {
  CategoriaReclamo,
  EstadoReclamo,
  PrioridadReclamo,
  TipoAutorMensaje,
  TipoReclamo,
} from "../../types/reclamo";

import type {
  CrearReclamoDto,
  MensajeReclamo,
  Reclamo,
} from "../../types/reclamo";

type VistaActual =
  | "LISTA"
  | "CREAR"
  | "DETALLE";

const FORMULARIO_INICIAL: CrearReclamoDto = {
  tipo: TipoReclamo.RECLAMO,
  categoria:
    CategoriaReclamo.ATENCION,
  prioridad:
    PrioridadReclamo.NORMAL,
  asunto: "",
  descripcion: "",
};

function formatearFecha(
  fecha?: string | null,
): string {
  if (!fecha) {
    return "Sin fecha";
  }

  const valor = new Date(fecha);

  if (
    Number.isNaN(valor.getTime())
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

function textoTipo(
  tipo: TipoReclamo,
): string {
  const textos: Record<
    TipoReclamo,
    string
  > = {
    [TipoReclamo.RECLAMO]:
      "Reclamo",

    [TipoReclamo.QUEJA]:
      "Queja",

    [TipoReclamo.CONSULTA]:
      "Consulta",

    [TipoReclamo.SUGERENCIA]:
      "Sugerencia",
  };

  return textos[tipo];
}

function textoCategoria(
  categoria: CategoriaReclamo,
): string {
  const textos: Record<
    CategoriaReclamo,
    string
  > = {
    [CategoriaReclamo.PAGO]:
      "Pago",

    [CategoriaReclamo.RESERVA]:
      "Reserva",

    [CategoriaReclamo.TICKET]:
      "Ticket",

    [CategoriaReclamo.VIAJE]:
      "Viaje",

    [CategoriaReclamo.CONDUCTOR]:
      "Conductor",

    [CategoriaReclamo.ATENCION]:
      "Atención",

    [CategoriaReclamo.OBJETO_PERDIDO]:
      "Objeto perdido",

    [CategoriaReclamo.OTRO]:
      "Otro",
  };

  return textos[categoria];
}

function textoPrioridad(
  prioridad: PrioridadReclamo,
): string {
  const textos: Record<
    PrioridadReclamo,
    string
  > = {
    [PrioridadReclamo.BAJA]:
      "Baja",

    [PrioridadReclamo.NORMAL]:
      "Normal",

    [PrioridadReclamo.ALTA]:
      "Alta",

    [PrioridadReclamo.URGENTE]:
      "Urgente",
  };

  return textos[prioridad];
}

function textoEstado(
  estado: EstadoReclamo,
): string {
  const textos: Record<
    EstadoReclamo,
    string
  > = {
    [EstadoReclamo.PENDIENTE]:
      "Pendiente",

    [EstadoReclamo.EN_REVISION]:
      "En revisión",

    [EstadoReclamo.RESPONDIDO]:
      "Respondido",

    [EstadoReclamo.CERRADO]:
      "Cerrado",
  };

  return textos[estado];
}

function claseEstado(
  estado: EstadoReclamo,
): string {
  const clases: Record<
    EstadoReclamo,
    string
  > = {
    [EstadoReclamo.PENDIENTE]:
      "border-amber-200 bg-amber-50 text-amber-700",

    [EstadoReclamo.EN_REVISION]:
      "border-sky-200 bg-sky-50 text-sky-700",

    [EstadoReclamo.RESPONDIDO]:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    [EstadoReclamo.CERRADO]:
      "border-slate-200 bg-slate-100 text-slate-700",
  };

  return clases[estado];
}

function clasePrioridad(
  prioridad: PrioridadReclamo,
): string {
  const clases: Record<
    PrioridadReclamo,
    string
  > = {
    [PrioridadReclamo.BAJA]:
      "bg-slate-100 text-slate-600",

    [PrioridadReclamo.NORMAL]:
      "bg-emerald-100 text-emerald-700",

    [PrioridadReclamo.ALTA]:
      "bg-orange-100 text-orange-700",

    [PrioridadReclamo.URGENTE]:
      "bg-red-100 text-red-700",
  };

  return clases[prioridad];
}

function EstadoBadge({
  estado,
}: {
  estado: EstadoReclamo;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${claseEstado(
        estado,
      )}`}
    >
      {textoEstado(estado)}
    </span>
  );
}

function PrioridadBadge({
  prioridad,
}: {
  prioridad: PrioridadReclamo;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${clasePrioridad(
        prioridad,
      )}`}
    >
      {textoPrioridad(
        prioridad,
      )}
    </span>
  );
}

function MensajeAlerta({
  mensaje,
  error,
  onCerrar,
}: {
  mensaje: string;
  error: boolean;
  onCerrar: () => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <div className="flex items-start gap-3">
        {error ? (
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={19}
          />
        ) : (
          <CheckCircle2
            className="mt-0.5 shrink-0"
            size={19}
          />
        )}

        <p className="text-sm font-bold leading-6">
          {mensaje}
        </p>
      </div>

      <button
        type="button"
        onClick={onCerrar}
        className="rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Cerrar mensaje"
      >
        <X size={17} />
      </button>
    </div>
  );
}

function TarjetaResumen({
  icono,
  titulo,
  cantidad,
  clase,
}: {
  icono: ReactNode;
  titulo: string;
  cantidad: number;
  clase: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${clase}`}
    >
      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/30" />

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide opacity-80">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-black">
            {cantidad}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
          {icono}
        </div>
      </div>
    </div>
  );
}

function TarjetaReclamo({
  reclamo,
  onAbrir,
}: {
  reclamo: Reclamo;

  onAbrir: (
    reclamo: Reclamo,
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onAbrir(reclamo)
      }
      className="group w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5"
    >
      <div className="h-1.5 bg-gradient-to-r from-emerald-700 via-green-500 to-lime-400" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-700">
                {reclamo.codigo}
              </span>

              <EstadoBadge
                estado={reclamo.estado}
              />

              <PrioridadBadge
                prioridad={
                  reclamo.prioridad
                }
              />
            </div>

            <h3 className="mt-3 truncate text-base font-black text-slate-950">
              {reclamo.asunto}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
              {reclamo.descripcion}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
            <ChevronRight
              size={21}
              className="transition group-hover:translate-x-0.5"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 sm:flex sm:flex-wrap sm:items-center sm:gap-x-5">
          <span className="inline-flex items-center gap-1.5">
            <FileQuestion
              size={15}
              className="text-emerald-700"
            />

            {textoTipo(
              reclamo.tipo,
            )}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Ticket
              size={15}
              className="text-emerald-700"
            />

            {textoCategoria(
              reclamo.categoria,
            )}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <MessageCircle
              size={15}
              className="text-emerald-700"
            />

            {reclamo.mensajes
              ?.length ??
              reclamo.cantidadMensajes ??
              0}{" "}
            mensajes
          </span>

          <span className="inline-flex items-center gap-1.5">
            <CalendarDays
              size={15}
              className="text-emerald-700"
            />

            {formatearFecha(
              reclamo.fechaRegistro,
            )}
          </span>
        </div>
      </div>
    </button>
  );
}

function FormularioReclamo({
  onCancelar,
  onCreado,
}: {
  onCancelar: () => void;

  onCreado: (
    reclamo: Reclamo,
  ) => void;
}) {
  const [
    formulario,
    setFormulario,
  ] = useState<CrearReclamoDto>(
    FORMULARIO_INICIAL,
  );

  const [
    ticketId,
    setTicketId,
  ] = useState("");

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    esError,
    setEsError,
  ] = useState(false);

  function actualizarCampo<
    K extends keyof CrearReclamoDto,
  >(
    campo: K,
    valor: CrearReclamoDto[K],
  ) {
    setFormulario(
      (actual) => ({
        ...actual,
        [campo]: valor,
      }),
    );
  }

  async function enviarFormulario(
    event: FormEvent,
  ) {
    event.preventDefault();

    setMensaje("");
    setEsError(false);

    if (
      formulario.asunto
        .trim()
        .length < 5
    ) {
      setEsError(true);

      setMensaje(
        "El asunto debe tener al menos 5 caracteres.",
      );

      return;
    }

    if (
      formulario.descripcion
        .trim()
        .length < 10
    ) {
      setEsError(true);

      setMensaje(
        "La descripción debe tener al menos 10 caracteres.",
      );

      return;
    }

    try {
      setProcesando(true);

      const respuesta =
        await crearReclamo({
          ...formulario,

          asunto:
            formulario.asunto.trim(),

          descripcion:
            formulario.descripcion.trim(),

          ticketId:
            ticketId.trim() ||
            undefined,
        });

      onCreado(
        respuesta.reclamo,
      );
    } catch (error) {
      setEsError(true);

      setMensaje(
        obtenerMensajeError(error),
      );
    } finally {
      setProcesando(false);
    }
  }
    return (
    <div className="mx-auto max-w-5xl">
      <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-[40px] border-white/10" />

        <div className="absolute bottom-0 right-48 h-24 w-24 rounded-full bg-lime-300/10" />

        <div className="relative z-10 flex items-center gap-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
            <Headphones size={27} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
              Atención al pasajero
            </p>

            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Nuevo reclamo
            </h1>

            <p className="mt-1 text-sm text-emerald-50/90">
              Cuéntanos qué ocurrió para poder ayudarte.
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={enviarFormulario}
        className="overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5"
      >
        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-5 sm:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
              <Sparkles size={22} />
            </div>

            <div>
              <h2 className="font-black text-slate-950">
                Información de la solicitud
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Selecciona el tipo de solicitud y describe el problema con claridad.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-8">
          {mensaje && (
            <MensajeAlerta
              mensaje={mensaje}
              error={esError}
              onCerrar={() =>
                setMensaje("")
              }
            />
          )}

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                1
              </span>

              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Clasifica tu solicitud
                </h3>

                <p className="text-xs text-slate-500">
                  Esto nos ayudará a atenderte correctamente.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-black text-slate-700">
                  Tipo de solicitud
                </span>

                <select
                  value={formulario.tipo}
                  onChange={(event) =>
                    actualizarCampo(
                      "tipo",
                      event.target
                        .value as TipoReclamo,
                    )
                  }
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                >
                  {Object.values(
                    TipoReclamo,
                  ).map((tipo) => (
                    <option
                      key={tipo}
                      value={tipo}
                    >
                      {textoTipo(tipo)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black text-slate-700">
                  Categoría
                </span>

                <select
                  value={
                    formulario.categoria
                  }
                  onChange={(event) =>
                    actualizarCampo(
                      "categoria",
                      event.target
                        .value as CategoriaReclamo,
                    )
                  }
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                >
                  {Object.values(
                    CategoriaReclamo,
                  ).map(
                    (categoria) => (
                      <option
                        key={categoria}
                        value={categoria}
                      >
                        {textoCategoria(
                          categoria,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-black text-slate-700">
                Prioridad
              </span>

              <select
                value={
                  formulario.prioridad
                }
                onChange={(event) =>
                  actualizarCampo(
                    "prioridad",
                    event.target
                      .value as PrioridadReclamo,
                  )
                }
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              >
                {Object.values(
                  PrioridadReclamo,
                ).map(
                  (prioridad) => (
                    <option
                      key={prioridad}
                      value={prioridad}
                    >
                      {textoPrioridad(
                        prioridad,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>
          </section>

          <div className="border-t border-emerald-100" />

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                2
              </span>

              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Describe lo ocurrido
                </h3>

                <p className="text-xs text-slate-500">
                  Agrega un asunto corto y una explicación detallada.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-black text-slate-700">
                  Asunto
                </span>

                <input
                  type="text"
                  value={
                    formulario.asunto
                  }
                  onChange={(event) =>
                    actualizarCampo(
                      "asunto",
                      event.target.value,
                    )
                  }
                  maxLength={180}
                  placeholder="Ejemplo: Tuve un problema con mi ticket QR"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />

                <div className="text-right text-[11px] text-slate-400">
                  {
                    formulario.asunto
                      .length
                  }
                  /180
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-black text-slate-700">
                  Descripción
                </span>

                <textarea
                  value={
                    formulario.descripcion
                  }
                  onChange={(event) =>
                    actualizarCampo(
                      "descripcion",
                      event.target.value,
                    )
                  }
                  rows={7}
                  maxLength={3000}
                  placeholder="Explícanos detalladamente qué ocurrió, cuándo sucedió y cómo podemos ayudarte..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />

                <div className="text-right text-[11px] text-slate-400">
                  {
                    formulario
                      .descripcion.length
                  }
                  /3000 caracteres
                </div>
              </label>
            </div>
          </section>

          <div className="border-t border-emerald-100" />

          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-700">
                3
              </span>

              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Ticket relacionado
                </h3>

                <p className="text-xs text-slate-500">
                  Completa este campo solamente si el problema corresponde a un ticket.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <label className="block space-y-2">
                <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <Ticket
                    size={17}
                    className="text-emerald-700"
                  />

                  Identificador del ticket
                  <span className="font-semibold text-slate-400">
                    (opcional)
                  </span>
                </span>

                <input
                  type="text"
                  value={ticketId}
                  onChange={(event) =>
                    setTicketId(
                      event.target.value,
                    )
                  }
                  placeholder="Pega aquí el identificador de tu ticket"
                  className="h-14 w-full rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>

              <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-emerald-800">
                <CircleHelp
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  Puedes dejar este campo vacío si tu solicitud no está relacionada con una compra.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <ShieldCheck size={20} />
            </div>

            <div>
              <p className="text-sm font-black text-emerald-900">
                Tu solicitud será atendida
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                La administración recibirá una notificación y podrás seguir la respuesta desde esta sección.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-emerald-100 bg-slate-50 px-5 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            className="h-13 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-black text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={procesando}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:from-emerald-800 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {procesando ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  size={19}
                />

                Registrando...
              </>
            ) : (
              <>
                <Plus size={19} />
                Crear reclamo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function BurbujaMensaje({
  mensaje,
}: {
  mensaje: MensajeReclamo;
}) {
  const esUsuario =
    mensaje.tipoAutor ===
    TipoAutorMensaje.USUARIO;

  return (
    <div
      className={`flex ${
        esUsuario
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
          esUsuario
            ? "rounded-br-md bg-emerald-700 text-white"
            : "rounded-bl-md border border-emerald-100 bg-white text-slate-800"
        }`}
      >
        <div
          className={`mb-1 text-xs font-black ${
            esUsuario
              ? "text-emerald-100"
              : "text-emerald-700"
          }`}
        >
          {esUsuario
            ? "Tú"
            : "Atención al cliente"}
        </div>

        <p className="whitespace-pre-wrap break-words text-sm leading-6">
          {mensaje.mensaje}
        </p>

        <div
          className={`mt-2 text-right text-[11px] ${
            esUsuario
              ? "text-emerald-100"
              : "text-slate-400"
          }`}
        >
          {formatearFecha(
            mensaje.fechaRegistro,
          )}
        </div>
      </div>
    </div>
  );
}

function DetalleReclamo({
  reclamoInicial,
  onVolver,
  onActualizar,
}: {
  reclamoInicial: Reclamo;
  onVolver: () => void;

  onActualizar: (
    reclamo: Reclamo,
  ) => void;
}) {
  const [
    reclamo,
    setReclamo,
  ] = useState(
    reclamoInicial,
  );

  const [
    respuesta,
    setRespuesta,
  ] = useState("");

  const [
    procesando,
    setProcesando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    esError,
    setEsError,
  ] = useState(false);

  useEffect(() => {
    setReclamo(
      reclamoInicial,
    );
  }, [reclamoInicial]);

  useEffect(() => {
    marcarMensajesLeidos(
      reclamoInicial.id,
    ).catch(() => {
      // No bloqueamos la pantalla
      // si falla el marcado.
    });
  }, [reclamoInicial.id]);

  async function enviarRespuesta(
    event: FormEvent,
  ) {
    event.preventDefault();

    const mensajeLimpio =
      respuesta.trim();

    if (
      mensajeLimpio.length < 2
    ) {
      setEsError(true);

      setMensaje(
        "Escribe un mensaje antes de enviarlo.",
      );

      return;
    }

    try {
      setProcesando(true);
      setMensaje("");
      setEsError(false);

      const resultado =
        await responderReclamo(
          reclamo.id,
          {
            mensaje:
              mensajeLimpio,
          },
        );

      setReclamo(
        resultado.reclamo,
      );

      onActualizar(
        resultado.reclamo,
      );

      setRespuesta("");

      setMensaje(
        "Mensaje enviado correctamente.",
      );
    } catch (error) {
      setEsError(true);

      setMensaje(
        obtenerMensajeError(error),
      );
    } finally {
      setProcesando(false);
    }
  }

  const estaCerrado =
    reclamo.estado ===
    EstadoReclamo.CERRADO;
      return (
    <div className="mx-auto max-w-6xl">
      <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-6 text-white shadow-xl shadow-emerald-900/15">
        <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full border-[38px] border-white/10" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={onVolver}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ArrowLeft size={21} />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-mono text-xl font-black sm:text-2xl">
                  {reclamo.codigo}
                </h1>

                <EstadoBadge
                  estado={reclamo.estado}
                />
              </div>

              <p className="mt-1 truncate text-sm text-emerald-100">
                {reclamo.asunto}
              </p>
            </div>
          </div>

          <PrioridadBadge
            prioridad={
              reclamo.prioridad
            }
          />
        </div>
      </section>

      {mensaje && (
        <div className="mb-5">
          <MensajeAlerta
            mensaje={mensaje}
            error={esError}
            onCerrar={() =>
              setMensaje("")
            }
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600">
                Información
              </p>

              <h2 className="mt-1 font-black text-slate-950">
                Detalles del reclamo
              </h2>
            </div>

            <div className="space-y-4 p-5">
              <DatoDetalle
                etiqueta="Asunto"
                valor={reclamo.asunto}
              />

              <DatoDetalle
                etiqueta="Tipo"
                valor={textoTipo(
                  reclamo.tipo,
                )}
              />

              <DatoDetalle
                etiqueta="Categoría"
                valor={textoCategoria(
                  reclamo.categoria,
                )}
              />

              <DatoDetalle
                etiqueta="Fecha de registro"
                valor={formatearFecha(
                  reclamo.fechaRegistro,
                )}
              />

              {reclamo.ticket && (
                <DatoDetalle
                  etiqueta="Ticket"
                  valor={
                    reclamo.ticket
                      .codigoTicket ||
                    reclamo.ticket
                      .numeroTicket ||
                    reclamo.ticket.id
                  }
                />
              )}
            </div>
          </section>

          {reclamo.respuestaFinal && (
            <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                  <CheckCircle2
                    size={20}
                  />
                </div>

                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Respuesta final
                </p>
              </div>

              <p className="mt-4 text-sm leading-7 text-emerald-900">
                {
                  reclamo.respuestaFinal
                }
              </p>
            </section>
          )}

          <section className="rounded-[26px] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-sm font-black text-slate-900">
                  Seguimiento seguro
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Todas las respuestas quedan registradas en el historial de tu solicitud.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <section className="flex min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5">
          <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <MessageCircle
                  size={20}
                />
              </div>

              <div>
                <h3 className="font-black text-slate-950">
                  Conversación
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Historial con atención al cliente
                </p>
              </div>
            </div>

            <span className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-black text-emerald-700">
              {reclamo.mensajes?.length ??
                0}{" "}
              mensajes
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f6fbf8] p-5">
            {reclamo.mensajes &&
            reclamo.mensajes.length >
              0 ? (
              reclamo.mensajes.map(
                (item) => (
                  <BurbujaMensaje
                    key={item.id}
                    mensaje={item}
                  />
                ),
              )
            ) : (
              <div className="flex h-full min-h-72 flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <MessageCircle
                    size={31}
                  />
                </div>

                <p className="mt-4 font-black text-slate-700">
                  No hay mensajes
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  La conversación aparecerá aquí.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-emerald-100 bg-white p-4">
            {estaCerrado ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-4 text-sm font-black text-slate-600">
                <CheckCircle2
                  size={19}
                />

                Este reclamo está cerrado.
              </div>
            ) : (
              <form
                onSubmit={
                  enviarRespuesta
                }
                className="flex items-end gap-3"
              >
                <textarea
                  value={respuesta}
                  onChange={(event) =>
                    setRespuesta(
                      event.target.value,
                    )
                  }
                  rows={2}
                  placeholder="Escribe tu mensaje..."
                  className="min-h-14 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />

                <button
                  type="submit"
                  disabled={
                    procesando ||
                    respuesta.trim()
                      .length < 2
                  }
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  aria-label="Enviar mensaje"
                >
                  {procesando ? (
                    <LoaderCircle
                      className="animate-spin"
                      size={21}
                    />
                  ) : (
                    <Send size={21} />
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function DatoDetalle({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {etiqueta}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-700">
        {valor}
      </p>
    </div>
  );
}

export default function MisReclamos() {
  const [
    vista,
    setVista,
  ] = useState<VistaActual>(
    "LISTA",
  );

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
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    esError,
    setEsError,
  ] = useState(false);

  const cargarReclamos =
    useCallback(
      async (
        mostrarCargaCompleta = true,
      ) => {
        try {
          if (
            mostrarCargaCompleta
          ) {
            setCargando(true);
          } else {
            setActualizando(true);
          }

          setMensaje("");
          setEsError(false);

          const datos =
            await obtenerMisReclamos();

          setReclamos(
            Array.isArray(datos)
              ? datos
              : [],
          );
        } catch (error) {
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
    void cargarReclamos();
  }, [cargarReclamos]);

  const reclamosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return reclamos;
      }

      return reclamos.filter(
        (reclamo) =>
          reclamo.codigo
            .toLowerCase()
            .includes(texto) ||
          reclamo.asunto
            .toLowerCase()
            .includes(texto) ||
          reclamo.descripcion
            .toLowerCase()
            .includes(texto) ||
          textoCategoria(
            reclamo.categoria,
          )
            .toLowerCase()
            .includes(texto),
      );
    }, [
      busqueda,
      reclamos,
    ]);

  const resumen = useMemo(
    () => ({
      total: reclamos.length,

      pendientes:
        reclamos.filter(
          (item) =>
            item.estado ===
            EstadoReclamo.PENDIENTE,
        ).length,

      revision:
        reclamos.filter(
          (item) =>
            item.estado ===
            EstadoReclamo.EN_REVISION,
        ).length,

      respondidos:
        reclamos.filter(
          (item) =>
            item.estado ===
            EstadoReclamo.RESPONDIDO,
        ).length,
    }),
    [reclamos],
  );

  async function buscarPorCodigo() {
    const codigo =
      busqueda.trim();

    if (
      !codigo
        .toUpperCase()
        .startsWith("REC-")
    ) {
      return;
    }

    try {
      setActualizando(true);
      setMensaje("");
      setEsError(false);

      const encontrado =
        await buscarReclamoPorCodigo(
          codigo,
        );

      setReclamoSeleccionado(
        encontrado,
      );

      setVista("DETALLE");
    } catch (error) {
      setEsError(true);

      setMensaje(
        obtenerMensajeError(error),
      );
    } finally {
      setActualizando(false);
    }
  }

  function abrirReclamo(
    reclamo: Reclamo,
  ) {
    setReclamoSeleccionado(
      reclamo,
    );

    setVista("DETALLE");
    setMensaje("");
  }

  function reclamoCreado(
    reclamo: Reclamo,
  ) {
    setReclamos(
      (actuales) => [
        reclamo,
        ...actuales,
      ],
    );

    setReclamoSeleccionado(
      reclamo,
    );

    setMensaje(
      "Reclamo registrado correctamente.",
    );

    setEsError(false);
    setVista("DETALLE");
  }

  function actualizarReclamo(
    reclamoActualizado: Reclamo,
  ) {
    setReclamos(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id ===
            reclamoActualizado.id
              ? reclamoActualizado
              : item,
        ),
    );

    setReclamoSeleccionado(
      reclamoActualizado,
    );
  }

  if (vista === "CREAR") {
    return (
      <div className="min-h-screen bg-[#f2f8f4] px-4 py-6 sm:px-6 lg:px-8">
        <FormularioReclamo
          onCancelar={() =>
            setVista("LISTA")
          }
          onCreado={
            reclamoCreado
          }
        />
      </div>
    );
  }

  if (
    vista === "DETALLE" &&
    reclamoSeleccionado
  ) {
    return (
      <div className="min-h-screen bg-[#f2f8f4] px-4 py-6 sm:px-6 lg:px-8">
        <DetalleReclamo
          reclamoInicial={
            reclamoSeleccionado
          }
          onVolver={() => {
            setVista("LISTA");

            void cargarReclamos(
              false,
            );
          }}
          onActualizar={
            actualizarReclamo
          }
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f8f4] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 px-6 py-8 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[45px] border-white/10" />

          <div className="absolute bottom-0 right-52 h-28 w-28 rounded-full bg-lime-300/10" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                <Headphones size={28} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
                  Atención al cliente
                </p>

                <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                  Mis reclamos
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                  Consulta el estado de tus solicitudes y conversa directamente con nuestro equipo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setVista("CREAR")
              }
              className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 lg:self-center"
            >
              <Plus size={19} />
              Nuevo reclamo
            </button>
          </div>
        </section>

        {mensaje && (
          <div className="mt-5">
            <MensajeAlerta
              mensaje={mensaje}
              error={esError}
              onCerrar={() =>
                setMensaje("")
              }
            />
          </div>
        )}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <TarjetaResumen
            icono={
              <FileQuestion
                size={21}
              />
            }
            titulo="Total"
            cantidad={resumen.total}
            clase="border-slate-200 bg-white text-slate-800"
          />

          <TarjetaResumen
            icono={
              <CircleHelp
                size={21}
              />
            }
            titulo="Pendientes"
            cantidad={
              resumen.pendientes
            }
            clase="border-amber-200 bg-amber-50 text-amber-800"
          />

          <TarjetaResumen
            icono={
              <RefreshCw
                size={21}
              />
            }
            titulo="En revisión"
            cantidad={
              resumen.revision
            }
            clase="border-sky-200 bg-sky-50 text-sky-800"
          />

          <TarjetaResumen
            icono={
              <CheckCircle2
                size={21}
              />
            }
            titulo="Respondidos"
            cantidad={
              resumen.respondidos
            }
            clase="border-emerald-200 bg-emerald-50 text-emerald-800"
          />
        </section>

        <section className="mt-6 flex flex-col gap-3 rounded-[24px] border border-emerald-100 bg-white p-4 shadow-lg shadow-emerald-900/5 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
              size={19}
            />

            <input
              type="search"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  void buscarPorCodigo();
                }
              }}
              placeholder="Buscar por código, asunto o categoría..."
              className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void cargarReclamos(
                false,
              )
            }
            disabled={actualizando}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={
                actualizando
                  ? "animate-spin"
                  : ""
              }
              size={18}
            />

            Actualizar
          </button>
        </section>

        {cargando ? (
          <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5">
            <LoaderCircle
              className="animate-spin text-emerald-700"
              size={40}
            />

            <p className="mt-4 font-black text-slate-600">
              Cargando reclamos...
            </p>
          </section>
        ) : reclamosFiltrados.length ===
          0 ? (
          <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-emerald-200 bg-white px-6 text-center shadow-lg shadow-emerald-900/5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
              <FileQuestion
                size={39}
              />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              No hay reclamos
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Todavía no registraste ninguna solicitud o no existen resultados para la búsqueda realizada.
            </p>

            <button
              type="button"
              onClick={() =>
                setVista("CREAR")
              }
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 text-sm font-black text-white shadow-md shadow-emerald-700/20 transition hover:bg-emerald-800"
            >
              <Plus size={18} />
              Crear reclamo
            </button>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            {reclamosFiltrados.map(
              (reclamo) => (
                <TarjetaReclamo
                  key={reclamo.id}
                  reclamo={reclamo}
                  onAbrir={
                    abrirReclamo
                  }
                />
              ),
            )}
          </section>
        )}

        <section className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck size={20} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-900">
              Tus solicitudes están protegidas
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Solo tú y el personal autorizado pueden consultar la conversación y sus datos relacionados.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}