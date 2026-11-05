import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BusFront,
  CalendarDays,
  CheckCircle2,
  Home,
  LogOut,
  Ticket,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BusquedaViaje from "../../components/compra/BusquedaViaje";
import CompraSteps from "../../components/compra/CompraSteps";
import ModoCompraReserva from "../../components/compra/ModoCompraReserva";
import OpcionRecojo from "../../components/compra/OpcionRecojo";
import SectorRapidoCompra from "../../components/compra/SectorRapidoCompra";

import SectorTransporte, {
  type SectorTransporteTipo,
} from "../../components/compra/SectorTransporte";

import useCompraReservar from "../../hooks/compra/useCompraReservar";

import type {
  TurnoSalidaRapida,
} from "../../services/salidas-rapidas.service";

import type {
  VehiculoDisponible,
} from "../../services/viajes.service";

import {
  obtenerFechaActual,
} from "../../utils/compra/compra.utils";

const HorariosSalida = lazy(
  () =>
    import(
      "../../components/compra/HorariosSalida"
    ),
);

const RutaBanner = lazy(
  () =>
    import(
      "../../components/compra/RutaBanner"
    ),
);

const SeatMap = lazy(
  () =>
    import(
      "../../components/compra/SeatMap"
    ),
);

const ResumenCompra = lazy(
  () =>
    import(
      "../../components/compra/ResumenCompra"
    ),
);

const ResumenReservaPendiente = lazy(
  () =>
    import(
      "../../components/compra/ResumenReservaPendiente"
    ),
);

const PagoQR = lazy(
  () =>
    import(
      "../../components/compra/PagoQR"
    ),
);

/**
 * Selección recibida desde el Dashboard del pasajero.
 * Se valida antes de usarla para evitar seleccionar viajes de otro sector.
 */
type SeleccionDashboard = {
  sector: "FLOTA" | "RAPIDO";
  rutaId: string;
  fecha: string;
  horaSalida: string;
  viajeId: string;
  vehiculoId: string;
};

function leerSeleccionDashboard(valor: unknown): SeleccionDashboard | null {
  if (!valor || typeof valor !== "object") return null;
  const dato = valor as Record<string, unknown>;
  if (dato.sector !== "FLOTA" && dato.sector !== "RAPIDO") return null;

  // Ruta y fecha bastan para ir directamente a las salidas.
  if (typeof dato.rutaId !== "string" || !dato.rutaId.trim()) return null;
  if (typeof dato.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dato.fecha)) return null;

  return {
    sector: dato.sector,
    rutaId: dato.rutaId,
    fecha: dato.fecha,
    horaSalida: typeof dato.horaSalida === "string" ? dato.horaSalida : "",
    viajeId: typeof dato.viajeId === "string" ? dato.viajeId : "",
    vehiculoId: typeof dato.vehiculoId === "string" ? dato.vehiculoId : "",
  };
}

/**
 * Recupera la selección incluso si React Router pierde location.state.
 * Ejemplo: ?sector=FLOTA&rutaId=...&fecha=2026-11-05&horaSalida=18:00
 */
function leerSeleccionDesdeURL(busqueda: string): SeleccionDashboard | null {
  const params = new URLSearchParams(busqueda);
  const datos = {
    sector: params.get("sector"),
    rutaId: params.get("rutaId"),
    fecha: params.get("fecha"),
    horaSalida: params.get("horaSalida"),
    viajeId: params.get("viajeId"),
    vehiculoId: params.get("vehiculoId"),
  };
  return leerSeleccionDashboard(datos);
}

function ComprarReservar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Se lee una sola vez: el pago y el mapa de asientos no reinician la selección.
  const seleccionInicialRef = useRef<SeleccionDashboard | null>(
    leerSeleccionDashboard(location.state) ?? leerSeleccionDesdeURL(location.search),
  );
  const seleccionAplicadaRef = useRef(false);
  const seleccionFlotaPendienteRef = useRef<SeleccionDashboard | null>(null);
  // Se usa solamente para el desplazamiento inicial desde el Dashboard.
  const irDirectoAHorariosRef = useRef(Boolean(seleccionInicialRef.current));


  const seccionResultadoPagoRef =
    useRef<HTMLDivElement | null>(null);

  const seccionBusquedaRef =
    useRef<HTMLDivElement | null>(null);

  const seccionHorariosRef =
    useRef<HTMLDivElement | null>(null);

  const seccionAsientosRef =
    useRef<HTMLElement | null>(null);

  const seccionResumenRef =
    useRef<HTMLElement | null>(null);

  // Solo desplazar automáticamente cuando el pasajero
  // selecciona un vehículo; no al cargar la página.
  const esperandoAsientosRef = useRef(false);

  const desplazarA = (
    elemento: HTMLElement | null,
  ) => {
    if (!elemento) return;

    // Respetar la preferencia de movimiento reducido.
    const reducirMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    elemento.scrollIntoView({
      behavior: reducirMovimiento ? "auto" : "smooth",
      block: "start",
    });
  };

  const [
    sectorTransporte,
    setSectorTransporte,
  ] = useState<SectorTransporteTipo>(
    seleccionInicialRef.current?.sector ?? "FLOTA",
  );

  const {
    usuario,
    pasajero,

    paso,
    setPaso,

    modoOperacion,
    cambiarModoOperacion,

    mensaje,
    exito,

    reservando,
    bloqueado,

    confirmarReservaTemporal,

    guardarTicket,
    descargarTicket,
    compartirPorWhatsApp,
    cerrarSesion,

    compraViaje,
    pago,
  } = useCompraReservar();

  const {
    rutas,
    rutaId,
    fecha,
    horarios,
    horarioSeleccionado,
    vehiculoSeleccionado,
    viaje,
    asientos,
    asientosSeleccionados,

    cargandoRutas,
    cargandoViajes,
    cargandoAsientos,

    cantidadAsientos,
    precioUnitario,
    total,

    cambiarRuta,
    cambiarFecha,
    seleccionarHorario,
    seleccionarVehiculo,
    seleccionarAsiento,
    limpiarSeleccionViaje,
  } = compraViaje;

  const {
    mostrarQR,
    confirmando,
    compraConfirmada,
    estadoPago,
    motivoRechazo,
    referenciaPago,
    ticketAprobado,

    pagarPorQR,
    enviarComprobante,
    reintentarPago,
  } = pago;

  /*
   * Lleva al pasajero al resultado cuando
   * el pago sea aprobado o rechazado.
   */
  useEffect(() => {
    if (
      !mostrarQR ||
      (
        !compraConfirmada &&
        estadoPago !== "RECHAZADO"
      )
    ) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        seccionResultadoPagoRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

    return () =>
      window.clearTimeout(
        temporizador,
      );
  }, [
    compraConfirmada,
    estadoPago,
    mostrarQR,
  ]);

  // Esperar a que el mapa esté disponible antes de
  // desplazar la pantalla tras elegir un vehículo.
  useEffect(() => {
    if (
      !esperandoAsientosRef.current ||
      !viaje ||
      cargandoAsientos
    ) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      if (!esperandoAsientosRef.current) return;
      esperandoAsientosRef.current = false;
      desplazarA(seccionAsientosRef.current);
    }, 200);

    return () => window.clearTimeout(temporizador);
  }, [viaje, cargandoAsientos]);

  // El sector Flotas solamente debe listar viajes de vehículos FLOTA.
  // Se recalcula la cantidad de vehículos visible en cada horario.
  const horariosFlotas = useMemo(
    () =>
      horarios
        .map((horario) => {
          const vehiculos = horario.vehiculos.filter(
            (vehiculo) =>
              vehiculo.tipo?.trim().toUpperCase() === "FLOTA",
          );

          return {
            ...horario,
            cantidadVehiculos: vehiculos.length,
            vehiculos,
          };
        })
        .filter((horario) => horario.vehiculos.length > 0),
    [horarios],
  );

  const seleccionarVehiculoYAvanzar = async (
    vehiculoDisponible: VehiculoDisponible,
    horaSalida: string,
  ) => {
    esperandoAsientosRef.current = true;
    try {
      await seleccionarVehiculo(vehiculoDisponible, horaSalida);
    } catch (error) {
      esperandoAsientosRef.current = false;
      throw error;
    }
  };

  /**
   * DASHBOARD -> COMPRAR / RESERVAR.
   * Si ya se seleccionó una salida en Inicio, NO pedir de nuevo ruta
   * ni fecha: se completan los campos y se abren los horarios del sector.
   * No se seleccionan asientos ni se genera pago automáticamente.
   */
  useEffect(() => {
    if (seleccionAplicadaRef.current) return;
    seleccionAplicadaRef.current = true;
    const seleccion = seleccionInicialRef.current;
    if (!seleccion) return;

    compraViaje.setRutaId(seleccion.rutaId);
    compraViaje.setFecha(seleccion.fecha);
    setSectorTransporte(seleccion.sector);
    setPaso(2);

    if (seleccion.sector === "FLOTA") {
      seleccionFlotaPendienteRef.current = seleccion;
      // Solicita las horas reales de esa ruta y fecha al backend.
      void compraViaje.cargarSalidasAutomatico(
        seleccion.rutaId,
        seleccion.fecha,
      );
    }
    // Para RAPIDO, SectorRapidoCompra consulta automáticamente
    // los turnos cuando recibe rutaId y fecha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Una vez que llegan los horarios de Flotas, se marca únicamente
   * la hora publicada. El pasajero conserva la libertad de elegir
   * el vehículo, asientos y modalidad de compra.
   */
  useEffect(() => {
    const seleccion = seleccionFlotaPendienteRef.current;
    if (!seleccion || cargandoViajes) return;

    if (horariosFlotas.length > 0) {
      // Un mismo horario puede tener varias flotas; mostrar todas.
      const horario = horariosFlotas.find(
        (item) => item.horaSalida.substring(0, 5) === seleccion.horaSalida.substring(0, 5),
      );
      seleccionFlotaPendienteRef.current = null;
      if (horario && seleccion.horaSalida) {
        seleccionarHorario(horario.horaSalida);
      }
    }
    // Si una salida no está publicada, permanece el horario vacío;
    // no se elige un vehículo diferente por error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horariosFlotas, cargandoViajes]);

  /**
   * Desplazamiento tras preparar el sector seleccionado.
   * La ruta/fecha quedan arriba como datos editables, pero el
   * pasajero ve directamente las salidas, sin desplazamiento largo.
   */
  useEffect(() => {
    if (!irDirectoAHorariosRef.current) return;
    const seleccion = seleccionInicialRef.current;
    if (!seleccion || !rutaId || !fecha) return;
    if (seleccion.sector === "FLOTA" && cargandoViajes) return;

    const temporizador = window.setTimeout(() => {
      if (!irDirectoAHorariosRef.current) return;
      irDirectoAHorariosRef.current = false;
      desplazarA(seccionHorariosRef.current);
    }, seleccion.sector === "RAPIDO" ? 400 : 260);

    return () => window.clearTimeout(temporizador);
  }, [rutaId, fecha, sectorTransporte, cargandoViajes]);

  const cambiarSectorTransporte = (
    nuevoSector: SectorTransporteTipo,
  ) => {
    if (
      bloqueado ||
      nuevoSector === sectorTransporte
    ) {
      return;
    }

    esperandoAsientosRef.current = false;
    seleccionFlotaPendienteRef.current = null;
    seleccionInicialRef.current = null;
    irDirectoAHorariosRef.current = false;
    // El cambio manual del sector elimina los parámetros anteriores.
    if (location.search) {
      navigate("/pasajero/comprar-reservar", { replace: true });
    }
    limpiarSeleccionViaje();
    setSectorTransporte(nuevoSector);
    window.setTimeout(() => {
      desplazarA(seccionBusquedaRef.current);
    }, 180);
  };

  const seleccionarTurnoRapido =
    async (
      turno: TurnoSalidaRapida,
    ) => {
      // Evitar seleccionar una flota desde Noah/Hiace.
      const tipoTurno = String(turno.vehiculo.tipo).toUpperCase();
      if (tipoTurno !== "NOAH" && tipoTurno !== "HIACE") {
        return;
      }

      const vehiculoDisponible:
        VehiculoDisponible = {
          viajeId:
            turno.viaje.id,

          vehiculoId:
            turno.vehiculo.id,

          placa:
            turno.vehiculo.placa,

          marca:
            turno.vehiculo.marca,

          modelo:
            turno.vehiculo.modelo,

          tipo:
            turno.vehiculo.tipo,

          capacidad:
            turno.vehiculo.capacidad,

          precio:
            Number(
              turno.viaje.precio,
            ),

          asientosDisponibles:
            turno.ocupacion.disponibles,

          estadoViaje:
            "PROGRAMADO",

          estadoVehiculo:
            true,

          numeroFlota: turno.vehiculo.numeroFlota ?? null,

          // Priorizar el chofer asignado a esta salida.
          chofer: turno.chofer
            ? {
                id: turno.chofer.id,
                nombre: turno.chofer.nombre,
                apellido: turno.chofer.apellido,
                codigo: (turno.chofer as typeof turno.chofer & {
                  codigo?: string | null;
                }).codigo ?? null,
              }
            : null,
        };

      await seleccionarVehiculoYAvanzar(
        vehiculoDisponible,
        turno.viaje.horaSalida,
      );
    };

  return (
    <div className="relative isolate min-h-screen w-full max-w-full overflow-x-clip bg-[#f2f8f4] text-slate-900">
      {/* NAVEGACIÓN */}

      <nav className="sticky top-0 z-50 isolate overflow-hidden border-b border-lime-400/80 bg-gradient-to-r from-[#005c2e] via-[#00743a] to-[#008844] px-3 py-2 sm:px-5 sm:py-4 text-white shadow-xl shadow-emerald-950/10 backdrop-blur-xl lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-radial-gradient(ellipse at 18% 10%, rgba(255,255,255,.22) 0, rgba(255,255,255,.22) 1px, transparent 2px, transparent 18px)",
          }}
        />

        <svg
          aria-hidden="true"
          viewBox="0 0 480 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute right-0 top-0 h-full w-[360px] opacity-25"
        >
          <path
            d="M270 -20 C315 25 285 75 350 140"
            fill="none"
            stroke="#bef264"
            strokeWidth="15"
          />

          <path
            d="M320 -20 C365 25 335 75 400 140"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="12"
          />

          <path
            d="M370 -20 C415 25 385 75 450 140"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
          />
        </svg>

        <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-2 sm:gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm sm:h-14 sm:w-14 sm:rounded-2xl">
              <BusFront size={25} />
            </div>

            <div>
              <h1 className="text-base font-black tracking-tight sm:text-xl">
                Trans 2 de Junio
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100 sm:text-xs">
                Sistema de pasajes
              </p>
            </div>
          </div>

          <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 text-xs font-semibold text-emerald-50 sm:flex-wrap sm:gap-3 sm:pb-0 sm:text-base xl:w-auto">
            <Link
              to="/pasajero"
              className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 transition hover:bg-white/15 hover:text-white sm:gap-2 sm:px-4 sm:py-3"
            >
              <Home size={18} />
              Inicio
            </Link>

            <span className="flex shrink-0 items-center gap-1 rounded-xl border border-white/30 bg-white px-2.5 py-2 font-black text-emerald-800 shadow-lg sm:gap-2 sm:px-5 sm:py-3">
              <Ticket size={18} />
              Comprar / Reservar
            </span>

            <Link
              to="/pasajero/mis-reservas"
              className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 transition hover:bg-white/15 hover:text-white sm:gap-2 sm:px-4 sm:py-3"
            >
              <CalendarDays size={18} />
              Mis Tickets
            </Link>

            <span className="hidden max-w-[190px] truncate rounded-xl bg-black/10 px-4 py-3 text-sm text-emerald-50 md:block">
              {usuario.email || "pasajero"}
            </span>

            <button
              type="button"
              onClick={cerrarSesion}
              className="flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 transition hover:bg-red-500/20 hover:text-red-100 sm:gap-2 sm:px-4 sm:py-3"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>
      </nav>

      <FondoCompraDecorativo />

      <main className="relative z-10 mx-auto max-w-[1500px] px-3 py-4 sm:px-7 sm:py-8 lg:px-10">
        {/* ENCABEZADO */}

        <header className="relative mb-4 overflow-hidden rounded-2xl sm:mb-8 sm:rounded-[28px] bg-gradient-to-r from-[#006331] via-[#007a3d] to-[#009149] px-4 py-5 text-white shadow-xl shadow-emerald-900/15 sm:px-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[40px] border-white/5" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-96 rotate-[-8deg] rounded-[50%] bg-lime-300/10" />

          <div className="pointer-events-none absolute right-8 top-7 grid grid-cols-5 gap-2 opacity-35">
            {Array.from({
              length: 25,
            }).map(
              (_, indice) => (
                <span
                  key={indice}
                  className="h-1.5 w-1.5 rounded-full bg-lime-200"
                />
              ),
            )}
          </div>

          <span className="pointer-events-none absolute right-[28%] top-4 text-3xl text-lime-300/80">
            ✦
          </span>

          <span className="pointer-events-none absolute bottom-5 right-[17%] text-4xl text-lime-200/80">
            ✦
          </span>

          <div className="relative z-10 flex items-center gap-4">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm sm:flex">
              <Ticket size={31} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                Reserva tu próximo viaje
              </p>

              <h2 className="mt-2 text-xl font-black tracking-tight sm:text-4xl">
                Comprar o Reservar Pasaje
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
                Selecciona el sector, ruta, fecha,
                vehículo y uno o varios asientos.
              </p>
            </div>
          </div>
        </header>

        {/* INDICADOR DE PASOS */}

        <CompraSteps paso={paso} />

        {/* SECTOR DE TRANSPORTE */}

        <SectorTransporte
          valor={sectorTransporte}
          bloqueado={bloqueado}
          onCambiar={
            cambiarSectorTransporte
          }
        />

        {/* MODALIDAD */}

        <ModoCompraReserva
          valor={modoOperacion}
          bloqueado={bloqueado}
          onCambiar={
            cambiarModoOperacion
          }
        />

        {/* MENSAJES */}

        {mensaje && (
          <div
            role="alert"
            className={`mt-6 rounded-2xl border p-4 font-bold shadow-sm ${
              exito
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3">
              {exito ? (
                <CheckCircle2
                  size={22}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-red-500" />
              )}

              <span className="leading-6">
                {mensaje}
              </span>
            </div>
          </div>
        )}

        {/* RUTA Y FECHA */}

        {seleccionInicialRef.current && (
          <div className="mt-5 flex min-w-0 items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-semibold text-emerald-900 sm:text-sm">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-700" />
            <span>
              Ya elegiste una salida desde Inicio. La ruta y la fecha se
              completaron automáticamente; continúa con el horario y los
              asientos disponibles. Puedes cambiarlas si deseas.
            </span>
          </div>
        )}

        <div ref={seccionBusquedaRef} className="scroll-mt-32 sm:scroll-mt-40">
          <BusquedaViaje
          rutas={rutas}
          rutaId={rutaId}
          fecha={fecha}
          fechaMinima={
            obtenerFechaActual()
          }
          cargandoRutas={
            cargandoRutas
          }
          bloqueado={bloqueado}
          onCambiarRuta={(nuevoId) => {
            esperandoAsientosRef.current = false;
            seleccionInicialRef.current = null;
            seleccionFlotaPendienteRef.current = null;
            irDirectoAHorariosRef.current = false;
            if (location.search) navigate("/pasajero/comprar-reservar", { replace: true });
            cambiarRuta(nuevoId);
            // Ruta y fecha comparten formulario: mantenerlo visible.
            window.setTimeout(() => {
              desplazarA(seccionBusquedaRef.current);
            }, 120);
          }}
          onCambiarFecha={(nuevaFecha) => {
            esperandoAsientosRef.current = false;
            seleccionInicialRef.current = null;
            seleccionFlotaPendienteRef.current = null;
            irDirectoAHorariosRef.current = false;
            if (location.search) navigate("/pasajero/comprar-reservar", { replace: true });
            cambiarFecha(nuevaFecha);
            // Al definir la fecha, mostrar horarios/vehículos.
            window.setTimeout(() => {
              desplazarA(seccionHorariosRef.current);
            }, 240);
          }}
          />
        </div>

        {/* SECTOR FLOTAS */}
        <div ref={seccionHorariosRef} className="scroll-mt-32 sm:scroll-mt-40">

        {sectorTransporte ===
          "FLOTA" && (
          <Suspense
            fallback={
              <CargandoComponente mensaje="Cargando horarios disponibles..." />
            }
          >
            <HorariosSalida
              sector="FLOTA"
              horarios={horariosFlotas}
              horarioSeleccionado={
                horarioSeleccionado
              }
              vehiculoSeleccionadoId={
                vehiculoSeleccionado
                  ?.viajeId
              }
              cargando={
                cargandoViajes
              }
              bloqueado={bloqueado}
              onSeleccionarHorario={(horario) => {
                // HorariosSalida gestiona el desplazamiento a vehículos.
                seleccionarHorario(horario);
              }}
              onSeleccionarVehiculo={(
                vehiculoDisponible,
                horaSalida,
              ) => {
                if (
                  String(vehiculoDisponible.tipo).toUpperCase() !== "FLOTA"
                ) return;
                void seleccionarVehiculoYAvanzar(
                  vehiculoDisponible,
                  horaSalida,
                );
              }}
            />
          </Suspense>
        )}

        {/* SECTOR NOAH Y HIACE */}

        {sectorTransporte ===
          "RAPIDO" && (
          <SectorRapidoCompra
            rutaId={rutaId}
            fecha={fecha}
            bloqueado={bloqueado}
            onElegirFlota={() =>
              cambiarSectorTransporte(
                "FLOTA",
              )
            }
            onDisponibilidadSuspendida={
              limpiarSeleccionViaje
            }
            onSeleccionar={(
              turno,
            ) =>
              void seleccionarTurnoRapido(
                turno,
              )
            }
          />
        )}

        </div>

        {/* INFORMACIÓN DEL VIAJE */}

        {viaje && (
          <div className="mt-6">
            <Suspense
              fallback={
                <CargandoComponente mensaje="Cargando información del viaje..." />
              }
            >
              <RutaBanner
                viaje={viaje}
              />
            </Suspense>
          </div>
        )}

        {/* MAPA DE ASIENTOS */}

        {paso >= 3 && viaje && (
          <section ref={seccionAsientosRef} className="mt-4 scroll-mt-32 sm:mt-6 sm:scroll-mt-40">
            {cargandoAsientos ? (
              <CargandoComponente mensaje="Cargando mapa de asientos..." />
            ) : (
              <Suspense
                fallback={
                  <CargandoComponente mensaje="Preparando mapa de asientos..." />
                }
              >
                <SeatMap
                  vehiculo={
                    viaje.vehiculo
                  }
                  asientos={
                    asientos
                  }
                  seleccionados={asientosSeleccionados.map(
                    ({ id }) => id,
                  )}
                  bloqueado={
                    bloqueado
                  }
                  onSeleccionar={
                    seleccionarAsiento
                  }
                />
              </Suspense>
            )}
            {cantidadAsientos > 0 && !bloqueado && !mostrarQR && (
              <button
                type="button"
                onClick={() => desplazarA(seccionResumenRef.current)}
                className="sticky bottom-3 z-20 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/20 hover:bg-emerald-800 sm:static sm:text-base"
              >
                Continuar con {cantidadAsientos} {cantidadAsientos === 1 ? "asiento" : "asientos"}
                <CheckCircle2 size={20} />
              </button>
            )}
          </section>
        )}

        {/* LUGAR DE RECOJO PARA NOAH Y HIACE */}

        {sectorTransporte ===
          "RAPIDO" &&
          paso >= 4 &&
          viaje &&
          cantidadAsientos > 0 && (
            <div className="mt-6">
              <OpcionRecojo
                usuarioId={
                  usuario.id || ""
                }
                viajeId={viaje.id}
              />
            </div>
          )}

        {/* RESUMEN, PAGO O RESERVA */}

        {paso >= 4 &&
          viaje &&
          (
            cantidadAsientos > 0 ||
            (
              modoOperacion ===
                "COMPRA" &&
              mostrarQR
            )
          ) && (
            <section ref={seccionResumenRef} className="mt-4 scroll-mt-32 space-y-4 sm:mt-6 sm:scroll-mt-40 sm:space-y-6">
              {modoOperacion ===
              "COMPRA" ? (
                <>
                  <Suspense
                    fallback={
                      <CargandoComponente mensaje="Preparando resumen de compra..." />
                    }
                  >
                    <ResumenCompra
                      pasajero={
                        pasajero
                      }
                      origen={
                        viaje.ruta
                          ?.origen
                      }
                      destino={
                        viaje.ruta
                          ?.destino
                      }
                      fecha={
                        fecha ||
                        viaje.fecha
                      }
                      hora={
                        viaje.horaSalida
                      }
                      asientos={
                        asientosSeleccionados
                      }
                      precioUnitario={
                        precioUnitario
                      }
                      deshabilitado={
                        bloqueado
                      }
                      onGenerarPagoQR={
                        pagarPorQR
                      }
                    />
                  </Suspense>

                  {mostrarQR && (
                    <div
                      ref={seccionResultadoPagoRef}
                      className="scroll-mt-28"
                    >
                      <Suspense
                        fallback={
                          <CargandoComponente mensaje="Preparando pago por QR..." />
                        }
                      >
                        <PagoQR
                        mostrar={
                          mostrarQR
                        }
                        total={total}
                        confirmando={
                          confirmando
                        }
                        compraConfirmada={
                          compraConfirmada
                        }
                        estadoPago={
                          estadoPago
                        }
                        motivoRechazo={
                          motivoRechazo
                        }
                        referenciaPago={
                          referenciaPago
                        }
                        ticket={
                          ticketAprobado
                        }
                        onReintentarPago={
                          reintentarPago
                        }
                        onVolverInicio={() =>
                          navigate(
                            "/pasajero",
                          )
                        }
                        onVerMisTickets={() =>
                          navigate(
                            "/pasajero/mis-reservas",
                          )
                        }
                        onGuardarTicket={
                          guardarTicket
                        }
                        onDescargarTicket={() =>
                          void descargarTicket()
                        }
                        onCompartirWhatsApp={() =>
                          void compartirPorWhatsApp()
                        }
                        onConfirmarCompra={
                          enviarComprobante
                        }
                        />
                      </Suspense>
                    </div>
                  )}
                </>
              ) : (
                <Suspense
                  fallback={
                    <CargandoComponente mensaje="Preparando resumen de reserva..." />
                  }
                >
                  <ResumenReservaPendiente
                    origen={
                      viaje.ruta
                        ?.origen
                    }
                    destino={
                      viaje.ruta
                        ?.destino
                    }
                    fecha={
                      fecha ||
                      viaje.fecha
                    }
                    hora={
                      viaje.horaSalida
                    }
                    numerosAsientos={asientosSeleccionados.map(
                      ({ numero }) =>
                        numero,
                    )}
                    total={total}
                    guardando={
                      reservando
                    }
                    onReservar={() =>
                      void confirmarReservaTemporal()
                    }
                  />
                </Suspense>
              )}
            </section>
          )}

        {/* PIE INFORMATIVO */}

        <footer className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[24px] border border-emerald-100 bg-white px-6 py-5 text-center shadow-sm sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BusFront size={23} />
            </div>

            <div>
              <p className="text-sm font-black text-emerald-800">
                Trans 2 de Junio
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Sistema de venta y reserva
                de pasajes
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Tu información se encuentra
            protegida.
          </p>
        </footer>
      </main>
    </div>
  );
}

function CargandoComponente({
  mensaje,
}: {
  mensaje: string;
}) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-[28px] border border-emerald-100 bg-white p-7 shadow-lg shadow-emerald-900/5">
      <div className="text-center">
        <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

        <p className="mt-4 font-black text-emerald-800">
          {mensaje}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Espere un momento.
        </p>
      </div>
    </div>
  );
}

function FondoCompraDecorativo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(167,243,208,0.15),transparent_24%),radial-gradient(circle_at_88%_38%,rgba(190,242,100,0.12),transparent_28%)]" />

      <svg
        viewBox="0 0 300 900"
        className="absolute left-0 top-40 hidden h-[900px] w-[260px] opacity-[0.10] xl:block"
        fill="none"
      >
        <path
          d="M18 0V110Q18 140 48 140H112Q142 140 142 170V255Q142 285 172 285H292"
          stroke="#047857"
          strokeWidth="3"
        />

        <path
          d="M0 360H68Q98 360 98 390V500Q98 530 128 530H260Q290 530 290 560V650"
          stroke="#10b981"
          strokeWidth="3"
        />

        <path
          d="M34 900V790Q34 760 64 760H155Q185 760 185 730V680"
          stroke="#65a30d"
          strokeWidth="3"
        />

        {[
          [18, 72],
          [142, 212],
          [236, 285],
          [68, 360],
          [98, 462],
          [220, 530],
          [34, 820],
          [185, 710],
        ].map(
          ([cx, cy], indice) => (
            <circle
              key={indice}
              cx={cx}
              cy={cy}
              r="7"
              fill="#f2f8f4"
              stroke="#059669"
              strokeWidth="3"
            />
          ),
        )}
      </svg>

      <svg
        viewBox="0 0 620 1500"
        preserveAspectRatio="none"
        className="absolute -right-44 top-24 hidden h-[1550px] w-[590px] xl:block"
        fill="none"
      >
        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#d9f99d"
          strokeWidth="128"
          opacity="0.75"
        />

        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#ffffff"
          strokeWidth="104"
        />

        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#a3e635"
          strokeWidth="88"
        />

        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#ffffff"
          strokeWidth="70"
        />

        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#10b981"
          strokeWidth="56"
        />

        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#ffffff"
          strokeWidth="38"
        />

        <path
          d="M485 -120C145 250 625 500 315 835C120 1045 535 1210 300 1580"
          stroke="#065f46"
          strokeWidth="25"
        />
      </svg>
    </div>
  );
}

export default ComprarReservar;