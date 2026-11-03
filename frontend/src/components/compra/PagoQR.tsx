
import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  FileUp,
  Loader2,
  QrCode,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

import qrPago from "../../assets/QR.png";

import PagoAprobado from "./PagoAprobado";

import type {
  TicketPagoAprobado,
} from "./PagoAprobado";

import PagoRechazado from "./PagoRechazado";

export type {
  TicketPagoAprobado,
} from "./PagoAprobado";

export interface DatosComprobantePago {
  referencia: string;
  comprobante: File;
  monto: number;
}

export type EstadoPagoPasajero =
  | "PENDIENTE"
  | "EN_REVISION"
  | "APROBADO"
  | "RECHAZADO";

interface Props {
  mostrar: boolean;
  total: number;
  confirmando?: boolean;
  compraConfirmada?: boolean;
  estadoPago?: EstadoPagoPasajero | null;
  motivoRechazo?: string;
  referenciaPago?: string;
  ticket?: TicketPagoAprobado | null;
  qrPagoUrl?: string;
  nombreCuenta?: string;
  entidadPago?: string;
  onReintentarPago?: () => void;
  onVolverInicio?: () => void;
  onVerMisTickets?: () => void;
  onGuardarTicket?: () => void;
  onDescargarTicket?: () => void;
  onCompartirWhatsApp?: () => void;
  onConfirmarCompra: (
    datos: DatosComprobantePago,
  ) => void | Promise<void>;
}

const TIPOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const TAMANO_MAXIMO =
  5 * 1024 * 1024;

const formatoMoneda =
  new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const boton =
  "flex min-h-12 w-full items-center " +
  "justify-center gap-2 rounded-xl " +
  "bg-emerald-700 px-4 py-3 " +
  "text-sm font-black text-white " +
  "shadow-sm transition-colors " +
  "hover:bg-emerald-800 " +
  "focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 " +
  "focus-visible:outline-emerald-600 " +
  "disabled:cursor-not-allowed " +
  "disabled:opacity-50";

const estiloCampo =
  "mt-2 block min-h-12 w-full " +
  "min-w-0 max-w-full rounded-xl " +
  "border border-slate-300 bg-white " +
  "px-3 py-3 text-base text-slate-900 " +
  "outline-none transition " +
  "focus:border-emerald-600 " +
  "focus:ring-2 focus:ring-emerald-100 " +
  "disabled:cursor-not-allowed " +
  "disabled:bg-slate-100";

function formatearMonto(
  monto: number,
): string {
  return formatoMoneda.format(
    Number.isFinite(monto)
      ? monto
      : 0,
  );
}

function PagoQR({
  mostrar,
  total,
  confirmando = false,
  compraConfirmada = false,
  estadoPago = null,
  motivoRechazo = "",
  referenciaPago = "",
  ticket = null,
  qrPagoUrl = qrPago,
  nombreCuenta =
    "Sindicato Autotransporte Trans 2 de Junio",
  entidadPago =
    "Cuenta oficial del sindicato",
  onReintentarPago,
  onVolverInicio,
  onVerMisTickets,
  onGuardarTicket,
  onDescargarTicket,
  onCompartirWhatsApp,
  onConfirmarCompra,
}: Props) {
  const [
    referencia,
    setReferencia,
  ] = useState("");

  const [
    comprobante,
    setComprobante,
  ] = useState<File | null>(null);

  const [
    vistaPrevia,
    setVistaPrevia,
  ] = useState("");

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState("");

  const [
    comprobanteEnviado,
    setComprobanteEnviado,
  ] = useState(false);

  const [
    qrDisponible,
    setQrDisponible,
  ] = useState(true);

  const [
    adjuntando,
    setAdjuntando,
  ] = useState(false);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const envioEnCurso =
    useRef(false);

  const encabezado =
    useRef<HTMLHeadingElement | null>(
      null,
    );

  const seccionFormularioRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const seccionQrRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const desplazamientoPendienteRef =
    useRef<
      "FORMULARIO" | "QR" | null
    >(null);

  /*
   * Genera la vista previa del comprobante
   * y libera la URL temporal al cambiarlo.
   */
  useEffect(() => {
    if (
      !comprobante?.type.startsWith(
        "image/",
      )
    ) {
      setVistaPrevia("");
      return;
    }

    const url =
      URL.createObjectURL(
        comprobante,
      );

    setVistaPrevia(url);

    return () =>
      URL.revokeObjectURL(
        url,
      );
  }, [
    comprobante,
  ]);

  /*
   * Permite comprobar nuevamente
   * la disponibilidad del QR cuando
   * cambia su dirección.
   */
  useEffect(() => {
    setQrDisponible(true);
  }, [
    qrPagoUrl,
  ]);

  /*
   * Al ocultar el panel se restablece
   * solamente la presentación temporal.
   */
  useEffect(() => {
    if (!mostrar) {
      setAdjuntando(false);
      setErrorFormulario("");
      desplazamientoPendienteRef.current =
        null;
    }
  }, [
    mostrar,
  ]);

  const estadoActual =
    compraConfirmada
      ? "APROBADO"
      : estadoPago;

  const enRevision =
    estadoActual === "EN_REVISION" ||
    (
      comprobanteEnviado &&
      estadoActual !== "RECHAZADO" &&
      estadoActual !== "APROBADO"
    );

  const ocupado =
    confirmando || enviando;

  /*
   * Cuando se envía el comprobante
   * y entra en revisión, se muestra
   * el estado correspondiente.
   */
  useEffect(() => {
    if (
      mostrar &&
      enRevision
    ) {
      encabezado.current?.focus({
        preventScroll: true,
      });

      encabezado.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [
    mostrar,
    enRevision,
  ]);

  /*
   * Navegación automática en celulares.
   * No altera la selección del viaje
   * ni el procesamiento de pagos.
   */
  useEffect(() => {
    const destino =
      desplazamientoPendienteRef.current;

    if (
      !mostrar ||
      !destino
    ) {
      return;
    }

    desplazamientoPendienteRef.current =
      null;

    if (
      !window.matchMedia(
        "(max-width: 1023px)",
      ).matches
    ) {
      return;
    }

    const animacion =
      window.requestAnimationFrame(
        () => {
          const elemento =
            destino === "FORMULARIO"
              ? seccionFormularioRef.current
              : seccionQrRef.current;

          elemento?.scrollIntoView({
            behavior: window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches
              ? "auto"
              : "smooth",

            block: "start",
          });
        },
      );

    return () =>
      window.cancelAnimationFrame(
        animacion,
      );
  }, [
    adjuntando,
    mostrar,
  ]);

  function mostrarFormulario() {
    if (
      ocupado ||
      !qrDisponible
    ) {
      return;
    }

    desplazamientoPendienteRef.current =
      "FORMULARIO";

    setAdjuntando(true);
    setErrorFormulario("");
  }

  function volverAlQr() {
    if (ocupado) {
      return;
    }

    desplazamientoPendienteRef.current =
      "QR";

    setAdjuntando(false);
  }

  function prepararNuevoComprobante() {
    setReferencia("");
    setComprobante(null);
    setVistaPrevia("");
    setErrorFormulario("");
    setComprobanteEnviado(false);
    setAdjuntando(false);

    desplazamientoPendienteRef.current =
      null;

    onReintentarPago?.();
  }

  function seleccionarComprobante(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const archivo =
      event.currentTarget.files?.[0];

    setErrorFormulario("");

    if (
      archivo &&
      (
        !TIPOS.includes(
          archivo.type,
        ) ||
        archivo.size >
          TAMANO_MAXIMO
      )
    ) {
      setErrorFormulario(
        !TIPOS.includes(
          archivo.type,
        )
          ? "Selecciona un archivo JPG, PNG, WEBP o PDF."
          : "El comprobante no puede superar los 5 MB.",
      );

      event.currentTarget.value =
        "";

      setComprobante(null);

      return;
    }

    setComprobante(
      archivo ?? null,
    );
  }

  async function enviarComprobante(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      envioEnCurso.current ||
      ocupado ||
      enRevision ||
      !qrDisponible
    ) {
      return;
    }

    const codigo =
      referencia.trim();

    if (
      codigo.length < 4
    ) {
      setErrorFormulario(
        "Ingresa el número o código de la transacción (mínimo 4 caracteres).",
      );

      return;
    }

    if (!comprobante) {
      setErrorFormulario(
        "Adjunta la imagen o el PDF del comprobante.",
      );

      return;
    }

    if (
      !TIPOS.includes(
        comprobante.type,
      ) ||
      comprobante.size >
        TAMANO_MAXIMO
    ) {
      setErrorFormulario(
        "El comprobante debe ser JPG, PNG, WEBP o PDF y no superar los 5 MB.",
      );

      return;
    }

    if (
      !Number.isFinite(
        total,
      ) ||
      total <= 0
    ) {
      setErrorFormulario(
        "El monto no es válido. Revisa el viaje y los asientos.",
      );

      return;
    }

    envioEnCurso.current =
      true;

    setEnviando(true);
    setErrorFormulario("");

    try {
      await onConfirmarCompra({
        referencia: codigo,
        comprobante,
        monto: total,
      });

      setComprobanteEnviado(true);
    } catch (
      error: unknown
    ) {
      setErrorFormulario(
        obtenerMensajeError(
          error,
        ),
      );
    } finally {
      envioEnCurso.current =
        false;

      setEnviando(false);
    }
  }

  if (!mostrar) {
    return null;
  }

  /*
   * PAGO RECHAZADO
   * Se conserva el componente original.
   */
  if (
    estadoActual === "RECHAZADO"
  ) {
    return (
      <PagoRechazado
        motivo={motivoRechazo}
        referencia={
          referenciaPago ||
          referencia
        }
        procesando={confirmando}
        onCorregirDatos={
          prepararNuevoComprobante
        }
        onSubirNuevoComprobante={
          prepararNuevoComprobante
        }
        onVolverInicio={
          onVolverInicio
        }
      />
    );
  }

  /*
   * PAGO APROBADO
   * Se conserva el componente original.
   */
  if (
    estadoActual === "APROBADO"
  ) {
    return (
      <PagoAprobado
        total={total}
        ticket={ticket}
        onGuardar={
          onGuardarTicket
        }
        onDescargar={
          onDescargarTicket
        }
        onCompartir={
          onCompartirWhatsApp
        }
        onVerTickets={
          onVerMisTickets
        }
      />
    );
  }

  return (
    <section className="mt-3 w-full min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-md shadow-emerald-950/5 sm:rounded-3xl">
      {/* ENCABEZADO */}

      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 p-4 text-white sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            {enRevision ? (
              <Clock3
                size={25}
              />
            ) : adjuntando ? (
              <FileUp
                size={25}
              />
            ) : (
              <QrCode
                size={25}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 sm:text-xs">
              Pago seguro
            </p>

            <h2
              ref={encabezado}
              tabIndex={-1}
              className="mt-1 text-xl font-black outline-none sm:text-2xl"
            >
              {enRevision
                ? "Pago en revisión"
                : adjuntando
                  ? "Adjunta tu comprobante"
                  : "Pago por QR"}
            </h2>
          </div>

          <ShieldCheck
            size={24}
            className="shrink-0 text-lime-200"
          />
        </div>
      </div>

      <div className="space-y-4 p-3 sm:p-6">
        {/* TOTAL A PAGAR */}

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <CreditCard
              size={20}
              className="shrink-0 text-emerald-700"
            />

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Total a pagar
              </p>

              <p className="text-xs text-slate-500">
                Importe en bolivianos
              </p>
            </div>
          </div>

          <strong className="break-words text-2xl font-black tabular-nums text-emerald-900 sm:text-3xl">
            Bs. {formatearMonto(total)}
          </strong>
        </div>

        {/* PAGO EN REVISIÓN */}

        {enRevision ? (
          <div
            role="status"
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock3
                  size={24}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-amber-900">
                  Comprobante enviado
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-900/80">
                  Tu comprobante está en
                  revisión. Aquí aparecerá
                  el resultado cuando la
                  administradora revise
                  tu pago.
                </p>

                {referenciaPago && (
                  <p className="mt-3 break-all rounded-lg bg-white/70 p-3 text-xs font-bold text-amber-900">
                    Referencia:{" "}
                    {referenciaPago}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">
            {/* CÓDIGO QR */}

            <div
              ref={seccionQrRef}
              className={
                "min-w-0 scroll-mt-28 " +
                (adjuntando
                  ? "hidden lg:block"
                  : "")
              }
            >
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <QrCode
                      size={22}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900">
                      Escanea para pagar
                    </h3>

                    <p className="text-xs text-slate-500">
                      Utiliza tu aplicación bancaria
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-3">
                  <p className="break-words text-center text-sm font-bold text-slate-800">
                    {nombreCuenta}
                  </p>

                  <p className="mt-1 break-words text-center text-xs text-slate-500">
                    {entidadPago}
                  </p>

                  {qrDisponible ? (
                    <img
                      src={qrPagoUrl}
                      alt="QR bancario para pagar el pasaje"
                      onError={() =>
                        setQrDisponible(false)
                      }
                      className="mx-auto my-3 aspect-square w-full max-w-[260px] rounded-lg bg-white object-contain"
                    />
                  ) : (
                    <div
                      role="alert"
                      className="my-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"
                    >
                      No se pudo cargar el QR de pago.
                    </div>
                  )}
                </div>

                <p className="mt-3 text-center text-xs leading-5 text-slate-600 sm:text-sm">
                  Paga el importe indicado y
                  guarda tu comprobante.
                </p>

                <button
                  type="button"
                  disabled={
                    !qrDisponible ||
                    ocupado
                  }
                  className={
                    boton +
                    " mt-4 lg:hidden"
                  }
                  onClick={
                    mostrarFormulario
                  }
                >
                  <CheckCircle2
                    size={20}
                  />

                  Ya pagué · Adjuntar comprobante
                </button>
              </div>
            </div>

            {/* FORMULARIO DE COMPROBANTE */}

            <div
              ref={seccionFormularioRef}
              className={
                "min-w-0 scroll-mt-28 " +
                (adjuntando
                  ? ""
                  : "hidden lg:block")
              }
            >
              <div className="h-full rounded-2xl border border-emerald-100 bg-white p-3 sm:p-5">
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={volverAlQr}
                  className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-50 lg:hidden"
                >
                  <ArrowLeft
                    size={18}
                  />

                  Volver al QR
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <UploadCloud
                      size={23}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900">
                      Datos del pago
                    </h3>

                    <p className="text-xs text-slate-500">
                      Completa la referencia y adjunta tu comprobante
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={
                    enviarComprobante
                  }
                  className="min-w-0 space-y-4"
                >
                  {/* REFERENCIA */}

                  <div>
                    <label
                      htmlFor="referencia-pago"
                      className="block text-sm font-bold text-slate-800"
                    >
                      Número de transacción
                    </label>

                    <p className="mt-1 text-xs text-slate-500">
                      Escribe el código que
                      aparece en tu comprobante.
                    </p>

                    <input
                      id="referencia-pago"
                      type="text"
                      value={referencia}
                      maxLength={80}
                      autoComplete="off"
                      placeholder="Ejemplo: 78451236"
                      disabled={ocupado}
                      onChange={(
                        event,
                      ) =>
                        setReferencia(
                          event.currentTarget.value,
                        )
                      }
                      className={
                        estiloCampo
                      }
                    />
                  </div>

                  {/* ARCHIVO */}

                  <div>
                    <label
                      htmlFor="comprobante-pago"
                      className="block text-sm font-bold text-slate-800"
                    >
                      Adjuntar comprobante
                    </label>

                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG, WEBP o PDF.
                      Tamaño máximo: 5 MB.
                    </p>

                    <input
                      id="comprobante-pago"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      disabled={ocupado}
                      onChange={
                        seleccionarComprobante
                      }
                      className="mt-2 block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white disabled:opacity-50 sm:text-sm"
                    />
                  </div>

                  {/* ARCHIVO SELECCIONADO */}

                  {comprobante && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileCheck2
                          size={22}
                          className="shrink-0 text-emerald-700"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="break-all text-xs font-black text-emerald-900 sm:text-sm">
                            {comprobante.name}
                          </p>

                          <p className="mt-1 text-xs text-emerald-700">
                            {(
                              comprobante.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() =>
                            setComprobante(null)
                          }
                          aria-label="Quitar comprobante"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-600 disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {vistaPrevia && (
                        <img
                          src={vistaPrevia}
                          alt="Vista previa del comprobante"
                          className="mx-auto mt-3 max-h-44 w-auto max-w-full rounded-lg border border-white bg-white object-contain"
                        />
                      )}

                      {comprobante.type ===
                        "application/pdf" && (
                        <p className="mt-3 text-xs font-medium text-emerald-800">
                          Documento PDF adjuntado correctamente.
                        </p>
                      )}
                    </div>
                  )}

                  {/* ERRORES */}

                  {errorFormulario && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
                    >
                      {errorFormulario}
                    </div>
                  )}

                  {/* ENVIAR */}

                  <button
                    type="submit"
                    disabled={
                      ocupado ||
                      !qrDisponible ||
                      enRevision
                    }
                    className={
                      boton +
                      " min-h-14"
                    }
                  >
                    {ocupado ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />

                        Enviando comprobante...
                      </>
                    ) : (
                      <>
                        <UploadCloud
                          size={21}
                        />

                        Enviar comprobante
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-500">
                    El pago será verificado
                    por el personal autorizado
                    antes de generar el ticket.
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const respuesta = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
          };
        };
      }
    ).response;

    const mensaje =
      respuesta?.data?.message;

    if (
      Array.isArray(
        mensaje,
      )
    ) {
      return mensaje.join(", ");
    }

    if (
      typeof mensaje === "string"
    ) {
      return mensaje;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "No se pudo enviar el comprobante. Inténtalo nuevamente.";
}

export default PagoQR;
