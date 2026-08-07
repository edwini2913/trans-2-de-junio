import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BusFront,
  CheckCircle2,
  Clock3,
  Globe2,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  QrCode,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Ticket,
  UserPlus,
  X,
} from "lucide-react";

import fondo from "../assets/fondo.jpg";
import logo from "../assets/logo.png";
import taxi1 from "../assets/noa.png";
import cbba from "../assets/CBBA.jpg";
import sacaba from "../assets/SACABA.jpg";
import scz from "../assets/SCZ.jpg";
import sucre from "../assets/SUCRE.jpg";

type Estadistica = {
  valor: string;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
};

type Destino = {
  nombre: string;
  descripcion: string;
  imagen: string;
};

type Paso = {
  numero: string;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
};

const ESTADISTICAS: Estadistica[] = [
  {
    valor: "5000+",
    titulo: "Pasajes vendidos",
    descripcion: "Compras y reservas registradas de forma segura.",
    icono: <Ticket size={25} />,
  },
  {
    valor: "15+",
    titulo: "Vehículos disponibles",
    descripcion: "Flotas registradas para brindar el servicio.",
    icono: <BusFront size={25} />,
  },
  {
    valor: "120+",
    titulo: "Viajes realizados",
    descripcion: "Salidas administradas digitalmente.",
    icono: <Route size={25} />,
  },
  {
    valor: "24/7",
    titulo: "Disponibilidad",
    descripcion: "Acceso desde celular o computadora.",
    icono: <Clock3 size={25} />,
  },
];

const DESTINOS: Destino[] = [
  {
    nombre: "Chimoré",
    descripcion: "Punto principal de salida",
    imagen: fondo,
  },
  {
    nombre: "Cochabamba",
    descripcion: "Viajes cómodos y seguros",
    imagen: cbba,
  },
  {
    nombre: "Santa Cruz",
    descripcion: "Consulta horarios disponibles",
    imagen: scz,
  },
  {
    nombre: "Sacaba",
    descripcion: "Reserva tu asiento desde el celular",
    imagen: sacaba,
  },
  {
    nombre: "Sucre",
    descripcion: "Compra rápida, segura y sin filas",
    imagen: sucre,
  },
];

const PASOS: Paso[] = [
  {
    numero: "01",
    titulo: "Crea tu cuenta",
    descripcion: "Registra tus datos personales e inicia sesión.",
    icono: <UserPlus size={25} />,
  },
  {
    numero: "02",
    titulo: "Busca tu viaje",
    descripcion: "Selecciona ruta, fecha y horario disponible.",
    icono: <Search size={25} />,
  },
  {
    numero: "03",
    titulo: "Elige tu asiento",
    descripcion: "Selecciona el asiento que prefieras.",
    icono: <BusFront size={25} />,
  },
  {
    numero: "04",
    titulo: "Confirma la compra",
    descripcion: "Revisa los datos y completa el pago.",
    icono: <CheckCircle2 size={25} />,
  },
  {
    numero: "05",
    titulo: "Recibe tu QR",
    descripcion: "Obtén tu ticket digital listo para abordar.",
    icono: <QrCode size={25} />,
  },
];

function Home() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const cerrarMenuEnEscritorio = () => {
      if (window.innerWidth >= 1024) {
        setMenuAbierto(false);
      }
    };

    window.addEventListener("resize", cerrarMenuEnEscritorio);

    return () => {
      window.removeEventListener("resize", cerrarMenuEnEscritorio);
    };
  }, []);

  function irASeccion(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setMenuAbierto(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f9f6] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-[#005536]/95 shadow-lg shadow-emerald-950/10 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white px-1 shadow-lg">
              <img
                src={logo}
                alt="Logo Trans 2 de Junio"
                className="h-full w-full scale-[1.2] object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-black text-white sm:text-base">
                Trans 2 de Junio
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">
                Venta y reserva de pasajes
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <BotonNavegacion texto="Inicio" onClick={() => irASeccion("inicio")} />
            <BotonNavegacion texto="Destinos" onClick={() => irASeccion("destinos")} />
            <BotonNavegacion texto="Cómo funciona" onClick={() => irASeccion("como-funciona")} />
            <BotonNavegacion texto="Contacto" onClick={() => irASeccion("contacto")} />
          </nav>

          <button
            type="button"
            onClick={() => setMenuAbierto((valor) => !valor)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white lg:hidden"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            {menuAbierto ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {menuAbierto && (
          <div className="border-t border-white/15 bg-[#005536] px-4 py-4 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2">
              <EnlaceMenuMovil texto="Inicio" onClick={() => irASeccion("inicio")} />
              <EnlaceMenuMovil texto="Destinos" onClick={() => irASeccion("destinos")} />
              <EnlaceMenuMovil texto="Cómo funciona" onClick={() => irASeccion("como-funciona")} />
              <EnlaceMenuMovil texto="Contacto" onClick={() => irASeccion("contacto")} />
            </div>
          </div>
        )}
      </header>

      <section id="inicio" className="relative isolate overflow-hidden pt-[74px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fondo})` }}
        />
        <div className="absolute inset-0 bg-white/48" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-emerald-50/70 to-lime-100/18" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_77%_43%,rgba(163,230,53,0.24),transparent_27%),radial-gradient(circle_at_17%_30%,rgba(16,185,129,0.11),transparent_27%)]" />

        <div className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full border-[62px] border-emerald-700/5" />
        <div className="pointer-events-none absolute right-7 top-24 grid grid-cols-6 gap-3 opacity-20">
          {Array.from({ length: 30 }).map((_, indice) => (
            <span key={indice} className="h-2 w-2 rounded-full bg-emerald-700" />
          ))}
        </div>

        <div className="relative z-10 mx-auto grid min-h-[660px] max-w-7xl items-center gap-10 px-5 pb-24 pt-14 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-28 lg:pt-16">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm backdrop-blur-md sm:text-xs">
              <ShieldCheck size={17} />
              Viajes rápidos y seguros
            </div>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:mx-0 lg:text-6xl xl:text-7xl">
              Bienvenido a
              <span className="block text-emerald-700">Trans 2 de Junio</span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-xl font-black text-slate-700 sm:text-2xl lg:mx-0">
              Viaja seguro, rápido y confiable
            </p>

            <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-8 text-slate-600 sm:text-lg lg:mx-0">
              Compra o reserva tus pasajes desde el celular, elige tu asiento y
              recibe tu ticket electrónico con código QR.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                to="/register"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-emerald-700 px-7 font-black text-white shadow-[0_18px_45px_rgba(0,100,65,0.25)] transition hover:-translate-y-1 hover:bg-emerald-800"
              >
                <UserPlus size={20} />
                Crear cuenta
                <ArrowRight size={19} />
              </Link>

              <Link
                to="/login"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border-2 border-emerald-700 bg-white/80 px-7 font-black text-emerald-700 backdrop-blur-md transition hover:-translate-y-1 hover:bg-emerald-50"
              >
                <Lock size={19} />
                Iniciar sesión
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Etiqueta icono={<Clock3 size={16} />} texto="Disponible 24/7" />
              <Etiqueta icono={<ShieldCheck size={16} />} texto="Compra segura" />
              <Etiqueta icono={<Smartphone size={16} />} texto="Atención al cliente" />
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[430px] w-full max-w-[720px] items-center justify-center sm:min-h-[540px] lg:min-h-[570px]">
            {/* Halo e iluminación */}
            <div className="pointer-events-none absolute h-[330px] w-[330px] rounded-full bg-lime-300/30 blur-3xl sm:h-[470px] sm:w-[470px]" />
            <div className="pointer-events-none absolute h-[310px] w-[310px] rounded-full border border-emerald-300/35 bg-gradient-to-br from-white/45 via-emerald-100/35 to-lime-200/30 shadow-[0_35px_85px_rgba(0,110,70,0.20)] sm:h-[445px] sm:w-[445px]" />
            <div className="pointer-events-none absolute h-[270px] w-[270px] rounded-full border-[18px] border-emerald-500/12 sm:h-[390px] sm:w-[390px]" />

            {/* Formas verdes detrás de la Noah */}
            <div className="pointer-events-none absolute left-[7%] top-[34%] h-16 w-16 rounded-full bg-emerald-500 shadow-[0_18px_38px_rgba(16,185,129,0.35)] sm:h-24 sm:w-24" />
            <div className="pointer-events-none absolute left-[17%] top-[22%] h-7 w-7 rounded-full bg-lime-400 shadow-lg sm:h-10 sm:w-10" />
            <div className="pointer-events-none absolute left-[11%] top-[58%] h-5 w-5 rounded-full bg-emerald-700" />
            <div className="pointer-events-none absolute right-[7%] top-[24%] h-11 w-11 rounded-full bg-lime-400 shadow-lg sm:h-16 sm:w-16" />
            <div className="pointer-events-none absolute right-[3%] top-[48%] h-5 w-5 rounded-full bg-emerald-600" />
            <div className="pointer-events-none absolute right-[15%] top-[64%] h-3 w-3 rounded-full bg-lime-500" />
            <div className="pointer-events-none absolute left-[18%] top-[16%] h-40 w-24 rotate-[26deg] rounded-[60%] bg-emerald-400/15 blur-sm sm:h-52 sm:w-32" />
            <div className="pointer-events-none absolute right-[13%] top-[15%] h-44 w-28 -rotate-[25deg] rounded-[60%] bg-lime-300/18 blur-sm sm:h-56 sm:w-36" />

            {/* Plataforma circular 3D */}
            <div className="pointer-events-none absolute bottom-[34px] left-1/2 z-[2] h-[118px] w-[92%] max-w-[590px] -translate-x-1/2 rounded-[50%] bg-emerald-950/22 blur-2xl sm:bottom-[38px] sm:h-[145px]" />
            <div className="pointer-events-none absolute bottom-[58px] left-1/2 z-[3] h-[94px] w-[88%] max-w-[570px] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-white via-emerald-50 to-emerald-200 shadow-[0_34px_55px_rgba(0,80,45,0.30)] sm:bottom-[66px] sm:h-[118px]" />
            <div className="pointer-events-none absolute bottom-[72px] left-1/2 z-[4] h-[68px] w-[82%] max-w-[530px] -translate-x-1/2 rounded-[50%] border border-white/90 bg-gradient-to-r from-lime-100 via-white to-emerald-100 shadow-inner sm:bottom-[82px] sm:h-[84px]" />
            <div className="pointer-events-none absolute bottom-[84px] left-1/2 z-[5] h-[42px] w-[72%] max-w-[460px] -translate-x-1/2 rounded-[50%] bg-white/85 sm:bottom-[98px] sm:h-[54px]" />

            {/* Noah transparente sobre la plataforma */}
            <img
              src={taxi1}
              alt="Vehículo Noah Trans 2 de Junio"
              className="relative z-10 mb-8 h-[315px] w-[390px] object-contain object-center drop-shadow-[0_30px_28px_rgba(0,70,45,0.34)] sm:mb-10 sm:h-[440px] sm:w-[590px] lg:h-[480px] lg:w-[650px]"
            />

            {/* Logo flotante */}
            <div className="absolute right-[2%] top-[8%] z-20 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/95 p-2 shadow-[0_18px_40px_rgba(0,80,45,0.25)] backdrop-blur-md sm:right-[7%] sm:h-28 sm:w-28">
              <img
                src={logo}
                alt="Logo Trans 2 de Junio"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 1440 125"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-1 left-0 z-20 h-20 w-full sm:h-28"
          aria-hidden="true"
        >
          <path
            d="M0,48 C230,125 455,20 720,70 C980,115 1200,24 1440,63 L1440,125 L0,125 Z"
            fill="#f4f9f6"
          />
        </svg>
      </section>

      <section className="relative isolate overflow-hidden px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <FondoSeccionDecorativo variante="estadisticas" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ESTADISTICAS.map((estadistica) => (
            <TarjetaEstadistica key={estadistica.titulo} estadistica={estadistica} />
          ))}
        </div>
      </section>

      <section
        id="destinos"
        className="relative isolate scroll-mt-24 overflow-hidden px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <FondoSeccionDecorativo variante="destinos" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <EncabezadoSeccion
              alineacion="izquierda"
              etiqueta="Destinos destacados"
              titulo="Encuentra tu próxima salida"
              descripcion="Consulta rutas disponibles y accede rápidamente al sistema para reservar tu próximo viaje."
            />
            <Link
              to="/login"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Ver todos los viajes
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {DESTINOS.map((destino, indice) => (
              <TarjetaDestino key={destino.nombre} destino={destino} destacado={indice === 0} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative isolate scroll-mt-24 overflow-hidden bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <FondoSeccionDecorativo variante="pasos" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <EncabezadoSeccion
            etiqueta="Proceso sencillo"
            titulo="Compra tu pasaje en cinco pasos"
            descripcion="La plataforma guía al pasajero desde el registro hasta la generación del ticket digital."
          />

          <div className="relative mt-12">
            <div className="absolute left-[10%] right-[10%] top-10 hidden h-1 rounded-full bg-gradient-to-r from-emerald-200 via-emerald-500 to-lime-300 lg:block" />
            <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {PASOS.map((paso) => (
                <TarjetaPaso key={paso.numero} paso={paso} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer
        id="contacto"
        className="scroll-mt-24 bg-gradient-to-r from-[#003b26] via-[#005e3b] to-[#00794b] px-4 pb-8 pt-16 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-lg">
                  <img src={logo} alt="Logo Trans 2 de Junio" className="h-full w-full scale-[1.2] object-contain" />
                </div>
                <div>
                  <p className="font-black">Trans 2 de Junio</p>
                  <p className="mt-1 text-xs text-emerald-100">Transporte de pasajeros</p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-100">
                Plataforma para la venta, reserva, generación y validación digital de pasajes.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <BotonRedSocial etiqueta="WhatsApp" icono={<MessageCircle size={19} />} />
                <BotonRedSocial etiqueta="Sitio web" icono={<Globe2 size={19} />} />
                <BotonRedSocial etiqueta="Aplicación" icono={<Smartphone size={19} />} />
              </div>
            </div>

            <div>
              <h4 className="font-black">Enlaces rápidos</h4>
              <div className="mt-5 space-y-3 text-sm text-emerald-100">
                <EnlaceFooter texto="Inicio" onClick={() => irASeccion("inicio")} />
                <EnlaceFooter texto="Destinos" onClick={() => irASeccion("destinos")} />
                <EnlaceFooter texto="Cómo funciona" onClick={() => irASeccion("como-funciona")} />
              </div>
            </div>

            <div>
              <h4 className="font-black">Servicios</h4>
              <div className="mt-5 space-y-3 text-sm text-emerald-100">
                <p>Venta de pasajes</p>
                <p>Reserva de asientos</p>
                <p>Ticket digital QR</p>
                <p>Validación Blockchain</p>
                <p>Atención de reclamos</p>
              </div>
            </div>

            <div>
              <h4 className="font-black">Información</h4>
              <div className="mt-5 space-y-4 text-sm text-emerald-100">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-lime-300" />
                  <span>Chimoré, Cochabamba, Bolivia</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-0.5 shrink-0 text-lime-300" />
                  <span>Atención todos los días</span>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone size={18} className="mt-0.5 shrink-0 text-lime-300" />
                  <span>Compatible con celulares y computadoras</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-center text-xs text-emerald-100 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© 2026 Sindicato Autotransporte Trans 2 de Junio. Todos los derechos reservados.</p>
            <p>Sistema PWA de venta y reserva de pasajes</p>
          </div>
        </div>
      </footer>
    </main>
  );
}


type VarianteFondo = "estadisticas" | "destinos" | "pasos";

function FondoSeccionDecorativo({
  variante,
}: {
  variante: VarianteFondo;
}) {
  if (variante === "estadisticas") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -left-32 top-4 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-lime-200/25 blur-3xl" />
        <div className="absolute left-[12%] top-12 h-24 w-24 rounded-full border-[18px] border-emerald-100/55" />

        <div className="absolute right-[8%] top-10 grid grid-cols-5 gap-3 opacity-30">
          {Array.from({ length: 25 }).map((_, indice) => (
            <span
              key={indice}
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
          ))}
        </div>

        <svg
          viewBox="0 0 900 240"
          preserveAspectRatio="none"
          className="absolute -bottom-16 -left-28 h-56 w-[760px] opacity-25"
        >
          <path
            d="M-40 225 C170 20 310 215 520 80 C650 0 760 80 950 -30"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
          />
          <path
            d="M-55 240 C165 45 320 235 540 100 C675 20 790 100 965 -10"
            fill="none"
            stroke="#84cc16"
            strokeWidth="2"
          />
          <path
            d="M-70 255 C160 70 330 255 560 120 C700 40 815 120 980 10"
            fill="none"
            stroke="#047857"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  if (variante === "destinos") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(167,243,208,0.28),transparent_25%),radial-gradient(circle_at_94%_38%,rgba(217,249,157,0.28),transparent_28%)]" />

        <div className="absolute -left-28 top-1/3 h-72 w-72 rounded-full border-[52px] border-emerald-100/45" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-lime-100/45 blur-2xl" />
        <div className="absolute right-[12%] top-16 h-24 w-24 rounded-full bg-emerald-100/45 blur-xl" />
        <div className="absolute left-[4%] bottom-16 h-10 w-10 rounded-full bg-lime-300/35" />
        <div className="absolute left-[9%] bottom-28 h-5 w-5 rounded-full bg-emerald-500/30" />

        <div className="absolute left-[3%] top-16 grid grid-cols-6 gap-3 opacity-25">
          {Array.from({ length: 30 }).map((_, indice) => (
            <span
              key={indice}
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
          ))}
        </div>

        <svg
          viewBox="0 0 520 1000"
          preserveAspectRatio="none"
          className="absolute -right-24 top-0 hidden h-full w-[420px] opacity-25 lg:block"
        >
          <path
            d="M410 -40 C130 180 500 370 245 600 C80 750 410 865 210 1060"
            fill="none"
            stroke="#047857"
            strokeWidth="28"
          />
          <path
            d="M455 -40 C185 190 545 390 295 625 C135 775 455 890 265 1060"
            fill="none"
            stroke="#10b981"
            strokeWidth="18"
          />
          <path
            d="M365 -40 C80 165 455 350 195 575 C25 725 360 840 155 1060"
            fill="none"
            stroke="#bef264"
            strokeWidth="12"
          />
          <path
            d="M430 -40 C155 185 520 380 270 610 C105 760 435 880 235 1060"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -left-40 -top-20 h-96 w-96 rounded-full bg-emerald-100/45 blur-3xl" />
      <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-lime-100/45 blur-3xl" />
      <div className="absolute right-[8%] top-20 h-28 w-28 rounded-full border-[22px] border-emerald-100/45" />
      <div className="absolute left-[7%] bottom-20 h-14 w-14 rounded-full bg-lime-200/40" />

      <div className="absolute bottom-14 right-[16%] grid grid-cols-5 gap-3 opacity-25">
        {Array.from({ length: 25 }).map((_, indice) => (
          <span
            key={indice}
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
          />
        ))}
      </div>

      <svg
        viewBox="0 0 900 260"
        preserveAspectRatio="none"
        className="absolute -bottom-12 -left-28 h-64 w-[780px] opacity-25"
      >
        <path
          d="M-50 240 C145 30 320 245 525 105 C675 5 790 95 955 -25"
          fill="none"
          stroke="#047857"
          strokeWidth="3"
        />
        <path
          d="M-60 255 C150 55 330 260 545 125 C695 30 810 120 975 0"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
        />
        <path
          d="M-70 270 C155 80 340 275 565 145 C715 55 830 145 995 25"
          fill="none"
          stroke="#bef264"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function BotonNavegacion({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-50 transition hover:bg-white/10 hover:text-white"
    >
      {texto}
    </button>
  );
}

function EnlaceMenuMovil({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black text-white transition hover:bg-white/10"
    >
      <span>{texto}</span>
      <ArrowRight size={17} className="text-emerald-200" />
    </button>
  );
}

function Etiqueta({ icono, texto }: { icono: ReactNode; texto: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-4 py-2 text-xs font-bold text-slate-700 backdrop-blur-md">
      <span className="text-emerald-700">{icono}</span>
      {texto}
    </span>
  );
}

function TarjetaEstadistica({ estadistica }: { estadistica: Estadistica }) {
  return (
    <article className="group rounded-[24px] border border-emerald-100 bg-white p-6 shadow-md shadow-emerald-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
          {estadistica.icono}
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
          Activo
        </span>
      </div>
      <p className="mt-6 text-4xl font-black text-slate-900">{estadistica.valor}</p>
      <h3 className="mt-2 font-black text-slate-800">{estadistica.titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{estadistica.descripcion}</p>
    </article>
  );
}

function EncabezadoSeccion({
  etiqueta,
  titulo,
  descripcion,
  alineacion = "centro",
}: {
  etiqueta: string;
  titulo: string;
  descripcion: string;
  alineacion?: "centro" | "izquierda";
}) {
  const centrado = alineacion === "centro";

  return (
    <div className={centrado ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left"}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">{etiqueta}</p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
        {titulo}
      </h2>
      <p className={`mt-4 text-base leading-7 text-slate-500 ${centrado ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
        {descripcion}
      </p>
    </div>
  );
}

function TarjetaDestino({
  destino,
  destacado,
}: {
  destino: Destino;
  destacado: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-[26px] border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5 transition duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden">
        <img
          src={destino.imagen}
          alt={`Destino ${destino.nombre}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/10 to-transparent" />
        {destacado && (
          <span className="absolute left-4 top-4 rounded-full bg-lime-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-950">
            Destacado
          </span>
        )}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-2xl font-black">{destino.nombre}</h3>
          <p className="mt-1 text-sm text-emerald-100">{destino.descripcion}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-5">
        <p className="text-sm font-black text-emerald-700">Consultar disponibilidad</p>
        <Link
          to="/login"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800"
          aria-label={`Reservar viaje a ${destino.nombre}`}
        >
          <ArrowRight size={19} />
        </Link>
      </div>
    </article>
  );
}

function TarjetaPaso({ paso }: { paso: Paso }) {
  return (
    <article className="relative rounded-[26px] border border-emerald-100 bg-white p-6 text-center shadow-md shadow-emerald-900/5 transition duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-lg">
        {paso.icono}
      </div>
      <span className="mt-5 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
        Paso {paso.numero}
      </span>
      <h3 className="mt-3 text-lg font-black text-slate-900">{paso.titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{paso.descripcion}</p>
    </article>
  );
}

function BotonRedSocial({ etiqueta, icono }: { etiqueta: string; icono: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-emerald-800"
    >
      {icono}
    </button>
  );
}

function EnlaceFooter({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-left transition hover:text-white"
    >
      <ArrowRight size={14} className="text-lime-300" />
      {texto}
    </button>
  );
}

export default Home;
