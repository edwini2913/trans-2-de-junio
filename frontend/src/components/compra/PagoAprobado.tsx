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
    useRef<HTMLDivElement | null>(null);

  const [procesandoImagen, setProcesandoImagen] =
    useState(false);

  if (!ticket) {
    return null;
  }

  const ticketOficial =
    ticket.datosOficiales ?? {
      codigoTicket:
        ticket.codigoTicket,
      imagenQr: ticket.imagenQr,
      montoTotal:
        ticket.total ?? total,
      asientos:
        ticket.asientos?.map(
          (numero, indice) => ({
            id: String(indice),
            numero,
          }),
        ) ?? [],
      viaje: {
        fecha: ticket.fecha,
        horaSalida: ticket.hora,
        ruta: {
          origen: ticket.origen,
          destino: ticket.destino,
        },
      },
    };

  const codigoSeguro = String(
    ticket.codigoTicket ||
      ticket.id ||
      "ticket",
  ).replace(
    /[^a-zA-Z0-9-_]/g,
    "-",
  );

  const descargarTicketOficial =
    async () => {
      if (!ticketRef.current) {
        onDescargar?.();
        return;
      }

      try {
        setProcesandoImagen(true);

        const imagen = await toPng(
          ticketRef.current,
          {
            cacheBust: true,
            backgroundColor: "#ffffff",
            pixelRatio: 2,
          },
        );

        const enlace =
          document.createElement("a");

        enlace.download =
          `ticket-${codigoSeguro}.png`;
        enlace.href = imagen;
        enlace.click();
      } catch (error) {
        console.error(
          "No se pudo descargar el ticket:",
          error,
        );
        onDescargar?.();
      } finally {
        setProcesandoImagen(false);
      }
    };

  const compartirTicketOficial =
    async () => {
      if (!ticketRef.current) {
        onCompartir?.();
        return;
      }

      try {
        setProcesandoImagen(true);

        const blob = await toBlob(
          ticketRef.current,
          {
            cacheBust: true,
            backgroundColor: "#ffffff",
            pixelRatio: 2,
          },
        );

        if (!blob) {
          throw new Error(
            "No se pudo crear la imagen.",
          );
        }

        const archivo = new File(
          [blob],
          `ticket-${codigoSeguro}.png`,
          {
            type: "image/png",
          },
        );

        if (
          navigator.share &&
          navigator.canShare?.({
            files: [archivo],
          })
        ) {
          await navigator.share({
            title:
              "Ticket Trans 2 de Junio",
            text:
              "Mi ticket electrónico de Trans 2 de Junio.",
            files: [archivo],
          });
          return;
        }

        onCompartir?.();
      } catch (error) {
        console.error(
          "No se pudo compartir el ticket:",
          error,
        );
        onCompartir?.();
      } finally {
        setProcesandoImagen(false);
      }
    };

  const imprimirTicket = () => {
    window.print();
  };

  return (
    <section className="mt-6 overflow-hidden rounded-[30px] border border-emerald-100 bg-white shadow-2xl shadow-emerald-950/10">
      <header className="relative overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-600 to-lime-500 px-6 py-8 text-white sm:px-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[38px] border-white/[0.09]" />

        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full border-[28px] border-emerald-200/[0.08]" />

        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/35 bg-white/15 shadow-xl backdrop-blur-sm">
            <CheckCircle2
              size={48}
            />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-emerald-100">
            Verificación completada
          </p>

          <h2 className="mt-2 text-3xl font-black sm:text-4xl">
            ¡Compra exitosa!
          </h2>

          <p className="mt-2 max-w-xl text-sm font-semibold text-emerald-50">
            La administradora aprobó
            el pago y tu ticket ya
            está disponible.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] p-4 sm:p-7 lg:p-9">
        <div className="overflow-x-auto rounded-[28px] bg-emerald-50/40 p-2 sm:p-4">
          <div className="min-w-[1050px]">
            <TicketCard
              ticket={ticketOficial}
              ticketRef={ticketRef}
              mostrarDetallesInicialmente
              mostrarAcciones={false}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BotonAccion
            icono={<Save size={21} />}
            texto="Guardar"
            onClick={onGuardar}
          />

          <BotonAccion
            icono={
              procesandoImagen ? (
                <LoaderCircle
                  size={21}
                  className="animate-spin"
                />
              ) : (
                <ImageDown size={21} />
              )
            }
            texto="Descargar imagen"
            onClick={() =>
              void descargarTicketOficial()
            }
          />

          <BotonAccion
            icono={
              <MessageCircle
                size={21}
              />
            }
            texto="Compartir por WhatsApp"
            onClick={() =>
              void compartirTicketOficial()
            }
            principal
          />

          <BotonAccion
            icono={
              <WalletCards size={21} />
            }
            texto="Ver mis tickets"
            onClick={onVerTickets}
          />

          <BotonAccion
            icono={<Printer size={21} />}
            texto="Imprimir ticket"
            onClick={imprimirTicket}
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2
            size={23}
            className="mt-0.5 shrink-0 text-emerald-700"
          />

          <p className="text-sm font-semibold leading-6 text-emerald-900">
            Tu compra está confirmada.
            Guarda el ticket en tu
            dispositivo o compártelo
            por WhatsApp para tenerlo
            disponible al momento de
            abordar.
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
}: {
  icono: ReactNode;
  texto: string;
  onClick?: () => void;
  principal?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={[
        "flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 font-black transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        principal
          ? "border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 hover:-translate-y-0.5 hover:bg-emerald-600"
          : "border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50",
      ].join(" ")}
    >
      {icono}
      {texto}
    </button>
  );
}

export default PagoAprobado;