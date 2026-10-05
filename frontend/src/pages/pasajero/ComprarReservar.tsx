import {
  lazy,
  Suspense,
  useEffect,
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

function ComprarReservar() {
  const navigate = useNavigate();

  const seccionResultadoPagoRef =
    useRef<HTMLDivElement | null>(null);

  const [
    sectorTransporte,
    setSectorTransporte,
  ] = useState<SectorTransporteTipo>(
    "FLOTA",
  );

  const {
    usuario,
    pasajero,

    paso,

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

  const cambiarSectorTransporte = (
    nuevoSector: SectorTransporteTipo,
  ) => {
    if (
      bloqueado ||
      nuevoSector === sectorTransporte
    ) {
      return;
    }

    limpiarSeleccionViaje();
    setSectorTransporte(nuevoSector);
  };

  const seleccionarTurnoRapido =
    async (
      turno: TurnoSalidaRapida,
    ) => {
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
        };

      await seleccionarVehiculo(
        vehiculoDisponible,
        turno.viaje.horaSalida,
      );
    };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f2f8f4] text-slate-900">
      {/* NAVEGACIÓN */}

      <nav className="sticky top-0 z-50 isolate overflow-hidden border-b border-lime-400/80 bg-gradient-to-r from-[#005c2e] via-[#00743a] to-[#008844] px-5 py-4 text-white shadow-xl shadow-emerald-950/10 backdrop-blur-xl lg:px-10">
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

        <div className="relative z-10 mx-auto flex max-w-[1500px] flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm">
              <BusFront size={29} />
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight">
                Trans 2 de Junio
              </h1>

              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                Sistema de pasajes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-semibold text-emerald-50 sm:gap-3">
            <Link
              to="/pasajero"
              className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-white/15 hover:text-white"
            >
              <Home size={18} />
              Inicio
            </Link>

            <span className="flex items-center gap-2 rounded-xl border border-white/30 bg-white px-5 py-3 font-black text-emerald-800 shadow-lg">
              <Ticket size={18} />
              Comprar / Reservar
            </span>

            <Link
              to="/pasajero/mis-reservas"
              className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-white/15 hover:text-white"
            >
              <CalendarDays size={18} />
              Mis Tickets
            </Link>

            <span className="max-w-[190px] truncate rounded-xl bg-black/10 px-4 py-3 text-sm text-emerald-50">
              {usuario.email || "pasajero"}
            </span>

            <button
              type="button"
              onClick={cerrarSesion}
              className="flex items-center gap-2 rounded-xl px-4 py-3 transition hover:bg-red-500/20 hover:text-red-100"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </div>
      </nav>

      <FondoCompraDecorativo />

      <main className="relative z-10 mx-auto max-w-[1500px] px-5 py-8 sm:px-7 lg:px-10">
        {/* ENCABEZADO */}

        <header className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#006331] via-[#007a3d] to-[#009149] px-6 py-8 text-white shadow-xl shadow-emerald-900/15 sm:px-9">
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

              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
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
          onCambiarRuta={
            cambiarRuta
          }
          onCambiarFecha={
            cambiarFecha
          }
        />

        {/* SECTOR FLOTAS */}

        {sectorTransporte ===
          "FLOTA" && (
          <Suspense
            fallback={
              <CargandoComponente mensaje="Cargando horarios disponibles..." />
            }
          >
            <HorariosSalida
              horarios={horarios}
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
              onSeleccionarHorario={
                seleccionarHorario
              }
              onSeleccionarVehiculo={(
                vehiculoDisponible,
                horaSalida,
              ) =>
                void seleccionarVehiculo(
                  vehiculoDisponible,
                  horaSalida,
                )
              }
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
          <section className="mt-6">
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
            <section className="mt-6 space-y-6">
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