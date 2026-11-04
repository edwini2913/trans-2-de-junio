
import {
  useRef,
  useState,
  type ReactNode,
} from "react";

import { toPng } from "html-to-image";

import {
  AlertTriangle,
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
  ShieldCheck,
  User,
} from "lucide-react";

import logo from "../assets/logo.png";

/* ========================================================
   TIPOS DE DATOS
======================================================== */

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

/* ========================================================
   FUNCIONES AUXILIARES
======================================================== */

function formatearFecha(fecha?: string): string {
  if (!fecha) {
    return "---";
  }

  const valor = String(fecha).substring(0, 10);
  const partes = valor.split("-");

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatearHora(hora?: string): string {
  if (!hora) {
    return "--:--";
  }

  return String(hora).substring(0, 5);
}

function normalizarTelefono(valor: string): string {
  let telefono = String(valor || "").replace(/\D/g, "");

  if (!telefono) {
    return "";
  }

  if (telefono.startsWith("591")) {
    return telefono;
  }

  if (telefono.startsWith("0")) {
    telefono = telefono.substring(1);
  }

  return `591${telefono}`;
}

function obtenerRespuestaVenta(resultado: any): any {
  if (
    resultado?.data &&
    (
      resultado.data.ticket ||
      resultado.data.tickets ||
      resultado.data.venta
    )
  ) {
    return resultado.data;
  }

  return resultado;
}

function obtenerTicket(respuesta: any): any {
  if (
    respuesta?.ticket &&
    typeof respuesta.ticket === "object"
  ) {
    return respuesta.ticket;
  }

  if (
    Array.isArray(respuesta?.tickets) &&
    respuesta.tickets.length > 0
  ) {
    return respuesta.tickets[0];
  }

  return null;
}

function obtenerNumerosAsientos(
  respuesta: any,
  ticket: any,
  asientos: AsientoTicket[],
): string[] {
  const numeros =
    ticket?.numerosAsientos ??
    respuesta?.numerosAsientos;

  if (Array.isArray(numeros)) {
    return numeros
      .map((numero: unknown) => String(numero))
      .filter(Boolean);
  }

  const lista =
    ticket?.asientos ??
    respuesta?.asientos ??
    asientos;

  if (!Array.isArray(lista)) {
    return [];
  }

  return lista
    .map((asiento: any) =>
      String(asiento?.numero ?? ""),
    )
    .filter(Boolean);
}

function normalizarMonto(valor: unknown): number {
  const monto = Number(valor);

  return Number.isFinite(monto)
    ? monto
    : 0;
}

/* ========================================================
   COMPONENTE PRINCIPAL
======================================================== */

export default function TicketVentaOficina({
  resultado,
  pasajero,
  viaje,
  asientos,
  metodoPago,
  onNuevaVenta,
}: Props) {
  const ticketRef = useRef<HTMLDivElement | null>(null);

  const [
    procesandoImagen,
    setProcesandoImagen,
  ] = useState(false);

  const [
    mensajeError,
    setMensajeError,
  ] = useState("");

  /* ======================================================
     OBTENER DATOS DEL BACKEND
  ====================================================== */

  const respuesta = obtenerRespuestaVenta(resultado);

  const ticket = obtenerTicket(respuesta);

  const venta = respuesta?.venta || respuesta;

  const reserva = respuesta?.reserva;

  const viajeRespuesta = respuesta?.viaje;

  const datosViaje = viajeRespuesta || viaje;

  const datosRuta =
    viajeRespuesta?.ruta ||
    viaje?.ruta ||
    {};

  const datosVehiculo =
    viajeRespuesta?.vehiculo ||
    viaje?.vehiculo ||
    {};

  const datosPasajero =
    respuesta?.pasajero ||
    pasajero;

  const codigoVenta =
    venta?.codigoVenta ||
    respuesta?.codigoOperacion ||
    "---";

  const codigoReserva =
    reserva?.codigoReserva ||
    respuesta?.codigoReserva ||
    "---";

  const codigoTicket =
    ticket?.codigoTicket ||
    "";

  const imagenQr =
    ticket?.imagenQr ||
    "";

  const estadoTicket = String(
    ticket?.estado || "SIN TICKET",
  ).toUpperCase();

  const tokenValidacion =
    ticket?.tokenValidacion ||
    "";

  const ticketCompleto = Boolean(
    ticket?.id &&
    codigoTicket &&
    tokenValidacion &&
    typeof imagenQr === "string" &&
    imagenQr.startsWith("data:image/"),
  );

  /* ======================================================
     DATOS DEL PASAJERO
  ====================================================== */

  const nombrePasajero =
    datosPasajero?.nombre ||
    pasajero.nombre ||
    "---";

  const ciPasajero =
    datosPasajero?.ci ||
    pasajero.ci ||
    "---";

  const telefonoPasajero =
    datosPasajero?.telefono ||
    pasajero.telefono ||
    "---";

  const emailPasajero =
    datosPasajero?.email ||
    pasajero.email ||
    "No registrado";

  /* ======================================================
     DATOS DEL VIAJE
  ====================================================== */

  const origen =
    datosRuta?.origen ||
    "---";

  const destino =
    datosRuta?.destino ||
    "---";

  const fecha =
    datosViaje?.fecha ||
    viaje?.fecha ||
    "";

  const horaSalida =
    datosViaje?.horaSalida ||
    viaje?.horaSalida ||
    "";

  const marca =
    datosVehiculo?.marca ||
    "---";

  const modelo =
    datosVehiculo?.modelo ||
    "";

  const placa =
    datosVehiculo?.placa ||
    "---";

  const capacidad =
    datosVehiculo?.capacidad ||
    "---";

  const tipoVehiculo =
    datosVehiculo?.tipo ||
    "---";

  /* ======================================================
     ASIENTOS
  ====================================================== */

  const listaAsientos = Array.isArray(asientos)
    ? asientos
    : [];

  const numerosAsientos = obtenerNumerosAsientos(
    respuesta,
    ticket,
    listaAsientos,
  );

  const cantidadAsientos =
    numerosAsientos.length;

  const textoAsientos =
    cantidadAsientos > 0
      ? numerosAsientos.join(", ")
      : "---";

  /* ======================================================
     PRECIO Y PAGO
  ====================================================== */

  const precioUnitario = normalizarMonto(
    datosViaje?.precio ??
    viaje?.precio ??
    0,
  );

  const totalCalculado =
    precioUnitario * cantidadAsientos;

  const montoRespuesta = normalizarMonto(
    respuesta?.montoTotal ??
    respuesta?.total ??
    venta?.monto ??
    venta?.total ??
    0,
  );

  const precio =
    montoRespuesta > 0
      ? montoRespuesta
      : totalCalculado;

  const pago =
    respuesta?.metodoPago ||
    venta?.metodoPago ||
    metodoPago;

  /* ======================================================
     BLOCKCHAIN
  ====================================================== */

  const blockchain = ticket?.blockchain || {};

  const registradoBlockchain =
    blockchain.registrado === true;

  const numeroBloque =
    blockchain.indice ?? "";

  /* ======================================================
     GENERAR IMAGEN PNG DE 6 X 6 PULGADAS
  ====================================================== */

  const generarImagen = async (): Promise<string> => {
    if (!ticketCompleto) {
      throw new Error(
        "La venta no contiene un ticket QR completo. Comprueba la operación antes de repetir el cobro.",
      );
    }

    if (!ticketRef.current) {
      throw new Error(
        "No se encontró el ticket para generar la imagen.",
      );
    }

    const imagenTicket =
      ticketRef.current.querySelector<HTMLImageElement>(
        '[data-qr-ticket="true"]',
      );

    if (!imagenTicket) {
      throw new Error(
        "No se encontró la imagen QR del pasajero.",
      );
    }

    if (!imagenTicket.complete) {
      await new Promise<void>((resolve, reject) => {
        imagenTicket.addEventListener(
          "load",
          () => resolve(),
          { once: true },
        );

        imagenTicket.addEventListener(
          "error",
          () => reject(
            new Error("No se pudo cargar el QR."),
          ),
          { once: true },
        );
      });
    }

    if (imagenTicket.naturalWidth === 0) {
      throw new Error(
        "La imagen QR no pudo cargarse correctamente.",
      );
    }

    return await toPng(ticketRef.current, {
      cacheBust: true,
      pixelRatio: 3,
      backgroundColor: "#ffffff",
      width: 576,
      height: 576,
      canvasWidth: 1728,
      canvasHeight: 1728,
      style: {
        width: "576px",
        height: "576px",
        minWidth: "576px",
        minHeight: "576px",
        maxWidth: "576px",
        maxHeight: "576px",
        margin: "0",
        padding: "0",
        transform: "none",
      },
    });
  };

  /* ======================================================
     DESCARGAR TICKET
  ====================================================== */

  const descargarImagen = async () => {
    if (procesandoImagen) {
      return;
    }

    try {
      setProcesandoImagen(true);
      setMensajeError("");

      const imagen = await generarImagen();

      const enlace = document.createElement("a");

      enlace.href = imagen;
      enlace.download = `${codigoTicket}.png`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
    } catch (error) {
      console.error(error);

      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el ticket.",
      );
    } finally {
      setProcesandoImagen(false);
    }
  };

  /* ======================================================
     IMPRIMIR TICKET
  ====================================================== */

  const imprimirSoloTicket = async () => {
    let ventana: Window | null = null;

    try {
      setMensajeError("");

      ventana = window.open(
        "",
        "_blank",
        "width=900,height=900",
      );

      if (!ventana) {
        throw new Error(
          "El navegador bloqueó la ventana de impresión.",
        );
      }

      const imagen = await generarImagen();

      ventana.document.open();

      ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
            />
            <title>Ticket de pasaje</title>

            <style>
              * {
                box-sizing: border-box;
              }

              @page {
                size: 6in 6in;
                margin: 0;
              }

              html,
              body {
                margin: 0;
                padding: 0;
                width: 6in;
                height: 6in;
                overflow: hidden;
                background: white;
              }

              img {
                display: block;
                width: 6in;
                height: 6in;
                object-fit: contain;
              }
            </style>
          </head>

          <body>
            <img
              id="ticket-impresion"
              alt="Boleto electrónico"
            />
          </body>
        </html>
      `);

      ventana.document.close();

      const imagenImprimir =
        ventana.document.getElementById(
          "ticket-impresion",
        ) as HTMLImageElement | null;

      if (!imagenImprimir) {
        throw new Error(
          "No se pudo preparar la impresión.",
        );
      }

      const ventanaDestino = ventana;

      imagenImprimir.onload = () => {
        ventanaDestino.focus();
        ventanaDestino.print();
      };

      imagenImprimir.src = imagen;
    } catch (error) {
      if (ventana && !ventana.closed) {
        ventana.close();
      }

      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo imprimir el ticket.",
      );
    }
  };

  /* ======================================================
     ENVIAR TICKET POR WHATSAPP
  ====================================================== */

  const enviarWhatsApp = async () => {
    if (procesandoImagen) {
      return;
    }

    if (!ticketCompleto) {
      setMensajeError(
        "No existe un ticket QR completo para compartir.",
      );

      return;
    }

    const telefono = normalizarTelefono(
      telefonoPasajero,
    );

    if (!telefono) {
      setMensajeError(
        "El teléfono del pasajero no es válido.",
      );

      return;
    }

    try {
      setProcesandoImagen(true);
      setMensajeError("");

      const imagen = await generarImagen();

      const respuestaImagen = await fetch(imagen);

      const blob = await respuestaImagen.blob();

      const archivo = new File(
        [blob],
        `${codigoTicket}.png`,
        {
          type: "image/png",
        },
      );

      const mensaje = [
        "SINDICATO TRANS-2 DE JUNIO",
        "",
        `Hola ${nombrePasajero}.`,
        "",
        "Su compra de pasajes fue confirmada.",
        "",
        `Ticket: ${codigoTicket}`,
        `Reserva: ${codigoReserva}`,
        `Ruta: ${origen} → ${destino}`,
        `Fecha: ${formatearFecha(fecha)}`,
        `Hora: ${formatearHora(horaSalida)}`,
        `Asientos: ${textoAsientos}`,
        `Cantidad: ${cantidadAsientos}`,
        `Total: Bs. ${precio.toFixed(2)}`,
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
          title: `Ticket ${codigoTicket}`,
          text: mensaje,
          files: [archivo],
        });

        return;
      }

      const enlace = document.createElement("a");

      enlace.href = imagen;
      enlace.download = `${codigoTicket}.png`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      const mensajeWhatsApp = [
        mensaje,
        "",
        `Adjunte la imagen ${codigoTicket}.png descargada.`,
      ].join("\n");

      const urlWhatsApp =
        `https://wa.me/${telefono}?text=` +
        encodeURIComponent(mensajeWhatsApp);

      window.open(
        urlWhatsApp,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(error);

      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo preparar el ticket para WhatsApp.",
      );
    } finally {
      setProcesandoImagen(false);
    }
  };

  /* ======================================================
     PROTECCIÓN CONTRA TICKETS INCOMPLETOS
  ====================================================== */

  if (!ticketCompleto) {
    return (
      <section className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle
            size={36}
            className="shrink-0 text-amber-700"
          />

          <div className="space-y-3">
            <h2 className="text-xl font-black text-amber-900">
              Ticket QR no disponible
            </h2>

            <p className="text-sm leading-6 text-slate-700">
              El sistema recibió una respuesta de la
              operación, pero no contiene los datos
              completos del ticket QR.
            </p>

            <div className="rounded-xl bg-white p-3">
              <p className="text-xs font-bold text-slate-500">
                Código de operación
              </p>

              <p className="break-all font-mono text-sm text-slate-900">
                {respuesta?.codigoOperacion || codigoVenta}
              </p>
            </div>

            <p className="font-bold text-red-700">
              No repitas el cobro ni registres otra
              venta hasta comprobar esta operación.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /* ======================================================
     PANTALLA DE VENTA CONFIRMADA
  ====================================================== */

  return (
    <section className="mt-8 space-y-5">

      {/* MENSAJE DE CONFIRMACIÓN */}

      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center shadow-sm">
        <CheckCircle2
          size={42}
          className="mx-auto text-emerald-700"
        />

        <h2 className="mt-3 text-2xl font-black text-emerald-900">
          ¡VENTA REGISTRADA!
        </h2>

        <p className="mt-2 text-sm font-medium text-emerald-700">
          El ticket QR del pasajero está disponible.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

        {/* ==================================================
           VISTA DEL TICKET ORIGINAL 6 X 6
        ================================================== */}

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

                {/* ========================================
                   CABECERA
                ======================================== */}

                <header className="grid grid-cols-[110px_1fr_145px] items-center gap-3 border-b-2 border-emerald-800 pb-2">

                  <div className="flex items-center justify-center">
                    <img
                      src={logo}
                      alt="Logo Trans-2 de Junio"
                      className="h-20 w-24 scale-[1.25] object-contain"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-black uppercase text-emerald-800">
                      Servicio de transporte
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

                {/* ========================================
                   PASAJERO, QR Y TOTAL
                ======================================== */}

                <div className="mt-3 grid grid-cols-[1fr_180px_1fr] gap-3">

                  {/* INFORMACIÓN DEL PASAJERO */}

                  <Caja titulo="Datos del pasajero">

                    <LineaDato
                      icono={<User size={15} />}
                      titulo="Nombre"
                      valor={nombrePasajero}
                    />

                    <LineaDato
                      icono={<ReceiptText size={15} />}
                      titulo="C.I."
                      valor={ciPasajero}
                    />

                    <LineaDato
                      icono={<Phone size={15} />}
                      titulo="Teléfono"
                      valor={telefonoPasajero}
                    />

                    <LineaDato
                      icono={<Mail size={15} />}
                      titulo="Email"
                      valor={emailPasajero}
                    />
                  </Caja>

                  {/* CÓDIGO QR */}

                  <div className="flex flex-col items-center justify-center">

                    <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-emerald-800 bg-white p-2">
                      <img
                        data-qr-ticket="true"
                        src={imagenQr}
                        alt={`QR ${codigoTicket}`}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <p className="mt-1 w-full rounded-md bg-emerald-800 py-1 text-center text-xs font-black uppercase text-white">
                      Escanea para validar
                    </p>
                  </div>

                  {/* FECHA Y PRECIO */}

                  <div className="flex flex-col gap-2">

                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-emerald-900">
                        Fecha y hora de emisión
                      </p>

                      <p className="text-xs font-bold">
                        {new Date().toLocaleString("es-BO")}
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

                      {estadoTicket === "VALIDO" ? (
                        <CheckCircle2 size={30} />
                      ) : (
                        <QrCode size={30} />
                      )}

                      <span className="text-lg font-black">
                        {estadoTicket}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ========================================
                   DETALLE DEL VIAJE
                ======================================== */}

                <div className="mt-3 overflow-hidden rounded-lg border-2 border-emerald-800">

                  <p className="bg-emerald-800 py-1 text-center text-sm font-black uppercase text-white">
                    Detalle del viaje
                  </p>

                  <div className="grid grid-cols-5 divide-x divide-dashed divide-slate-300">

                    <DatoTicket
                      icono={<MapPin size={19} />}
                      titulo="Ruta"
                      valor={`${origen} → ${destino}`}
                    />

                    <DatoTicket
                      icono={<CalendarDays size={19} />}
                      titulo="Fecha"
                      valor={formatearFecha(fecha)}
                    />

                    <DatoTicket
                      icono={<Clock size={19} />}
                      titulo="Hora"
                      valor={formatearHora(horaSalida)}
                    />

                    <DatoTicket
                      icono={<Armchair size={19} />}
                      titulo={
                        cantidadAsientos === 1
                          ? "Asiento"
                          : "Asientos"
                      }
                      valor={textoAsientos}
                    />

                    <DatoTicket
                      icono={<QrCode size={19} />}
                      titulo="Cantidad"
                      valor={`${cantidadAsientos} ${
                        cantidadAsientos === 1
                          ? "pasaje"
                          : "pasajes"
                      }`}
                    />
                  </div>
                </div>

                {/* ========================================
                   DATOS DEL VEHÍCULO
                ======================================== */}

                <div className="mt-2 grid grid-cols-2 gap-2">

                  <Caja titulo="Vehículo">

                    <LineaDato
                      icono={<BusFront size={15} />}
                      titulo="Marca"
                      valor={`${marca} ${modelo}`.trim()}
                    />

                    <LineaDato
                      icono={<ReceiptText size={15} />}
                      titulo="Placa"
                      valor={placa}
                    />

                    <LineaDato
                      icono={<Armchair size={15} />}
                      titulo="Capacidad"
                      valor={`${capacidad} pasajeros`}
                    />
                  </Caja>

                  {/* ======================================
                     INFORMACIÓN DE LA VENTA
                  ====================================== */}

                  <Caja titulo="Información de la venta">

                    <LineaDato
                      icono={<ReceiptText size={15} />}
                      titulo="Código venta"
                      valor={codigoVenta}
                    />

                    <LineaDato
                      icono={<ReceiptText size={15} />}
                      titulo="Pago"
                      valor={pago === "QR" ? "QR Digital" : pago}
                    />

                    <LineaDato
                      icono={<CheckCircle2 size={15} />}
                      titulo="Estado"
                      valor={estadoTicket}
                    />
                  </Caja>
                </div>

                {/* ========================================
                   PIE DEL TICKET
                ======================================== */}

                <footer className="mt-auto">

                  <div className="grid grid-cols-[1fr_1.5fr_1fr] items-center gap-2 border-t border-emerald-800 pt-2">

                    {/* INSTRUCCIONES */}

                    <div className="text-[9px] leading-tight">

                      <p className="font-black uppercase text-emerald-900">
                        Importante
                      </p>

                      <p>
                        • Presente este boleto al abordar.
                      </p>

                      <p>
                        • Llegue 30 minutos antes.
                      </p>

                      <p>
                        • El ticket es personal.
                      </p>
                    </div>

                    {/* LEMA */}

                    <div className="text-center">

                      <p className="text-sm font-black italic text-emerald-800">
                        Seguridad, puntualidad y confianza
                      </p>

                      <p className="text-xs italic">
                        ¡Gracias por su preferencia!
                      </p>

                      {registradoBlockchain && (
                        <p className="mt-1 flex items-center justify-center gap-1 text-[9px] font-bold text-emerald-800">
                          <ShieldCheck size={12} />
                          Blockchain #{numeroBloque}
                        </p>
                      )}
                    </div>

                    {/* CONTACTO */}

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

                  {/* FRASE INSTITUCIONAL */}

                  <div className="mt-2 bg-emerald-800 py-1 text-center text-[10px] font-bold text-white">
                    2 de Junio, llevando destinos,
                    uniendo familias.
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
           PANEL DE ACCIONES
        ================================================== */}

        <aside className="space-y-4 rounded-[28px] border border-emerald-100 bg-white p-5 text-slate-900 shadow-[0_18px_55px_rgba(0,83,42,0.12)]">

          {/* ENCABEZADO */}

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

          {/* ASIENTOS */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Asientos
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {numerosAsientos.map((numero) => (
                <span
                  key={numero}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-black text-emerald-800 shadow-sm"
                >
                  #{numero}
                </span>
              ))}
            </div>

            {/* MONTO */}

            <div className="mt-4 flex items-center justify-between border-t border-emerald-200 pt-4">

              <span className="text-sm font-bold text-slate-600">
                Total
              </span>

              <span className="text-xl font-black text-emerald-700">
                Bs. {precio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* VEHÍCULO */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-xs font-black uppercase text-slate-500">
              Vehículo asignado
            </p>

            <p className="mt-2 font-black text-slate-900">
              {tipoVehiculo}
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Placa: {placa}
            </p>
          </div>

          {/* BLOCKCHAIN */}

          {registradoBlockchain && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

              <ShieldCheck
                size={28}
                className="shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-black text-emerald-800">
                  Registrado en Blockchain
                </p>

                <p className="text-xs text-emerald-700">
                  Bloque #{numeroBloque}
                </p>
              </div>
            </div>
          )}

          {/* MENSAJES DE ERROR */}

          {mensajeError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"
            >
              {mensajeError}
            </div>
          )}

          {/* IMPRIMIR */}

          <button
            type="button"
            onClick={() => void imprimirSoloTicket()}
            disabled={procesandoImagen}
            className="flex w-full items-center gap-3 rounded-2xl bg-emerald-800 p-4 font-black text-white transition hover:bg-emerald-900 disabled:opacity-50"
          >
            <Printer size={24} />

            <div className="text-left">

              <p>Imprimir ticket</p>

              <p className="text-xs font-normal text-emerald-100">
                Tamaño exacto 6 × 6 pulgadas
              </p>
            </div>
          </button>

          {/* DESCARGAR */}

          <button
            type="button"
            onClick={() => void descargarImagen()}
            disabled={procesandoImagen}
            className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <Download size={24} />

            <div className="text-left">

              <p>Guardar como imagen</p>

              <p className="text-xs font-normal text-emerald-600">
                Descargar ticket PNG
              </p>
            </div>
          </button>

          {/* WHATSAPP */}

          <button
            type="button"
            onClick={() => void enviarWhatsApp()}
            disabled={procesandoImagen}
            className="flex w-full items-center gap-3 rounded-2xl bg-[#25D366] p-4 font-black text-white transition hover:bg-[#1fbd5a] disabled:opacity-50"
          >
            <MessageCircle size={24} />

            <div className="text-left">

              <p>
                {procesandoImagen
                  ? "Preparando ticket..."
                  : "Enviar por WhatsApp"}
              </p>

              <p className="text-xs font-normal text-green-50">
                Compartir ticket como imagen
              </p>
            </div>
          </button>

          {/* NUEVA VENTA */}

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

/* ========================================================
   COMPONENTE DE CÓDIGOS
======================================================== */

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

/* ========================================================
   COMPONENTE CAJA
======================================================== */

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

/* ========================================================
   COMPONENTE DE DATOS
======================================================== */

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

/* ========================================================
   COMPONENTE DE DETALLE DEL VIAJE
======================================================== */

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

      <p className="mt-1 break-words text-[10px] font-black leading-tight">
        {valor}
      </p>
    </div>
  );
}
