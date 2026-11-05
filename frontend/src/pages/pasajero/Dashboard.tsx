import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Armchair,
  ArrowRight,
  BusFront,
  CarFront,
  UserRound,
  Zap,
  CalendarDays,
  Clock,
  Home,
  LogOut,
  MapPin,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import logo from "../../assets/logo.png";
import fondo from "../../assets/fondo.jpg";
import taxi1 from "../../assets/taxi1.png";
import NotificacionesPasajero from "../../components/pasajero/NotificacionesPasajero";
import {
  obtenerViajesPublicados,
  type Viaje,
} from "../../services/viajes.service";

type UsuarioSesion = {
  nombre?: string;
  email?: string;
};

type TarjetaEstadisticaProps = {
  icono: ReactNode;
  valor: string;
  titulo: string;
  descripcion: string;
};

function obtenerUsuarioSesion(): UsuarioSesion {
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    return {};
  }

  try {
    return JSON.parse(usuarioGuardado) as UsuarioSesion;
  } catch {
    return {};
  }
}

function obtenerInicial(nombre?: string): string {
  return (nombre || "P").charAt(0).toUpperCase();
}

function DashboardPasajero() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioSesion();

  const [viajes, setViajes] =
    useState<Viaje[]>([]);

  const [cargandoViajes, setCargandoViajes] =
    useState(true);

  const [errorViajes, setErrorViajes] =
    useState("");

  async function cargarViajes(
    mostrarCarga = true,
  ) {
    if (mostrarCarga) {
      setCargandoViajes(true);
    }

    setErrorViajes("");

    try {
      const resultado =
        await obtenerViajesPublicados();

      setViajes(
        Array.isArray(resultado)
          ? resultado
          : [],
      );
    } catch (error) {
      setViajes([]);
      setErrorViajes(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los viajes publicados.",
      );
    } finally {
      if (mostrarCarga) {
        setCargandoViajes(false);
      }
    }
  }

  useEffect(() => {
    void cargarViajes();

    const actualizarSilenciosamente = () => {
      void cargarViajes(false);
    };

    const intervalo = window.setInterval(
      actualizarSilenciosamente,
      10_000,
    );

    const actualizarAlRegresar = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        actualizarSilenciosamente();
      }
    };

    document.addEventListener(
      "visibilitychange",
      actualizarAlRegresar,
    );

    return () => {
      window.clearInterval(intervalo);

      document.removeEventListener(
        "visibilitychange",
        actualizarAlRegresar,
      );
    };
  }, []);

  function cerrarSesion() {
    [
      "access_token",
      "token",
      "usuario",
      "user",
      "auth",
      "sesion",
      "session",
    ].forEach((clave) => localStorage.removeItem(clave));

    navigate("/", { replace: true });
  }

  return (
    <div className="relative isolate min-h-screen w-full min-w-0 overflow-x-clip bg-[#f6faf7] text-slate-800">
      <Cabecera usuario={usuario} cerrarSesion={cerrarSesion} />
      <FondoDecorativo />

      <main className="relative z-10 mx-auto w-full min-w-0 max-w-[1600px] px-3 py-5 min-[375px]:px-4 sm:px-6 sm:py-8 lg:px-10 lg:py-10 2xl:px-12">
        <BannerBienvenida nombre={usuario.nombre || "Pasajero"} />

        <section className="mt-5 grid min-w-0 grid-cols-2 gap-2.5 min-[375px]:gap-3 sm:mt-8 sm:gap-5 xl:grid-cols-4">
          <TarjetaEstadistica
            icono={<Ticket />}
            valor="1"
            titulo="Pasajes activos"
            descripcion="Tickets disponibles"
          />
          <TarjetaEstadistica
            icono={<CalendarDays />}
            valor="0"
            titulo="Reservas pendientes"
            descripcion="Reservas por confirmar"
          />
          <TarjetaEstadistica
            icono={<BusFront />}
            valor="15"
            titulo="Flotas disponibles"
            descripcion="Vehículos operativos"
          />
          <TarjetaEstadistica
            icono={<ShieldCheck />}
            valor="1"
            titulo="Bloques registrados"
            descripcion="Validación Blockchain"
          />
        </section>

        <SeccionRutas
          viajes={viajes}
          cargando={cargandoViajes}
          error={errorViajes}
          onActualizar={cargarViajes}
        />

        <section className="relative mt-8 min-w-0 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 p-4 text-white shadow-xl shadow-emerald-900/20 min-[375px]:p-5 sm:mt-12 sm:rounded-[30px] sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[34px] border-lime-300/10" />
          <div className="pointer-events-none absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-emerald-400/10" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">
                Atención al pasajero
              </span>
              <h3 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                ¿Necesitas ayuda con tu viaje?
              </h3>
              <p className="mt-3 leading-7 text-emerald-100">
                Registra un reclamo o consulta el estado de tus solicitudes
                desde tu cuenta.
              </p>
            </div>

            <Link
              to="/pasajero/mis-reclamos"
              className="inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-center text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:w-auto sm:rounded-2xl sm:px-7 sm:py-4 sm:text-base"
            >
              <MessageCircle size={20} />
              Ir a mis reclamos
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Cabecera({
  usuario,
  cerrarSesion,
}: {
  usuario: UsuarioSesion;
  cerrarSesion: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-50 isolate overflow-visible border-b-4 border-lime-400 shadow-xl shadow-emerald-950/15"
      style={{
        backgroundImage: `
          radial-gradient(circle at 12% 15%, rgba(255,255,255,.09), transparent 25%),
          radial-gradient(circle at 42% 120%, rgba(132,204,22,.13), transparent 34%),
          radial-gradient(circle at 85% -30%, rgba(110,231,183,.18), transparent 32%),
          linear-gradient(115deg, #004b35 0%, #007651 52%, #005e42 100%)
        `,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(ellipse at 20% 10%, rgba(255,255,255,.22) 0, rgba(255,255,255,.22) 1px, transparent 2px, transparent 18px)",
        }}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 500 130"
        preserveAspectRatio="none"
        className="pointer-events-none absolute right-0 top-0 h-full w-[430px] opacity-30"
      >
        <path d="M250 -20 C300 30 260 80 340 150" fill="none" stroke="#d9f99d" strokeWidth="20" />
        <path d="M300 -20 C350 30 305 80 390 150" fill="none" stroke="#6ee7b7" strokeWidth="15" />
        <path d="M350 -20 C400 35 365 82 445 150" fill="none" stroke="#ffffff" strokeWidth="6" />
        <path d="M400 -20 C440 30 420 80 490 150" fill="none" stroke="#84cc16" strokeWidth="12" />
      </svg>

      <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-2.5 px-2.5 py-3 min-[375px]:px-3 sm:gap-4 sm:px-6 sm:py-4 xl:flex-row xl:items-center xl:justify-between xl:px-10 2xl:px-12">
        <div className="flex min-w-0 items-center justify-between gap-1.5 min-[375px]:gap-3">
          <Link to="/pasajero" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white shadow-lg min-[375px]:h-12 min-[375px]:w-12 sm:h-14 sm:w-14 sm:rounded-2xl">
              <img
                src={logo}
                alt="Logo Trans 2 de Junio"
                className="h-9 w-9 object-contain min-[375px]:h-10 min-[375px]:w-10 sm:h-11 sm:w-11"
              />
            </div>
            <div>
              <h1 className="truncate text-[13px] font-black leading-tight text-white drop-shadow-sm min-[375px]:text-sm sm:text-xl">
                Trans 2 de Junio
              </h1>
              <p className="hidden text-[10px] font-black tracking-[0.12em] text-emerald-100 min-[375px]:block sm:text-[11px] sm:tracking-[0.22em]">
                SISTEMA DE PASAJES
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 min-[375px]:gap-1.5 xl:hidden">
            <NotificacionesPasajero />

            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-black text-emerald-800 shadow-md min-[375px]:flex sm:h-10 sm:w-10">
              {obtenerInicial(usuario.nombre)}
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 transition hover:bg-red-50"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <nav className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 xl:flex xl:items-center xl:gap-1">
          <Link
            to="/pasajero"
            className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-center text-xs font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5 min-[375px]:text-sm sm:px-3 xl:px-4 xl:py-3"
          >
            <Home size={18} />
            Inicio
          </Link>
          <EnlaceNavegacion to="/pasajero/comprar-reservar" icono={<Ticket size={18} />} texto="Comprar / Reservar" />
          <EnlaceNavegacion to="/pasajero/mis-reservas" icono={<CalendarDays size={18} />} texto="Mis Reservas" />
          <EnlaceNavegacion to="/pasajero/mis-reclamos" icono={<MessageCircle size={18} />} texto="Mis Reclamos" />
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <NotificacionesPasajero />

          <div className="text-right">
            <p className="text-sm font-black text-white">
              {usuario.nombre || "Pasajero"}
            </p>
            <p className="max-w-48 truncate text-xs text-emerald-100">
              {usuario.email || "Cuenta de pasajero"}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-black text-emerald-800 shadow-lg">
            {obtenerInicial(usuario.nombre)}
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex items-center gap-2 rounded-xl border border-white/70 bg-white px-4 py-3 text-sm font-black text-red-600 shadow-md transition hover:-translate-y-0.5 hover:bg-red-50"
          >
            <LogOut size={18} />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}

function EnlaceNavegacion({
  to,
  icono,
  texto,
}: {
  to: string;
  icono: ReactNode;
  texto: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-1.5 py-2.5 text-center text-[11px] font-bold leading-tight text-emerald-50 transition hover:bg-white/15 hover:text-white min-[375px]:px-2 min-[375px]:text-xs sm:text-sm xl:shrink-0 xl:border-transparent xl:px-4 xl:py-3"
    >
      {icono}
      {texto}
    </Link>
  );
}

function FondoDecorativo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_25%,rgba(167,243,208,0.18),transparent_25%),radial-gradient(circle_at_85%_40%,rgba(190,242,100,0.13),transparent_30%)]" />

      <div className="absolute left-0 top-32 hidden h-[680px] w-[600px] overflow-hidden lg:block">
        <img
          src={taxi1}
          alt=""
          className="h-full w-full -translate-x-[24%] object-contain object-center opacity-[0.12] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f6faf7]/5 to-[#f6faf7]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f6faf7]/40 via-transparent to-[#f6faf7]" />
      </div>

      <svg
        viewBox="0 0 650 1300"
        preserveAspectRatio="none"
        className="absolute -right-24 top-24 hidden h-[1350px] w-[600px] xl:block"
      >
        <path d="M470 -100 C170 260 610 440 300 780 C130 970 480 1110 280 1390" fill="none" stroke="#064e3b" strokeWidth="70" />
        <path d="M550 -100 C250 260 680 455 390 800 C230 990 560 1130 370 1390" fill="none" stroke="#059669" strokeWidth="50" />
        <path d="M385 -100 C90 250 520 420 220 750 C45 955 400 1090 195 1390" fill="none" stroke="#10b981" strokeWidth="42" />
        <path d="M300 -100 C20 235 435 400 145 720 C-35 925 310 1080 110 1390" fill="none" stroke="#a3e635" strokeWidth="30" />
        <path d="M625 -100 C320 270 740 470 475 830 C340 1010 630 1150 465 1390" fill="none" stroke="#a7f3d0" strokeWidth="34" />
        <path d="M425 -100 C125 255 555 430 260 765 C90 965 440 1100 235 1390" fill="none" stroke="#ffffff" strokeWidth="13" />
        <path d="M510 -100 C210 260 640 450 345 795 C190 985 520 1120 330 1390" fill="none" stroke="#ffffff" strokeWidth="15" />
      </svg>

      <svg
        viewBox="0 0 850 520"
        preserveAspectRatio="none"
        className="absolute -bottom-24 -left-40 hidden h-[500px] w-[900px] xl:block"
      >
        <path d="M-120 500 C190 70 380 470 940 20" fill="none" stroke="#047857" strokeWidth="70" />
        <path d="M-130 550 C210 120 410 520 960 75" fill="none" stroke="#10b981" strokeWidth="48" />
        <path d="M-140 600 C230 165 440 565 980 130" fill="none" stroke="#bef264" strokeWidth="30" />
        <path d="M-110 455 C165 30 350 420 900 -20" fill="none" stroke="#a7f3d0" strokeWidth="34" />
        <path d="M-120 525 C200 95 395 495 950 55" fill="none" stroke="#ffffff" strokeWidth="14" />
      </svg>
    </div>
  );
}

function BannerBienvenida({ nombre }: { nombre: string }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white/95 shadow-xl shadow-emerald-900/10 backdrop-blur-sm sm:rounded-[32px]">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/70" />
      <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-lime-100/50" />

      <svg
        aria-hidden="true"
        viewBox="0 0 400 500"
        preserveAspectRatio="none"
        className="pointer-events-none absolute right-[28%] top-0 hidden h-full w-52 opacity-25 lg:block"
      >
        <path d="M320 -20 C80 120 340 290 90 540" fill="none" stroke="#047857" strokeWidth="24" />
        <path d="M365 -20 C125 130 390 300 140 540" fill="none" stroke="#34d399" strokeWidth="18" />
        <path d="M275 -20 C35 110 290 280 45 540" fill="none" stroke="#bef264" strokeWidth="12" />
      </svg>

      <div className="relative grid min-w-0 lg:min-h-[420px] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex min-w-0 flex-col justify-center p-4 min-[375px]:p-5 sm:p-10 lg:p-14">
          <span className="mb-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[10px] font-black leading-snug tracking-normal text-emerald-700 min-[375px]:text-[11px] sm:mb-5 sm:rounded-full sm:px-4 sm:text-xs sm:tracking-[0.12em]">
            <BusFront size={16} />
            SINDICATO AUTOTRANSPORTE TRANS 2 DE JUNIO
          </span>

          <h2 className="max-w-2xl break-words text-[clamp(1.55rem,7.2vw,2.25rem)] font-black leading-tight text-slate-900 sm:text-5xl">
            Bienvenido, <span className="break-words text-emerald-700">{nombre}</span>
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 min-[375px]:text-base sm:mt-5 sm:leading-8 sm:text-lg">
            Compra o reserva tu pasaje de manera rápida, elige tu asiento y
            recibe tu ticket digital con código QR.
          </p>

          <div className="mt-5 flex min-w-0 flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
            <Link
              to="/pasajero/comprar-reservar"
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 sm:rounded-2xl sm:px-7 sm:py-4 sm:text-base"
            >
              <Ticket size={20} />
              Comprar pasaje
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/pasajero/mis-reservas"
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 sm:rounded-2xl sm:px-7 sm:py-4 sm:text-base"
            >
              <CalendarDays size={20} />
              Ver mis reservas
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-xs font-bold text-slate-600 sm:mt-8 sm:gap-4 sm:text-sm">
            <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Compra segura
            </span>
            <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <QrCode size={18} className="text-emerald-600" />
              Ticket digital
            </span>
            <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Armchair size={18} className="text-emerald-600" />
              Selección de asiento
            </span>
          </div>
        </div>

        <div className="relative hidden min-h-[420px] overflow-hidden lg:block">
          <img
            src={fondo}
            alt="Transporte de pasajeros"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/15 to-emerald-950/30" />
          <div className="absolute bottom-8 right-8 max-w-xs rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <BusFront size={25} />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Viaja con confianza
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Consulta rutas, horarios y asientos disponibles desde cualquier
              dispositivo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatearFechaViaje(fecha: string): string {
  const [anio, mes, dia] = fecha
    .substring(0, 10)
    .split("-")
    .map(Number);

  const fechaLocal = new Date(
    anio,
    mes - 1,
    dia,
  );

  if (Number.isNaN(fechaLocal.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(fechaLocal);
}

function obtenerFechaHoraViaje(viaje: Viaje): number {
  const fecha = String(viaje.fecha || "").substring(0, 10);
  const hora = String(viaje.horaSalida || "00:00").substring(0, 5);
  const fechaHora = new Date(`${fecha}T${hora}:00`);

  return fechaHora.getTime();
}

function obtenerViajesVigentes(viajes: Viaje[]): Viaje[] {
  const ahora = Date.now();

  return [...viajes]
    .filter((viaje) => {
      const fechaHora = obtenerFechaHoraViaje(viaje);
      const estado = String(viaje.estado || "").toUpperCase();

      return (
        Number.isFinite(fechaHora) &&
        fechaHora >= ahora &&
        estado === "PROGRAMADO" &&
        viaje.vehiculo?.estado !== false &&
        viaje.asientosDisponibles > 0
      );
    })
    .sort(
      (a, b) => obtenerFechaHoraViaje(a) - obtenerFechaHoraViaje(b),
    );
}

function obtenerIdentificadorFlota(viaje: Viaje): string {
  const vehiculo = viaje.vehiculo as Viaje["vehiculo"] & {
    numeroFlota?: string | number;
  };

  if (
    vehiculo.numeroFlota !== undefined &&
    vehiculo.numeroFlota !== null &&
    String(vehiculo.numeroFlota).trim()
  ) {
    return `Flota ${String(vehiculo.numeroFlota).trim()}`;
  }

  return `Placa ${vehiculo.placa || "sin registrar"}`;
}

/**
 * Salidas separadas por tipo de servicio.
 * Nunca se clasifica por nombre del chofer ni por la ruta:
 * un mismo chofer puede trabajar en vehículos distintos.
 */
function SeccionRutas({
  viajes,
  cargando,
  error,
  onActualizar,
}: {
  viajes: Viaje[];
  cargando: boolean;
  error: string;
  onActualizar: () => Promise<void>;
}) {
  const viajesVigentes = obtenerViajesVigentes(viajes);

  const salidasFlotas = viajesVigentes.filter(
    (viaje) => String(viaje.vehiculo?.tipo ?? "").trim().toUpperCase() === "FLOTA",
  );

  const salidasRapidas = viajesVigentes.filter((viaje) => {
    const tipo = String(viaje.vehiculo?.tipo ?? "").trim().toUpperCase();
    return tipo === "NOAH" || tipo === "HIACE";
  });

  return (
    <section className="mt-8 min-w-0 sm:mt-12" aria-labelledby="titulo-salidas">
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600 sm:text-sm sm:tracking-[0.2em]">
            Salidas del sistema
          </span>
          <h3 id="titulo-salidas" className="mt-2 break-words text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
            Salidas disponibles
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
            Elige entre Flotas o Noah y Hiace. Consulta el chofer y continúa a comprar tu pasaje.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onActualizar()}
          disabled={cargando}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:rounded-2xl sm:px-5"
        >
          <RefreshCw size={18} className={cargando ? "animate-spin" : ""} />
          Actualizar viajes
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-bold text-red-700 sm:px-5">
          {error}
        </div>
      )}

      {cargando ? (
        <EstadoRutas
          icono={<RefreshCw size={32} className="animate-spin" />}
          titulo="Cargando viajes publicados"
          descripcion="Estamos consultando las próximas rutas y horarios disponibles."
        />
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
          <PanelSectorSalidas
            titulo="Flotas"
            subtitulo="Viajes programados"
            descripcion="Horarios y asientos asignados."
            ayuda="Salidas del sector Flotas, listas para elegir."
            sector="FLOTA"
            viajes={salidasFlotas}
            icono={<BusFront size={28} />}
          />
          <PanelSectorSalidas
            titulo="Noah y Hiace"
            subtitulo="Salidas rápidas"
            descripcion="Vehículos de 7 y 10 pasajeros."
            ayuda="Salidas del sector Noah y Hiace, sin mezclar flotas."
            sector="RAPIDO"
            viajes={salidasRapidas}
            icono={<CarFront size={28} />}
          />
        </div>
      )}
    </section>
  );
}

function PanelSectorSalidas({
  titulo,
  subtitulo,
  descripcion,
  ayuda,
  sector,
  viajes,
  icono,
}: {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  ayuda: string;
  sector: "FLOTA" | "RAPIDO";
  viajes: Viaje[];
  icono: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-emerald-200 bg-white/90 p-2.5 shadow-lg shadow-emerald-900/5 min-[375px]:p-3 sm:rounded-[28px] sm:p-4 xl:p-5">
      <div className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-3 py-4 sm:px-5 sm:py-5">
        <div className="relative flex min-w-0 items-start gap-3 sm:gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 text-white shadow-md sm:h-14 sm:w-14 sm:rounded-2xl">
            {icono}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">{titulo}</h4>
            <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-black text-emerald-800 sm:px-3">
              {sector === "FLOTA" ? <CalendarDays size={14} /> : <Zap size={14} />}
              {subtitulo}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm">{descripcion}</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-xs font-black text-emerald-800" title="Salidas disponibles">
            {viajes.length}
          </span>
        </div>
      </div>

      <p className="my-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold leading-5 text-emerald-900 sm:text-sm">
        {ayuda}
      </p>

      {viajes.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white px-4 py-7 text-center">
          <span className="text-emerald-600">{icono}</span>
          <p className="mt-3 text-sm font-black text-slate-900">No hay salidas disponibles en {titulo}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Prueba con otra fecha o vuelve a actualizar las salidas.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4">
          {viajes.map((viaje) => (
            <TarjetaViajePublicado key={viaje.id} viaje={viaje} sector={sector} />
          ))}
        </div>
      )}
    </section>
  );
}

function EstadoRutas({
  icono,
  titulo,
  descripcion,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-emerald-200 bg-white/90 px-6 py-12 text-center shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {icono}
      </div>

      <h4 className="mt-5 text-xl font-black text-slate-900">
        {titulo}
      </h4>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {descripcion}
      </p>
    </div>
  );
}

/**
 * Los nombres se extraen del viaje y vehículo reales.
 * No se muestran datos inventados del conductor.
 */
function obtenerDatosChofer(viaje: Viaje): {
  nombre: string;
  codigo: string | null;
  habitual: boolean;
} {
  const asignado = viaje.chofer;
  const habitual = viaje.vehiculo?.choferHabitual;
  const chofer = asignado ?? habitual;
  if (!chofer) {
    return { nombre: "Por confirmar", codigo: null, habitual: false };
  }
  const nombre = [chofer.nombre, chofer.apellido].filter(Boolean).join(" ").trim();
  const datos = chofer as typeof chofer & {
    codigoChofer?: string | number | null;
  };
  const codigo = datos.codigo ?? datos.codigoChofer;
  return {
    nombre: nombre || "Por confirmar",
    codigo: codigo == null || String(codigo).trim() === "" ? null : String(codigo),
    habitual: !asignado && Boolean(habitual),
  };
}

function TarjetaViajePublicado({
  viaje,
  sector,
}: {
  viaje: Viaje;
  sector: "FLOTA" | "RAPIDO";
}) {
  const pocosAsientos = viaje.asientosDisponibles <= 8;
  const chofer = obtenerDatosChofer(viaje);
  const esFlota = sector === "FLOTA";
  const identificacionVehiculo = esFlota
    ? obtenerIdentificadorFlota(viaje)
    : `${viaje.vehiculo.tipo === "HIACE" ? "Toyota Hiace" : "Toyota Noah"} · ${viaje.vehiculo.placa || "Sin placa"}`;

  // Se pasan los identificadores reales para abrir directamente esta salida.
  // ComprarReservar.tsx debe leer location.state para preseleccionarla.
  const seleccionCompra = {
    sector,
    rutaId: viaje.ruta.id,
    fecha: viaje.fecha.substring(0, 10),
    horaSalida: viaje.horaSalida,
    viajeId: viaje.id,
    vehiculoId: viaje.vehiculo.id,
  };

  // Conservar la selección también en la URL para que no se pierda
  // al actualizar la página, al abrir el enlace o al usar la PWA.
  const destinoCompra = {
    pathname: "/pasajero/comprar-reservar",
    search: `?${new URLSearchParams(seleccionCompra).toString()}`,
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md shadow-emerald-900/5 transition duration-200 hover:border-emerald-300 hover:shadow-lg sm:rounded-[22px]">
      <div className="min-w-0 p-3 min-[375px]:p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-sm sm:h-12 sm:w-12">
            {esFlota ? <BusFront size={23} /> : <CarFront size={23} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-emerald-600">
              {esFlota ? "Próxima salida · Flota" : "Salida rápida · Noah/Hiace"}
            </p>
            <h5 className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 break-words text-sm font-black leading-snug text-slate-950 min-[375px]:text-base sm:text-lg">
              <span>{viaje.ruta.origen}</span>
              <ArrowRight size={16} className="shrink-0 text-emerald-500" />
              <span>{viaje.ruta.destino}</span>
            </h5>
            <p className="mt-1.5 break-words text-[11px] font-bold text-emerald-700 sm:text-xs">
              {identificacionVehiculo}
            </p>
          </div>
          <span className="max-w-[38%] shrink-0 rounded-xl bg-emerald-50 px-2 py-1.5 text-right text-xs font-black tabular-nums text-emerald-900 sm:px-3 sm:text-sm">
            Bs. {Number(viaje.precio || 0).toFixed(2)}
          </span>
        </div>

        <div className="mt-3 flex min-w-0 items-start gap-2 rounded-xl border border-emerald-200 bg-gradient-to-r from-lime-50 via-emerald-50 to-lime-50 px-3 py-2.5">
          <UserRound size={20} className="mt-0.5 shrink-0 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:text-xs">
              {chofer.habitual ? "Chofer habitual" : "Chofer del viaje"}
            </p>
            <p className="break-words text-base font-black leading-snug text-emerald-950 min-[375px]:text-lg sm:text-xl">
              {chofer.nombre}
            </p>
            {chofer.codigo && (
              <p className="mt-1 text-xs font-semibold text-emerald-700">Código: {chofer.codigo}</p>
            )}
          </div>
        </div>

        <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 min-[375px]:gap-2.5 sm:grid-cols-3">
          <DatoViaje icono={<CalendarDays size={18} />} etiqueta="Fecha" valor={formatearFechaViaje(viaje.fecha)} />
          <DatoViaje icono={<Clock size={18} />} etiqueta="Hora" valor={viaje.horaSalida.substring(0, 5)} />
          <div className="col-span-2 min-w-0 sm:col-span-1">
            <DatoViaje
              icono={<Armchair size={18} />}
              etiqueta="Disponibilidad"
              valor={`${viaje.asientosDisponibles} asientos`}
              alerta={pocosAsientos}
            />
          </div>
        </div>

        <p className="mt-3 flex min-w-0 items-start gap-2 break-words rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 sm:items-center">
          <MapPin size={16} className="shrink-0 text-emerald-600" />
          {viaje.vehiculo.marca} {viaje.vehiculo.modelo} · {viaje.vehiculo.placa}
        </p>

        <Link
          to={destinoCompra}
          state={seleccionCompra}
          className="mt-3 flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-3 py-3 text-center text-sm font-black text-white shadow-lg shadow-emerald-700/15 transition hover:from-emerald-800 hover:to-emerald-700 sm:min-h-14 sm:text-base"
        >
          <Ticket size={18} />
          {esFlota ? "Comprar ahora" : "Ir a comprar"}
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

function DatoViaje({
  icono,
  etiqueta,
  valor,
  alerta = false,
}: {
  icono: ReactNode;
  etiqueta: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-2.5 min-[375px]:p-3 sm:rounded-2xl sm:p-4 ${
        alerta
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-100 bg-emerald-50/60"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          alerta ? "text-amber-700" : "text-emerald-700"
        }`}
      >
        {icono}
        <span className="min-w-0 break-words text-[9px] font-black uppercase tracking-normal text-slate-500 min-[375px]:text-[10px] sm:tracking-wider">
          {etiqueta}
        </span>
      </div>
      <p className="mt-2 break-words text-xs font-black text-slate-900 min-[375px]:text-sm sm:mt-3 sm:text-base">
        {valor}
      </p>
    </div>
  );
}

function TarjetaEstadistica({
  icono,
  valor,
  titulo,
  descripcion,
}: TarjetaEstadisticaProps) {
  return (
    <article className="group min-w-0 rounded-xl border border-emerald-100 bg-white/95 p-3 shadow-md shadow-emerald-900/5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 min-[375px]:p-4 sm:rounded-[24px] sm:p-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-1.5 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white sm:h-12 sm:w-12 sm:rounded-2xl">
          {icono}
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 min-[375px]:text-[10px] sm:px-3 sm:text-xs">
          ACTIVO
        </span>
      </div>
      <p className="mt-3 break-words text-2xl font-black text-slate-900 min-[375px]:text-3xl sm:mt-6 sm:text-4xl">{valor}</p>
      <h3 className="mt-1 break-words text-xs font-black leading-tight text-slate-800 min-[375px]:text-sm sm:mt-2 sm:text-base">{titulo}</h3>
      <p className="mt-1 break-words text-[11px] leading-snug text-slate-500 min-[375px]:text-xs sm:text-sm">{descripcion}</p>
    </article>
  );
}

export default DashboardPasajero;
