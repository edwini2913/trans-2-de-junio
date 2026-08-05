import type {
  TicketPagoAprobado,
} from "../../components/compra/PagoQR";

import type {
  TicketRespuesta,
} from "../../services/tickets.service";

export type ViajeTicketCompra = {
  id: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;

  ruta?: {
    id?: string;
    origen?: string;
    destino?: string;
  };

  vehiculo?: {
    id?: string;
    marca?: string;
    modelo?: string;
    placa?: string;
    capacidad?: number;
    tipo?: string;
  };
};

export type AsientoTicketCompra = {
  id: string;
  numero: number | string;
  estado: string;
};

export interface ConstruirTicketParametros {
  ticketBackend: TicketRespuesta;
  viaje: ViajeTicketCompra | null;
  fecha: string;
  asientos: AsientoTicketCompra[];
  total: number;
}

export function construirTicketAprobado({
  ticketBackend,
  viaje,
  fecha,
  asientos,
  total,
}: ConstruirTicketParametros): TicketPagoAprobado {
  const numerosAsientos =
    ticketBackend.asientoNumeros.length > 0
      ? ticketBackend.asientoNumeros
      : ticketBackend.asientos.length > 0
        ? ticketBackend.asientos.map(
            (asiento) => asiento.numero,
          )
        : asientos.map(
            (asiento) => asiento.numero,
          );

  const totalTicket = Number(
    ticketBackend.total ??
      ticketBackend.montoTotal,
  );

  return {
    datosOficiales: ticketBackend,

    id: ticketBackend.id,

    codigoTicket:
      ticketBackend.codigoTicket,

    origen:
      ticketBackend.origen ||
      ticketBackend.reserva?.viaje?.ruta
        ?.origen ||
      viaje?.ruta?.origen ||
      "Chimoré",

    destino:
      ticketBackend.destino ||
      ticketBackend.reserva?.viaje?.ruta
        ?.destino ||
      viaje?.ruta?.destino ||
      "Destino",

    fecha:
      ticketBackend.fecha ||
      ticketBackend.reserva?.viaje
        ?.fecha ||
      viaje?.fecha ||
      fecha,

    hora:
      ticketBackend.hora ||
      ticketBackend.reserva?.viaje
        ?.horaSalida ||
      viaje?.horaSalida ||
      "",

    asientos: numerosAsientos,

    total: Number.isFinite(totalTicket)
      ? totalTicket
      : total,

    imagenQr: ticketBackend.imagenQr,
  };
}

export function nombreArchivoTicket(
  ticket: TicketPagoAprobado,
): string {
  const codigo = (
    ticket.codigoTicket ||
    ticket.id ||
    "ticket"
  )
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    )
    .slice(0, 80);

  return `ticket-${codigo}.png`;
}

export function construirTextoTicket(
  ticket: TicketPagoAprobado,
): string {
  const asientos =
    ticket.asientos?.length
      ? ticket.asientos
          .map(
            (numero) =>
              `#${String(
                numero,
              ).replace(/^#/, "")}`,
          )
          .join(", ")
      : "Por confirmar";

  return [
    "✅ Ticket Trans 2 de Junio",

    `Código: ${
      ticket.codigoTicket ||
      "Generado"
    }`,

    `Ruta: ${
      ticket.origen || "Origen"
    } → ${
      ticket.destino || "Destino"
    }`,

    `Fecha: ${
      ticket.fecha ||
      "Por confirmar"
    }`,

    `Hora: ${
      ticket.hora ||
      "Por confirmar"
    }`,

    `Asientos: ${asientos}`,

    `Total: Bs. ${Number(
      ticket.total || 0,
    ).toFixed(2)}`,
  ].join("\n");
}

export async function crearImagenTicket(
  ticket: TicketPagoAprobado,
  pasajero: string,
): Promise<Blob> {
  const canvas =
    document.createElement("canvas");

  canvas.width = 1200;
  canvas.height = 760;

  const contexto =
    canvas.getContext("2d");

  if (!contexto) {
    throw new Error(
      "El navegador no permite generar la imagen.",
    );
  }

  const asientos =
    ticket.asientos?.length
      ? ticket.asientos
          .map(
            (numero) =>
              `#${String(
                numero,
              ).replace(/^#/, "")}`,
          )
          .join(", ")
      : "Por confirmar";

  contexto.fillStyle = "#f0fdf4";

  contexto.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  contexto.fillStyle = "#047857";

  contexto.fillRect(
    0,
    0,
    canvas.width,
    155,
  );

  contexto.fillStyle = "#ffffff";

  contexto.font =
    "900 30px Arial";

  contexto.fillText(
    "SERVICIO DE TRANSPORTE",
    55,
    58,
  );

  contexto.font =
    "900 58px Arial";

  contexto.fillText(
    "TRANS 2 DE JUNIO",
    55,
    122,
  );

  contexto.fillStyle = "#052e2b";

  contexto.font =
    "900 28px Arial";

  contexto.fillText(
    "TICKET ELECTRÓNICO OFICIAL",
    55,
    215,
  );

  contexto.fillStyle = "#64748b";

  contexto.font =
    "700 20px Arial";

  contexto.fillText(
    "Pasajero",
    55,
    278,
  );

  contexto.fillStyle = "#0f172a";

  contexto.font =
    "900 29px Arial";

  contexto.fillText(
    pasajero,
    55,
    318,
    730,
  );

  const datos: Array<
    [string, string]
  > = [
    [
      "Ruta",
      `${ticket.origen || "Origen"} → ${
        ticket.destino ||
        "Destino"
      }`,
    ],

    [
      "Fecha y hora",
      `${
        ticket.fecha ||
        "Por confirmar"
      } · ${
        ticket.hora ||
        "Por confirmar"
      }`,
    ],

    [
      "Asientos",
      asientos,
    ],

    [
      "Monto pagado",
      `Bs. ${Number(
        ticket.total || 0,
      ).toFixed(2)}`,
    ],
  ];

  datos.forEach(
    (
      [etiqueta, valor],
      indice,
    ) => {
      const columna =
        indice % 2;

      const fila = Math.floor(
        indice / 2,
      );

      const x =
        55 + columna * 405;

      const y =
        400 + fila * 125;

      contexto.fillStyle =
        "#d1fae5";

      contexto.fillRect(
        x,
        y - 42,
        365,
        92,
      );

      contexto.fillStyle =
        "#047857";

      contexto.font =
        "800 17px Arial";

      contexto.fillText(
        etiqueta.toUpperCase(),
        x + 18,
        y - 12,
      );

      contexto.fillStyle =
        "#0f172a";

      contexto.font =
        "900 22px Arial";

      contexto.fillText(
        valor,
        x + 18,
        y + 24,
        330,
      );
    },
  );

  contexto.fillStyle = "#ffffff";

  contexto.fillRect(
    870,
    240,
    260,
    260,
  );

  contexto.strokeStyle =
    "#047857";

  contexto.lineWidth = 8;

  contexto.strokeRect(
    870,
    240,
    260,
    260,
  );

  dibujarCodigoVisual(
    contexto,
    895,
    265,
    210,
    ticket.codigoTicket ||
      ticket.id ||
      "TRANS2DEJUNIO",
  );

  contexto.fillStyle = "#047857";

  contexto.font =
    "900 18px Arial";

  contexto.textAlign =
    "center";

  contexto.fillText(
    ticket.codigoTicket ||
      "TICKET GENERADO",
    1000,
    545,
    300,
  );

  contexto.fillStyle = "#334155";

  contexto.font =
    "700 18px Arial";

  contexto.fillText(
    "Presenta este ticket al momento de abordar.",
    600,
    690,
  );

  contexto.textAlign =
    "start";

  return convertirCanvasABlob(
    canvas,
  );
}

export function descargarArchivo(
  archivo: Blob,
  nombre: string,
): void {
  const url =
    URL.createObjectURL(archivo);

  const enlace =
    document.createElement("a");

  enlace.href = url;
  enlace.download = nombre;

  document.body.appendChild(
    enlace,
  );

  enlace.click();
  enlace.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function compartirTicket(
  ticket: TicketPagoAprobado,
  pasajero: string,
): Promise<boolean> {
  const texto =
    construirTextoTicket(ticket);

  try {
    const imagen =
      await crearImagenTicket(
        ticket,
        pasajero,
      );

    const archivoCompartible =
      new File(
        [imagen],
        nombreArchivoTicket(ticket),
        {
          type: "image/png",
        },
      );

    const datosCompartir = {
      title:
        "Ticket Trans 2 de Junio",

      text: texto,

      files: [
        archivoCompartible,
      ],
    };

    if (
      navigator.share &&
      navigator.canShare?.(
        datosCompartir,
      )
    ) {
      await navigator.share(
        datosCompartir,
      );

      return true;
    }
  } catch {
    /*
     * Si el navegador no permite
     * compartir archivos, se usa
     * WhatsApp como alternativa.
     */
  }

  window.open(
    `https://wa.me/?text=${encodeURIComponent(
      texto,
    )}`,
    "_blank",
    "noopener,noreferrer",
  );

  return false;
}

function dibujarCodigoVisual(
  contexto:
    CanvasRenderingContext2D,
  x: number,
  y: number,
  tamanio: number,
  semilla: string,
): void {
  const semillaSegura =
    semilla ||
    "TRANS2DEJUNIO";

  const celdas = 21;

  const celda =
    tamanio / celdas;

  contexto.fillStyle =
    "#0f172a";

  for (
    let fila = 0;
    fila < celdas;
    fila += 1
  ) {
    for (
      let columna = 0;
      columna < celdas;
      columna += 1
    ) {
      const posicion =
        (fila * celdas +
          columna) %
        semillaSegura.length;

      const caracter =
        semillaSegura.charCodeAt(
          posicion,
        );

      const dibujar =
        (caracter +
          fila * 7 +
          columna * 11) %
          3 !==
        0;

      if (dibujar) {
        contexto.fillRect(
          x + columna * celda,
          y + fila * celda,
          Math.ceil(celda),
          Math.ceil(celda),
        );
      }
    }
  }
}

function convertirCanvasABlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  return new Promise(
    (resolver, rechazar) => {
      canvas.toBlob(
        (archivo) => {
          if (archivo) {
            resolver(archivo);
            return;
          }

          rechazar(
            new Error(
              "No se pudo crear la imagen del ticket.",
            ),
          );
        },
        "image/png",
        0.95,
      );
    },
  );
}