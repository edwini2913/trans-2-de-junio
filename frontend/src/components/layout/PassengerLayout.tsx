import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Ticket,
  QrCode,
  User,
  LogOut,
  BusFront,
} from "lucide-react";
import logo from "../../assets/logo.png";

interface Props {
  children: React.ReactNode;
  titulo: string;
}

function PassengerLayout({ children, titulo }: Props) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-72 bg-blue-950 text-white min-h-screen p-5">
        <div className="flex items-center gap-3 mb-10">
          <img src={logo} className="w-16 bg-white rounded-xl p-1" />
          <div>
            <h1 className="text-xl font-black text-yellow-400">
              TRANS 2 DE JUNIO
            </h1>
            <p className="text-blue-200 text-sm">Portal pasajero</p>
          </div>
        </div>

        <nav className="space-y-3">
          <Link to="/pasajero" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-900">
            <Home size={20} /> Inicio
          </Link>

          <Link to="/pasajero/buscar-viajes" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-800">
            <Search size={20} /> Buscar viajes
          </Link>

          <Link to="/pasajero/mis-pasajes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-900">
            <Ticket size={20} /> Mis pasajes
          </Link>

          <Link to="/pasajero/tickets" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-900">
            <QrCode size={20} /> Tickets QR
          </Link>

          <Link to="/pasajero/perfil" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-900">
            <User size={20} /> Mi perfil
          </Link>
        </nav>

        <button
          onClick={cerrarSesion}
          className="mt-10 w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1">
        <header className="bg-white shadow px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BusFront className="text-blue-800" size={30} />
            <h2 className="text-2xl font-black text-slate-900">{titulo}</h2>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-900">
              {usuario.nombre || "Pasajero"}
            </p>
            <p className="text-sm text-slate-500">{usuario.rol || "PASAJERO"}</p>
          </div>
        </header>

        <section className="p-8">{children}</section>
      </main>
    </div>
  );
}

export default PassengerLayout;