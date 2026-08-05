import {
  useEffect,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileImage,
  Hash,
  QrCode,
  ShieldCheck,
  UploadCloud,
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

const TAMANIO_MAXIMO =
  5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

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
  nombreCuenta = "Sindicato Autotransporte Trans 2 de Junio",
  entidadPago = "Cuenta oficial del sindicato",
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

  useEffect(() => {
    return () => {
      if (vistaPrevia) {
        URL.revokeObjectURL(
          vistaPrevia,
        );
      }
    };
  }, [vistaPrevia]);

  useEffect(() => {
    if (!mostrar) {
      setErrorFormulario("");
    }
  }, [mostrar]);

  useEffect(() => {
    setQrDisponible(true);
  }, [qrPagoUrl]);

  if (!mostrar) {
    return null;
  }

  const estadoActual:
    EstadoPagoPasajero | null =
    compraConfirmada
      ? "APROBADO"
      : estadoPago;

  const prepararNuevoComprobante =
    () => {
      setReferencia("");
      setComprobante(null);
      setVistaPrevia("");
      setErrorFormulario("");
      setComprobanteEnviado(false);
      onReintentarPago?.();
    };

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

  const seleccionarComprobante = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo =
      event.target.files?.[0] ??
      null;

    setErrorFormulario("");
    setComprobanteEnviado(false);

    if (!archivo) {
      setComprobante(null);
      setVistaPrevia("");
      return;
    }

    if (
      !TIPOS_PERMITIDOS.includes(
        archivo.type,
      )
    ) {
      setErrorFormulario(
        "El comprobante debe ser una imagen JPG, PNG, WEBP o un archivo PDF.",
      );
      event.target.value = "";
      return;
    }

    if (
      archivo.size >
      TAMANIO_MAXIMO
    ) {
      setErrorFormulario(
        "El comprobante no puede superar los 5 MB.",
      );
      event.target.value = "";
      return;
    }

    setComprobante(archivo);

    if (
      archivo.type.startsWith(
        "image/",
      )
    ) {
      const nuevaVista =
        URL.createObjectURL(
          archivo,
        );

      setVistaPrevia(
        (vistaAnterior) => {
          if (vistaAnterior) {
            URL.revokeObjectURL(
              vistaAnterior,
            );
          }

          return nuevaVista;
        },
      );
    } else {
      setVistaPrevia("");
    }
  };

  const enviarComprobante =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault();
      setErrorFormulario("");

      const referenciaLimpia =
        referencia.trim();

      if (
        referenciaLimpia.length < 4
      ) {
        setErrorFormulario(
          "Ingresa el número o código de la transacción.",
        );
        return;
      }

      if (!comprobante) {
        setErrorFormulario(
          "Adjunta una fotografía o PDF del comprobante de pago.",
        );
        return;
      }

      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        setErrorFormulario(
          "El monto total del pago no es válido. Vuelve a seleccionar el viaje y los asientos.",
        );
        return;
      }

      try {
        await onConfirmarCompra({
          referencia:
            referenciaLimpia,
          comprobante,
          monto: total,
        });

        setComprobanteEnviado(true);
      } catch (error: unknown) {
        setErrorFormulario(
          obtenerMensajeError(error),
        );
      }
    };

  const formularioBloqueado =
    confirmando ||
    compraConfirmada ||
    comprobanteEnviado;

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
      <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-700 via-emerald-600 to-lime-500 px-5 py-6 text-white sm:px-7 md:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[34px] border-white/[0.08]" />

        <div className="pointer-events-none absolute bottom-3 right-[28%] h-16 w-16 rounded-full bg-white/[0.07]" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
            <QrCode size={28} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
              Pago mediante QR
            </p>

            <h2 className="mt-1 text-3xl font-black leading-tight">
              Paga y envía tu
              comprobante
            </h2>

            <p className="mt-2 text-sm font-medium text-emerald-50/90">
              La administradora
              verificará el pago antes
              de confirmar tu compra y
              generar el ticket.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 md:p-8">
        <div className="grid gap-7 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <QrCode size={25} />
            </div>

            <h3 className="mt-4 text-xl font-black text-slate-900">
              Escanea este código QR
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Abre tu aplicación
              bancaria y realiza el
              pago por el monto exacto.
            </p>

            <div className="mx-auto mt-5 flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-3xl border-4 border-emerald-700 bg-white p-3 shadow-lg shadow-emerald-900/10">
              {qrDisponible ? (
                <img
                  src={qrPagoUrl}
                  alt="QR oficial para realizar el pago"
                  onError={() =>
                    setQrDisponible(
                      false,
                    )
                  }
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="px-5 text-center">
                  <AlertCircle
                    size={55}
                    className="mx-auto text-amber-600"
                  />

                  <p className="mt-3 font-black text-slate-800">
                    QR de pago no
                    configurado
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    No se pudo cargar
                    la imagen{" "}
                    <strong>
                      src/assets/QR.png
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              Monto total
            </p>

            <p className="mt-1 break-words text-4xl font-black text-emerald-800">
              Bs. {total.toFixed(2)}
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 text-left">
              <div className="flex items-start gap-3">
                <Building2
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Titular
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-800">
                    {nombreCuenta}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {entidadPago}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={
              enviarComprobante
            }
            className="flex flex-col"
          >
            <div className="space-y-4">
              <InformacionPago
                icono={
                  <CreditCard
                    size={23}
                  />
                }
                titulo="Instrucciones de pago"
                descripcion="Escanea el QR, paga el monto exacto, guarda el comprobante e ingresa el número de la transacción."
              />

              <InformacionPago
                icono={
                  <ShieldCheck
                    size={23}
                  />
                }
                titulo="Compra segura"
                descripcion="El ticket se generará únicamente después de que la administradora verifique y apruebe el pago."
                segura
              />
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-700">
                  1
                </span>

                <div>
                  <p className="font-black text-slate-900">
                    Número de
                    transacción
                  </p>

                  <p className="text-xs text-slate-500">
                    Escribe el código
                    mostrado en tu
                    comprobante.
                  </p>
                </div>
              </div>

              <label
                htmlFor="referencia-pago"
                className="mt-5 block text-sm font-black text-slate-700"
              >
                Código o referencia
              </label>

              <div className="relative mt-2">
                <Hash
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                />

                <input
                  id="referencia-pago"
                  type="text"
                  value={referencia}
                  disabled={
                    formularioBloqueado
                  }
                  onChange={(event) => {
                    setReferencia(
                      event.target.value,
                    );
                    setComprobanteEnviado(
                      false,
                    );
                  }}
                  placeholder="Ejemplo: 78451236"
                  maxLength={80}
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-700">
                  2
                </span>

                <div>
                  <p className="font-black text-slate-900">
                    Comprobante de pago
                  </p>

                  <p className="text-xs text-slate-500">
                    JPG, PNG, WEBP o
                    PDF de hasta 5 MB.
                  </p>
                </div>
              </div>

              <label
                htmlFor="comprobante-pago"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-white px-5 py-7 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50"
              >
                {vistaPrevia ? (
                  <img
                    src={vistaPrevia}
                    alt="Vista previa del comprobante"
                    className="max-h-52 w-auto rounded-xl border border-slate-200 object-contain shadow-sm"
                  />
                ) : comprobante ? (
                  <>
                    <FileImage
                      size={42}
                      className="text-emerald-700"
                    />

                    <p className="mt-3 font-black text-slate-800">
                      {
                        comprobante.name
                      }
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud
                      size={46}
                      className="text-emerald-700"
                    />

                    <p className="mt-3 font-black text-slate-800">
                      Seleccionar
                      comprobante
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Presiona aquí para
                      buscar el archivo.
                    </p>
                  </>
                )}

                {comprobante && (
                  <p className="mt-3 max-w-full truncate text-xs font-bold text-emerald-700">
                    {comprobante.name}
                  </p>
                )}
              </label>

              <input
                id="comprobante-pago"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                disabled={
                  formularioBloqueado
                }
                onChange={
                  seleccionarComprobante
                }
                className="sr-only"
              />
            </div>

            {errorFormulario && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />
                {errorFormulario}
              </div>
            )}

            <EstadoPago
              compraConfirmada={
                compraConfirmada
              }
              confirmando={confirmando}
              comprobanteEnviado={
                comprobanteEnviado ||
                estadoActual ===
                  "PENDIENTE" ||
                estadoActual ===
                  "EN_REVISION"
              }
            />

            <button
              type="submit"
              disabled={
                formularioBloqueado ||
                !qrDisponible
              }
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {compraConfirmada ? (
                <CheckCircle2
                  size={23}
                />
              ) : comprobanteEnviado ? (
                <Clock3 size={23} />
              ) : (
                <UploadCloud
                  size={23}
                />
              )}

              {confirmando
                ? "Enviando comprobante..."
                : compraConfirmada
                  ? "Pago aprobado"
                  : comprobanteEnviado
                    ? "Comprobante enviado"
                    : "Enviar comprobante"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              No cierres esta pantalla
              mientras se envía la
              información del pago.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

function EstadoPago({
  compraConfirmada,
  confirmando,
  comprobanteEnviado,
}: {
  compraConfirmada: boolean;
  confirmando: boolean;
  comprobanteEnviado: boolean;
}) {
  const titulo = compraConfirmada
    ? "Pago aprobado"
    : confirmando
      ? "Enviando comprobante"
      : comprobanteEnviado
        ? "Pago en revisión"
        : "Pago pendiente";

  const descripcion =
    compraConfirmada
      ? "La compra fue confirmada y el ticket fue generado correctamente."
      : confirmando
        ? "Estamos registrando el comprobante de pago."
        : comprobanteEnviado
          ? "La administradora revisará el comprobante antes de aprobar la compra."
          : "Realiza el pago y completa los dos campos para solicitar la verificación.";

  const aprobado =
    compraConfirmada;

  const enRevision =
    comprobanteEnviado &&
    !compraConfirmada;

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        Estado del pago
      </p>

      <div className="mt-3 flex items-center gap-3">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            aprobado
              ? "bg-emerald-700 text-white"
              : enRevision
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700",
          ].join(" ")}
        >
          {aprobado ? (
            <CheckCircle2 size={24} />
          ) : enRevision ? (
            <Clock3 size={24} />
          ) : (
            <CreditCard size={24} />
          )}
        </div>

        <div>
          <p className="font-black text-slate-900">
            {titulo}
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {descripcion}
          </p>
        </div>
      </div>
    </div>
  );
}

function InformacionPago({
  icono,
  titulo,
  descripcion,
  segura = false,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
  segura?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl border p-5",
        segura
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            segura
              ? "bg-emerald-700 text-white"
              : "bg-white text-emerald-700 shadow-sm",
          ].join(" ")}
        >
          {icono}
        </div>

        <div>
          <p
            className={[
              "font-black",
              segura
                ? "text-emerald-900"
                : "text-slate-900",
            ].join(" ")}
          >
            {titulo}
          </p>

          <p
            className={[
              "mt-2 text-sm leading-relaxed",
              segura
                ? "text-emerald-800/80"
                : "text-slate-600",
            ].join(" ")}
          >
            {descripcion}
          </p>
        </div>
      </div>
    </div>
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

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (
      typeof mensaje === "string"
    ) {
      return mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo enviar el comprobante. Inténtalo nuevamente.";
}

export default PagoQR;