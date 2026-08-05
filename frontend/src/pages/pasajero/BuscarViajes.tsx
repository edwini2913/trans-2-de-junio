import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  BusFront,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { buscarViajes } from "../../services/viajes.service";

function BuscarViajes() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [viajes, setViajes] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");
    setViajes([]);

    try {
      const data = await buscarViajes(origen, destino, fecha);
      data.length === 0
        ? setMensaje("No se encontraron viajes disponibles.")
        : setViajes(data);
    } catch {
      setMensaje("Error al buscar viajes.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-950 text-white px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <img src={logo} className="w-20 bg-white rounded-xl p-1" />
          <div>
            <h1 className="text-2xl font-black text-yellow-400">
              TRANS 2 DE JUNIO
            </h1>
            <p className="text-blue-200 text-sm">Búsqueda de viajes</p>
          </div>
        </div>

        <Link
          to="/pasajero"
          className="flex items-center gap-2 bg-white text-blue-950 px-4 py-2 rounded-xl font-bold"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
      </header>

      <main className="p-8">
        <section className="bg-white rounded-3xl shadow p-8">
          <h2 className="text-3xl font-black text-slate-900">
            Buscar viaje disponible
          </h2>

          <form onSubmit={buscar} className="grid md:grid-cols-4 gap-5 mt-8">
            <input
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
              placeholder="Origen: Chimoré"
              className="w-full border rounded-xl p-4"
              required
            />

            <input
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Destino: Cochabamba"
              className="w-full border rounded-xl p-4"
              required
            />

            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border rounded-xl p-4"
              required
            />

            <button
              disabled={cargando}
              className="bg-blue-800 hover:bg-blue-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
            >
              <Search size={20} />
              {cargando ? "Buscando..." : "Buscar"}
            </button>
          </form>
        </section>

        {mensaje && (
          <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-2xl p-4 mt-6 font-bold">
            {mensaje}
          </div>
        )}

        <section className="grid lg:grid-cols-2 gap-6 mt-8">
          {viajes.map((viaje) => (
            <div
              key={viaje.id}
              className="bg-white rounded-3xl shadow p-6 border hover:shadow-xl transition"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 text-blue-800 p-4 rounded-2xl">
                  <BusFront size={38} />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    {viaje.ruta.origen} → {viaje.ruta.destino}
                  </h3>
                  <p className="text-slate-500">
                    {viaje.vehiculo.marca} {viaje.vehiculo.modelo} -{" "}
                    {viaje.vehiculo.placa}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-100 p-4 rounded-2xl">
                  <Clock className="text-blue-800" size={24} />
                  <p className="text-slate-500 text-sm mt-2">Salida</p>
                  <h4 className="font-black">{viaje.horaSalida}</h4>
                </div>

                <div className="bg-slate-100 p-4 rounded-2xl">
                  <Users className="text-blue-800" size={24} />
                  <p className="text-slate-500 text-sm mt-2">Asientos</p>
                  <h4 className="font-black">{viaje.asientosDisponibles}</h4>
                </div>

                <div className="bg-slate-100 p-4 rounded-2xl">
                  <DollarSign className="text-blue-800" size={24} />
                  <p className="text-slate-500 text-sm mt-2">Precio</p>
                  <h4 className="font-black">Bs {viaje.precio}</h4>
                </div>
              </div>

              <Link
                to="/pasajero/comprar"
                state={{ viaje }}
                className="block text-center w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 py-4 rounded-xl font-black mt-6"
              >
                Reservar pasaje
              </Link>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default BuscarViajes;
