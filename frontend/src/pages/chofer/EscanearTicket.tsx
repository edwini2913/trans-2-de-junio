import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Armchair,
  BusFront,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  RotateCcw,
  ShieldCheck,
  TicketCheck,
  User,
  XCircle,
} from "lucide-react";

import LectorQr from "../../components/qr/LectorQr";
import API from "../../services/auth.service";

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
  ruta?: RutaTicket;
  vehiculo?: VehiculoTicket;
};

type ReservaTicket = {
  codigoReserva?: string;
  estado?: string;
  usuario?: UsuarioTicket;
  viaje?: ViajeTicket;
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

  reserva?: ReservaTicket;

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

  origen?: string;
  destino?: string;
};

type RespuestaValidacion = {
  ok?: boolean;
  mensaje?: string;
  ticket?: TicketEscaneado;
};

function EscanearTicket() {
  const procesandoRef = useRef(false);

  const [estado, setEstado] =
    useState<EstadoResultado>("INICIAL");

  const [mensaje, setMensaje] = useState(
    "Presiona “Iniciar escáner” y apunta la cámara hacia el código QR del ticket.",
  );

  const [ticket, setTicket] =
    useState<TicketEscaneado | null>(null);

  const [tokenActual, setTokenActual] =
    useState("");

  const [procesando, setProcesando] =
    useState(false);

  const [scannerActivo, setScannerActivo] =
    useState(false);

  const procesarCodigoQr = useCallback(
    async (contenidoQr: string) => {
      if (procesandoRef.current) {
        return;
      }

      procesandoRef.current = true;
      setProcesando(true);
      setScannerActivo(false);

      try {
        const token =
          extraerToken(contenidoQr);

        if (!token) {
          throw new Error(
            "El código QR no pertenece al sistema Trans 2 de Junio.",
          );
        }

        setTokenActual(token);

        /*
         * Esta consulta solamente comprueba el ticket.
         * Todavía no lo marca como utilizado.
         */
        const consulta =
          await API.get<TicketEscaneado>(
            `/tickets/token/${encodeURIComponent(
              token,
            )}`,
          );

        const ticketEncontrado =
          consulta.data;

        setTicket(ticketEncontrado);

        if (
          !ticketEncontrado?.blockchain
            ?.autentico
        ) {
          setEstado("ERROR");

          setMensaje(
            ticketEncontrado?.blockchain
              ?.mensaje ||
              "El ticket no pudo autenticarse en blockchain.",
          );

          return;
        }

        if (
          ticketEncontrado.estado ===
          "UTILIZADO"
        ) {
          setEstado("UTILIZADO");

          setMensaje(
            "Este ticket ya fue utilizado anteriormente y no permite un nuevo abordaje.",
          );

          return;
        }

        if (
          ticketEncontrado.estado ===
          "CANCELADO"
        ) {
          setEstado("ERROR");

          setMensaje(
            "Este ticket está cancelado y no puede utilizarse.",
          );

          return;
        }

        if (
          ticketEncontrado.estado !==
          "VALIDO"
        ) {
          setEstado("ERROR");

          setMensaje(
            `El ticket tiene estado ${
              ticketEncontrado.estado ||
              "DESCONOCIDO"
            } y no puede utilizarse.`,
          );

          return;
        }

        if (
          ticketEncontrado.reserva
            ?.estado !== "CONFIRMADA"
        ) {
          setEstado("ERROR");

          setMensaje(
            "La reserva asociada al ticket no está confirmada.",
          );

          return;
        }

        setEstado("COMPROBADO");

        setMensaje(
          "Ticket auténtico y vigente. Revisa los datos y presiona “Autorizar abordaje” para utilizarlo.",
        );
      } catch (error: unknown) {
        setTicket(null);
        setTokenActual("");
        setEstado("ERROR");
        setMensaje(
          obtenerMensajeError(error),
        );
      } finally {
        setProcesando(false);
        procesandoRef.current = false;
      }
    },
    [],
  );

  const iniciarEscaner = () => {
    if (procesando) {
      return;
    }

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
    if (procesando) {
      return;
    }

    setScannerActivo(false);

    setMensaje(
      "La cámara está desactivada. Presiona “Iniciar escáner” para continuar.",
    );
  };

  const reiniciarEscaner = () => {
    if (procesando) {
      return;
    }

    setScannerActivo(false);
    setTicket(null);
    setTokenActual("");
    setEstado("INICIAL");

    setMensaje(
      "Preparando el escáner para leer otro ticket.",
    );

    procesandoRef.current = false;

    window.setTimeout(() => {
      setMensaje(
        "Apunta la cámara hacia el código QR del ticket.",
      );

      setScannerActivo(true);
    }, 150);
  };

  const autorizarAbordaje =
    async () => {
      if (
        !tokenActual ||
        estado !== "COMPROBADO" ||
        procesando
      ) {
        return;
      }

      const confirmado =
        window.confirm(
          "¿Confirmas que revisaste los datos y deseas autorizar el abordaje? El ticket quedará marcado como utilizado.",
        );

      if (!confirmado) {
        return;
      }

      try {
        setProcesando(true);

        const respuesta =
          await API.patch<RespuestaValidacion>(
            `/tickets/validar/${encodeURIComponent(
              tokenActual,
            )}`,
          );

        setTicket(
          respuesta.data?.ticket ||
            ticket,
        );

        setEstado("AUTORIZADO");

        setMensaje(
          respuesta.data?.mensaje ||
            "Ticket validado correctamente. Pasajero autorizado para abordar.",
        );
      } catch (error: unknown) {
        const mensajeError =
          obtenerMensajeError(error);

        if (
          mensajeError
            .toLowerCase()
            .includes("utilizado")
        ) {
          setEstado("UTILIZADO");
        } else {
          setEstado("ERROR");
        }

        setMensaje(mensajeError);
      } finally {
        setProcesando(false);
      }
    };

  const reserva = ticket?.reserva;
  const usuario = reserva?.usuario;
  const viaje = reserva?.viaje;
  const ruta = viaje?.ruta;
  const vehiculo = viaje?.vehiculo;

  const numerosAsientos =
    obtenerNumerosAsientos(ticket);

  const textoAsientos =
    numerosAsientos.length > 0
      ? numerosAsientos
          .map(
            (numero) =>
              `#${numero}`,
          )
          .join(", ")
      : "---";

  const resultadoPositivo =
    estado === "COMPROBADO" ||
    estado === "AUTORIZADO";

  const resultadoNegativo =
    estado === "UTILIZADO" ||
    estado === "ERROR";

  return (
    <div className="min-h-screen bg-[#f2f8f4] text-slate-900">
      <header className="border-b border-emerald-200 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-600 px-5 py-5 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <QrCode size={29} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                Control de abordaje
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Validar ticket QR
              </h1>

              <p className="mt-1 text-sm text-emerald-100">
                Escáner para choferes y
                personal autorizado
              </p>
            </div>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            <ArrowLeft size={19} />
            Volver al panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-5 md:p-8">
        <div className="grid items-start gap-7 lg:grid-cols-[420px_1fr]">
          {/* LECTOR QR */}

          <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <QrCode size={25} />
              </div>

              <h2 className="mt-4 text-2xl font-black">
                Escanear código QR
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Activa la cámara y apunta
                hacia el QR del ticket.
              </p>
            </div>

            <LectorQr
              activo={scannerActivo}
              procesando={procesando}
              onCodigoDetectado={
                procesarCodigoQr
              }
              onEstadoActivo={() => {
                /*
                 * El estado principal ya se
                 * controla desde esta página.
                 */
              }}
            />

            {!scannerActivo && (
              <button
                type="button"
                onClick={iniciarEscaner}
                disabled={procesando}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera size={21} />

                Iniciar escáner
              </button>
            )}

            {scannerActivo && (
              <button
                type="button"
                onClick={detenerEscaner}
                disabled={procesando}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle size={20} />

                Detener cámara
              </button>
            )}

            {estado !== "INICIAL" && (
              <button
                type="button"
                onClick={reiniciarEscaner}
                disabled={procesando}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-black text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={20} />

                Escanear otro ticket
              </button>
            )}
          </section>

          {/* RESULTADO */}

          <section
            className={[
              "min-h-[520px] rounded-[28px] border bg-white p-7 shadow-xl shadow-emerald-950/5",

              resultadoPositivo
                ? "border-emerald-200"
                : resultadoNegativo
                  ? "border-red-200"
                  : "border-slate-200",
            ].join(" ")}
          >
            <div className="text-center">
              {estado ===
              "AUTORIZADO" ? (
                <CheckCircle2
                  size={76}
                  className="mx-auto text-emerald-600"
                />
              ) : estado ===
                "COMPROBADO" ? (
                <ShieldCheck
                  size={76}
                  className="mx-auto text-emerald-600"
                />
              ) : resultadoNegativo ? (
                <XCircle
                  size={76}
                  className="mx-auto text-red-500"
                />
              ) : (
                <ShieldCheck
                  size={76}
                  className="mx-auto text-slate-300"
                />
              )}

              <h2
                className={[
                  "mt-5 text-3xl font-black",

                  resultadoPositivo
                    ? "text-emerald-700"
                    : resultadoNegativo
                      ? "text-red-600"
                      : "text-slate-700",
                ].join(" ")}
              >
                {estado ===
                "AUTORIZADO"
                  ? "PASAJERO AUTORIZADO"
                  : estado ===
                      "COMPROBADO"
                    ? "TICKET VÁLIDO"
                    : estado ===
                        "UTILIZADO"
                      ? "TICKET YA UTILIZADO"
                      : estado ===
                          "ERROR"
                        ? "TICKET NO VÁLIDO"
                        : "Esperando lectura"}
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-6 text-slate-500">
                {mensaje}
              </p>
            </div>

            {ticket && (
              <>
                <div
                  className={`mt-7 flex items-center gap-3 rounded-2xl border p-4 ${
                    ticket.blockchain
                      ?.autentico
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {ticket.blockchain
                    ?.autentico ? (
                    <ShieldCheck
                      size={24}
                      className="shrink-0"
                    />
                  ) : (
                    <XCircle
                      size={24}
                      className="shrink-0"
                    />
                  )}

                  <div>
                    <p className="font-black">
                      {ticket.blockchain
                        ?.autentico
                        ? "Verificado en blockchain"
                        : "Sin autenticidad blockchain"}
                    </p>

                    <p className="text-sm opacity-80">
                      {ticket.blockchain
                        ?.autentico
                        ? `Bloque #${
                            ticket
                              .blockchain
                              .bloque
                              ?.indice ??
                            "---"
                          } · Cadena íntegra`
                        : ticket
                            .blockchain
                            ?.mensaje ||
                          "No registrado"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Dato
                    titulo="Código del ticket"
                    valor={
                      ticket.codigoTicket ||
                      "---"
                    }
                    icono={
                      <TicketCheck
                        size={19}
                      />
                    }
                  />

                  <Dato
                    titulo="Pasajero"
                    valor={`${usuario?.nombre || "Pasajero"} ${
                      usuario?.apellido ||
                      ""
                    }`.trim()}
                    icono={
                      <User size={19} />
                    }
                  />

                  <Dato
                    titulo="Ruta"
                    valor={`${
                      ruta?.origen ||
                      ticketOrigen(ticket)
                    } → ${
                      ruta?.destino ||
                      ticketDestino(ticket)
                    }`}
                    icono={
                      <MapPin size={19} />
                    }
                  />

                  <Dato
                    titulo="Fecha"
                    valor={formatearFecha(
                      viaje?.fecha,
                    )}
                    icono={
                      <CalendarDays
                        size={19}
                      />
                    }
                  />

                  <Dato
                    titulo="Hora"
                    valor={formatearHora(
                      viaje?.horaSalida,
                    )}
                    icono={
                      <Clock size={19} />
                    }
                  />

                  <Dato
                    titulo={
                      numerosAsientos.length ===
                      1
                        ? "Asiento"
                        : "Asientos"
                    }
                    valor={textoAsientos}
                    icono={
                      <Armchair
                        size={19}
                      />
                    }
                  />

                  <Dato
                    titulo="Vehículo"
                    valor={`${vehiculo?.marca || "---"} ${
                      vehiculo?.modelo ||
                      ""
                    }`.trim()}
                    icono={
                      <BusFront
                        size={19}
                      />
                    }
                  />

                  <Dato
                    titulo="Placa"
                    valor={
                      vehiculo?.placa ||
                      "---"
                    }
                  />
                </div>

                {estado ===
                  "COMPROBADO" && (
                  <div className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="font-black text-emerald-950">
                      Confirmación de abordaje
                    </p>

                    <p className="mt-2 text-sm leading-6 text-emerald-800/80">
                      Verifica el nombre, la
                      ruta, la fecha, la hora
                      y los asientos. Al
                      autorizar, el ticket
                      cambiará de VÁLIDO a
                      UTILIZADO.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void autorizarAbordaje()
                      }
                      disabled={procesando}
                      className="mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {procesando ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                          Autorizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={22}
                          />

                          Autorizar abordaje
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function extraerToken(
  contenido: string,
): string {
  const valor = contenido.trim();

  if (!valor) {
    return "";
  }

  try {
    const url = new URL(valor);

    const partes =
      url.pathname
        .split("/")
        .filter(Boolean);

    const indice =
      partes.indexOf(
        "validar-ticket",
      );

    return indice >= 0 &&
      partes[indice + 1]
      ? partes[indice + 1]
      : "";
  } catch {
    const patronUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return patronUuid.test(valor)
      ? valor
      : "";
  }
}

function obtenerNumerosAsientos(
  ticket: TicketEscaneado | null,
): Array<number | string> {
  if (
    Array.isArray(
      ticket?.asientoNumeros,
    )
  ) {
    return ticket.asientoNumeros.filter(
      (numero) =>
        String(numero).trim() !== "",
    );
  }

  const asientos = Array.isArray(
    ticket?.asientos,
  )
    ? ticket.asientos
    : Array.isArray(
          ticket?.reserva?.asientos,
        )
      ? ticket.reserva.asientos
      : [];

  return asientos
    .map(
      (asiento) =>
        asiento.numero,
    )
    .filter(
      (
        numero,
      ): numero is
        | number
        | string =>
        numero !== undefined &&
        String(numero).trim() !==
          "",
    );
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
      typeof mensaje === "string"
    ) {
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
            message?:
              | string
              | string[];

            mensaje?: string;
          };
        };
      }
    ).response?.data;

    if (
      Array.isArray(
        respuesta?.message,
      )
    ) {
      return respuesta.message.join(
        ", ",
      );
    }

    if (
      typeof respuesta?.message ===
      "string"
    ) {
      return respuesta.message;
    }

    if (
      typeof respuesta?.mensaje ===
      "string"
    ) {
      return respuesta.mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo comprobar el ticket.";
}

function ticketOrigen(
  ticket: TicketEscaneado,
): string {
  return ticket.origen || "---";
}

function ticketDestino(
  ticket: TicketEscaneado,
): string {
  return ticket.destino || "---";
}

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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {icono && (
        <div className="text-emerald-700">
          {icono}
        </div>
      )}

      <p className="mt-2 text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 break-words font-black text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function formatearFecha(
  fecha?: string,
): string {
  if (!fecha) {
    return "---";
  }

  const fechaNormalizada =
    fecha.substring(0, 10);

  const fechaLocal = new Date(
    `${fechaNormalizada}T00:00:00`,
  );

  if (
    Number.isNaN(
      fechaLocal.getTime(),
    )
  ) {
    return fecha;
  }

  return fechaLocal.toLocaleDateString(
    "es-BO",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

function formatearHora(
  hora?: string,
): string {
  if (!hora) {
    return "--:--";
  }

  return String(hora).substring(
    0,
    5,
  );
}

export default EscanearTicket;