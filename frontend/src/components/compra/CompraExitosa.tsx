import {
  CheckCircle2,
  Download,
  Home,
  LoaderCircle,
  Printer,
  Ticket,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import TicketCard from "../TicketCard";

interface Props {
  ticket: any;
  esVentaOficina?: boolean;
  onVerMisTickets?: () => void;
  onVolverInicio: () => void;
}

function CompraExitosa({
  ticket,
  esVentaOficina = false,
  onVerMisTickets,
  onVolverInicio,
}: Props) {
  const ticketRef =
    useRef<HTMLDivElement | null>(null);

  const [descargando, setDescargando] =
    useState(false);

  if (!ticket) {
    return null;
  }

  const imprimirTicket = () => {
    const contenido =
      ticketRef.current?.innerHTML;

    if (!contenido) {
      return;
    }

    const ventanaImpresion = window.open(
      "",
      "_blank",
      "width=1200,height=900",
    );

    if (!ventanaImpresion) {
      alert(
        "El navegador bloqueó la ventana de impresión.",
      );
      return;
    }

    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>Ticket 2 de Junio</title>

          <script src="https://cdn.tailwindcss.com"></script>

          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            img {
              max-width: 100%;
            }
          </style>
        </head>

        <body>
          ${contenido}

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
                window.close();
              }, 700);
            };
          </script>
        </body>
      </html>
    `);

    ventanaImpresion.document.close();
  };

  const descargarPdf = async () => {
    if (!ticketRef.current) {
      return;
    }

    try {
      setDescargando(true);

      const canvas = await html2canvas(
        ticketRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        },
      );

      const imagen = canvas.toDataURL(
        "image/png",
        1,
      );

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const anchoPagina =
        pdf.internal.pageSize.getWidth();

      const altoPagina =
        pdf.internal.pageSize.getHeight();

      const margen = 6;

      const anchoDisponible =
        anchoPagina - margen * 2;

      const altoDisponible =
        altoPagina - margen * 2;

      const proporcionImagen =
        canvas.width / canvas.height;

      let anchoImagen = anchoDisponible;
      let altoImagen =
        anchoImagen / proporcionImagen;

      if (altoImagen > altoDisponible) {
        altoImagen = altoDisponible;
        anchoImagen =
          altoImagen * proporcionImagen;
      }

      const posicionX =
        (anchoPagina - anchoImagen) / 2;

      const posicionY =
        (altoPagina - altoImagen) / 2;

      pdf.addImage(
        imagen,
        "PNG",
        posicionX,
        posicionY,
        anchoImagen,
        altoImagen,
      );

      const codigo =
        ticket?.ticket?.codigoTicket ??
        ticket?.tickets?.[0]?.codigoTicket ??
        ticket?.codigoTicket ??
        "boleto";

      pdf.save(`ticket-${codigo}.pdf`);
    } catch (error) {
      console.error(
        "Error descargando el ticket:",
        error,
      );

      alert(
        "No se pudo descargar el ticket en PDF.",
      );
    } finally {
      setDescargando(false);
    }
  };

  return (
    <section className="mt-10 rounded-3xl border border-emerald-500/40 bg-[#111827] p-4 shadow-2xl md:p-8">
      <div className="mb-8 text-center">
        <CheckCircle2
          size={70}
          className="mx-auto text-emerald-400"
        />

        <h2 className="mt-5 text-3xl font-black text-emerald-400 md:text-4xl">
          ¡Compra realizada correctamente!
        </h2>

        <p className="mt-3 text-slate-300">
          Tu boleto electrónico fue generado
          correctamente.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl">
        <div className="min-w-[1050px]">
          <TicketCard
            ticket={ticket}
            ticketRef={ticketRef}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col flex-wrap justify-center gap-4 sm:flex-row">
        <button
          type="button"
          onClick={imprimirTicket}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-black text-white transition hover:bg-blue-700"
        >
          <Printer size={20} />
          Imprimir Ticket
        </button>

        <button
          type="button"
          onClick={descargarPdf}
          disabled={descargando}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {descargando ? (
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
          ) : (
            <Download size={20} />
          )}

          {descargando
            ? "Generando PDF..."
            : "Descargar PDF"}
        </button>

        {!esVentaOficina &&
          onVerMisTickets && (
            <button
              type="button"
              onClick={onVerMisTickets}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 font-black text-white transition hover:bg-violet-700"
            >
              <Ticket size={20} />
              Ver Mis Tickets
            </button>
          )}

        <button
          type="button"
          onClick={onVolverInicio}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 font-black text-slate-950 transition hover:bg-yellow-300"
        >
          <Home size={20} />

          {esVentaOficina
            ? "Realizar Nueva Venta"
            : "Volver al Inicio"}
        </button>
      </div>
    </section>
  );
}

export default CompraExitosa;