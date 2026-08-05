import {
  useRef,
  useState,
  type ReactNode,
} from "react";

import { toPng } from "html-to-image";

import {
  Armchair,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  QrCode,
  ReceiptText,
  User,
} from "lucide-react";

import logo from "../assets/logo.png";

type AsientoTicket = {
  id?: string;
  numero?: number | string;
  estado?: string;
};

type PasajeroTicket = {
  nombre: string;
  ci: string;
  telefono: string;
  email?: string;
};

type Props = {
  resultado: any;

  pasajero: PasajeroTicket;

  viaje: any;

  asientos: AsientoTicket[];

  metodoPago: string;

  onNuevaVenta: () => void;
};

function TicketVentaOficina({
  resultado,
  pasajero,
  viaje,
  asientos,
  metodoPago,
  onNuevaVenta,
}: Props) {
  const ticketRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    procesandoImagen,
    setProcesandoImagen,
  ] = useState(false);

  const listaAsientos =
    Array.isArray(asientos)
      ? asientos
      : [];

  const numerosAsientos =
    listaAsientos
      .map((item) =>
        String(
          item?.numero ?? "",
        ).trim(),
      )
      .filter(Boolean);

  const textoAsientos =
    numerosAsientos.length > 0
      ? numerosAsientos.join(", ")
      : "---";

  const cantidadAsientos =
    listaAsientos.length;

  const venta =
    resultado?.venta ||
    resultado;

  const reserva =
    resultado?.reserva;

  const ticketsRespuesta =
    Array.isArray(
      resultado?.tickets,
    )
      ? resultado.tickets
      : [];

  const ticket =
    resultado?.ticket ||
    ticketsRespuesta[0] ||
    null;

  const codigoVenta =
    venta?.codigoVenta ||
    resultado?.codigoVenta ||
    "---";

  const codigoReserva =
    reserva?.codigoReserva ||
    resultado?.codigoReserva ||
    "---";

  const codigoTicket =
    ticket?.codigoTicket ||
    resultado?.codigoTicket ||
    "---";

  const imagenQr =
    ticket?.imagenQr ||
    resultado?.imagenQr ||
    "";

  const precioUnitario = Number(
    viaje?.precio || 0,
  );

  const totalCalculado =
    precioUnitario *
    cantidadAsientos;

  const montoRespuesta = Number(
    venta?.monto ||
      venta?.total ||
      resultado?.monto ||
      resultado?.total ||
      0,
  );

  const precio =
    montoRespuesta > 0
      ? montoRespuesta
      : totalCalculado;

  const origen =
    viaje?.ruta?.origen ||
    "---";

  const destino =
    viaje?.ruta?.destino ||
    "---";

  const marca =
    viaje?.vehiculo?.marca ||
    "---";

  const modelo =
    viaje?.vehiculo?.modelo ||
    "";

  const placa =
    viaje?.vehiculo?.placa ||
    "---";

  const capacidad =
    viaje?.vehiculo?.capacidad ||
    "---";

  const generarImagen =
    async (): Promise<string> => {
      if (!ticketRef.current) {
        throw new Error(
          "No se encontró el ticket.",
        );
      }

      const ancho = 576;
      const alto = 576;

      return await toPng(
        ticketRef.current,
        {
          cacheBust: true,
          pixelRatio: 3,
          backgroundColor:
            "#ffffff",
          width: ancho,
          height: alto,
          canvasWidth:
            ancho * 3,
          canvasHeight:
            alto * 3,

          style: {
            width: `${ancho}px`,
            height: `${alto}px`,
            minWidth: `${ancho}px`,
            minHeight: `${alto}px`,
            maxWidth: `${ancho}px`,
            maxHeight: `${alto}px`,
            margin: "0",
            padding: "0",
            transform: "none",
            position: "relative",
            left: "0",
            top: "0",
          },
        },
      );
    };

  const descargarImagen =
    async () => {
      try {
        setProcesandoImagen(true);

        const imagen =
          await generarImagen();

        const enlace =
          document.createElement(
            "a",
          );

        enlace.download =
          `${codigoTicket}.png`;

        enlace.href = imagen;
        enlace.click();
      } catch (error) {
        console.error(error);

        window.alert(
          "No se pudo generar la imagen del ticket.",
        );
      } finally {
        setProcesandoImagen(false);
      }
    };

  const imprimirSoloTicket = () => {
    if (!ticketRef.current) {
      return;
    }

    const contenido =
      ticketRef.current.outerHTML;

    const estilos = Array.from(
      document.querySelectorAll(
        'style, link[rel="stylesheet"]',
      ),
    )
      .map(
        (elemento) =>
          elemento.outerHTML,
      )
      .join("\n");

    const ventana = window.open(
      "",
      "_blank",
      "width=900,height=900",
    );

    if (!ventana) {
      window.alert(
        "El navegador bloqueó la ventana de impresión.",
      );

      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>${codigoTicket}</title>

          ${estilos}

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            body {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }

            .ticket-impresion {
              width: 6in !important;
              height: 6in !important;
              min-width: 6in !important;
              max-width: 6in !important;
              min-height: 6in !important;
              max-height: 6in !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              overflow: hidden !important;
            }

            @page {
              size: 6in 6in;
              margin: 0;
            }

            @media print {
              html,
              body {
                width: 6in;
                height: 6in;
                min-width: 6in;
                min-height: 6in;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
              }

              body {
                display: block;
              }

              .ticket-impresion {
                width: 6in !important;
                height: 6in !important;
                min-width: 6in !important;
                max-width: 6in !important;
                min-height: 6in !important;
                max-height: 6in !important;
                margin: 0 !important;
                page-break-after: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          ${contenido}

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 700);
            };

            window.onafterprint = function () {
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  };

  const enviarWhatsApp =
    async () => {
      const telefono =
        normalizarTelefono(
          pasajero.telefono,
        );

      if (!telefono) {
        window.alert(
          "El número de teléfono no es válido.",
        );

        return;
      }

      try {
        setProcesandoImagen(true);

        const imagen =
          await generarImagen();

        const respuesta =
          await fetch(imagen);

        const blob =
          await respuesta.blob();

        const archivo =
          new File(
            [blob],
            `${codigoTicket}.png`,
            {
              type: "image/png",
            },
          );

        const palabraAsiento =
          cantidadAsientos === 1
            ? "Asiento"
            : "Asientos";

        const palabraPasaje =
          cantidadAsientos === 1
            ? "pasaje"
            : "pasajes";

        const mensaje = [
          "TRANS 2 DE JUNIO",
          "",
          `Hola ${pasajero.nombre}.`,
          "",
          `Su compra de ${cantidadAsientos} ${palabraPasaje} fue confirmada correctamente.`,
          "",
          `Ticket: ${codigoTicket}`,
          `Reserva: ${codigoReserva}`,
          `Ruta: ${origen} → ${destino}`,
          `Fecha: ${formatearFecha(
            viaje?.fecha,
          )}`,
          `Hora: ${formatearHora(
            viaje?.horaSalida,
          )}`,
          `${palabraAsiento}: ${textoAsientos}`,
          `Cantidad: ${cantidadAsientos}`,
          `Precio unitario: Bs. ${precioUnitario.toFixed(
            2,
          )}`,
          `Total: Bs. ${precio.toFixed(
            2,
          )}`,
          "",
          "Presente el código QR antes de abordar.",
        ].join("\n");

        if (
          navigator.share &&
          navigator.canShare?.({
            files: [archivo],
          })
        ) {
          await navigator.share({
            title:
              "Ticket Trans 2 de Junio",

            text: mensaje,

            files: [archivo],
          });

          return;
        }

        const enlace =
          document.createElement(
            "a",
          );

        enlace.download =
          `${codigoTicket}.png`;

        enlace.href = imagen;
        enlace.click();

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(
          `${mensaje}

La imagen del ticket fue descargada. Adjunte el archivo ${codigoTicket}.png en este chat.`,
        )}`;

        window.open(
          url,
          "_blank",
          "noopener,noreferrer",
        );
      } catch (error) {
        console.error(error);

        window.alert(
          "No se pudo preparar el ticket para WhatsApp.",
        );
      } finally {
        setProcesandoImagen(false);
      }
    };
      return (
    <section className="mt-8">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* TICKET 6 × 6 */}

        <div className="overflow-x-auto rounded-[28px] border border-emerald-100 bg-emerald-50/50 p-4 sm:p-6">
          <div className="mx-auto w-max">
            <div
              ref={ticketRef}
              className="ticket-impresion relative overflow-hidden border-2 border-dashed border-emerald-700 bg-white text-slate-900"
              style={{
                width: "576px",
                height: "576px",
                minWidth: "576px",
                minHeight: "576px",
                maxWidth: "576px",
                maxHeight: "576px",
                margin: 0,
                padding: 0,
              }}
            >
              {/* MARCA DE AGUA */}

              <img
                src={logo}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 m-auto h-[78%] w-[78%] object-contain opacity-[0.05]"
              />

              <div className="relative z-10 flex h-full flex-col p-3">
                {/* CABECERA */}

                <header className="grid grid-cols-[110px_1fr_145px] items-center gap-3 border-b-2 border-emerald-800 pb-2">
                  <div className="flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Logo Trans 2 de Junio"
                      className="h-20 w-24 scale-[1.25] object-contain"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-black uppercase text-emerald-800">
                      Servicio de Transporte
                    </p>

                    <h2 className="text-4xl font-black leading-none text-emerald-800">
                      2 de Junio
                    </h2>

                    <p className="mt-1 rounded-md bg-emerald-800 px-2 py-1 text-sm font-black uppercase text-white">
                      Boleto electrónico oficial
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Codigo
                      titulo="Ticket N.º"
                      valor={codigoTicket}
                    />

                    <Codigo
                      titulo="Reserva N.º"
                      valor={codigoReserva}
                    />
                  </div>
                </header>

                {/* PASAJERO, QR Y TOTAL */}

                <div className="mt-3 grid grid-cols-[1fr_180px_1fr] gap-3">
                  <Caja titulo="Datos del pasajero">
                    <LineaDato
                      icono={<User size={15} />}
                      titulo="Nombre"
                      valor={
                        pasajero.nombre ||
                        "---"
                      }
                    />

                    <LineaDato
                      icono={
                        <ReceiptText
                          size={15}
                        />
                      }
                      titulo="C.I."
                      valor={
                        pasajero.ci ||
                        "---"
                      }
                    />

                    <LineaDato
                      icono={
                        <Phone size={15} />
                      }
                      titulo="Teléfono"
                      valor={
                        pasajero.telefono ||
                        "---"
                      }
                    />

                    <LineaDato
                      icono={
                        <Mail size={15} />
                      }
                      titulo="Email"
                      valor={
                        pasajero.email ||
                        "No registrado"
                      }
                    />
                  </Caja>

                  <div className="flex flex-col items-center justify-center">
                    <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-emerald-800 bg-white p-2">
                      {imagenQr ? (
                        <img
                          src={imagenQr}
                          alt={`QR ${codigoTicket}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <QrCode
                          size={95}
                          className="text-slate-800"
                        />
                      )}
                    </div>

                    <p className="mt-1 w-full rounded-md bg-emerald-800 py-1 text-center text-xs font-black uppercase text-white">
                      Escanea para validar
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-emerald-900">
                        Fecha y hora de emisión
                      </p>

                      <p className="text-xs font-bold">
                        {new Date().toLocaleString(
                          "es-BO",
                        )}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-lg border-2 border-emerald-800 text-center">
                      <p className="bg-emerald-800 py-1 text-xs font-black uppercase text-white">
                        Total pagado
                      </p>

                      <p className="py-2 text-3xl font-black text-emerald-800">
                        Bs. {precio.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <CheckCircle2 size={35} />

                      <span className="text-xl font-black">
                        VÁLIDO
                      </span>
                    </div>
                  </div>
                </div>

                {/* DETALLE DEL VIAJE */}

                <div className="mt-3 overflow-hidden rounded-lg border-2 border-emerald-800">
                  <p className="bg-emerald-800 py-1 text-center text-sm font-black uppercase text-white">
                    Detalle del viaje
                  </p>

                  <div className="grid grid-cols-5 divide-x divide-dashed divide-slate-300">
                    <DatoTicket
                      icono={
                        <MapPin size={19} />
                      }
                      titulo="Ruta"
                      valor={`${origen} → ${destino}`}
                    />

                    <DatoTicket
                      icono={
                        <CalendarDays
                          size={19}
                        />
                      }
                      titulo="Fecha"
                      valor={formatearFecha(
                        viaje?.fecha,
                      )}
                    />

                    <DatoTicket
                      icono={
                        <Clock size={19} />
                      }
                      titulo="Hora"
                      valor={formatearHora(
                        viaje?.horaSalida,
                      )}
                    />

                    <DatoTicket
                      icono={
                        <Armchair size={19} />
                      }
                      titulo={
                        cantidadAsientos === 1
                          ? "Asiento"
                          : "Asientos"
                      }
                      valor={textoAsientos}
                    />

                    <DatoTicket
                      icono={
                        <TicketCantidad
                          cantidad={
                            cantidadAsientos
                          }
                        />
                      }
                      titulo="Cantidad"
                      valor={`${cantidadAsientos} ${
                        cantidadAsientos === 1
                          ? "pasaje"
                          : "pasajes"
                      }`}
                    />
                  </div>
                </div>

                {/* VEHÍCULO Y VENTA */}

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Caja titulo="Vehículo">
                    <LineaDato
                      icono={
                        <BusFront size={15} />
                      }
                      titulo="Marca"
                      valor={`${marca} ${modelo}`.trim()}
                    />

                    <LineaDato
                      icono={
                        <ReceiptText
                          size={15}
                        />
                      }
                      titulo="Placa"
                      valor={placa}
                    />

                    <LineaDato
                      icono={
                        <Armchair size={15} />
                      }
                      titulo="Capacidad"
                      valor={`${capacidad} pasajeros`}
                    />
                  </Caja>

                  <Caja titulo="Información de la venta">
                    <LineaDato
                      icono={
                        <ReceiptText
                          size={15}
                        />
                      }
                      titulo="Código venta"
                      valor={codigoVenta}
                    />

                    <LineaDato
                      icono={
                        <ReceiptText
                          size={15}
                        />
                      }
                      titulo="Pago"
                      valor={metodoPago}
                    />

                    <LineaDato
                      icono={
                        <CheckCircle2
                          size={15}
                        />
                      }
                      titulo="Estado"
                      valor="CONFIRMADO"
                    />
                  </Caja>
                </div>

                {/* PIE */}

                <footer className="mt-auto">
                  <div className="grid grid-cols-[1fr_1.5fr_1fr] items-center gap-2 border-t border-emerald-800 pt-2">
                    <div className="text-[9px] leading-tight">
                      <p className="font-black uppercase text-emerald-900">
                        Importante
                      </p>

                      <p>
                        • Presente este boleto al
                        abordar.
                      </p>

                      <p>
                        • Llegue 30 minutos antes.
                      </p>

                      <p>
                        • El ticket es personal.
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-black italic text-emerald-800">
                        Seguridad, puntualidad y
                        confianza
                      </p>

                      <p className="text-xs italic">
                        ¡Gracias por su preferencia!
                      </p>
                    </div>

                    <div className="text-right text-[9px] leading-tight">
                      <p className="font-black uppercase text-emerald-900">
                        Atención al cliente
                      </p>

                      <p>Oficina Central</p>

                      <p className="font-black">
                        67599408
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 bg-emerald-800 py-1 text-center text-[10px] font-bold text-white">
                    2 de Junio, llevando destinos,
                    uniendo familias.
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES */}

        <aside className="space-y-4 rounded-[28px] border border-emerald-100 bg-white p-5 text-slate-900 shadow-[0_18px_55px_rgba(0,83,42,0.12)]">
          <div className="border-b border-emerald-100 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Venta confirmada
            </p>

            <h3 className="mt-2 text-xl font-black">
              Acciones del ticket
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {cantidadAsientos}{" "}
              {cantidadAsientos === 1
                ? "asiento vendido"
                : "asientos vendidos"}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Asientos
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {numerosAsientos.map(
                (numero) => (
                  <span
                    key={numero}
                    className="rounded-xl bg-white px-3 py-2 text-sm font-black text-emerald-800 shadow-sm"
                  >
                    #{numero}
                  </span>
                ),
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-emerald-200 pt-4">
              <span className="text-sm font-bold text-slate-600">
                Total
              </span>

              <span className="text-xl font-black text-emerald-700">
                Bs. {precio.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={imprimirSoloTicket}
            className="flex w-full items-center gap-3 rounded-2xl bg-emerald-800 p-4 font-black text-white transition hover:bg-emerald-900"
          >
            <Printer size={24} />

            <div className="text-left">
              <p>Imprimir ticket</p>

              <p className="text-xs font-normal text-emerald-100">
                Tamaño exacto 6 × 6 pulgadas
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={descargarImagen}
            disabled={procesandoImagen}
            className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <Download size={24} />

            <div className="text-left">
              <p>Guardar como imagen</p>

              <p className="text-xs font-normal text-emerald-600">
                Descargar en formato PNG
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={enviarWhatsApp}
            disabled={procesandoImagen}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#25D366] p-4 font-black text-white transition hover:bg-[#1fbd5a] disabled:opacity-50"
          >
            <MessageCircle size={24} />

            <div className="text-left">
              <p>
                {procesandoImagen
                  ? "Preparando..."
                  : "Enviar por WhatsApp"}
              </p>

              <p className="text-xs font-normal text-green-50">
                Compartir ticket como imagen
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onNuevaVenta}
            className="w-full rounded-2xl border-2 border-emerald-700 bg-white p-4 font-black text-emerald-700 transition hover:bg-emerald-700 hover:text-white"
          >
            Registrar otra venta
          </button>
        </aside>
      </div>
    </section>
  );
}

function Codigo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-emerald-800 text-center">
      <p className="bg-emerald-800 py-0.5 text-[9px] font-black uppercase text-white">
        {titulo}
      </p>

      <p className="truncate px-1 py-1 text-[11px] font-black">
        {valor}
      </p>
    </div>
  );
}

function Caja({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-emerald-800">
      <p className="bg-emerald-800 py-1 text-center text-xs font-black uppercase text-white">
        {titulo}
      </p>

      <div className="space-y-1 p-2">
        {children}
      </div>
    </div>
  );
}

function LineaDato({
  icono,
  titulo,
  valor,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="grid grid-cols-[20px_1fr] items-start gap-1">
      <div className="text-emerald-800">
        {icono}
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-black text-emerald-900">
          {titulo}:
        </p>

        <p className="break-words text-[10px] font-bold leading-tight">
          {valor}
        </p>
      </div>
    </div>
  );
}

function DatoTicket({
  icono,
  titulo,
  valor,
}: {
  icono: ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="min-h-[70px] p-2 text-center">
      <div className="flex justify-center text-emerald-800">
        {icono}
      </div>

      <p className="mt-1 text-[9px] font-black uppercase text-emerald-900">
        {titulo}
      </p>

      <p className="mt-1 text-[10px] font-black leading-tight">
        {valor}
      </p>
    </div>
  );
}

function TicketCantidad({
  cantidad,
}: {
  cantidad: number;
}) {
  return (
    <div className="flex h-5 min-w-5 items-center justify-center rounded bg-emerald-800 px-1 text-[10px] font-black text-white">
      {cantidad}
    </div>
  );
}

function normalizarTelefono(
  valor: string,
): string {
  let telefono =
    valor.replace(/\D/g, "");

  if (!telefono) {
    return "";
  }

  if (
    telefono.startsWith("591")
  ) {
    return telefono;
  }

  if (
    telefono.startsWith("0")
  ) {
    telefono =
      telefono.substring(1);
  }

  return `591${telefono}`;
}

function formatearFecha(
  fecha?: string,
): string {
  if (!fecha) {
    return "---";
  }

  const fechaNormalizada =
    String(fecha).substring(0, 10);

  const fechaLocal = new Date(
    `${fechaNormalizada}T00:00:00`,
  );

  if (
    Number.isNaN(fechaLocal.getTime())
  ) {
    return fechaNormalizada;
  }

  return fechaLocal.toLocaleDateString(
    "es-BO",
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

export default TicketVentaOficina;