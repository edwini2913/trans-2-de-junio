import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Armchair,
  Bell,
  RefreshCw,
  Navigation,
  Loader2,
  Phone,
  ChevronDown,
  BusFront,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import LectorQr from "../../components/qr/LectorQr";

import {
  obtenerMisTurnosRecojoChofer,
  obtenerMisRecojosChofer,
  marcarResultadoRecojoChofer,
  obtenerEnlaceMapaRecojo,
} from "../../services/salidas-rapidas.service";

import type {
  SolicitudRecojo,
  TurnoRecojoChofer,
} from "../../services/salidas-rapidas.service";


import {
  obtenerTicketPorToken,
  validarTicket,
} from "../../services/tickets.service";

type EstadoResultado =
  | "INICIAL"
  | "COMPROBADO"
  | "AUTORIZADO"
  | "UTILIZADO"
  | "ERROR";

type AsientoTicket = {
  id?: string;
  numero?: number | string;
  estado?: string;
};

type UsuarioTicket = {
  nombre?: string;
  apellido?: string;
  ci?: string;
};

type RutaTicket = {
  origen?: string;
  destino?: string;
};

type VehiculoTicket = {
  marca?: string;
  modelo?: string;
  placa?: string;
};

type ViajeTicket = {
  fecha?: string;
  horaSalida?: string;
  ruta?: RutaTicket | null;
  vehiculo?: VehiculoTicket | null;
};

type ReservaTicket = {
  codigoReserva?: string;
  estado?: string;
  usuario?: UsuarioTicket | null;
  viaje?: ViajeTicket | null;
  asientos?: AsientoTicket[];
};

type TicketEscaneado = {
  id?: string;
  codigoTicket?: string;
  estado?: string;
  fechaUso?: string | null;
  cantidadAsientos?: number;
  asientoNumeros?: Array<number | string>;
  asientos?: AsientoTicket[];
  reserva?: ReservaTicket | null;
  origen?: string | null;
  destino?: string | null;
  blockchain?: {
    autentico?: boolean;
    cadenaValida?: boolean;
    registrado?: boolean;
    mensaje?: string;
    bloque?: {
      indice?: string;
      hashBloque?: string;
    } | null;
  };
};

function EscanearTicket() {
  const [mostrarRecojos, setMostrarRecojos] = useState(false);

  const procesandoRef = useRef(false);

  const [estado, setEstado] =
    useState<EstadoResultado>("INICIAL");

  const [mensaje, setMensaje] = useState(
    "Presiona Iniciar escáner y apunta la cámara hacia el código QR.",
  );

  const [ticket, setTicket] =
    useState<TicketEscaneado | null>(null);

  const [tokenActual, setTokenActual] = useState("");

  const [procesando, setProcesando] = useState(false);

  const [scannerActivo, setScannerActivo] = useState(false);

  /* ========================================
     LEER Y COMPROBAR EL CÓDIGO QR
     Esta acción NO consume el ticket.
  ======================================== */

  const procesarCodigoQr = useCallback(
    async (contenidoQr: string) => {
      if (procesandoRef.current) return;

      procesandoRef.current = true;
      setProcesando(true);
      setScannerActivo(false);

      try {
        const token = extraerToken(contenidoQr);

        if (!token) {
          throw new Error(
            "El código QR no pertenece al sistema Trans 2 de Junio.",
          );
        }

        setTokenActual(token);

        const ticketEncontrado =
          await obtenerTicketPorToken(token);

        setTicket(ticketEncontrado);

        if (!ticketEncontrado?.blockchain?.autentico) {
          setEstado("ERROR");
          setMensaje(
            ticketEncontrado?.blockchain?.mensaje ||
              "No se pudo comprobar la autenticidad del ticket.",
          );
          return;
        }

        if (ticketEncontrado.estado === "UTILIZADO") {
          setEstado("UTILIZADO");
          setMensaje(
            "Este ticket ya fue utilizado y no permite un segundo abordaje.",
          );
          return;
        }

        if (ticketEncontrado.estado === "CANCELADO") {
          setEstado("ERROR");
          setMensaje(
            "Este ticket está cancelado y no puede utilizarse.",
          );
          return;
        }

        if (ticketEncontrado.estado !== "VALIDO") {
          setEstado("ERROR");
          setMensaje(
            `El ticket tiene estado ${
              ticketEncontrado.estado || "DESCONOCIDO"
            } y no puede utilizarse.`,
          );
          return;
        }

        if (
          ticketEncontrado.reserva?.estado !== "CONFIRMADA"
        ) {
          setEstado("ERROR");
          setMensaje(
            "La reserva asociada al ticket no está confirmada.",
          );
          return;
        }

        setEstado("COMPROBADO");
        setMensaje(
          "Ticket auténtico y vigente. Comprueba los datos antes de autorizar el abordaje.",
        );
      } catch (error: unknown) {
        setTicket(null);
        setTokenActual("");
        setEstado("ERROR");
        setMensaje(obtenerMensajeError(error));
      } finally {
        setProcesando(false);
        procesandoRef.current = false;
      }
    },
    [],
  );

  /* ========================================
     CONTROLES DEL ESCÁNER
  ======================================== */

  const iniciarEscaner = () => {
    if (procesando) return;

    setTicket(null);
    setTokenActual("");
    setEstado("INICIAL");
    setMensaje(
      "Apunta la cámara hacia el código QR del ticket.",
    );

    procesandoRef.current = false;
    setScannerActivo(true);
  };

  const detenerEscaner = () => {
    if (procesando) return;

    setScannerActivo(false);
    setMensaje(
      "La cámara está desactivada. Presiona Iniciar escáner para continuar.",
    );
  };

  const reiniciarEscaner = () => {
    if (procesando) return;

    setScannerActivo(false);
    setTicket(null);
    setTokenActual("");
    setEstado("INICIAL");
    setMensaje(
      "Apunta la cámara hacia el código QR del siguiente ticket.",
    );

    procesandoRef.current = false;

    window.setTimeout(() => {
      setScannerActivo(true);
    }, 150);
  };

  /* ========================================
     AUTORIZACIÓN DE ABORDAJE
     El backend valida y consume el ticket.
  ======================================== */

  const autorizarAbordaje = async () => {
    if (
      !tokenActual ||
      estado !== "COMPROBADO" ||
      procesando ||
      procesandoRef.current
    ) {
      return;
    }

    const confirmado = window.confirm(
      "¿Confirmas que revisaste los datos y deseas autorizar el abordaje? El ticket quedará marcado como UTILIZADO.",
    );

    if (!confirmado) return;

    procesandoRef.current = true;

    try {
      setProcesando(true);

      const respuesta = await validarTicket(tokenActual);

      setTicket(respuesta.ticket);
      setEstado("AUTORIZADO");
      setMensaje(
        respuesta.mensaje ||
          "Pasajero autorizado para abordar. Ticket utilizado correctamente.",
      );
    } catch (error: unknown) {
      const mensajeError = obtenerMensajeError(error);

      if (
        mensajeError.toLowerCase().includes("utilizado")
      ) {
        setEstado("UTILIZADO");
      } else {
        setEstado("ERROR");
      }

      setMensaje(mensajeError);
    } finally {
      setProcesando(false);
      procesandoRef.current = false;
    }
  };

  /* ========================================
     INFORMACIÓN DEL TICKET
  ======================================== */

  const reserva = ticket?.reserva;
  const usuario = reserva?.usuario;
  const viaje = reserva?.viaje;
  const ruta = viaje?.ruta;
  const vehiculo = viaje?.vehiculo;

  const numerosAsientos =
    obtenerNumerosAsientos(ticket);

  const textoAsientos =
    numerosAsientos.length > 0
      ? numerosAsientos.map((n) => `#${n}`).join(", ")
      : "---";

  const resultadoPositivo =
    estado === "COMPROBADO" ||
    estado === "AUTORIZADO";

  const resultadoNegativo =
    estado === "UTILIZADO" ||
    estado === "ERROR";

  const mostrarResultado = estado !== "INICIAL";

  const tituloResultado =
    estado === "AUTORIZADO"
      ? "ABORDAJE AUTORIZADO"
      : estado === "COMPROBADO"
        ? "TICKET VÁLIDO"
        : estado === "UTILIZADO"
          ? "TICKET YA UTILIZADO"
          : estado === "ERROR"
            ? "TICKET NO VÁLIDO"
            : "Esperando lectura";

  /* ========================================
     DISEÑO RESPONSIVO
  ======================================== */

  return (
    <div className="min-h-screen bg-[#f3f8f5] pb-8 text-slate-900">
      {/* ENCABEZADO */}

      <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-700 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-12 sm:w-12">
              <QrCode size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100 sm:text-xs">
                Trans 2 de Junio · Control de abordaje
              </p>

              <h1 className="text-lg font-extrabold leading-tight sm:text-2xl">
                Validar ticket QR
              </h1>
            </div>
          </div>

          <Link
            to="/admin"
            aria-label="Volver al panel"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25 sm:h-auto sm:w-auto sm:gap-2 sm:bg-white sm:px-4 sm:py-2.5 sm:font-bold sm:text-emerald-900"
          >
            <ArrowLeft size={19} />

            <span className="hidden sm:inline">
              Volver al panel
            </span>
          </Link>
        </div>
      </header>

      {/* CONTENIDO */}

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-7">
        {/* ACCESO A RECOJOS: CONEXIÓN PENDIENTE */}

        <section className="mb-5 overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <button
            type="button"
            aria-expanded={mostrarRecojos}
            aria-controls="panel-recojos-chofer"
            onClick={() =>
              setMostrarRecojos((actual) => !actual)
            }
            className="flex min-h-16 w-full items-center gap-3 bg-emerald-700 px-4 py-4 text-left text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:px-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Bell size={23} aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold">
                Pasajeros por recoger
              </span>

              <span className="mt-0.5 block text-xs text-emerald-50 sm:text-sm">
                Solicitudes y lugares de recojo
              </span>
            </span>

            <ChevronDown
              size={22}
              aria-hidden="true"
              className={`shrink-0 transition-transform ${
                mostrarRecojos ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            id="panel-recojos-chofer"
            hidden={!mostrarRecojos}
            className="p-4 sm:p-5"
          >
            {mostrarRecojos && <MisRecojosChofer />}
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* ESCÁNER */}
          {/* Se oculta en móvil después de leer un QR */}

          <section
            className={`${
              mostrarResultado && !scannerActivo
                ? "hidden lg:block"
                : "block"
            } rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5`}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <QrCode size={21} />
              </div>

              <div>
                <h2 className="text-base font-extrabold">
                  Escanear código QR
                </h2>

                <p className="text-xs text-slate-500">
                  Apunta la cámara al ticket
                </p>
              </div>
            </div>

            <LectorQr
              activo={scannerActivo}
              procesando={procesando}
              onCodigoDetectado={procesarCodigoQr}
              onEstadoActivo={() => {}}
            />

            {!scannerActivo ? (
              <button
                type="button"
                onClick={iniciarEscaner}
                disabled={procesando}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                <Camera size={19} />
                Iniciar escáner
              </button>
            ) : (
              <button
                type="button"
                onClick={detenerEscaner}
                disabled={procesando}
                className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bold text-red-700 disabled:opacity-60"
              >
                <XCircle size={19} />
                Detener cámara
              </button>
            )}

            {mostrarResultado && (
              <button
                type="button"
                onClick={reiniciarEscaner}
                disabled={procesando}
                className="mt-2 hidden min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800 disabled:opacity-60 lg:flex"
              >
                <RotateCcw size={17} />
                Escanear otro ticket
              </button>
            )}
          </section>

          {/* RESULTADO DEL TICKET */}

          <section
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
              resultadoPositivo
                ? "border-emerald-200"
                : resultadoNegativo
                  ? "border-red-200"
                  : "border-slate-200"
            }`}
          >
            {/* ESTADO COMPACTO */}

            <div
              className={`px-4 py-4 sm:px-6 sm:py-5 ${
                resultadoPositivo
                  ? "bg-emerald-50/70"
                  : resultadoNegativo
                    ? "bg-red-50/60"
                    : "bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ${
                    resultadoPositivo
                      ? "text-emerald-600"
                      : resultadoNegativo
                        ? "text-red-600"
                        : "text-slate-400"
                  }`}
                >
                  {estado === "AUTORIZADO" ? (
                    <CheckCircle2 size={28} />
                  ) : estado === "COMPROBADO" ? (
                    <ShieldCheck size={28} />
                  ) : resultadoNegativo ? (
                    <XCircle size={28} />
                  ) : (
                    <QrCode size={26} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2
                    className={`text-lg font-black leading-tight sm:text-2xl ${
                      resultadoPositivo
                        ? "text-emerald-800"
                        : resultadoNegativo
                          ? "text-red-700"
                          : "text-slate-700"
                    }`}
                  >
                    {tituloResultado}
                  </h2>

                  <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {mensaje}
                  </p>
                </div>
              </div>
            </div>

            {/* DATOS DEL TICKET */}

            {ticket && (
              <div className="space-y-4 p-4 sm:p-6">
                {/* BLOCKCHAIN */}

                <div
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                    ticket.blockchain?.autentico
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {ticket.blockchain?.autentico ? (
                    <ShieldCheck
                      size={21}
                      className="shrink-0"
                    />
                  ) : (
                    <XCircle
                      size={21}
                      className="shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-extrabold sm:text-sm">
                      {ticket.blockchain?.autentico
                        ? "Verificado en Blockchain"
                        : "Sin autenticidad Blockchain"}
                    </p>

                    <p className="text-[11px] leading-relaxed opacity-80 sm:text-xs">
                      {ticket.blockchain?.autentico
                        ? `Bloque #${
                            ticket.blockchain.bloque?.indice ??
                            "---"
                          } · Cadena íntegra`
                        : ticket.blockchain?.mensaje ||
                          "No registrado"}
                    </p>
                  </div>
                </div>

                {/* PASAJERO Y NÚMERO DEL TICKET */}

                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pasajero
                    </p>

                    <p className="mt-1 break-words text-base font-extrabold leading-tight text-slate-900">
                      {`${usuario?.nombre || "Pasajero"} ${
                        usuario?.apellido || ""
                      }`.trim()}
                    </p>
                  </div>

                  <div className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-right">
                    <p className="text-[9px] font-bold uppercase text-slate-400">
                      Ticket
                    </p>

                    <p className="text-xs font-black text-slate-900">
                      {ticket.codigoTicket || "---"}
                    </p>
                  </div>
                </div>

                {/* RUTA */}

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ruta
                  </p>

                  <p className="mt-1 flex items-center gap-2 text-sm font-extrabold text-slate-900 sm:text-base">
                    <MapPin
                      size={17}
                      className="shrink-0 text-emerald-700"
                    />

                    <span className="break-words">
                      {ruta?.origen || ticketOrigen(ticket)}
                      {" → "}
                      {ruta?.destino || ticketDestino(ticket)}
                    </span>
                  </p>
                </div>

                {/* FECHA, HORA Y ASIENTOS */}

                <div className="grid grid-cols-3 gap-2">
                  <Dato
                    titulo="Fecha"
                    valor={formatearFechaCorta(viaje?.fecha)}
                    icono={<CalendarDays size={16} />}
                  />

                  <Dato
                    titulo="Hora"
                    valor={formatearHora(viaje?.horaSalida)}
                    icono={<Clock size={16} />}
                  />

                  <Dato
                    titulo={
                      numerosAsientos.length === 1
                        ? "Asiento"
                        : "Asientos"
                    }
                    valor={textoAsientos}
                    icono={<Armchair size={16} />}
                  />
                </div>

                {/* VEHÍCULO */}

                <div className="grid grid-cols-2 gap-2">
                  <Dato
                    titulo="Vehículo"
                    valor={`${vehiculo?.marca || "---"} ${
                      vehiculo?.modelo || ""
                    }`.trim()}
                    icono={<BusFront size={16} />}
                  />

                  <Dato
                    titulo="Placa"
                    valor={vehiculo?.placa || "---"}
                  />
                </div>

                {/* CONFIRMACIÓN DE ABORDAJE */}

                {estado === "COMPROBADO" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs leading-relaxed text-emerald-900">
                      Comprueba los datos antes de autorizar.
                      Esta acción marcará el ticket como{" "}
                      <strong>UTILIZADO</strong>.
                    </p>

                    <button
                      type="button"
                      onClick={() => void autorizarAbordaje()}
                      disabled={procesando}
                      className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {procesando ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Autorizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={19} />
                          Autorizar abordaje
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* BOTÓN MÓVIL PARA ESCANEAR OTRO */}

            {mostrarResultado && (
              <div className="border-t border-slate-100 px-4 py-3 lg:hidden">
                <button
                  type="button"
                  onClick={reiniciarEscaner}
                  disabled={procesando}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800 disabled:opacity-60"
                >
                  <RotateCcw size={18} />
                  Escanear otro ticket
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ========================================
   EXTRAER TOKEN DEL QR
======================================== */

function extraerToken(contenido: string): string {
  const valor = contenido.trim();

  if (!valor) return "";

  try {
    const url = new URL(valor);
    const partes = url.pathname.split("/").filter(Boolean);
    const indice = partes.indexOf("validar-ticket");

    return indice >= 0 && partes[indice + 1]
      ? partes[indice + 1]
      : "";
  } catch {
    const patronUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return patronUuid.test(valor) ? valor : "";
  }
}

/* ========================================
   OBTENER ASIENTOS
======================================== */

function obtenerNumerosAsientos(
  ticket: TicketEscaneado | null,
): Array<number | string> {
  if (Array.isArray(ticket?.asientoNumeros)) {
    return ticket.asientoNumeros.filter(
      (numero) => String(numero).trim() !== "",
    );
  }

  const asientos = Array.isArray(ticket?.asientos)
    ? ticket.asientos
    : Array.isArray(ticket?.reserva?.asientos)
      ? ticket.reserva.asientos
      : [];

  return asientos
    .map((asiento) => asiento.numero)
    .filter(
      (numero): numero is number | string =>
        numero !== undefined &&
        String(numero).trim() !== "",
    );
}

/* ========================================
   MENSAJES DE ERROR
======================================== */

function obtenerMensajeError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error
  ) {
    const mensaje = (
      error as { mensaje?: unknown }
    ).mensaje;

    if (typeof mensaje === "string") {
      return mensaje;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const respuesta = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
            mensaje?: string;
          };
        };
      }
    ).response?.data;

    if (Array.isArray(respuesta?.message)) {
      return respuesta.message.join(", ");
    }

    if (typeof respuesta?.message === "string") {
      return respuesta.message;
    }

    if (typeof respuesta?.mensaje === "string") {
      return respuesta.mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo comprobar el ticket.";
}

/* ========================================
   DATOS DE LA RUTA
======================================== */

function ticketOrigen(ticket: TicketEscaneado): string {
  return ticket.origen || "---";
}

function ticketDestino(ticket: TicketEscaneado): string {
  return ticket.destino || "---";
}

/* ========================================
   COMPONENTE PARA DATOS COMPACTOS
======================================== */

function Dato({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: string;
  icono?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
      <div className="mb-1 flex items-center gap-1 text-emerald-700">
        {icono}

        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {titulo}
        </span>
      </div>

      <p className="break-words text-xs font-extrabold leading-snug text-slate-900 sm:text-sm">
        {valor}
      </p>
    </div>
  );
}

/* ========================================
   FORMATO DE FECHA CORTA PARA CELULAR
======================================== */

function formatearFechaCorta(fecha?: string): string {
  if (!fecha) return "---";

  const fechaNormalizada = fecha.substring(0, 10);
  const partes = fechaNormalizada.split("-");

  if (partes.length !== 3) return fechaNormalizada;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* ========================================
   FORMATO DE HORA
======================================== */

function formatearHora(hora?: string): string {
  if (!hora) return "--:--";

  return String(hora).substring(0, 5);
}

export default EscanearTicket;


/**
 * Recojos visibles solamente para el chofer autenticado.
 * El backend verifica la asignación por TurnoVehiculo.chofer.
 * Esta sección es independiente de los estados del lector QR.
 */
function MisRecojosChofer() {
  const [turnos, setTurnos] = useState<TurnoRecojoChofer[]>([]);
  const [viajeId, setViajeId] = useState("");
  const [solicitudes, setSolicitudes] = useState<SolicitudRecojo[]>([]);
  const [cargandoTurnos, setCargandoTurnos] = useState(true);
  const [cargandoRecojos, setCargandoRecojos] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargandoTurnos(true);
    setError("");
    void obtenerMisTurnosRecojoChofer()
      .then((lista) => {
        if (!vigente) return;
        setTurnos(lista);
        setViajeId((anterior) =>
          lista.some((t) => t.viaje.id === anterior)
            ? anterior
            : (lista[0]?.viaje.id ?? ""),
        );
      })
      .catch((fallo: unknown) => {
        if (vigente) setError(obtenerMensajeError(fallo));
      })
      .finally(() => {
        if (vigente) setCargandoTurnos(false);
      });
    return () => { vigente = false; };
  }, [revision]);

  useEffect(() => {
    if (!viajeId) {
      setSolicitudes([]);
      return;
    }
    let vigente = true;
    setCargandoRecojos(true);
    setError("");
    void obtenerMisRecojosChofer(viajeId)
      .then((lista) => {
        if (vigente) setSolicitudes(lista);
      })
      .catch((fallo: unknown) => {
        if (vigente) {
          setSolicitudes([]);
          setError(obtenerMensajeError(fallo));
        }
      })
      .finally(() => {
        if (vigente) setCargandoRecojos(false);
      });
    return () => { vigente = false; };
  }, [viajeId, revision]);

  const cambiarEstado = async (
    solicitud: SolicitudRecojo,
    estadoNuevo: "RECOGIDO" | "NO_ENCONTRADO",
  ) => {
    if (actualizando) return;
    const accion = estadoNuevo === "RECOGIDO"
      ? "marcar como recogido"
      : "marcar como no encontrado";
    if (!window.confirm(
      `¿Deseas ${accion} a ${solicitud.usuario.nombre} ${solicitud.usuario.apellido}?`,
    )) return;

    setActualizando(solicitud.id);
    setError("");
    setMensaje("");
    try {
      const respuesta = await marcarResultadoRecojoChofer(
        solicitud.id, estadoNuevo,
      );
      setMensaje(respuesta.mensaje);
      setRevision((anterior) => anterior + 1);
    } catch (fallo) {
      setError(obtenerMensajeError(fallo));
    } finally {
      setActualizando(null);
    }
  };

  const seleccionado = turnos.find((turno) => turno.viaje.id === viajeId);
  const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE").length;
  const confirmados = solicitudes.filter((s) => s.estado === "CONFIRMADA").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800">Mis viajes asignados</p>
        <button type="button" onClick={() => setRevision((v) => v + 1)}
          disabled={cargandoTurnos || cargandoRecojos || Boolean(actualizando)}
          className="flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 disabled:opacity-50">
          <RefreshCw size={16} /> Actualizar
        </button>
      </div>

      {cargandoTurnos ? (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={17} className="animate-spin" /> Consultando turnos...
        </p>
      ) : turnos.length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          No tienes vehículos asignados en una fila activa.
        </p>
      ) : (
        <>
          <label className="block text-sm font-semibold text-slate-700">
            Selecciona tu vehículo y viaje
            <select value={viajeId} onChange={(e) => setViajeId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
              {turnos.map((turno) => (
                <option key={turno.id} value={turno.viaje.id}>
                  {turno.viaje.vehiculo.tipo} {turno.viaje.vehiculo.placa} · {turno.viaje.fecha} · {turno.viaje.horaSalida.slice(0, 5)}
                </option>
              ))}
            </select>
          </label>
          {seleccionado && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
              {seleccionado.viaje.ruta.origen} → {seleccionado.viaje.ruta.destino} · Estado: {seleccionado.estado}
            </div>
          )}
          <p className="text-xs font-semibold text-slate-600">
            {pendientes} pendientes · {confirmados} confirmados · {solicitudes.length} en total
          </p>

          {cargandoRecojos ? (
            <p className="flex items-center gap-2 py-4 text-sm text-slate-600">
              <Loader2 size={18} className="animate-spin" /> Cargando pasajeros...
            </p>
          ) : solicitudes.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No existen solicitudes de recojo para este viaje.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {solicitudes.map((solicitud) => {
                const mapa = obtenerEnlaceMapaRecojo(solicitud, "RUTA");
                return (
                  <article key={solicitud.id}
                    className="min-w-0 space-y-3 rounded-2xl border border-emerald-100 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="break-words font-black text-slate-900">
                        {solicitud.usuario.nombre} {solicitud.usuario.apellido}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                        {solicitud.estado.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="break-words text-sm text-slate-700"><MapPin size={15} className="mr-1 inline" />{solicitud.referencia}</p>
                    <p className="text-sm text-slate-600"><Phone size={15} className="mr-1 inline" />{solicitud.telefono}</p>
                    {solicitud.observacion && (
                      <p className="break-words text-xs text-slate-600">{solicitud.observacion}</p>
                    )}
                    {mapa ? (
                      <a href={mapa} target="_blank" rel="noopener noreferrer"
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700">
                        <Navigation size={17} /> Ir con Google Maps
                      </a>
                    ) : (
                      <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-800">Sin ubicación GPS; usar referencia escrita.</p>
                    )}
                    {solicitud.estado === "CONFIRMADA" && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button type="button" disabled={Boolean(actualizando)}
                          onClick={() => void cambiarEstado(solicitud, "RECOGIDO")}
                          className="min-h-11 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                          Recogido
                        </button>
                        <button type="button" disabled={Boolean(actualizando)}
                          onClick={() => void cambiarEstado(solicitud, "NO_ENCONTRADO")}
                          className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 disabled:opacity-50">
                          No encontrado
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {mensaje && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{mensaje}</p>}
    </div>
  );
}