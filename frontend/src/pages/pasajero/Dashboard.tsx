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
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f6faf7] text-slate-800">
      <Cabecera usuario={usuario} cerrarSesion={cerrarSesion} />
      <FondoDecorativo />

      <main className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10 2xl:px-12">
        <BannerBienvenida nombre={usuario.nombre || "Pasajero"} />

        <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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

        <section className="relative mt-12 overflow-hidden rounded-[30px] bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 p-7 text-white shadow-xl shadow-emerald-900/20 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[34px] border-lime-300/10" />
          <div className="pointer-events-none absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-emerald-400/10" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">
                Atención al pasajero
              </span>
              <h3 className="mt-3 text-3xl font-black">
                ¿Necesitas ayuda con tu viaje?
              </h3>
              <p className="mt-3 leading-7 text-emerald-100">
                Registra un reclamo o consulta el estado de tus solicitudes
                desde tu cuenta.
              </p>
            </div>

            <Link
              to="/pasajero/mis-reclamos"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-50"
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

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-10 2xl:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link to="/pasajero" className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-white shadow-lg">
              <img
                src={logo}
                alt="Logo Trans 2 de Junio"
                className="h-11 w-11 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-black text-white drop-shadow-sm sm:text-xl">
                Trans 2 de Junio
              </h1>
              <p className="text-[11px] font-black tracking-[0.22em] text-emerald-100">
                SISTEMA DE PASAJES
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 xl:hidden">
            <NotificacionesPasajero />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-emerald-800 shadow-md">
              {obtenerInicial(usuario.nombre)}
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600 transition hover:bg-red-50"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-1 xl:overflow-visible xl:pb-0">
          <Link
            to="/pasajero"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5"
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
      className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-emerald-50 transition hover:bg-white/15 hover:text-white"
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
    <section className="relative overflow-hidden rounded-[32px] border border-emerald-100 bg-white/95 shadow-xl shadow-emerald-900/10 backdrop-blur-sm">
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

      <div className="relative grid min-h-[420px] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black tracking-[0.18em] text-emerald-700">
            <BusFront size={16} />
            SINDICATO AUTOTRANSPORTE TRANS 2 DE JUNIO
          </span>

          <h2 className="max-w-2xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
            Bienvenido, <span className="text-emerald-700">{nombre}</span>
          </h2>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Compra o reserva tu pasaje de manera rápida, elige tu asiento y
            recibe tu ticket digital con código QR.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/pasajero/comprar-reservar"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-7 py-4 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              <Ticket size={20} />
              Comprar pasaje
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/pasajero/mis-reservas"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-7 py-4 font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              <CalendarDays size={20} />
              Ver mis reservas
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Compra segura
            </span>
            <span className="flex items-center gap-2">
              <QrCode size={18} className="text-emerald-600" />
              Ticket digital
            </span>
            <span className="flex items-center gap-2">
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
        estado === "PROGRAMADO"
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

  return (
    <section className="mt-12">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
            Próximos viajes
          </span>
          <h3 className="mt-2 text-3xl font-black text-slate-900">
            Rutas y próximas salidas
          </h3>
          <p className="mt-2 text-slate-500">
            Encuentra tu próximo viaje y reserva tus asientos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onActualizar()}
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={18}
            className={
              cargando
                ? "animate-spin"
                : ""
            }
          />
          Actualizar viajes
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <EstadoRutas
          icono={
            <RefreshCw
              size={32}
              className="animate-spin"
            />
          }
          titulo="Cargando viajes publicados"
          descripcion="Estamos consultando las próximas rutas y horarios disponibles."
        />
      ) : viajesVigentes.length === 0 ? (
        <EstadoRutas
          icono={<BusFront size={32} />}
          titulo="No hay viajes programados"
          descripcion="Cuando la administradora programe una ruta, sus fechas y horarios se mostrarán automáticamente en esta sección."
        />
      ) : (
        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          {viajesVigentes.map((viaje) => (
            <TarjetaViajePublicado
              key={viaje.id}
              viaje={viaje}
            />
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

function TarjetaViajePublicado({ viaje }: { viaje: Viaje }) {
  const pocosAsientos = viaje.asientosDisponibles <= 8;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
      <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50 p-6">
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-emerald-100/70" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-lg shadow-emerald-800/20">
            <BusFront size={31} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
              Próxima salida
            </p>
            <h4 className="mt-2 flex flex-wrap items-center gap-2 text-xl font-black leading-tight text-slate-950">
              <span>{viaje.ruta.origen}</span>
              <ArrowRight size={19} className="text-emerald-500" />
              <span>{viaje.ruta.destino}</span>
            </h4>

            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800">
              <BusFront size={15} />
              {obtenerIdentificadorFlota(viaje)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="grid grid-cols-2 gap-3">
          <DatoViaje
            icono={<CalendarDays size={20} />}
            etiqueta="Fecha"
            valor={formatearFechaViaje(viaje.fecha)}
          />
          <DatoViaje
            icono={<Clock size={20} />}
            etiqueta="Hora"
            valor={viaje.horaSalida}
          />
          <DatoViaje
            icono={<Ticket size={20} />}
            etiqueta="Precio"
            valor={`Bs. ${Number(viaje.precio || 0).toFixed(2)}`}
          />
          <DatoViaje
            icono={<Armchair size={20} />}
            etiqueta="Disponibilidad"
            valor={`${viaje.asientosDisponibles} asientos`}
            alerta={pocosAsientos}
          />
        </div>

        <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
          <MapPin size={17} className="shrink-0 text-emerald-600" />
          {viaje.vehiculo.marca} {viaje.vehiculo.modelo} · {viaje.vehiculo.placa}
        </p>

        <Link
          to="/pasajero/comprar-reservar"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-4 font-black text-white shadow-lg shadow-emerald-700/15 transition hover:from-emerald-800 hover:to-emerald-700"
        >
          Ver salidas y comprar
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
      className={`rounded-2xl border p-4 ${
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
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {etiqueta}
        </span>
      </div>
      <p className="mt-3 break-words text-sm font-black text-slate-900 sm:text-base">
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
    <article className="group rounded-[24px] border border-emerald-100 bg-white/95 p-6 shadow-md shadow-emerald-900/5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
          {icono}
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          ACTIVO
        </span>
      </div>
      <p className="mt-6 text-4xl font-black text-slate-900">{valor}</p>
      <h3 className="mt-2 font-black text-slate-800">{titulo}</h3>
      <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
    </article>
  );
}

export default DashboardPasajero;
