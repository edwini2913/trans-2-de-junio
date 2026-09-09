import {
  Banknote,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  QrCode,
  RefreshCw,
  TicketCheck,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import SeatMap, {
  type AsientoCompra,
} from "../compra/SeatMap";
import TicketVentaOficina from "../TicketVentaOficina";
import PagoQROficina from "./PagoQROficina";

import {
  bloquearAsiento,
  liberarAsiento,
  obtenerAsientosPorViaje,
  type AsientoViaje,
} from "../../services/asientos.service";

import {
  obtenerRutas,
} from "../../services/rutas.service";

import {
  obtenerAvisoSalidaActivo,
  obtenerFilaSalida,
  type AvisoSalidaRapida,
  type TurnoSalidaRapida,
} from "../../services/salidas-rapidas.service";

import {
  crearVentaOficina,
  type MetodoPago,
} from "../../services/ventas.service";

type Ruta = {
  id: string;
  origen: string;
  destino: string;
};

type ResultadoVenta = Record<string, unknown>;

function fechaLocalActual(): string {
  const fecha = new Date();
  const compensacion =
    fecha.getTimezoneOffset() * 60_000;

  return new Date(
    fecha.getTime() - compensacion,
  )
    .toISOString()
    .slice(0, 10);
}

function obtenerOperadorId(): string {
  try {
    const texto =
      localStorage.getItem("usuario");

    if (!texto) {
      return "";
    }

    const usuario = JSON.parse(texto) as {
      id?: string;
    };

    return usuario.id || "";
  } catch {
    return "";
  }
}

function obtenerError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const mensaje = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(", ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

export default function VentaSectorRapido() {
  const operadorId = useMemo(
    () => obtenerOperadorId(),
    [],
  );

  const [rutas, setRutas] =
    useState<Ruta[]>([]);
  const [rutaId, setRutaId] =
    useState("");
  const [fecha, setFecha] =
    useState(fechaLocalActual());

  const [fila, setFila] =
    useState<TurnoSalidaRapida[]>([]);
  const [turno, setTurno] =
    useState<TurnoSalidaRapida | null>(null);
  const [asientos, setAsientos] =
    useState<AsientoViaje[]>([]);
  const [seleccionados, setSeleccionados] =
    useState<AsientoViaje[]>([]);

  const seleccionadosRef =
    useRef<AsientoViaje[]>([]);
  const turnoRef =
    useRef<TurnoSalidaRapida | null>(null);
  const operandoRef =
    useRef<Set<string>>(new Set());

  const [nombre, setNombre] =
    useState("");
  const [ci, setCi] =
    useState("");
  const [telefono, setTelefono] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [metodoPago, setMetodoPago] =
    useState<MetodoPago>("EFECTIVO");

  const [aviso, setAviso] =
    useState<AvisoSalidaRapida | null>(null);
  const [aceptaServicioParcial, setAceptaServicioParcial] =
    useState(false);

  const [cargando, setCargando] =
    useState(true);
  const [procesando, setProcesando] =
    useState(false);
  const [mensaje, setMensaje] =
    useState("");
  const [esError, setEsError] =
    useState(false);
  const [ventaFinal, setVentaFinal] =
    useState<ResultadoVenta | null>(null);
  const [asientosVendidos, setAsientosVendidos] =
    useState<AsientoViaje[]>([]);

  useEffect(() => {
    seleccionadosRef.current = seleccionados;
  }, [seleccionados]);

  useEffect(() => {
    turnoRef.current = turno;
  }, [turno]);

  const liberarSeleccion =
    useCallback(async () => {
      const lista = [
        ...seleccionadosRef.current,
      ];

      seleccionadosRef.current = [];
      setSeleccionados([]);

      if (!operadorId) {
        return;
      }

      await Promise.allSettled(
        lista.map((asiento) =>
          liberarAsiento(
            asiento.id,
            operadorId,
          ),
        ),
      );
    }, [operadorId]);

  useEffect(() => {
    return () => {
      const lista = [
        ...seleccionadosRef.current,
      ];

      if (!operadorId) {
        return;
      }

      lista.forEach((asiento) => {
        void liberarAsiento(
          asiento.id,
          operadorId,
        ).catch(() => undefined);
      });
    };
  }, [operadorId]);

  useEffect(() => {
    void (async () => {
      try {
        const respuesta = await obtenerRutas();
        setRutas(
          Array.isArray(respuesta)
            ? (respuesta as Ruta[])
            : [],
        );
      } catch (error) {
        setMensaje(obtenerError(error));
        setEsError(true);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const consultarFila =
    useCallback(async () => {
      if (!rutaId || !fecha) {
        setFila([]);
        setAviso(null);
        return;
      }

      try {
        const [turnos, avisoActivo] =
          await Promise.all([
            obtenerFilaSalida(rutaId, fecha),
            obtenerAvisoSalidaActivo(
              rutaId,
              fecha,
            ),
          ]);

        setFila(
          turnos.filter(
            (item) =>
              item.activo &&
              [
                "VENDIENDO",
                "SIGUIENTE",
                "EN_ESPERA",
                "COMPLETO",
              ].includes(item.estado),
          ),
        );
        setAviso(avisoActivo);

        if (
          avisoActivo?.tipoServicio !==
          "SERVICIO_PARCIAL"
        ) {
          setAceptaServicioParcial(false);
        }
      } catch (error) {
        setMensaje(obtenerError(error));
        setEsError(true);
      }
    }, [fecha, rutaId]);

  useEffect(() => {
    void consultarFila();

    const intervalo = window.setInterval(
      () => void consultarFila(),
      3000,
    );

    return () => window.clearInterval(intervalo);
  }, [consultarFila]);

  useEffect(() => {
    if (!turno?.viaje.id || ventaFinal) {
      return;
    }

    let activo = true;

    const actualizar = async () => {
      try {
        const respuesta =
          await obtenerAsientosPorViaje(
            turno.viaje.id,
          );

        if (activo) {
          setAsientos(respuesta);
        }
      } catch {
        // Conserva el último estado visible.
      }
    };

    void actualizar();
    const intervalo = window.setInterval(
      () => void actualizar(),
      2000,
    );

    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, [turno?.viaje.id, ventaFinal]);

  const seleccionarTurno = async (
    seleccionado: TurnoSalidaRapida,
  ) => {
    if (procesando || ventaFinal) {
      return;
    }

    await liberarSeleccion();
    setTurno(seleccionado);
    setAsientos([]);
    setMensaje("");

    try {
      const respuesta =
        await obtenerAsientosPorViaje(
          seleccionado.viaje.id,
        );
      setAsientos(respuesta);
    } catch (error) {
      setMensaje(obtenerError(error));
      setEsError(true);
    }
  };

  const seleccionarAsiento = async (
    asientoBase: AsientoCompra,
  ) => {
    const asiento =
      asientoBase as AsientoViaje;

    if (
      !operadorId ||
      procesando ||
      ventaFinal ||
      operandoRef.current.has(asiento.id)
    ) {
      return;
    }

    operandoRef.current.add(asiento.id);
    setMensaje("");

    const yaSeleccionado =
      seleccionadosRef.current.some(
        (item) => item.id === asiento.id,
      );

    try {
      if (yaSeleccionado) {
        const respuesta = await liberarAsiento(
          asiento.id,
          operadorId,
        );

        setAsientos((actuales) =>
          actuales.map((item) =>
            item.id === asiento.id
              ? respuesta.asiento
              : item,
          ),
        );
        setSeleccionados((actuales) =>
          actuales.filter(
            (item) => item.id !== asiento.id,
          ),
        );
        return;
      }

      if (asiento.estado !== "DISPONIBLE") {
        throw new Error(
          "Este asiento está ocupado o está siendo comprado por otro usuario.",
        );
      }

      const respuesta = await bloquearAsiento(
        asiento.id,
        operadorId,
      );

      setAsientos((actuales) =>
        actuales.map((item) =>
          item.id === asiento.id
            ? respuesta.asiento
            : item,
        ),
      );
      setSeleccionados((actuales) => [
        ...actuales.filter(
          (item) => item.id !== asiento.id,
        ),
        respuesta.asiento,
      ]);
    } catch (error) {
      setMensaje(obtenerError(error));
      setEsError(true);

      if (turnoRef.current?.viaje.id) {
        try {
          setAsientos(
            await obtenerAsientosPorViaje(
              turnoRef.current.viaje.id,
            ),
          );
        } catch {
          // Conserva el error principal.
        }
      }
    } finally {
      operandoRef.current.delete(asiento.id);
    }
  };

  const cantidad = seleccionados.length;
  const precioUnitario = Number(
    turno?.viaje.precio || 0,
  );
  const total = cantidad * precioUnitario;

  const suspensionTotal =
    aviso?.tipoServicio ===
      "SUSPENSION_TOTAL" ||
    aviso?.permiteCompra === false;

  const bloqueadoPorAviso =
    suspensionTotal ||
    (
      aviso?.tipoServicio ===
        "SERVICIO_PARCIAL" &&
      !aceptaServicioParcial
    );

  useEffect(() => {
    if (
      bloqueadoPorAviso &&
      seleccionadosRef.current.length > 0
    ) {
      void liberarSeleccion();
    }
  }, [
    bloqueadoPorAviso,
    liberarSeleccion,
  ]);

  const confirmarVenta = async () => {
    if (!operadorId) {
      setMensaje(
        "No se encontró la sesión de la administradora o secretaria.",
      );
      setEsError(true);
      return;
    }

    if (
      !nombre.trim() ||
      !ci.trim() ||
      !telefono.trim()
    ) {
      setMensaje(
        "Completa nombre, CI y teléfono del pasajero.",
      );
      setEsError(true);
      return;
    }

    if (!turno?.viaje.id || cantidad === 0) {
      setMensaje(
        "Selecciona un vehículo y al menos un asiento.",
      );
      setEsError(true);
      return;
    }

    if (bloqueadoPorAviso) {
      setMensaje(
        "La venta no está habilitada para las condiciones actuales del servicio.",
      );
      setEsError(true);
      return;
    }

    try {
      setProcesando(true);
      setMensaje("");

      const respuesta = await crearVentaOficina({
        operadorId,
        pasajeroNombre: nombre.trim(),
        pasajeroCi: ci.trim(),
        pasajeroTelefono: telefono.trim(),
        pasajeroEmail:
          email.trim() || undefined,
        viajeId: turno.viaje.id,
        asientoIds: seleccionados.map(
          (item) => item.id,
        ),
        metodoPago,
      });

      setVentaFinal(
        respuesta as ResultadoVenta,
      );
      setAsientosVendidos([
        ...seleccionados,
      ]);
      seleccionadosRef.current = [];
      setSeleccionados([]);
      setMensaje(
        "Venta rápida registrada y ticket generado correctamente.",
      );
      setEsError(false);

      window.setTimeout(() => {
        document
          .getElementById(
            "ticket-venta-sector-rapido",
          )
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 150);
    } catch (error) {
      setMensaje(obtenerError(error));
      setEsError(true);

      try {
        setAsientos(
          await obtenerAsientosPorViaje(
            turno.viaje.id,
          ),
        );
      } catch {
        // Conserva el mensaje de venta.
      }
    } finally {
      setProcesando(false);
    }
  };

  const nuevaVenta = async () => {
    await liberarSeleccion();
    setNombre("");
    setCi("");
    setTelefono("");
    setEmail("");
    setMetodoPago("EFECTIVO");
    setTurno(null);
    setAsientos([]);
    setVentaFinal(null);
    setAsientosVendidos([]);
    setMensaje("");
    setEsError(false);
  };

  if (cargando) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-white">
        <Loader2 className="animate-spin text-emerald-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
        <header className="bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
            Venta administrativa
          </p>
          <h2 className="mt-1 text-3xl font-black">
            Sector Noah y Hiace
          </h2>
          <p className="mt-2 text-emerald-50">
            Vende asientos de las salidas rápidas habilitadas y observa su ocupación en tiempo real.
          </p>
        </header>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <label>
            <span className="flex items-center gap-2 text-sm font-black text-slate-700">
              <MapPin size={17} /> Ruta
            </span>
            <select
              value={rutaId}
              disabled={procesando || Boolean(ventaFinal)}
              onChange={(evento) => {
                void liberarSeleccion();
                setRutaId(evento.target.value);
                setTurno(null);
                setAsientos([]);
                setAceptaServicioParcial(false);
              }}
              className="mt-2 h-14 w-full rounded-2xl border border-emerald-200 bg-slate-50 px-4 outline-none focus:border-emerald-600"
            >
              <option value="">Elegir ruta...</option>
              {rutas.map((ruta) => (
                <option key={ruta.id} value={ruta.id}>
                  {ruta.origen} → {ruta.destino}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="flex items-center gap-2 text-sm font-black text-slate-700">
              <CalendarDays size={17} /> Fecha
            </span>
            <input
              type="date"
              min={fechaLocalActual()}
              value={fecha}
              disabled={procesando || Boolean(ventaFinal)}
              onChange={(evento) => {
                void liberarSeleccion();
                setFecha(evento.target.value);
                setTurno(null);
                setAsientos([]);
                setAceptaServicioParcial(false);
              }}
              className="mt-2 h-14 w-full rounded-2xl border border-emerald-200 bg-slate-50 px-4 outline-none focus:border-emerald-600"
            />
          </label>
        </div>
      </section>

      {mensaje && (
        <div
          className={`rounded-2xl border p-4 font-bold ${
            esError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {mensaje}
        </div>
      )}

      {aviso && (
        <section
          className={`rounded-3xl border p-5 ${
            suspensionTotal
              ? "border-red-300 bg-red-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <h3 className="text-xl font-black text-slate-900">
            {aviso.titulo}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {aviso.mensaje}
          </p>

          {aviso.tipoServicio ===
            "SERVICIO_PARCIAL" && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-300 bg-white p-4">
                <input
                  type="checkbox"
                  checked={aceptaServicioParcial}
                  onChange={(evento) =>
                    setAceptaServicioParcial(
                      evento.target.checked,
                    )
                  }
                  className="mt-1 h-5 w-5 accent-emerald-700"
                />
                <span className="font-bold text-slate-800">
                  El pasajero acepta viajar solamente hasta {aviso.puntoLlegadaTemporal}.
                </span>
              </label>
            )}
        </section>
      )}

      {rutaId && fecha && (
        <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Fila habilitada
              </p>
              <h3 className="mt-1 text-2xl font-black text-slate-900">
                Selecciona el vehículo
              </h3>
            </div>
            <button
              type="button"
              onClick={() => void consultarFila()}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 font-bold text-emerald-700"
            >
              <RefreshCw size={17} /> Actualizar
            </button>
          </div>

          {fila.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No existen vehículos Noah o Hiace habilitados para esta ruta y fecha.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {fila.map((item) => {
                const activo = turno?.id === item.id;
                const completo =
                  item.ocupacion.disponibles <= 0 ||
                  item.estado === "COMPLETO";

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={
                      completo ||
                      bloqueadoPorAviso ||
                      procesando ||
                      Boolean(ventaFinal)
                    }
                    onClick={() =>
                      void seleccionarTurno(item)
                    }
                    className={`rounded-2xl border-2 p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      activo
                        ? "border-emerald-600 bg-emerald-50 ring-4 ring-emerald-100"
                        : "border-slate-200 bg-white hover:border-emerald-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <BusFront className="text-emerald-700" />
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                        #{item.posicion}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-black">
                      {item.vehiculo.tipo} · {item.vehiculo.placa}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 size={16} />
                      {item.estado === "VENDIENDO"
                        ? "Disponible ahora"
                        : `Aprox. ${String(
                            item.viaje.horaSalida,
                          ).slice(0, 5)}`}
                    </p>
                    <p className="mt-3 font-black text-emerald-700">
                      {item.ocupacion.disponibles} asientos disponibles
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-600">
                      Bs. {Number(item.viaje.precio).toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {turno && (
        <SeatMap
          vehiculo={turno.vehiculo}
          asientos={asientos}
          seleccionados={seleccionados.map(
            (item) => item.id,
          )}
          bloqueado={
            procesando ||
            Boolean(ventaFinal) ||
            bloqueadoPorAviso
          }
          onSeleccionar={(asiento) =>
            void seleccionarAsiento(asiento)
          }
        />
      )}

      {turno && seleccionados.length > 0 && !ventaFinal && (
        <section className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="text-emerald-700" />
            <h3 className="text-2xl font-black text-slate-900">
              Datos y confirmación de venta
            </h3>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Campo titulo="Nombre completo" valor={nombre} onChange={setNombre} />
            <Campo titulo="CI / DNI" valor={ci} onChange={setCi} />
            <Campo titulo="Teléfono" valor={telefono} onChange={setTelefono} />
            <Campo titulo="Correo opcional" valor={email} onChange={setEmail} tipo="email" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <BotonPago
              activo={metodoPago === "EFECTIVO"}
              titulo="Efectivo"
              icono={<Banknote />}
              onClick={() => setMetodoPago("EFECTIVO")}
            />
            <BotonPago
              activo={metodoPago === "QR"}
              titulo="QR Digital"
              icono={<QrCode />}
              onClick={() => setMetodoPago("QR")}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-bold text-slate-700">
                {cantidad} asiento(s) × Bs. {precioUnitario.toFixed(2)}
              </p>
              <p className="text-3xl font-black text-emerald-700">
                Total: Bs. {total.toFixed(2)}
              </p>
            </div>
          </div>

          {metodoPago === "QR" ? (
            <PagoQROficina
              mostrar
              total={total}
              cantidadAsientos={cantidad}
              procesando={procesando}
              onConfirmarPago={() =>
                void confirmarVenta()
              }
            />
          ) : (
            <button
              type="button"
              disabled={procesando}
              onClick={() => void confirmarVenta()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 font-black text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {procesando ? (
                <Loader2 className="animate-spin" />
              ) : (
                <TicketCheck />
              )}
              Confirmar venta y generar ticket
            </button>
          )}
        </section>
      )}

      {ventaFinal && (
        <section
          id="ticket-venta-sector-rapido"
          className="space-y-4"
        >
          <TicketVentaOficina
            resultado={ventaFinal}
            pasajero={{
              nombre: nombre.trim(),
              ci: ci.trim(),
              telefono: telefono.trim(),
              email:
                email.trim() || undefined,
            }}
            viaje={{
              ...turno?.viaje,
              ruta: turno?.ruta,
              vehiculo: turno?.vehiculo,
            }}
            asientos={asientosVendidos}
            metodoPago={metodoPago}
            onNuevaVenta={() =>
              void nuevaVenta()
            }
          />
        </section>
      )}
    </div>
  );
}

function Campo({
  titulo,
  valor,
  onChange,
  tipo = "text",
}: {
  titulo: string;
  valor: string;
  onChange: (valor: string) => void;
  tipo?: string;
}) {
  return (
    <label>
      <span className="text-sm font-black text-slate-700">
        {titulo}
      </span>
      <input
        type={tipo}
        value={valor}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        className="mt-2 h-14 w-full rounded-2xl border border-emerald-200 bg-slate-50 px-4 outline-none focus:border-emerald-600"
      />
    </label>
  );
}

function BotonPago({
  activo,
  titulo,
  icono,
  onClick,
}: {
  activo: boolean;
  titulo: string;
  icono: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 p-5 font-black transition ${
        activo
          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      {activo && <CheckCircle2 size={20} />}
      {icono}
      {titulo}
    </button>
  );
}
