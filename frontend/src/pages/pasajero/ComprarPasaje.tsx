import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BusFront,
  CalendarDays,
  Home,
  LogOut,
  QrCode,
  Ticket,
  User,
  CheckCircle,
} from "lucide-react";

import { obtenerAsientosPorViaje } from "../../services/asientos.service";
import { crearReserva } from "../../services/reservas.service";

function ComprarPasaje() {
  const location = useLocation();
  const navigate = useNavigate();

  const viaje = location.state?.viaje;
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const [asientos, setAsientos] = useState<any[]>([]);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState<any>(null);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarAsientos = async () => {
      if (!viaje?.id) {
        setCargando(false);
        return;
      }

      try {
        const data = await obtenerAsientosPorViaje(viaje.id);
        setAsientos(data);
      } catch {
        setMensaje("No se pudieron cargar los asientos.");
      } finally {
        setCargando(false);
      }
    };

    cargarAsientos();
  }, [viaje]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const confirmarReserva = async () => {
    if (!asientoSeleccionado) {
      setMensaje("Selecciona un asiento para continuar.");
      setExito(false);
      return;
    }

    try {
      const reserva = await crearReserva({
        usuarioId: usuario.id,
        viajeId: viaje.id,
        asientoIds: [asientoSeleccionado.id],
      });

      setMensaje(`Reserva confirmada correctamente. Código: ${reserva.codigoReserva}`);
      setExito(true);

      setAsientos((prev) =>
        prev.map((a) =>
          a.id === asientoSeleccionado.id ? { ...a, estado: "OCUPADO" } : a
        )
      );

      setAsientoSeleccionado(null);
    } catch {
      setMensaje("No se pudo confirmar la reserva.");
      setExito(false);
    }
  };

  if (!viaje) {
    return (
      <div className="min-h-screen bg-[#070b16] text-white flex items-center justify-center">
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-10 text-center">
          <h1 className="text-3xl font-black text-red-400">
            No se seleccionó ningún viaje
          </h1>

          <Link
            to="/pasajero/comprar-reservar"
            className="inline-block mt-6 bg-yellow-400 text-slate-950 px-8 py-4 rounded-xl font-black"
          >
            Volver a comprar
          </Link>
        </div>
      </div>
    );
  }

  const disponibles = asientos.filter((a) => a.estado === "DISPONIBLE").length;
  const ocupados = asientos.filter((a) => a.estado !== "DISPONIBLE").length;

  return (
    <div className="min-h-screen bg-[#070b16] text-white">
      <nav className="bg-[#0b1020] border-b border-white/10 px-10 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 text-slate-950 p-3 rounded-2xl">
            <BusFront size={26} />
          </div>

          <div>
            <h1 className="font-black text-xl">Trans 2 de Junio</h1>
            <p className="text-xs text-slate-400">SISTEMA DE PASAJES</p>
          </div>
        </div>

        <div className="flex items-center gap-7 text-slate-300 font-semibold">
          <Link to="/pasajero" className="hover:text-yellow-400 flex gap-2">
            <Home size={18} /> Inicio
          </Link>

          <Link
            to="/pasajero/comprar-reservar"
            className="text-yellow-400 border border-yellow-400/40 px-5 py-2 rounded-xl flex gap-2"
          >
            <Ticket size={18} /> Comprar / Reservar
          </Link>

          <Link to="/pasajero/mis-reservas" className="hover:text-yellow-400 flex gap-2">
            <CalendarDays size={18} /> Mis Reservas
          </Link>

          <Link to="/pasajero/tickets" className="hover:text-yellow-400 flex gap-2">
            <QrCode size={18} /> Mis Tickets
          </Link>

          <span className="text-sm text-slate-400">{usuario.email}</span>

          <button onClick={cerrarSesion} className="hover:text-red-400 flex gap-2">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <h2 className="text-4xl font-black">Comprar o Reservar Pasaje</h2>
        <p className="text-slate-400 mt-2">
          Selecciona tu asiento y confirma tu reserva.
        </p>

        <section className="mt-8 bg-[#111827] border border-white/10 rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-yellow-400 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center font-black">
              1
            </span>
            <h3 className="text-2xl font-black">Ruta y Fecha</h3>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Info titulo="Ruta" valor={`${viaje.ruta.origen} → ${viaje.ruta.destino}`} />
            <Info titulo="Fecha" valor={viaje.fecha} />
            <Info titulo="Salida" valor={viaje.horaSalida} />
            <Info titulo="Precio" valor={`Bs. ${viaje.precio}`} />
          </div>
        </section>

        <section className="mt-6 bg-[#111827] border border-white/10 rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-yellow-400 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center font-black">
              2
            </span>
            <h3 className="text-2xl font-black">Elige tu Asiento</h3>
          </div>

          <div className="flex gap-6 text-sm mb-6">
            <Leyenda color="bg-emerald-500" texto={`Disponible (${disponibles})`} />
            <Leyenda color="bg-red-500" texto={`Ocupado (${ocupados})`} />
            <Leyenda color="bg-yellow-400" texto="Seleccionado" />
          </div>

          {cargando ? (
            <p className="text-slate-400">Cargando asientos...</p>
          ) : (
            <div className="bg-[#0b1020] border border-white/10 rounded-3xl p-8">
              <div className="flex justify-between border-b border-white/10 pb-5 mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-full p-3">
                    <User size={22} />
                  </div>
                  <div>
                    <p className="font-black">CONDUCTOR</p>
                    <p className="text-slate-500 text-sm">Parte frontal del bus</p>
                  </div>
                </div>

                <span className="border border-white/10 px-4 py-2 rounded-xl text-slate-400">
                  {viaje.vehiculo.modelo}
                </span>
              </div>

              <div className="max-w-xl mx-auto">
                <div className="grid grid-cols-5 gap-4">
                  {asientos.map((asiento, index) => {
                    const ocupado = asiento.estado !== "DISPONIBLE";
                    const seleccionado = asientoSeleccionado?.id === asiento.id;

                    const pasillo = index % 4 === 2;

                    return (
                      <>
                        {pasillo && <div key={`pasillo-${asiento.id}`} />}

                        <button
                          key={asiento.id}
                          disabled={ocupado}
                          onClick={() => setAsientoSeleccionado(asiento)}
                          className={`h-12 rounded-xl font-black border transition ${
                            ocupado
                              ? "bg-red-500/20 border-red-500 text-red-400 cursor-not-allowed"
                              : seleccionado
                              ? "bg-yellow-400 text-slate-950 border-yellow-400 scale-105"
                              : "bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                          }`}
                        >
                          {asiento.numero}
                        </button>
                      </>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 text-center text-slate-500 mt-8 pt-4">
                  PARTE TRASERA
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 bg-[#111827] border border-white/10 rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-yellow-400 text-slate-950 w-9 h-9 rounded-full flex items-center justify-center font-black">
              3
            </span>
            <h3 className="text-2xl font-black">Resumen del Viaje</h3>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <Info titulo="Pasajero" valor={usuario.nombre || "Pasajero"} />
            <Info
              titulo="Asiento"
              valor={asientoSeleccionado ? `#${asientoSeleccionado.numero}` : "No seleccionado"}
            />
            <Info titulo="Fecha" valor={viaje.fecha} />
            <Info titulo="Total" valor={`Bs. ${viaje.precio}`} destacado />
          </div>

          <button
            onClick={confirmarReserva}
            disabled={!asientoSeleccionado}
            className="w-full mt-7 bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-black disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            Confirmar Reserva
          </button>

          {mensaje && (
            <div
              className={`mt-5 rounded-2xl p-4 font-bold ${
                exito
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            >
              {mensaje}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Info({ titulo, valor, destacado }: any) {
  return (
    <div className="bg-[#0b1020] border border-white/10 rounded-2xl p-5">
      <p className="text-slate-500 text-sm">{titulo}</p>
      <h4
        className={`font-black mt-2 ${
          destacado ? "text-yellow-400 text-2xl" : "text-white text-lg"
        }`}
      >
        {valor}
      </h4>
    </div>
  );
}

function Leyenda({ color, texto }: any) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <span className={`w-4 h-4 rounded-full ${color}`}></span>
      {texto}
    </div>
  );
}

export default ComprarPasaje;
