import { useState } from "react";
import type {
  ReactNode,
  RefObject,
} from "react";

import {
  Armchair,
  BusFront,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Phone,
  Printer,
  ReceiptText,
} from "lucide-react";

import logo from "../assets/logo.png";

interface TicketCardProps {
  ticket: any;
  ticketRef?: RefObject<HTMLDivElement | null>;
  mostrarDetallesInicialmente?: boolean;
  mostrarAcciones?: boolean;
}

function obtenerTexto(
  valor: unknown,
  reemplazo = "No registrado",
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return reemplazo;
  }

  return String(valor);
}

function formatearFecha(fecha: unknown) {
  if (!fecha) {
    return "No registrada";
  }

  const fechaConvertida = new Date(String(fecha));

  if (Number.isNaN(fechaConvertida.getTime())) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fechaConvertida);
}

function formatearFechaHora(fecha: unknown) {
  if (!fecha) {
    return new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
  }

  const fechaConvertida = new Date(String(fecha));

  if (Number.isNaN(fechaConvertida.getTime())) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(fechaConvertida);
}

function formatearMonto(monto: unknown) {
  const numero = Number(monto || 0);

  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

function TicketCard({
  ticket,
  ticketRef,
  mostrarDetallesInicialmente = false,
  mostrarAcciones = true,
}: TicketCardProps) {
  const [
    mostrarDetalles,
    setMostrarDetalles,
  ] = useState(
    mostrarDetallesInicialmente,
  );

  if (!ticket) {
    return null;
  }

  /*
   * El componente acepta cualquiera de estas formas:
   *
   * 1. La respuesta completa del backend:
   * {
   *   pasajero,
   *   viaje,
   *   asientos,
   *   ventas,
   *   reservas,
   *   tickets
   * }
   *
   * 2. Un objeto individual:
   * {
   *   ticket,
   *   venta,
   *   reserva,
   *   pasajero,
   *   viaje
   * }
   */

  const respuesta = ticket;

  const ticketPrincipal =
    respuesta.ticket ??
    respuesta.tickets?.[0] ??
    respuesta;

  const ventaPrincipal =
    respuesta.venta ??
    respuesta.ventas?.[0] ??
    ticketPrincipal?.venta ??
    {};

  const reservaPrincipal =
    respuesta.reserva ??
    respuesta.reservas?.[0] ??
    ticketPrincipal?.reserva ??
    {};

  const pasajero =
    respuesta.pasajero ??
    ventaPrincipal?.pasajero ??
    reservaPrincipal?.usuario ??
    {};

  const viaje =
    respuesta.viaje ??
    ventaPrincipal?.viaje ??
    reservaPrincipal?.viaje ??
    {};

  const ruta = viaje?.ruta ?? {};
  const vehiculo = viaje?.vehiculo ?? {};

  const asientos =
    respuesta.asientos ??
    ticketPrincipal?.asientos ??
    [];

  const numerosAsiento = Array.isArray(asientos)
    ? asientos
        .map((asiento: any) =>
          typeof asiento === "object"
            ? asiento.numero
            : asiento,
        )
        .filter(Boolean)
        .join(", ")
    : obtenerTexto(asientos);

  const numeroTicket =
    ticketPrincipal?.codigoTicket ??
    ticketPrincipal?.numeroTicket ??
    "Sin número";

  const codigoReserva =
    reservaPrincipal?.codigoReserva ??
    ticketPrincipal?.reserva?.codigoReserva ??
    "Sin código";

  const codigoVenta =
    ventaPrincipal?.codigoVenta ??
    respuesta.codigoOperacion ??
    "Sin código";

  const qr =
    ticketPrincipal?.imagenQr ??
    ticketPrincipal?.qr ??
    ticketPrincipal?.codigoQr ??
    "";

  const monto =
    respuesta.montoTotal ??
    ventaPrincipal?.monto ??
    ticketPrincipal?.monto ??
    viaje?.precio ??
    0;

  const estadoTicket =
    ticketPrincipal?.estado ??
    ventaPrincipal?.estado ??
    "VALIDO";

  const estadoVisual =
    String(estadoTicket).toUpperCase() ===
    "UTILIZADO"
      ? "UTILIZADO"
      : String(
            estadoTicket,
          ).toUpperCase() ===
          "CANCELADO"
        ? "CANCELADO"
        : "VÁLIDO";

  const colorEstado =
    estadoVisual === "UTILIZADO"
      ? "text-amber-600"
      : estadoVisual === "CANCELADO"
        ? "text-red-600"
        : "text-emerald-700";

  const descargarQr = () => {
    if (!qr) {
      return;
    }

    const enlace =
      document.createElement("a");

    enlace.href = qr;
    enlace.download = `QR-${String(
      numeroTicket,
    ).replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    )}.png`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  };

  const imprimirTicket = () => {
    window.print();
  };

  const idTicket = `boleto-${String(
    numeroTicket,
  ).replace(
    /[^a-zA-Z0-9-_]/g,
    "-",
  )}`;

  return (
    <article className="mx-auto w-full max-w-[1240px]">
      <div
        ref={ticketRef}
        id={idTicket}
        className="overflow-hidden rounded-[28px] border-2 border-emerald-700 bg-white text-slate-950 shadow-xl shadow-emerald-950/10 print:rounded-none print:border print:shadow-none"
      >
        <div className="p-4 sm:p-6">
        {/* ENCABEZADO */}
        <header className="relative grid gap-5 overflow-hidden border-b-2 border-emerald-700 pb-6 lg:grid-cols-[190px_1fr_310px]">
          <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-emerald-100/50" />

          <div className="relative flex items-center justify-center">
            <img
              src={logo}
              alt="Logo Servicio de Transporte 2 de Junio"
              className="max-h-36 w-full max-w-[180px] object-contain drop-shadow-sm"
            />
          </div>

          <div className="relative text-center">
            <p className="text-lg font-black uppercase tracking-[0.08em] text-emerald-700 md:text-xl">
              Servicio de Transporte
            </p>

            <h1 className="mt-1 text-5xl font-black leading-none text-emerald-800 md:text-7xl">
              2 de Junio
            </h1>

            <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-600 px-5 py-3 text-lg font-black uppercase tracking-wide text-white shadow-md md:text-xl">
              Boleto Electrónico Oficial
            </div>
          </div>

          <div className="relative grid gap-4">
            <div className="overflow-hidden rounded-2xl border-2 border-emerald-700 bg-white shadow-sm">
              <p className="bg-emerald-700 px-4 py-2 text-center font-black uppercase text-white">
                Ticket N.º
              </p>

              <p className="px-4 py-3 text-center text-xl font-black">
                {obtenerTexto(numeroTicket)}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-emerald-700 bg-white shadow-sm">
              <p className="bg-emerald-700 px-4 py-2 text-center font-black uppercase text-white">
                Reserva N.º
              </p>

              <p className="break-all px-4 py-3 text-center text-lg font-black">
                {obtenerTexto(codigoReserva)}
              </p>
            </div>
          </div>
        </header>

        {/* SECCIÓN PRINCIPAL */}
        <section className="grid gap-5 py-6 lg:grid-cols-[1fr_1.15fr_1fr]">
          {/* PASAJERO */}
          <article className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/40">
            <h2 className="bg-emerald-700 px-4 py-3 text-center text-lg font-black uppercase tracking-wide text-white">
              Datos del pasajero
            </h2>

            <div className="space-y-4 p-5">
              <Dato
                icono={<CircleUserRound size={28} />}
                titulo="Nombre"
                valor={
                  pasajero?.nombre ??
                  ventaPrincipal?.pasajeroNombre
                }
              />

              <Dato
                icono={<ReceiptText size={28} />}
                titulo="C.I."
                valor={
                  pasajero?.ci ??
                  ventaPrincipal?.pasajeroCi
                }
              />

              <Dato
                icono={<Phone size={28} />}
                titulo="Teléfono"
                valor={
                  pasajero?.telefono ??
                  ventaPrincipal?.pasajeroTelefono
                }
              />

              <Dato
                icono={<Mail size={28} />}
                titulo="Email"
                valor={
                  pasajero?.email ??
                  ventaPrincipal?.pasajeroEmail
                }
              />
            </div>
          </article>

          {/* QR */}
          <article className="flex flex-col items-center justify-center">
            <div className="flex min-h-[330px] w-full items-center justify-center rounded-2xl border-[3px] border-emerald-700 bg-white p-5 shadow-inner">
              {qr ? (
                <img
                  src={qr}
                  alt="Código QR para validar el ticket"
                  className="h-auto w-full max-w-[300px]"
                />
              ) : (
                <div className="text-center text-slate-500">
                  <ReceiptText
                    size={90}
                    className="mx-auto"
                  />

                  <p className="mt-3 font-bold">
                    QR no disponible
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 w-full rounded-xl bg-emerald-700 px-5 py-3 text-center text-base font-black uppercase tracking-wide text-white">
              Escanea para validar
            </div>
          </article>

          {/* EMISIÓN Y MONTO */}
          <article className="flex flex-col justify-between gap-5">
            <div>
              <p className="text-base font-black uppercase tracking-wide text-emerald-700">
                Fecha y hora de emisión
              </p>

              <p className="mt-1 text-xl font-black">
                {formatearFechaHora(
                  ventaPrincipal?.fechaVenta ??
                    ticketPrincipal?.fechaCreacion ??
                    respuesta?.fechaEmision,
                )}
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border-[3px] border-emerald-700 bg-white shadow-sm">
              <p className="bg-emerald-700 px-5 py-3 text-center text-lg font-black uppercase text-white">
                Monto pagado
              </p>

              <p className="px-5 py-7 text-center text-5xl font-black">
                Bs. {formatearMonto(monto)}
              </p>
            </div>

            <div className={`flex items-center justify-center gap-4 ${colorEstado}`}>
              <CheckCircle2 size={70} />

              <span className="text-4xl font-black uppercase">
                {estadoVisual}
              </span>
            </div>
          </article>
        </section>

        {mostrarDetalles && (
          <div className="border-t-2 border-emerald-700">
        {/* INFORMACIÓN DEL VIAJE */}
        <section className="grid gap-5 border-b-2 border-emerald-700 py-5 md:grid-cols-2 xl:grid-cols-4">
          <CajaInformacion
            icono={<MapPin size={30} />}
            titulo="Ruta"
            contenido={`${obtenerTexto(
              ruta?.origen,
              "Origen",
            )} → ${obtenerTexto(
              ruta?.destino,
              "Destino",
            )}`}
          />

          <CajaInformacion
            icono={<CalendarDays size={30} />}
            titulo="Fecha del viaje"
            contenido={formatearFecha(viaje?.fecha)}
          />

          <CajaInformacion
            icono={<Clock3 size={30} />}
            titulo="Hora de salida"
            contenido={obtenerTexto(
              viaje?.horaSalida,
              "No registrada",
            )}
          />

          <CajaInformacion
            icono={<Armchair size={30} />}
            titulo="Asiento(s)"
            contenido={
              numerosAsiento || "No registrado"
            }
          />
        </section>

        {/* VEHÍCULO Y VENTA */}
        <section className="grid gap-5 border-b border-emerald-200 py-5 lg:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
            <h2 className="bg-emerald-700 px-4 py-3 text-center text-lg font-black uppercase text-white">
              Vehículo
            </h2>

            <div className="grid gap-5 p-5 sm:grid-cols-3">
              <Dato
                icono={<BusFront size={27} />}
                titulo="Marca y modelo"
                valor={`${obtenerTexto(
                  vehiculo?.marca,
                  "",
                )} ${obtenerTexto(
                  vehiculo?.modelo,
                  "",
                )}`.trim()}
              />

              <Dato
                icono={<ReceiptText size={27} />}
                titulo="Placa"
                valor={vehiculo?.placa}
              />

              <Dato
                icono={<CircleUserRound size={27} />}
                titulo="Capacidad"
                valor={
                  vehiculo?.capacidad
                    ? `${vehiculo.capacidad} pasajeros`
                    : "No registrada"
                }
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
            <h2 className="bg-emerald-700 px-4 py-3 text-center text-lg font-black uppercase text-white">
              Información de la venta
            </h2>

            <div className="grid gap-5 p-5 sm:grid-cols-3">
              <Dato
                icono={<ReceiptText size={27} />}
                titulo="Código venta"
                valor={codigoVenta}
              />

              <Dato
                icono={<CreditCard size={27} />}
                titulo="Pago"
                valor={
                  respuesta?.metodoPago ??
                  ventaPrincipal?.metodoPago
                }
              />

              <Dato
                icono={<CheckCircle2 size={27} />}
                titulo="Estado"
                valor={
                  ventaPrincipal?.estado ??
                  reservaPrincipal?.estado ??
                  "CONFIRMADO"
                }
              />
            </div>
          </article>
        </section>

        {/* PIE */}
        <footer className="pt-5">
          <div className="grid items-end gap-5 md:grid-cols-3">
            <div>
              <p className="font-black uppercase text-green-800">
                Importante
              </p>

              <ul className="text-sm leading-6">
                <li>• Presente este boleto al abordar.</li>
                <li>• Llegue 30 minutos antes.</li>
                <li>• El ticket es personal.</li>
                <li>
                  • Válido solamente para la fecha y
                  hora indicadas.
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-2xl font-black italic text-green-800">
                Seguridad, puntualidad y confianza
              </p>

              <p className="mt-2 text-lg italic">
                ¡Gracias por su preferencia!
              </p>
            </div>

            <div className="text-right">
              <p className="font-black uppercase text-green-800">
                Atención al cliente
              </p>

              <p>Oficina Central</p>

              <p className="font-black">
                67599408
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-600 px-4 py-3 text-center text-lg font-black text-white">
            2 de Junio, llevando destinos, uniendo
            familias.
          </div>
        </footer>
          </div>
        )}
      </div>
    </div>

      {mostrarAcciones && (
      <div className="mt-4 grid gap-3 print:hidden sm:grid-cols-3">
        <button
          type="button"
          onClick={descargarQr}
          disabled={!qr}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={20} />
          Descargar QR
        </button>

        <button
          type="button"
          onClick={imprimirTicket}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          <Printer size={20} />
          Imprimir ticket
        </button>

        <button
          type="button"
          onClick={() =>
            setMostrarDetalles(
              (valorActual) =>
                !valorActual,
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
        >
          {mostrarDetalles ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}

          {mostrarDetalles
            ? "Ocultar detalles"
            : "Ver detalles"}
        </button>
      </div>
      )}
    </article>
  );
}

interface DatoProps {
  icono: ReactNode;
  titulo: string;
  valor: unknown;
}

function Dato({
  icono,
  titulo,
  valor,
}: DatoProps) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 text-emerald-700">
        {icono}
      </div>

      <div className="min-w-0">
        <p className="font-black text-emerald-800">
          {titulo}:
        </p>

        <p className="break-words font-bold">
          {obtenerTexto(valor)}
        </p>
      </div>
    </div>
  );
}

interface CajaInformacionProps {
  icono: ReactNode;
  titulo: string;
  contenido: string;
}

function CajaInformacion({
  icono,
  titulo,
  contenido,
}: CajaInformacionProps) {
  return (
    <article className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="flex items-center gap-3 text-emerald-700">
        {icono}

        <h3 className="font-black uppercase">
          {titulo}
        </h3>
      </div>

      <p className="mt-3 text-lg font-black">
        {contenido}
      </p>
    </article>
  );
}

export default TicketCard;
