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

  const fechaConvertida = new Date(
    String(fecha),
  );

  if (
    Number.isNaN(
      fechaConvertida.getTime(),
    )
  ) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(fechaConvertida);
}

function formatearFechaHora(
  fecha: unknown,
) {
  if (!fecha) {
    return new Intl.DateTimeFormat(
      "es-BO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      },
    ).format(new Date());
  }

  const fechaConvertida = new Date(
    String(fecha),
  );

  if (
    Number.isNaN(
      fechaConvertida.getTime(),
    )
  ) {
    return String(fecha);
  }

  return new Intl.DateTimeFormat(
    "es-BO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  ).format(fechaConvertida);
}

function formatearMonto(
  monto: unknown,
) {
  const numero = Number(monto || 0);

  return new Intl.NumberFormat(
    "es-BO",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(numero);
}

function TicketCard({
  ticket,
  ticketRef,
  mostrarDetallesInicialmente = true,
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
    ticketPrincipal?.viaje ??
    ticketPrincipal?.reserva?.viaje ??
    {};

  const ruta =
    viaje?.ruta ?? {};

  const vehiculo =
    viaje?.vehiculo ?? {};

  /*
   * DATOS DEL CONDUCTOR
   * Primero se usa el chofer asignado al viaje.
   * Solo si no existe se muestra el chofer habitual.
   * También acepta datos incorporados al ticket al aprobar el pago.
   * No se modifica el código QR ni su validación.
   */
  const choferAsignado =
    viaje?.chofer ??
    ticketPrincipal?.chofer ??
    respuesta?.chofer ??
    null;

  const choferHabitual =
    vehiculo?.choferHabitual ??
    null;

  const chofer =
    choferAsignado?.nombre || choferAsignado?.apellido
      ? choferAsignado
      : choferHabitual?.nombre || choferHabitual?.apellido
        ? choferHabitual
        : null;

  const nombreChofer = chofer
    ? [chofer.nombre, chofer.apellido]
        .filter((parte) => Boolean(parte))
        .join(" ")
        .trim()
    : "";

  const codigoChofer =
    chofer?.codigoChofer ??
    chofer?.codigo ??
    null;

  const esChoferHabitual =
    Boolean(chofer) &&
    (chofer === choferHabitual ||
      (chofer === respuesta?.chofer &&
        respuesta?.choferEsHabitual === true));

  const tipoVehiculo =
    vehiculo?.tipo ??
    respuesta?.tipoVehiculo ??
    "";

  const placaVehiculo =
    vehiculo?.placa ??
    respuesta?.placaVehiculo ??
    "";

  const numeroFlota =
    vehiculo?.numeroFlota ??
    respuesta?.numeroFlota ??
    null;

  const asientos =
    respuesta.asientos ??
    ticketPrincipal?.asientos ??
    [];

  const numerosAsiento =
    Array.isArray(asientos)
      ? asientos
          .map((asiento: any) =>
            typeof asiento ===
            "object"
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
    ticketPrincipal?.reserva
      ?.codigoReserva ??
    "Sin código";

  const codigoOperacion =
    ventaPrincipal?.codigoVenta ??
    respuesta?.codigoVenta ??
    respuesta?.codigoOperacion ??
    respuesta?.pago?.referencia ??
    respuesta?.referenciaPago ??
    respuesta?.referencia ??
    ticketPrincipal?.codigoTicket ??
    ticketPrincipal?.numeroTicket ??
    "Sin código";

  const metodoPago =
    respuesta?.metodoPago ??
    ventaPrincipal?.metodoPago ??
    respuesta?.pago?.metodoPago ??
    respuesta?.pago?.tipo ??
    (
      reservaPrincipal?.id ||
      ticketPrincipal?.reserva?.id
        ? "QR"
        : "No registrado"
    );

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
    "PENDIENTE";

  const estadoNormalizado = String(estadoTicket).toUpperCase();
  const estadoVisual =
    estadoNormalizado === "UTILIZADO"
      ? "UTILIZADO"
      : ["CANCELADO", "CANCELADA", "RECHAZADO", "RECHAZADA", "VENCIDA"].includes(estadoNormalizado)
        ? "CANCELADO"
        : estadoNormalizado === "VALIDO" || estadoNormalizado === "VÁLIDO"
          ? "VÁLIDO"
          : ["CONFIRMADA", "CONFIRMADO", "APROBADA", "APROBADO"].includes(estadoNormalizado)
            ? "CONFIRMADO"
            : "PENDIENTE";

  const colorEstado =
    estadoVisual === "UTILIZADO"
      ? "text-amber-600"
      : estadoVisual ===
          "CANCELADO"
        ? "text-red-600"
        : estadoVisual === "PENDIENTE"
          ? "text-slate-500"
          : "text-emerald-700";

  const descargarQr = () => {
    if (!qr) {
      return;
    }

    const enlace =
      document.createElement("a");

    enlace.href = qr;

    enlace.download =
      `QR-${String(
        numeroTicket,
      ).replace(
        /[^a-zA-Z0-9-_]/g,
        "-",
      )}.png`;

    document.body.appendChild(
      enlace,
    );

    enlace.click();
    enlace.remove();
  };

  const imprimirTicket = () => {
    window.print();
  };

  const idTicket =
    `boleto-${String(
      numeroTicket,
    ).replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    )}`;

  return (
    <article className="mx-auto w-full min-w-0 max-w-[1240px] overflow-x-hidden">
      <div
        ref={ticketRef}
        id={idTicket}
        className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-emerald-700 bg-white text-slate-950 shadow-sm sm:rounded-[28px] sm:border-2 sm:shadow-lg print:rounded-none print:border print:shadow-none"
      >
        <div className="min-w-0 p-1.5 min-[375px]:p-2.5 sm:p-6">
          {/* ENCABEZADO */}

          <header className="relative grid min-w-0 grid-cols-[48px_minmax(0,1fr)_88px] items-center gap-1.5 overflow-hidden border-b-2 border-emerald-700 pb-2.5 min-[390px]:grid-cols-[60px_minmax(0,1fr)_105px] sm:gap-4 sm:pb-5 lg:grid-cols-[190px_minmax(0,1fr)_310px]">
            <div className="pointer-events-none absolute -left-20 -top-24 h-52 w-52 rounded-full bg-emerald-100/50" />

            <div className="relative flex items-center justify-center">
              <img
                src={logo}
                alt="Logo Servicio de Transporte 2 de Junio"
                className="h-auto w-full max-w-[56px] object-contain drop-shadow-sm min-[390px]:max-w-[66px] sm:max-w-[150px] lg:max-w-[180px]"
              />
            </div>

            <div className="relative min-w-0 text-center">
              <p className="text-[7px] font-black uppercase leading-tight tracking-normal text-emerald-700 min-[390px]:text-[9px] sm:text-lg md:text-xl">
                Servicio de Transporte
              </p>

              <h1 className="mt-0.5 text-[18px] font-black leading-none text-emerald-800 min-[390px]:text-[23px] sm:text-5xl md:text-7xl">
                2 de Junio
              </h1>

              <div className="mt-1 rounded bg-gradient-to-r from-emerald-800 to-emerald-600 px-1 py-1 text-[7px] font-black uppercase leading-tight tracking-normal text-white shadow-sm min-[390px]:text-[8px] sm:mt-4 sm:rounded-xl sm:px-5 sm:py-3 sm:text-lg md:text-xl">
                Boleto Electrónico
                Oficial
              </div>
            </div>

            <div className="relative grid min-w-0 grid-cols-1 gap-1 sm:gap-3 lg:grid-cols-1">
              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-700 bg-white shadow-sm sm:rounded-2xl sm:border-2">
                <p className="bg-emerald-700 px-1 py-1 text-center text-[8px] font-black uppercase text-white sm:px-4 sm:py-2 sm:text-base">
                  Ticket N.º
                </p>

                <p className="truncate px-1 py-1 text-center text-[9px] font-black sm:whitespace-normal sm:break-all sm:px-4 sm:py-3 sm:text-xl">
                  {obtenerTexto(
                    numeroTicket,
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-700 bg-white shadow-sm sm:rounded-2xl sm:border-2">
                <p className="bg-emerald-700 px-1 py-1 text-center text-[8px] font-black uppercase text-white sm:px-4 sm:py-2 sm:text-base">
                  Reserva N.º
                </p>

                <p className="truncate px-1 py-1 text-center text-[8px] font-black sm:whitespace-normal sm:break-all sm:px-4 sm:py-3 sm:text-lg">
                  {obtenerTexto(
                    codigoReserva,
                  )}
                </p>
              </div>
            </div>
          </header>

          {/* SECCIÓN PRINCIPAL */}

          <section className="grid min-w-0 grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)_minmax(0,0.95fr)] items-stretch gap-1.5 py-2.5 sm:gap-4 sm:py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* PASAJERO */}

            <article className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/40 sm:rounded-2xl">
              <h2 className="bg-emerald-700 px-1 py-1.5 text-center text-[8px] font-black uppercase leading-tight tracking-normal text-white sm:px-4 sm:py-3 sm:text-lg">
                Datos del pasajero
              </h2>

              <div className="grid min-w-0 grid-cols-1 gap-1.5 p-1.5 min-[390px]:gap-2 sm:gap-4 sm:p-5">
                <Dato
                  icono={
                    <CircleUserRound
                      size={28}
                    />
                  }
                  titulo="Nombre"
                  valor={
                    pasajero?.nombre ??
                    ventaPrincipal
                      ?.pasajeroNombre
                  }
                />

                <Dato
                  icono={
                    <ReceiptText
                      size={28}
                    />
                  }
                  titulo="C.I."
                  valor={
                    pasajero?.ci ??
                    ventaPrincipal
                      ?.pasajeroCi
                  }
                />

                <Dato
                  icono={
                    <Phone size={28} />
                  }
                  titulo="Teléfono"
                  valor={
                    pasajero?.telefono ??
                    ventaPrincipal
                      ?.pasajeroTelefono
                  }
                />

                <Dato
                  icono={
                    <Mail size={28} />
                  }
                  titulo="Email"
                  valor={
                    pasajero?.email ??
                    ventaPrincipal
                      ?.pasajeroEmail
                  }
                />
              </div>
            </article>

            {/* QR */}

            <article className="flex min-w-0 flex-col items-center justify-center">
              <div className="flex w-full min-w-0 items-center justify-center rounded-md border border-emerald-700 bg-white p-1 shadow-inner sm:min-h-[330px] sm:rounded-2xl sm:border-[3px] sm:p-5">
                {qr ? (
                  <img
                    src={qr}
                    alt="Código QR para validar el ticket"
                    className="block aspect-square h-auto w-full max-w-[210px] object-contain sm:max-w-[300px]"
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

              <div className="mt-1 w-full rounded bg-emerald-700 px-0.5 py-1 text-center text-[7px] font-black uppercase leading-tight text-white sm:mt-3 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base">
                Escanea para validar
              </div>
            </article>

            {/* EMISIÓN Y MONTO */}

            <article className="flex min-w-0 flex-col justify-around gap-1.5 sm:gap-5">
              <div>
                <p className="text-[8px] font-black uppercase leading-tight tracking-normal text-emerald-700 sm:text-base">
                  Fecha y hora de
                  emisión
                </p>

                <p className="mt-0.5 break-words text-[9px] font-bold leading-tight sm:text-xl">
                  {formatearFechaHora(
                    ventaPrincipal
                      ?.fechaVenta ??
                      ticketPrincipal
                        ?.fechaCreacion ??
                      respuesta
                        ?.fechaEmision,
                  )}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-emerald-700 bg-white shadow-sm sm:rounded-2xl sm:border-[3px]">
                <p className="bg-emerald-700 px-1 py-1 text-center text-[8px] font-black uppercase leading-tight text-white sm:px-5 sm:py-3 sm:text-lg">
                  Monto pagado
                </p>

                <p className="break-words px-0.5 py-1.5 text-center text-[13px] font-black leading-tight min-[390px]:text-base sm:px-5 sm:py-7 sm:text-5xl">
                  Bs.{" "}
                  {formatearMonto(
                    monto,
                  )}
                </p>
              </div>

              <div
                className={`flex min-w-0 flex-wrap items-center justify-center gap-1 rounded-lg bg-slate-50 py-1 sm:gap-4 sm:bg-transparent ${colorEstado}`}
              >
                <CheckCircle2
                  size={23}
                  className="shrink-0 sm:h-10 sm:w-10"
                />

                <span className="break-words text-center text-[11px] font-black uppercase sm:text-4xl">
                  {estadoVisual}
                </span>
              </div>
            </article>
          </section>

          {mostrarDetalles && (
            <div className="border-t-2 border-emerald-700">
              {/* INFORMACIÓN DEL VIAJE */}

              <section className="grid min-w-0 grid-cols-4 gap-1 border-b-2 border-emerald-700 py-2 sm:gap-5 sm:py-5">
                <CajaInformacion
                  icono={
                    <MapPin size={30} />
                  }
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
                  icono={
                    <CalendarDays
                      size={30}
                    />
                  }
                  titulo="Fecha del viaje"
                  contenido={formatearFecha(
                    viaje?.fecha,
                  )}
                />

                <CajaInformacion
                  icono={
                    <Clock3 size={30} />
                  }
                  titulo="Hora de salida"
                  contenido={obtenerTexto(
                    viaje?.horaSalida,
                    "No registrada",
                  )}
                />

                <CajaInformacion
                  icono={
                    <Armchair size={30} />
                  }
                  titulo="Asiento(s)"
                  contenido={
                    numerosAsiento ||
                    "No registrado"
                  }
                />
              </section>

              {/* VEHÍCULO Y VENTA */}

              <section className="grid min-w-0 grid-cols-2 gap-1.5 border-b border-emerald-200 py-2 sm:gap-5 sm:py-5">
                <article className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/30 sm:rounded-2xl">
                  <h2 className="bg-emerald-700 px-1 py-1.5 text-center text-[9px] font-black uppercase leading-tight text-white sm:px-4 sm:py-3 sm:text-lg">
                    Vehículo
                  </h2>

                  <div className="grid min-w-0 grid-cols-1 gap-1.5 p-2 sm:gap-5 sm:p-5 xl:grid-cols-3">
                    <Dato
                      icono={
                        <BusFront
                          size={27}
                        />
                      }
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
                      icono={
                        <ReceiptText
                          size={27}
                        />
                      }
                      titulo="Placa"
                      valor={placaVehiculo}
                    />

                    <Dato
                      icono={
                        <CircleUserRound
                          size={27}
                        />
                      }
                      titulo="Capacidad"
                      valor={
                        vehiculo?.capacidad
                          ? `${vehiculo.capacidad} pasajeros`
                          : "No registrada"
                      }
                    />

                    {/* CHOFER ASIGNADO AL VIAJE */}
                    <Dato
                      icono={<CircleUserRound size={27} />}
                      titulo={
                        esChoferHabitual
                          ? "Chofer habitual"
                          : "Chofer del viaje"
                      }
                      valor={nombreChofer || "Por confirmar"}
                    />

                    <Dato
                      icono={<ReceiptText size={27} />}
                      titulo="Código del chofer"
                      valor={
                        codigoChofer !== null &&
                        codigoChofer !== undefined &&
                        String(codigoChofer).trim()
                          ? codigoChofer
                          : "No registrado"
                      }
                    />

                    <Dato
                      icono={<BusFront size={27} />}
                      titulo="Tipo / N.º de flota"
                      valor={
                        [
                          tipoVehiculo,
                          numeroFlota !== null &&
                          numeroFlota !== undefined &&
                          String(numeroFlota).trim()
                            ? `N.º ${numeroFlota}`
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No registrado"
                      }
                    />
                  </div>
                </article>

                <article className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/30 sm:rounded-2xl">
                  <h2 className="bg-emerald-700 px-1 py-1.5 text-center text-[9px] font-black uppercase leading-tight text-white sm:px-4 sm:py-3 sm:text-lg">
                    Información de la
                    operación
                  </h2>

                  <div className="grid min-w-0 grid-cols-1 gap-1.5 p-2 sm:gap-5 sm:p-5 xl:grid-cols-3">
                    <Dato
                      icono={
                        <ReceiptText
                          size={27}
                        />
                      }
                      titulo="Código operación"
                      valor={
                        codigoOperacion
                      }
                    />

                    <Dato
                      icono={
                        <CreditCard
                          size={27}
                        />
                      }
                      titulo="Pago"
                      valor={metodoPago}
                    />

                    <Dato
                      icono={
                        <CheckCircle2
                          size={27}
                        />
                      }
                      titulo="Estado"
                      valor={
                        ventaPrincipal
                          ?.estado ??
                        reservaPrincipal
                          ?.estado ??
                        "CONFIRMADO"
                      }
                    />
                  </div>
                </article>
              </section>

              {/* PIE */}

              <footer className="pt-2 sm:pt-5">
                <div className="grid min-w-0 grid-cols-[1fr_1.1fr_0.8fr] items-start gap-1.5 sm:gap-5">
                  <div>
                    <p className="text-[8px] font-black uppercase text-green-800 sm:text-base">
                      Importante
                    </p>

                    <ul className="text-[7px] leading-tight sm:text-sm sm:leading-6">
                      <li>
                        • Presente este
                        boleto al abordar.
                      </li>

                      <li>
                        • Llegue 30 minutos
                        antes.
                      </li>

                      <li>
                        • El ticket es
                        personal.
                      </li>

                      <li>
                        • Válido solamente
                        para la fecha y hora
                        indicadas.
                      </li>
                    </ul>
                  </div>

                  <div className="min-w-0 text-center">
                    <p className="text-[10px] font-black italic leading-tight text-green-800 sm:text-2xl">
                      Seguridad,
                      puntualidad y
                      confianza
                    </p>

                    <p className="mt-1 text-[8px] italic leading-tight sm:mt-2 sm:text-lg">
                      ¡Gracias por su
                      preferencia!
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[8px] font-black uppercase text-green-800 sm:text-base">
                      Atención al cliente
                    </p>

                    <p>
                      Oficina Central
                    </p>

                    <p className="break-words text-[9px] font-black sm:text-base">
                      67599408
                    </p>
                  </div>
                </div>

                <div className="mt-2 rounded bg-gradient-to-r from-emerald-800 to-emerald-600 px-1 py-1.5 text-center text-[9px] font-black text-white sm:mt-5 sm:rounded-xl sm:px-4 sm:py-3 sm:text-lg">
                  2 de Junio, llevando
                  destinos, uniendo
                  familias.
                </div>
              </footer>
            </div>
          )}
        </div>
      </div>

      {mostrarAcciones && (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 print:hidden sm:mt-4 sm:gap-3 lg:grid-cols-3">
          <button
            type="button"
            onClick={descargarQr}
            disabled={!qr}
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-2 py-3 text-center text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-5 sm:py-3.5 sm:text-base"
          >
            <Download size={20} />
            Descargar QR
          </button>

          <button
            type="button"
            onClick={imprimirTicket}
            className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-2 py-3 text-center text-xs font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 sm:rounded-2xl sm:px-5 sm:py-3.5 sm:text-base"
          >
            <Printer size={20} />
            Imprimir ticket
          </button>

          <button
            type="button"
            onClick={() =>
              setMostrarDetalles(
                (
                  valorActual,
                ) =>
                  !valorActual,
              )
            }
            className="col-span-2 inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-2 py-3 text-center text-xs font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 sm:col-span-1 sm:rounded-2xl sm:px-5 sm:py-3.5 sm:text-base"
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
    <div className="flex min-w-0 items-start gap-1 sm:gap-3">
      <div className="shrink-0 text-emerald-700 [&>svg]:h-3 [&>svg]:w-3 sm:[&>svg]:h-7 sm:[&>svg]:w-7">
        {icono}
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-black leading-tight text-emerald-800 sm:text-base">
          {titulo}:
        </p>

        <p className="break-all text-[8px] font-bold leading-tight sm:break-words sm:text-base">
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
    <article className="min-w-0 rounded-md border border-emerald-200 bg-emerald-50/40 p-1 sm:rounded-2xl sm:p-4">
      <div className="flex min-w-0 flex-col gap-0.5 text-emerald-700 [&>svg]:h-3 [&>svg]:w-3 sm:flex-row sm:items-center sm:gap-3 sm:[&>svg]:h-7 sm:[&>svg]:w-7">
        {icono}

        <h3 className="break-words text-[8px] font-black uppercase leading-tight sm:text-base">
          {titulo}
        </h3>
      </div>

      <p className="mt-1 break-words text-[8px] font-black leading-tight sm:mt-3 sm:text-lg">
        {contenido}
      </p>
    </article>
  );
}

export default TicketCard;