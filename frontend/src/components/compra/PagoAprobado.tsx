
import {
  useRef,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  CheckCircle2,
  ImageDown,
  LoaderCircle,
  MessageCircle,
  Printer,
  Save,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";

import {
  toBlob,
  toPng,
} from "html-to-image";

import TicketCard from "../TicketCard";

export interface TicketPagoAprobado {
  id?: string;
  codigoTicket?: string;
  origen?: string;
  destino?: string;
  fecha?: string;
  hora?: string;

  asientos?: Array<
    string | number
  >;

  total?: number;
  imagenQr?: string;
  datosOficiales?: unknown;
}

export interface PagoAprobadoProps {
  total: number;

  ticket:
    | TicketPagoAprobado
    | null;

  onGuardar?: () => void;
  onDescargar?: () => void;
  onCompartir?: () => void;
  onVerTickets?: () => void;
}

function PagoAprobado({
  total,
  ticket,
  onGuardar,
  onDescargar,
  onCompartir,
  onVerTickets,
}: PagoAprobadoProps) {
  const ticketRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    procesandoImagen,
    setProcesandoImagen,
  ] = useState(false);

  if (!ticket) {
    return null;
  }

  /*
   * Conservamos la información oficial
   * que llega desde el backend.
   *
   * Si no llega datosOficiales,
   * utilizamos los campos disponibles.
   */
  const ticketOficial =
    ticket.datosOficiales ?? {
      codigoTicket:
        ticket.codigoTicket,

      imagenQr:
        ticket.imagenQr,

      montoTotal:
        ticket.total ?? total,

      asientos:
        ticket.asientos?.map(
          (numero, indice) => ({
            id:
              String(indice),

            numero,
          }),
        ) ?? [],

      viaje: {
        fecha:
          ticket.fecha,

        horaSalida:
          ticket.hora,

        ruta: {
          origen:
            ticket.origen,

          destino:
            ticket.destino,
        },
      },
    };

  /*
   * Código seguro para utilizar
   * como nombre de archivo.
   */
  const codigoSeguro =
    String(
      ticket.codigoTicket ||
        ticket.id ||
        "ticket",
    ).replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    );

  /*
   * Descargar el ticket completo
   * como una imagen PNG.
   */
  const descargarTicketOficial =
    async () => {
      if (
        !ticketRef.current
      ) {
        onDescargar?.();
        return;
      }

      try {
        setProcesandoImagen(
          true,
        );

        const imagen =
          await toPng(
            ticketRef.current,
            {
              cacheBust: true,
              backgroundColor:
                "#ffffff",
              pixelRatio: 2,
            },
          );

        const enlace =
          document.createElement(
            "a",
          );

        enlace.download =
          `ticket-${codigoSeguro}.png`;

        enlace.href =
          imagen;

        enlace.click();
      } catch (
        error: unknown
      ) {
        console.error(
          "No se pudo descargar el ticket:",
          error,
        );

        onDescargar?.();
      } finally {
        setProcesandoImagen(
          false,
        );
      }
    };

  /*
   * Compartir imagen del ticket.
   *
   * En celulares compatibles permite
   * compartirla por WhatsApp u otra
   * aplicación mediante el menú nativo.
   */
  const compartirTicketOficial =
    async () => {
      if (
        !ticketRef.current
      ) {
        onCompartir?.();
        return;
      }

      try {
        setProcesandoImagen(
          true,
        );

        const blob =
          await toBlob(
            ticketRef.current,
            {
              cacheBust: true,
              backgroundColor:
                "#ffffff",
              pixelRatio: 2,
            },
          );

        if (!blob) {
          throw new Error(
            "No se pudo crear la imagen.",
          );
        }

        const archivo =
          new File(
            [blob],
            `ticket-${codigoSeguro}.png`,
            {
              type:
                "image/png",
            },
          );

        if (
          navigator.share &&
          navigator.canShare?.({
            files: [
              archivo,
            ],
          })
        ) {
          await navigator.share({
            title:
              "Ticket Trans 2 de Junio",

            text:
              "Mi ticket electrónico de Trans 2 de Junio.",

            files: [
              archivo,
            ],
          });

          return;
        }

        onCompartir?.();
      } catch (
        error: unknown
      ) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "No se pudo compartir el ticket:",
          error,
        );

        onCompartir?.();
      } finally {
        setProcesandoImagen(
          false,
        );
      }
    };

  /*
   * Se conserva la función
   * original de impresión.
   */
  const imprimirTicket =
    () => {
      window.print();
    };

  return (
    <section className="mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white text-slate-900 shadow-xl shadow-emerald-950/10 sm:mt-6 sm:rounded-[30px]">
      {/* ENCABEZADO */}

      <header className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 px-3 py-5 text-white sm:px-9 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[38px] border-white/[0.09]" />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border-[28px] border-emerald-200/[0.08]" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white/35 bg-white/15 shadow-lg backdrop-blur-sm sm:h-20 sm:w-20 sm:border-4">
            <CheckCircle2
              size={34}
              className="sm:h-12 sm:w-12"
              aria-hidden="true"
            />
          </div>

          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100 sm:mt-5 sm:text-xs sm:tracking-[0.24em]">
            Verificación completada
          </p>

          <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">
            ¡Compra exitosa!
          </h2>

          <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-emerald-50 sm:text-sm sm:font-semibold sm:leading-6">
            La administradora aprobó
            el pago y tu ticket ya
            está disponible.
          </p>

          {ticket.codigoTicket && (
            <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-3 py-2 backdrop-blur-sm">
              <TicketCheck
                size={17}
                className="shrink-0"
              />

              <span className="min-w-0 break-all text-xs font-black sm:text-sm">
                {ticket.codigoTicket}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* CONTENIDO */}

      <div className="mx-auto w-full min-w-0 max-w-[1320px] p-2 sm:p-5 lg:p-8">
        {/* TÍTULO DEL TICKET */}

        <div className="mb-3 flex min-w-0 items-center gap-2 px-1 sm:mb-4">
          <ShieldCheck
            size={20}
            className="shrink-0 text-emerald-700"
          />

          <div className="min-w-0">
            <h3 className="text-sm font-black text-emerald-900 sm:text-lg">
              Tu ticket digital
            </h3>

            <p className="text-xs text-slate-500">
              Preséntalo al momento
              de abordar el vehículo.
            </p>
          </div>
        </div>

        {/* TICKET ADAPTABLE */}

        <div className="w-full min-w-0 max-w-full rounded-xl border border-emerald-100 bg-emerald-50/40 p-1 sm:rounded-[28px] sm:p-4">
          {/*
           * Se elimina min-w-[1050px].
           *
           * El TicketCard puede utilizar
           * todo el ancho disponible.
           *
           * No cambiamos el QR ni sus datos.
           */}

          <div className="w-full min-w-0 max-w-full">
            <TicketCard
              ticket={ticketOficial}
              ticketRef={ticketRef}
              mostrarDetallesInicialmente
              mostrarAcciones={false}
            />
          </div>
        </div>

        {/* ACCIONES */}

        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-3">
          <BotonAccion
            icono={
              <Save size={20} />
            }
            texto="Guardar"
            onClick={onGuardar}
            disabled={
              procesandoImagen
            }
          />

          <BotonAccion
            icono={
              procesandoImagen ? (
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <ImageDown
                  size={20}
                />
              )
            }
            texto={
              procesandoImagen
                ? "Preparando..."
                : "Descargar imagen"
            }
            onClick={() =>
              void descargarTicketOficial()
            }
            disabled={
              procesandoImagen
            }
          />

          <BotonAccion
            icono={
              <MessageCircle
                size={20}
              />
            }
            texto="Compartir por WhatsApp"
            onClick={() =>
              void compartirTicketOficial()
            }
            principal
            disabled={
              procesandoImagen
            }
          />

          <BotonAccion
            icono={
              <WalletCards
                size={20}
              />
            }
            texto="Ver mis tickets"
            onClick={
              onVerTickets
            }
            disabled={
              procesandoImagen
            }
          />

          <BotonAccion
            icono={
              <Printer
                size={20}
              />
            }
            texto="Imprimir ticket"
            onClick={
              imprimirTicket
            }
            disabled={
              procesandoImagen
            }
          />
        </div>

        {/* MENSAJE DE CONFIRMACIÓN */}

        <div className="mt-4 flex min-w-0 items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:mt-6 sm:rounded-2xl sm:px-5 sm:py-4">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <p className="min-w-0 text-xs font-semibold leading-5 text-emerald-900 sm:text-sm sm:leading-6">
            Tu compra está confirmada.
            Guarda el ticket en tu
            dispositivo o compártelo
            por WhatsApp para tenerlo
            disponible al momento
            de abordar.
          </p>
        </div>
      </div>
    </section>
  );
}

function BotonAccion({
  icono,
  texto,
  onClick,
  principal = false,
  disabled = false,
}: {
  icono: ReactNode;
  texto: string;
  onClick?: () => void;
  principal?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={
        !onClick || disabled
      }
      className={[
        "flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center text-xs font-black leading-4 transition sm:min-h-14 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm",
        "disabled:cursor-not-allowed disabled:opacity-50",

        principal
          ? "border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-900/15 hover:bg-emerald-600"
          : "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50",
      ].join(" ")}
    >
      <span className="shrink-0">
        {icono}
      </span>

      <span className="min-w-0 break-words">
        {texto}
      </span>
    </button>
  );
}

export default PagoAprobado;
