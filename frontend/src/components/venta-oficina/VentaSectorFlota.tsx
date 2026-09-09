import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Armchair,
  Banknote,
  BusFront,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DoorOpen,
  Info,
  MapPin,
  QrCode,
  User,
  Users,
  X,
} from "lucide-react";

import TicketVentaOficina from "../TicketVentaOficina";
import PagoQROficina from "./PagoQROficina";
import { obtenerRutas } from "../../services/rutas.service";

import { obtenerViajesDisponibles } from "../../services/viajes.service";

import {
  bloquearAsiento,
  liberarAsiento,
  obtenerAsientosPorViaje,
} from "../../services/asientos.service";

import {
  crearVentaOficina,
  type MetodoPago,
} from "../../services/ventas.service";

type Ruta = {
  id: string;
  origen: string;
  destino: string;
};

type VehiculoViaje = {
  id?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  tipo?: string;
  capacidad?: number;
};

type ViajeDisponible = {
  id: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;
  asientosDisponibles?: number;

  vehiculo?: VehiculoViaje;

  ruta?: {
    id?: string;
    origen?: string;
    destino?: string;
  };
};

type AsientoViaje = {
  id: string;
  numero: number | string;
  estado: string;
  bloqueadoPor?: string | null;
  bloqueadoHasta?: string | null;
};

function normalizarEstadoAsiento(
  asiento: AsientoViaje,
): string {
  return String(
    asiento.estado || "",
  ).toUpperCase();
}

function asientoDisponible(
  asiento: AsientoViaje,
): boolean {
  return (
    normalizarEstadoAsiento(
      asiento,
    ) === "DISPONIBLE"
  );
}

function asientoReservadoTemporalmente(
  asiento: AsientoViaje,
): boolean {
  return (
    normalizarEstadoAsiento(
      asiento,
    ) === "BLOQUEADO"
  );
}

type ResultadoVenta = {
  [propiedad: string]: unknown;
};

function VentaSectorFlota() {
  const operadorId =
    obtenerOperadorLocal().id;

  const [nombre, setNombre] =
    useState("");

  const [ci, setCi] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [
    metodoPago,
    setMetodoPago,
  ] = useState<MetodoPago>(
    "EFECTIVO",
  );

  const [rutas, setRutas] =
    useState<Ruta[]>([]);

  const [rutaId, setRutaId] =
    useState("");

  const [fecha, setFecha] =
    useState("");

  const [viajes, setViajes] =
    useState<ViajeDisponible[]>([]);

  const [viaje, setViaje] =
    useState<ViajeDisponible | null>(
      null,
    );

  const [asientos, setAsientos] =
    useState<AsientoViaje[]>([]);

  const [
    asientosSeleccionados,
    setAsientosSeleccionados,
  ] = useState<AsientoViaje[]>([]);

  const asientosSeleccionadosRef =
    useRef<AsientoViaje[]>([]);

  const operacionesAsientoRef =
    useRef<Set<string>>(new Set());

  const [paso, setPaso] =
    useState(1);

  const [mensaje, setMensaje] =
    useState("");

  const [esError, setEsError] =
    useState(false);

  const [procesando, setProcesando] =
    useState(false);

  const [
    ventaFinal,
    setVentaFinal,
  ] =
    useState<ResultadoVenta | null>(
      null,
    );

  const formularioBloqueado =
    procesando ||
    Boolean(ventaFinal);

  const cantidadSeleccionada =
    asientosSeleccionados.length;

  const precioUnitario = Number(
    viaje?.precio || 0,
  );

  const totalVenta =
    precioUnitario *
    cantidadSeleccionada;

  useEffect(() => {
    asientosSeleccionadosRef.current =
      asientosSeleccionados;
  }, [asientosSeleccionados]);

  useEffect(() => {
    async function cargarRutas() {
      try {
        const data =
          await obtenerRutas();

        setRutas(
          Array.isArray(data)
            ? (data as Ruta[])
            : [],
        );
      } catch {
        mostrarMensaje(
          "No se pudieron cargar las rutas.",
          true,
        );
      }
    }

    void cargarRutas();
  }, []);

  useEffect(() => {
    if (
      nombre.trim() &&
      ci.trim() &&
      telefono.trim()
    ) {
      setPaso((anterior) =>
        Math.max(anterior, 2),
      );
    }
  }, [
    nombre,
    ci,
    telefono,
  ]);

  useEffect(() => {
    const viajeId =
      viaje?.id;

    if (
      !viajeId ||
      ventaFinal
    ) {
      return;
    }

    let componenteActivo =
      true;

    const actualizarMapa =
      async () => {
        try {
          const data =
            await obtenerAsientosPorViaje(
              viajeId,
            );

          if (!componenteActivo) {
            return;
          }

          const lista =
            Array.isArray(data)
              ? (data as AsientoViaje[])
              : [];

          const idsSeleccionados =
            new Set(
              asientosSeleccionadosRef.current.map(
                ({ id }) => id,
              ),
            );

          const listaVisual =
            lista.map((asiento) =>
              asientoReservadoTemporalmente(
                asiento,
              ) &&
              asiento.bloqueadoPor ===
                operadorId &&
              idsSeleccionados.has(
                asiento.id,
              )
                ? {
                    ...asiento,
                    estado: "DISPONIBLE",
                  }
                : asiento,
            );

          setAsientos(listaVisual);

          setAsientosSeleccionados(
            (seleccionados) => {
              const nuevaSeleccion =
                seleccionados
                  .map((seleccionado) =>
                    lista.find(
                      (asiento) =>
                        asiento.id ===
                        seleccionado.id,
                    ),
                  )
                  .filter(
                    (
                      asiento,
                    ): asiento is AsientoViaje =>
                      Boolean(asiento) &&
                      asientoReservadoTemporalmente(
                        asiento as AsientoViaje,
                      ) &&
                      asiento?.bloqueadoPor ===
                        operadorId,
                  )
                  .map((asiento) => ({
                    ...asiento,
                    estado: "DISPONIBLE",
                  }));

              asientosSeleccionadosRef.current =
                nuevaSeleccion;

              return nuevaSeleccion;
            },
          );
        } catch {
          // Conserva la información visible si falla una actualización automática.
        }
      };

    const intervalo =
      window.setInterval(
        () => {
          void actualizarMapa();
        },
        5000,
      );

    const actualizarAlVolver =
      () => {
        void actualizarMapa();
      };

    window.addEventListener(
      "focus",
      actualizarAlVolver,
    );

    return () => {
      componenteActivo = false;

      window.clearInterval(
        intervalo,
      );

      window.removeEventListener(
        "focus",
        actualizarAlVolver,
      );
    };
  }, [
    operadorId,
    viaje?.id,
    ventaFinal,
  ]);

  useEffect(() => {
    return () => {
      const seleccionados =
        asientosSeleccionadosRef.current;

      if (
        !operadorId ||
        seleccionados.length === 0
      ) {
        return;
      }

      void Promise.allSettled(
        seleccionados.map(({ id }) =>
          liberarAsiento(
            id,
            operadorId,
          ),
        ),
      );
    };
  }, [operadorId]);

  function mostrarMensaje(
    texto = "",
    error = false,
  ) {
    setMensaje(texto);
    setEsError(error);
  }

  function cambiarNombre(
    valor: string,
  ) {
    setNombre(valor);
    mostrarMensaje();
  }

  function cambiarCi(
    valor: string,
  ) {
    setCi(
      valor.replace(/\D/g, ""),
    );

    mostrarMensaje();
  }

  function cambiarTelefono(
    valor: string,
  ) {
    setTelefono(
      valor.replace(/\D/g, ""),
    );

    mostrarMensaje();
  }

  function cambiarEmail(
    valor: string,
  ) {
    setEmail(valor);
    mostrarMensaje();
  }

  function seleccionarMetodoPago(
    metodo: MetodoPago,
  ) {
    if (formularioBloqueado) {
      return;
    }

    setMetodoPago(metodo);

    setPaso((anterior) =>
      Math.max(anterior, 3),
    );

    mostrarMensaje();
  }

  function limpiarSeleccionViaje() {
    liberarSeleccionActual();

    setViaje(null);
    setAsientos([]);
    setAsientosSeleccionados([]);
    setVentaFinal(null);
  }

  function liberarSeleccionActual() {
    const seleccionados =
      asientosSeleccionadosRef.current;

    if (
      operadorId &&
      seleccionados.length > 0
    ) {
      void Promise.allSettled(
        seleccionados.map(({ id }) =>
          liberarAsiento(
            id,
            operadorId,
          ),
        ),
      );
    }

    asientosSeleccionadosRef.current = [];
  }

  async function cargarSalidas(
    rutaSeleccionada: string,
    fechaSeleccionada: string,
  ) {
    setViajes([]);
    limpiarSeleccionViaje();
    mostrarMensaje();

    if (
      !rutaSeleccionada ||
      !fechaSeleccionada
    ) {
      setPaso(3);
      return;
    }

    try {
      const data =
        await obtenerViajesDisponibles(
          rutaSeleccionada,
          fechaSeleccionada,
        );

      const lista =
        Array.isArray(data)
          ? (data as ViajeDisponible[])
          : [];

      setViajes(lista);
      setPaso(4);

      if (lista.length === 0) {
        mostrarMensaje(
          "No hay horarios disponibles para esa ruta y fecha.",
          true,
        );
      }
    } catch (error: unknown) {
      mostrarMensaje(
        obtenerMensajeError(
          error,
          "No se pudieron cargar los horarios.",
        ),
        true,
      );
    }
  }

  async function seleccionarViaje(
    item: ViajeDisponible,
  ) {
    if (formularioBloqueado) {
      return;
    }

    liberarSeleccionActual();

    setViaje(item);
    setAsientos([]);
    setAsientosSeleccionados([]);
    setVentaFinal(null);
    mostrarMensaje();

    try {
      const data =
        await obtenerAsientosPorViaje(
          item.id,
        );

      const lista =
        Array.isArray(data)
          ? (data as AsientoViaje[])
          : [];

      setAsientos(lista);
      setPaso(5);

      if (lista.length === 0) {
        mostrarMensaje(
          "Este vehículo todavía no tiene asientos registrados.",
          true,
        );
      }
    } catch (error: unknown) {
      mostrarMensaje(
        obtenerMensajeError(
          error,
          "No se pudieron cargar los asientos.",
        ),
        true,
      );
    }
  }

  async function seleccionarAsiento(
    item: AsientoViaje,
  ) {
    if (
      formularioBloqueado ||
      operacionesAsientoRef.current.has(
        item.id,
      )
    ) {
      return;
    }

    if (!operadorId) {
      mostrarMensaje(
        "No se encontró la sesión de la administradora o secretaria.",
        true,
      );
      return;
    }

    const yaSeleccionado =
      asientosSeleccionadosRef.current.some(
        (asiento) =>
          asiento.id === item.id,
      );

    if (
      !yaSeleccionado &&
      !asientoDisponible(item)
    ) {
      mostrarMensaje(
        "Este asiento está ocupado o está siendo seleccionado por otro usuario.",
        true,
      );
      return;
    }

    operacionesAsientoRef.current.add(
      item.id,
    );

    try {
      if (yaSeleccionado) {
        const respuesta =
          await liberarAsiento(
            item.id,
            operadorId,
          );

        setAsientos((lista) =>
          lista.map((asiento) =>
            asiento.id === item.id
              ? {
                  ...asiento,
                  ...respuesta.asiento,
                  estado: "DISPONIBLE",
                }
              : asiento,
          ),
        );

        setAsientosSeleccionados(
          (seleccionados) => {
            const nuevaSeleccion =
              seleccionados.filter(
                (asiento) =>
                  asiento.id !== item.id,
              );

            asientosSeleccionadosRef.current =
              nuevaSeleccion;

            setPaso(
              nuevaSeleccion.length > 0
                ? 6
                : 5,
            );

            return nuevaSeleccion;
          },
        );

        mostrarMensaje(
          "Asiento liberado correctamente.",
        );
        return;
      }

      const respuesta =
        await bloquearAsiento(
          item.id,
          operadorId,
        );

      const asientoSeleccionado: AsientoViaje = {
        ...item,
        ...respuesta.asiento,
        estado: "DISPONIBLE",
      };

      setAsientos((lista) =>
        lista.map((asiento) =>
          asiento.id === item.id
            ? asientoSeleccionado
            : asiento,
        ),
      );

      setAsientosSeleccionados(
        (seleccionados) => {
          const nuevaSeleccion = [
            ...seleccionados.filter(
              (asiento) =>
                asiento.id !== item.id,
            ),
            asientoSeleccionado,
          ].sort(
            (a, b) =>
              Number(a.numero) -
              Number(b.numero),
          );

          asientosSeleccionadosRef.current =
            nuevaSeleccion;

          return nuevaSeleccion;
        },
      );

      setPaso(6);
      mostrarMensaje(
        "Asiento bloqueado para esta venta durante 10 minutos.",
      );
    } catch (error: unknown) {
      mostrarMensaje(
        obtenerMensajeError(
          error,
          "Otro usuario acaba de seleccionar este asiento.",
        ),
        true,
      );

      if (viaje?.id) {
        try {
          const data =
            await obtenerAsientosPorViaje(
              viaje.id,
            );

          setAsientos(
            Array.isArray(data)
              ? (data as AsientoViaje[])
              : [],
          );
        } catch {
          // Conserva el mensaje principal.
        }
      }
    } finally {
      operacionesAsientoRef.current.delete(
        item.id,
      );
    }
  }

  async function quitarAsiento(
    asientoId: string,
  ) {
    if (formularioBloqueado) {
      return;
    }

    const asiento =
      asientosSeleccionadosRef.current.find(
        (item) => item.id === asientoId,
      );

    if (asiento) {
      await seleccionarAsiento(asiento);
    }
  }

  async function confirmarVenta() {
    if (formularioBloqueado) {
      return;
    }

    if (
      !nombre.trim() ||
      !ci.trim() ||
      !telefono.trim()
    ) {
      mostrarMensaje(
        "Completa los datos obligatorios del pasajero.",
        true,
      );

      setPaso(1);
      return;
    }

    if (!rutaId || !fecha) {
      mostrarMensaje(
        "Selecciona una ruta y una fecha.",
        true,
      );

      setPaso(3);
      return;
    }

    if (!viaje?.id) {
      mostrarMensaje(
        "Selecciona un horario de viaje.",
        true,
      );

      setPaso(4);
      return;
    }

    if (!operadorId) {
      mostrarMensaje(
        "No se encontró la sesión de la administradora o secretaria.",
        true,
      );
      return;
    }

    if (
      asientosSeleccionados.length ===
      0
    ) {
      mostrarMensaje(
        "Selecciona al menos un asiento disponible.",
        true,
      );

      setPaso(5);
      return;
    }

    setProcesando(true);
    mostrarMensaje();

    try {
      const resultado =
        await crearVentaOficina({
          operadorId,

          pasajeroNombre:
            nombre.trim(),

          pasajeroCi:
            ci.trim(),

          pasajeroTelefono:
            telefono.trim(),

          pasajeroEmail:
            email.trim() ||
            undefined,

          viajeId: viaje.id,

          asientoIds:
            asientosSeleccionados.map(
              (item) => item.id,
            ),

          metodoPago,
        });

      setVentaFinal(
        resultado as ResultadoVenta,
      );

      asientosSeleccionadosRef.current = [];

      const idsVendidos = new Set(
        asientosSeleccionados.map(
          (item) => item.id,
        ),
      );

      setAsientos((anteriores) =>
        anteriores.map((item) =>
          idsVendidos.has(item.id)
            ? {
                ...item,
                estado: "OCUPADO",
              }
            : item,
        ),
      );

      mostrarMensaje(
        `Venta registrada correctamente. Se vendieron ${cantidadSeleccionada} ${
          cantidadSeleccionada === 1
            ? "asiento"
            : "asientos"
        } y se generó el ticket electrónico.`,
        false,
      );

      setPaso(7);

      window.setTimeout(() => {
        document
          .getElementById(
            "ticket-venta-oficina",
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 200);
    } catch (error: unknown) {
      mostrarMensaje(
        obtenerMensajeError(
          error,
          "No se pudo registrar la venta.",
        ),
        true,
      );

      try {
        const dataActualizada =
          await obtenerAsientosPorViaje(
            viaje.id,
          );

        const listaActualizada =
          Array.isArray(
            dataActualizada,
          )
            ? (dataActualizada as AsientoViaje[])
            : [];

        setAsientos(
          listaActualizada,
        );

        const idsDisponibles =
          new Set(
            listaActualizada
              .filter(
                (item) =>
                  String(
                    item.estado || "",
                  ).toUpperCase() ===
                  "DISPONIBLE",
              )
              .map(
                (item) => item.id,
              ),
          );

        const seleccionDisponible =
          asientosSeleccionados.filter(
            (item) =>
              idsDisponibles.has(
                item.id,
              ),
          );

        if (
          seleccionDisponible.length !==
          asientosSeleccionados.length
        ) {
          setAsientosSeleccionados(
            seleccionDisponible,
          );

          setPaso(
            seleccionDisponible.length >
              0
              ? 6
              : 5,
          );

          mostrarMensaje(
            "Uno o más asientos fueron ocupados por otra venta. Revisa tu selección.",
            true,
          );
        }
      } catch {
        // Conserva el mensaje principal.
      }
    } finally {
      setProcesando(false);
    }
  }

  function nuevaVenta() {
    liberarSeleccionActual();

    setNombre("");
    setCi("");
    setTelefono("");
    setEmail("");

    setMetodoPago("EFECTIVO");

    setRutaId("");
    setFecha("");

    setViajes([]);
    setViaje(null);

    setAsientos([]);
    setAsientosSeleccionados([]);

    setMensaje("");
    setEsError(false);

    setVentaFinal(null);
    setProcesando(false);

    setPaso(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const disponibles =
    asientos.filter(
      asientoDisponible,
    ).length;

  const bloqueados =
    asientos.filter(
      asientoReservadoTemporalmente,
    ).length;

  const ocupados =
    Math.max(
      0,
      asientos.length -
        disponibles -
        bloqueados,
    );
      return (
    <main className="min-h-[calc(100vh-77px)] bg-[#f2f8f4] p-4 text-slate-900 sm:p-6 lg:p-8">
      <section className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}

        <header className="relative mb-7 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#006331] via-[#007a3d] to-[#009149] px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-96 rotate-[-10deg] rounded-[50%] bg-lime-300/10" />

          <div className="pointer-events-none absolute right-8 top-7 grid grid-cols-5 gap-2 opacity-20">
            {Array.from({
              length: 20,
            }).map((_, indice) => (
              <span
                key={indice}
                className="h-1.5 w-1.5 rounded-full bg-lime-200"
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm sm:flex">
                <CreditCard size={31} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                  Administración
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Venta en oficina
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50 sm:text-base">
                  Venta presencial con selección de
                  uno o varios asientos y generación
                  del ticket electrónico.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 px-5 py-4 shadow-lg backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Estado del proceso
              </p>

              <p className="mt-1 text-lg font-black text-white">
                Paso {paso} de 7
              </p>
            </div>
          </div>
        </header>

        {/* INDICADOR DE PASOS */}

        <div className="mb-6 overflow-x-auto rounded-[26px] border border-emerald-100 bg-white p-5 shadow-[0_12px_35px_rgba(0,83,42,0.07)]">
          <div className="flex min-w-[900px] items-center justify-between gap-3">
            <IndicadorPaso
              numero={1}
              texto="Pasajero"
              activo={paso >= 1}
              actual={paso === 1}
            />

            <LineaPaso
              activa={paso >= 2}
            />

            <IndicadorPaso
              numero={2}
              texto="Pago"
              activo={paso >= 2}
              actual={paso === 2}
            />

            <LineaPaso
              activa={paso >= 3}
            />

            <IndicadorPaso
              numero={3}
              texto="Ruta"
              activo={paso >= 3}
              actual={paso === 3}
            />

            <LineaPaso
              activa={paso >= 4}
            />

            <IndicadorPaso
              numero={4}
              texto="Horario"
              activo={paso >= 4}
              actual={paso === 4}
            />

            <LineaPaso
              activa={paso >= 5}
            />

            <IndicadorPaso
              numero={5}
              texto="Asientos"
              activo={paso >= 5}
              actual={paso === 5}
            />

            <LineaPaso
              activa={paso >= 6}
            />

            <IndicadorPaso
              numero={6}
              texto="Confirmar"
              activo={paso >= 6}
              actual={paso === 6}
            />

            <LineaPaso
              activa={paso >= 7}
            />

            <IndicadorPaso
              numero={7}
              texto="Ticket"
              activo={paso >= 7}
              actual={paso === 7}
            />
          </div>
        </div>

        {/* MENSAJES */}

        {mensaje && (
          <div
            role="alert"
            className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 font-bold shadow-sm ${
              esError
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {!esError && (
              <CheckCircle2
                size={21}
                className="shrink-0"
              />
            )}

            <span>{mensaje}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* PASO 1 */}

          <Seccion
            numero={1}
            titulo="Datos del pasajero"
            descripcion="Registra los datos de la persona que comprará los pasajes."
            activa
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Campo
                label="Nombre completo"
                value={nombre}
                onChange={cambiarNombre}
                placeholder="Ejemplo: José Pérez"
                disabled={
                  formularioBloqueado
                }
              />

              <Campo
                label="CI / DNI"
                value={ci}
                onChange={cambiarCi}
                placeholder="Número de CI"
                inputMode="numeric"
                maxLength={12}
                disabled={
                  formularioBloqueado
                }
              />

              <Campo
                label="Teléfono"
                value={telefono}
                onChange={
                  cambiarTelefono
                }
                placeholder="Ejemplo: 75432109"
                type="tel"
                inputMode="tel"
                maxLength={15}
                disabled={
                  formularioBloqueado
                }
              />

              <Campo
                label="Correo opcional"
                value={email}
                onChange={cambiarEmail}
                placeholder="correo@gmail.com"
                type="email"
                disabled={
                  formularioBloqueado
                }
              />
            </div>
          </Seccion>

          {/* PASO 2 */}

          <Seccion
            numero={2}
            titulo="Método de pago"
            descripcion="Selecciona la forma de pago utilizada en ventanilla."
            activa={paso >= 2}
          >
            {paso >= 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Metodo
                  activo={
                    metodoPago ===
                    "EFECTIVO"
                  }
                  titulo="Efectivo"
                  descripcion="Pago directo en caja"
                  icono={
                    <Banknote size={28} />
                  }
                  disabled={
                    formularioBloqueado
                  }
                  onClick={() =>
                    seleccionarMetodoPago(
                      "EFECTIVO",
                    )
                  }
                />

                <Metodo
                  activo={
                    metodoPago === "QR"
                  }
                  titulo="QR Digital"
                  descripcion="Pago mediante código QR"
                  icono={
                    <QrCode size={28} />
                  }
                  disabled={
                    formularioBloqueado
                  }
                  onClick={() =>
                    seleccionarMetodoPago(
                      "QR",
                    )
                  }
                />

              </div>
            )}
          </Seccion>

          {/* PASO 3 */}

          <Seccion
            numero={3}
            titulo="Ruta y fecha"
            descripcion="Selecciona el recorrido y la fecha del viaje."
            activa={paso >= 3}
          >
            {paso >= 3 && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="ruta-oficina"
                    className="flex items-center gap-2 text-sm font-black text-slate-700"
                  >
                    <MapPin
                      size={17}
                      className="text-emerald-700"
                    />
                    Ruta
                  </label>

                  <select
                    id="ruta-oficina"
                    value={rutaId}
                    disabled={
                      formularioBloqueado
                    }
                    onChange={(event) => {
                      const nuevaRuta =
                        event.target.value;

                      setRutaId(nuevaRuta);

                      void cargarSalidas(
                        nuevaRuta,
                        fecha,
                      );
                    }}
                    className="mt-2 h-14 w-full rounded-xl border border-emerald-200 bg-slate-50 px-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  >
                    <option value="">
                      Seleccionar ruta
                    </option>

                    {rutas.map((ruta) => (
                      <option
                        key={ruta.id}
                        value={ruta.id}
                      >
                        {ruta.origen} →{" "}
                        {ruta.destino}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="fecha-oficina"
                    className="flex items-center gap-2 text-sm font-black text-slate-700"
                  >
                    <CalendarDays
                      size={17}
                      className="text-emerald-700"
                    />
                    Fecha del viaje
                  </label>

                  <input
                    id="fecha-oficina"
                    type="date"
                    value={fecha}
                    min={obtenerFechaActual()}
                    disabled={
                      formularioBloqueado
                    }
                    onChange={(event) => {
                      const nuevaFecha =
                        event.target.value;

                      setFecha(nuevaFecha);

                      void cargarSalidas(
                        rutaId,
                        nuevaFecha,
                      );
                    }}
                    className="mt-2 h-14 w-full rounded-xl border border-emerald-200 bg-slate-50 px-4 font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  />
                </div>
              </div>
            )}
          </Seccion>

          {/* PASO 4 */}

          <Seccion
            numero={4}
            titulo="Horario y vehículo"
            descripcion="Selecciona una salida disponible para el pasajero."
            activa={paso >= 4}
          >
            {paso >= 4 && (
              <>
                {viajes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
                    <Clock
                      size={40}
                      className="mx-auto text-emerald-300"
                    />

                    <p className="mt-4 font-bold text-slate-600">
                      No hay horarios para mostrar.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {viajes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={
                          formularioBloqueado
                        }
                        onClick={() =>
                          void seleccionarViaje(
                            item,
                          )
                        }
                        className={`rounded-2xl border p-5 text-left transition disabled:opacity-50 ${
                          viaje?.id === item.id
                            ? "border-emerald-600 bg-emerald-50 shadow-md ring-4 ring-emerald-100"
                            : "border-emerald-100 bg-white hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            viaje?.id === item.id
                              ? "bg-emerald-700 text-white"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          <Clock size={21} />
                        </div>

                        <p className="mt-4 text-xl font-black">
                          {formatearHora(
                            item.horaSalida,
                          )}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.vehiculo
                            ?.marca || "Flota"}{" "}
                          {item.vehiculo
                            ?.modelo || ""}
                        </p>

                        <p className="mt-3 font-black text-emerald-700">
                          {item.asientosDisponibles ??
                            0}{" "}
                          libres
                        </p>

                        <p className="mt-2 text-lg font-black">
                          Bs.{" "}
                          {Number(
                            item.precio || 0,
                          ).toFixed(2)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Seccion>

          {/* PASO 5: MAPA NUEVO */}

          <Seccion
            numero={5}
            titulo="Seleccionar asientos"
            descripcion="Puedes seleccionar uno o varios asientos disponibles."
            activa={paso >= 5}
          >
            {paso >= 5 && viaje && (
              <MapaAsientosOficina
                viaje={viaje}
                asientos={asientos}
                seleccionados={
                  asientosSeleccionados
                }
                bloqueado={
                  formularioBloqueado
                }
                disponibles={disponibles}
                bloqueados={bloqueados}
                ocupados={ocupados}
                precioUnitario={
                  precioUnitario
                }
                onSeleccionar={
                  seleccionarAsiento
                }
                onQuitar={
                  quitarAsiento
                }
              />
            )}
          </Seccion>

          {/* PASO 6 */}

          <Seccion
            numero={6}
            titulo="Confirmar venta"
            descripcion="Revisa la información antes de registrar la venta."
            activa={paso >= 6}
          >
            {paso >= 6 &&
              viaje &&
              cantidadSeleccionada > 0 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Resumen
                      titulo="Pasajero"
                      valor={
                        nombre || "---"
                      }
                    />

                    <Resumen
                      titulo="Asientos"
                      valor={asientosSeleccionados
                        .map(
                          (item) =>
                            `#${item.numero}`,
                        )
                        .join(", ")}
                    />

                    <Resumen
                      titulo="Cantidad"
                      valor={`${cantidadSeleccionada} ${
                        cantidadSeleccionada ===
                        1
                          ? "pasaje"
                          : "pasajes"
                      }`}
                    />

                    <Resumen
                      titulo="Total a cobrar"
                      valor={`Bs. ${totalVenta.toFixed(
                        2,
                      )}`}
                      destacado
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-600">
                          Método de pago
                        </p>

                        <p className="mt-1 font-black text-emerald-700">
                          {metodoPago}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          {cantidadSeleccionada} ×
                          Bs.{" "}
                          {precioUnitario.toFixed(
                            2,
                          )}
                        </p>

                        <p className="mt-1 text-2xl font-black text-emerald-700">
                          Bs.{" "}
                          {totalVenta.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {metodoPago === "QR" ? (
                    <PagoQROficina
                      mostrar
                      total={totalVenta}
                      cantidadAsientos={
                        cantidadSeleccionada
                      }
                      procesando={procesando}
                      onConfirmarPago={() =>
                        void confirmarVenta()
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        void confirmarVenta()
                      }
                      disabled={
                        formularioBloqueado
                      }
                      className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#008743] to-[#006c36] px-5 py-4 font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:from-[#00783c] hover:to-[#005b2d] disabled:opacity-50"
                    >
                      {procesando ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Registrando venta...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={21}
                          />
                          Confirmar venta de{" "}
                          {cantidadSeleccionada}{" "}
                          {cantidadSeleccionada ===
                          1
                            ? "asiento"
                            : "asientos"}{" "}
                          — Bs.{" "}
                          {totalVenta.toFixed(2)}
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
          </Seccion>

          {/* PASO 7 */}

          {paso >= 7 &&
            ventaFinal &&
            viaje &&
            asientosSeleccionados.length >
              0 && (
              <div
                id="ticket-venta-oficina"
                className="scroll-mt-28"
              >
                <TicketVentaOficina
                  resultado={ventaFinal}
                  pasajero={{
                    nombre,
                    ci,
                    telefono,
                    email,
                  }}
                  viaje={viaje}
                  asientos={
                    asientosSeleccionados
                  }
                  metodoPago={metodoPago}
                  onNuevaVenta={
                    nuevaVenta
                  }
                />
              </div>
            )}
        </div>
      </section>
    </main>
  );
}
function MapaAsientosOficina({
  viaje,
  asientos,
  seleccionados,
  bloqueado,
  disponibles,
  bloqueados,
  ocupados,
  precioUnitario,
  onSeleccionar,
  onQuitar,
}: {
  viaje: ViajeDisponible;
  asientos: AsientoViaje[];
  seleccionados: AsientoViaje[];
  bloqueado: boolean;
  disponibles: number;
  bloqueados: number;
  ocupados: number;
  precioUnitario: number;
  onSeleccionar: (
    asiento: AsientoViaje,
  ) => void;
  onQuitar: (
    asientoId: string,
  ) => void;
}) {
  const mapa =
    new Map<number, AsientoViaje>();

  asientos.forEach((item) => {
    mapa.set(
      Number(item.numero),
      item,
    );
  });

  const capacidadRegistrada =
    Number(
      viaje.vehiculo?.capacidad ||
        asientos.length ||
        40,
    );

  const capacidad =
    Math.max(
      capacidadRegistrada,
      asientos.length,
    );

  const cantidadFilas =
    Math.ceil(capacidad / 4);

  const filas = Array.from(
    {
      length: cantidadFilas,
    },
    (_, indiceFila) => {
      const numeroInicial =
        indiceFila * 4 + 1;

      return [
        mapa.get(numeroInicial),
        mapa.get(numeroInicial + 1),
        mapa.get(numeroInicial + 2),
        mapa.get(numeroInicial + 3),
      ];
    },
  );

  const idsSeleccionados =
    new Set(
      seleccionados.map(
        (item) => item.id,
      ),
    );

  const total =
    seleccionados.length *
    precioUnitario;

  return (
    <div className="space-y-5">
      {/* VEHÍCULO ASIGNADO */}

      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
            <BusFront size={25} />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
              Vehículo asignado
            </p>

            <p className="mt-1 font-black text-slate-900">
              {viaje.vehiculo?.marca ||
                "Vehículo"}{" "}
              {viaje.vehiculo?.modelo ||
                ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <DatoVehiculo
            titulo="Tipo"
            valor={
              viaje.vehiculo?.tipo ||
              "Flota"
            }
          />

          <DatoVehiculo
            titulo="Placa"
            valor={
              viaje.vehiculo?.placa ||
              "---"
            }
          />

          <DatoVehiculo
            titulo="Capacidad"
            valor={`${capacidad} pasajeros`}
          />
        </div>
      </div>

      {/* LEYENDA */}

      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-sm font-semibold text-slate-600">
        <Leyenda
          color="bg-emerald-500"
          texto={`Disponible (${disponibles})`}
        />

        <Leyenda
          color="bg-orange-500"
          texto={`Reservado temporalmente (${bloqueados})`}
        />

        <Leyenda
          color="bg-red-400"
          texto={`Ocupado (${ocupados})`}
        />

        <Leyenda
          color="bg-amber-400"
          texto={`Seleccionado (${seleccionados.length})`}
        />
      </div>

      {/* MAPA Y RESUMEN */}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(620px,1fr)_300px]">
        {/* INTERIOR DEL VEHÍCULO */}

        <div className="overflow-x-auto rounded-[38px] border-[3px] border-slate-200 bg-slate-100/80 p-3 shadow-inner">
          <div className="mx-auto min-w-[590px] max-w-2xl overflow-hidden rounded-[32px] border border-emerald-100 bg-white">
            {/* PARTE DELANTERA */}

            <div className="relative min-h-[205px] border-b border-emerald-100 bg-gradient-to-b from-emerald-50 to-white px-7 py-6">
              <div className="flex items-center justify-center gap-3 text-emerald-800">
                <BusFront size={22} />

                <p className="text-sm font-black uppercase tracking-[0.18em]">
                  Parte delantera
                </p>
              </div>

              <div className="mt-7 flex items-end justify-between">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                    <User size={24} />
                  </div>

                  <Armchair
                    size={48}
                    className="mt-3 text-slate-700"
                  />

                  <span className="mt-2 rounded-lg bg-slate-800 px-4 py-1.5 text-[10px] font-black uppercase text-white">
                    Operador
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 font-black text-emerald-800">
                    <DoorOpen size={22} />
                    Ingreso
                  </div>

                  <div className="mt-3 h-16 w-20 rounded-t-xl border-[3px] border-slate-300 bg-slate-100 shadow-inner" />
                </div>
              </div>
            </div>

            {/* FILAS DE ASIENTOS */}

            <div className="relative px-4 py-4">
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 bg-emerald-50/80" />

              <div className="relative space-y-2.5">
                {filas.map(
                  (
                    fila,
                    indiceFila,
                  ) => (
                    <div
                      key={indiceFila}
                      className="grid grid-cols-[1fr_1fr_62px_1fr_1fr] items-center gap-2.5"
                    >
                      <AsientoVisual
                        asiento={fila[0]}
                        numeroEsperado={
                          indiceFila *
                            4 +
                          1
                        }
                        seleccionado={
                          fila[0]
                            ? idsSeleccionados.has(
                                fila[0]
                                  .id,
                              )
                            : false
                        }
                        bloqueado={
                          bloqueado
                        }
                        onSeleccionar={
                          onSeleccionar
                        }
                      />

                      <AsientoVisual
                        asiento={fila[1]}
                        numeroEsperado={
                          indiceFila *
                            4 +
                          2
                        }
                        seleccionado={
                          fila[1]
                            ? idsSeleccionados.has(
                                fila[1]
                                  .id,
                              )
                            : false
                        }
                        bloqueado={
                          bloqueado
                        }
                        onSeleccionar={
                          onSeleccionar
                        }
                      />

                      <div className="relative z-10 flex items-center justify-center">
                        <span className="rounded-lg bg-emerald-700 px-2 py-1.5 text-[9px] font-black uppercase text-white shadow-sm">
                          Fila{" "}
                          {indiceFila + 1}
                        </span>
                      </div>

                      <AsientoVisual
                        asiento={fila[2]}
                        numeroEsperado={
                          indiceFila *
                            4 +
                          3
                        }
                        seleccionado={
                          fila[2]
                            ? idsSeleccionados.has(
                                fila[2]
                                  .id,
                              )
                            : false
                        }
                        bloqueado={
                          bloqueado
                        }
                        onSeleccionar={
                          onSeleccionar
                        }
                      />

                      <AsientoVisual
                        asiento={fila[3]}
                        numeroEsperado={
                          indiceFila *
                            4 +
                          4
                        }
                        seleccionado={
                          fila[3]
                            ? idsSeleccionados.has(
                                fila[3]
                                  .id,
                              )
                            : false
                        }
                        bloqueado={
                          bloqueado
                        }
                        onSeleccionar={
                          onSeleccionar
                        }
                      />
                    </div>
                  ),
                )}
              </div>

              <div className="relative z-10 mt-5 flex justify-center border-t border-emerald-100 pt-4">
                <span className="rounded-xl bg-emerald-700 px-8 py-2 text-xs font-black uppercase tracking-wider text-white">
                  Parte trasera
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN LATERAL */}

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_14px_40px_rgba(0,83,42,0.1)]">
            <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Users size={23} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Resumen
                </p>

                <h3 className="font-black text-slate-900">
                  Asientos seleccionados
                </h3>
              </div>
            </div>

            <div className="p-5">
              {seleccionados.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center">
                  <Armchair
                    size={35}
                    className="mx-auto text-emerald-300"
                  />

                  <p className="mt-3 text-sm font-bold text-slate-500">
                    Todavía no seleccionaste
                    ningún asiento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {seleccionados.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2 font-black text-amber-800">
                          <Check size={18} />
                          Asiento #
                          {item.numero}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onQuitar(
                              item.id,
                            )
                          }
                          disabled={
                            bloqueado
                          }
                          aria-label={`Quitar asiento ${item.numero}`}
                          className="text-amber-700 transition hover:text-red-600 disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Cantidad seleccionada
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <span className="text-4xl font-black text-emerald-800">
                    {seleccionados.length}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase text-emerald-700">
                    {seleccionados.length ===
                    1
                      ? "Asiento"
                      : "Asientos"}
                  </span>
                </div>

                <div className="mt-4 border-t border-emerald-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Precio unitario
                    </span>

                    <span className="font-black text-slate-800">
                      Bs.{" "}
                      {precioUnitario.toFixed(
                        2,
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-black text-slate-700">
                      Total
                    </span>

                    <span className="text-xl font-black text-emerald-700">
                      Bs. {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Info size={21} />
              </div>

              <div>
                <p className="font-black text-emerald-800">
                  Cómo seleccionar
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Presiona un asiento verde
                  para seleccionarlo. Vuelve a
                  presionarlo o utiliza la X
                  para quitarlo de la selección.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AsientoVisual({
  asiento,
  numeroEsperado,
  seleccionado,
  bloqueado,
  onSeleccionar,
}: {
  asiento?: AsientoViaje;
  numeroEsperado: number;
  seleccionado: boolean;
  bloqueado: boolean;
  onSeleccionar: (
    asiento: AsientoViaje,
  ) => void;
}) {
  if (!asiento) {
    return (
      <button
        type="button"
        disabled
        title="Asiento no registrado"
        className="relative h-14 rounded-xl border border-slate-200 bg-slate-100 font-black text-slate-300"
      >
        {numeroEsperado}
      </button>
    );
  }

  const reservadoTemporal =
    asientoReservadoTemporalmente(
      asiento,
    );

  const disponible =
    asientoDisponible(asiento);

  const ocupado =
    !disponible &&
    !reservadoTemporal;

  const noDisponible =
    ocupado ||
    reservadoTemporal;

  return (
    <button
      type="button"
      disabled={
        noDisponible || bloqueado
      }
      onClick={() =>
        onSeleccionar(asiento)
      }
      title={
        reservadoTemporal
          ? `Asiento ${asiento.numero} reservado temporalmente por un pasajero`
          : ocupado
          ? `Asiento ${asiento.numero} ocupado`
          : seleccionado
            ? `Quitar asiento ${asiento.numero}`
            : `Seleccionar asiento ${asiento.numero}`
      }
      className={`group relative h-14 rounded-xl border-2 font-black shadow-md transition disabled:cursor-not-allowed ${
        reservadoTemporal
          ? "border-orange-400 bg-orange-500 text-white ring-4 ring-orange-100"
          : ocupado
          ? "border-red-300 bg-red-400 text-white"
          : seleccionado
            ? "scale-[1.03] border-amber-500 bg-amber-400 text-amber-950 ring-4 ring-amber-100"
            : "border-emerald-400 bg-emerald-500 text-white hover:-translate-y-1 hover:bg-emerald-600 hover:shadow-lg"
      }`}
    >
      {/* BRAZOS DEL ASIENTO */}

      <span
        className={`absolute -left-1.5 top-3 h-8 w-2 rounded-l-md ${
          reservadoTemporal
            ? "bg-orange-700"
            : ocupado
            ? "bg-red-700"
            : seleccionado
              ? "bg-amber-700"
              : "bg-emerald-900"
        }`}
      />

      <span
        className={`absolute -right-1.5 top-3 h-8 w-2 rounded-r-md ${
          reservadoTemporal
            ? "bg-orange-700"
            : ocupado
            ? "bg-red-700"
            : seleccionado
              ? "bg-amber-700"
              : "bg-emerald-900"
        }`}
      />

      {/* BASE DEL ASIENTO */}

      <span
        className={`absolute -bottom-1.5 left-2 right-2 h-2 rounded-b-md ${
          reservadoTemporal
            ? "bg-orange-800"
            : ocupado
            ? "bg-red-800"
            : seleccionado
              ? "bg-amber-800"
              : "bg-slate-700"
        }`}
      />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {seleccionado && (
          <Check size={19} />
        )}

        {asiento.numero}
      </span>
    </button>
  );
}

function DatoVehiculo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 truncate text-xs font-black text-slate-900 sm:text-sm">
        {valor}
      </p>
    </div>
  );
}

function Seccion({
  numero,
  titulo,
  descripcion,
  activa,
  children,
}: {
  numero: number;
  titulo: string;
  descripcion: string;
  activa: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[26px] border bg-white shadow-[0_12px_35px_rgba(0,83,42,0.07)] transition ${
        activa
          ? "border-emerald-100"
          : "border-slate-100 opacity-50"
      }`}
    >
      <div
        className={`border-b px-5 py-5 md:px-7 ${
          activa
            ? "border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50"
            : "border-slate-100 bg-slate-50"
        }`}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black shadow-sm ${
              activa
                ? "bg-emerald-700 text-white"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {numero}
          </span>

          <div>
            <h2
              className={`text-xl font-black ${
                activa
                  ? "text-slate-900"
                  : "text-slate-400"
              }`}
            >
              {titulo}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {descripcion}
            </p>
          </div>
        </div>
      </div>

      {activa && (
        <div className="p-5 md:p-7">
          {children}
        </div>
      )}
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    valor: string,
  ) => void;
  placeholder: string;
  type?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  maxLength?: number;
  disabled?: boolean;
}) {
  const campoCompleto =
    value.trim().length > 0;

  return (
    <div>
      <label className="text-xs font-black uppercase tracking-wide text-slate-600">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          type={type}
          value={value}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border border-emerald-200 bg-slate-50 px-4 pr-11 font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
        />

        {campoCompleto && (
          <CheckCircle2
            size={19}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700"
          />
        )}
      </div>
    </div>
  );
}

function Metodo({
  activo,
  titulo,
  descripcion,
  icono,
  onClick,
  disabled,
}: {
  activo: boolean;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border p-6 text-left transition disabled:opacity-50 ${
        activo
          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md ring-4 ring-emerald-100"
          : "border-emerald-100 bg-white text-slate-500 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"
      }`}
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
          activo
            ? "bg-emerald-700 text-white"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {icono}
      </div>

      <p className="font-black text-slate-900">
        {titulo}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {descripcion}
      </p>
    </button>
  );
}

function Leyenda({
  color,
  texto,
}: {
  color: string;
  texto: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3.5 w-3.5 rounded-full shadow-sm ${color}`}
      />

      <span>{texto}</span>
    </div>
  );
}

function Resumen({
  titulo,
  valor,
  destacado = false,
}: {
  titulo: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        destacado
          ? "border-emerald-300 bg-emerald-50"
          : "border-emerald-100 bg-white"
      }`}
    >
      <p className="text-sm font-semibold text-slate-500">
        {titulo}
      </p>

      <p
        className={`mt-2 text-lg font-black ${
          destacado
            ? "text-emerald-700"
            : "text-slate-900"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function IndicadorPaso({
  numero,
  texto,
  activo,
  actual,
}: {
  numero: number;
  texto: string;
  activo: boolean;
  actual: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full font-black transition ${
          actual
            ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
            : activo
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {numero}
      </span>

      <span
        className={`text-sm font-bold ${
          actual
            ? "text-emerald-700"
            : activo
              ? "text-slate-700"
              : "text-slate-400"
        }`}
      >
        {texto}
      </span>
    </div>
  );
}

function LineaPaso({
  activa,
}: {
  activa: boolean;
}) {
  return (
    <div
      className={`h-1 min-w-8 flex-1 rounded-full ${
        activa
          ? "bg-emerald-600"
          : "bg-slate-200"
      }`}
    />
  );
}

function obtenerFechaActual(): string {
  const fecha = new Date();

  const anio =
    fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate(),
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerOperadorLocal(): {
  id?: string;
} {
  try {
    const texto =
      localStorage.getItem("usuario");

    if (!texto) {
      return {};
    }

    const usuario: unknown =
      JSON.parse(texto);

    if (
      !usuario ||
      typeof usuario !== "object"
    ) {
      return {};
    }

    return usuario as {
      id?: string;
    };
  } catch {
    return {};
  }
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

function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const respuestaError =
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];
          };
        };
      };

    const respuesta =
      respuestaError.response?.data
        ?.message;

    if (Array.isArray(respuesta)) {
      return respuesta.join(", ");
    }

    if (
      typeof respuesta === "string" &&
      respuesta.trim()
    ) {
      return respuesta;
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return mensajePredeterminado;
}

export default VentaSectorFlota;
