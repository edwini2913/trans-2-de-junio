import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lock,
  MapPin,
  QrCode,
  Route,
  ShieldCheck,
  Smartphone,
  Ticket,
  UserPlus,
} from "lucide-react";

import fondo from "../assets/fondo.jpg";
import logo from "../assets/logo.png";
import noah from "../assets/noah.jpeg";

function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f2f8f4] text-slate-900">
      {/* PORTADA PRINCIPAL */}

      <section
        className="relative min-h-[720px] overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${fondo})`,
        }}
      >
        {/* CAPAS SOBRE LA IMAGEN */}

        <div className="absolute inset-0 bg-gradient-to-r from-[#004b27]/95 via-[#006f38]/85 to-[#008a46]/55" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#003d20]/75 via-transparent to-[#003d20]/25" />

        {/* DECORACIONES */}

        <div className="pointer-events-none absolute -left-32 -top-40 h-[430px] w-[430px] rounded-full border-[70px] border-white/5" />

        <div className="pointer-events-none absolute -right-32 top-16 h-[430px] w-[430px] rounded-full bg-lime-300/10 blur-2xl" />

        <div className="pointer-events-none absolute right-8 top-8 grid grid-cols-6 gap-3 opacity-30">
          {Array.from({ length: 30 }).map(
            (_, indice) => (
              <span
                key={indice}
                className="h-2 w-2 rounded-full bg-lime-200"
              />
            ),
          )}
        </div>

        {/* NAVEGACIÓN */}

        <nav className="relative z-30 border-b border-white/15 bg-emerald-950/15 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-center sm:justify-start">
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-[50%] bg-white px-2 shadow-lg">
                <img
                  src={logo}
                  alt="Logo de Trans 2 de Junio"
                  className="h-full w-full scale-[1.45] object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-black text-white">
                  Trans 2 de Junio
                </p>

                <p className="text-xs text-emerald-100">
                  Venta y reserva de pasajes
                </p>
              </div>
            </Link>
          </div>
        </nav>

        {/* CONTENIDO DE LA PORTADA */}

        <div className="relative z-20 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-36 pt-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-10 lg:pb-40 lg:pt-16">
          {/* INFORMACIÓN */}

          <div className="text-center text-white lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.17em] text-lime-200 backdrop-blur-sm">
              <ShieldCheck size={17} />
              Viajes rápidos y seguros
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
              BIENVENIDO AL SINDICATO AUTOTRANSPORTE TRANS "2 DE JUNIO" {" "}
              <span className="text-lime-300">
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-emerald-50/95 sm:text-lg lg:mx-0">
              Compra y reserva tus pasajes desde el
              celular, elige tu asiento y recibe un
              ticket electrónico.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
              <Link
                to="/register"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-white px-8 font-black text-emerald-800 shadow-[0_15px_35px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:bg-lime-50"
              >
                <UserPlus size={21} />
                Crear cuenta
                <ArrowRight size={19} />
              </Link>

              <Link
                to="/login"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border-2 border-white/80 bg-white/5 px-8 font-black text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white hover:text-emerald-800"
              >
                <Lock size={19} />
                Iniciar sesión
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
              <InformacionRapida
                icono={<Clock3 size={16} />}
                texto="Disponible las 24 horas"
              />

              <InformacionRapida
                icono={
                  <Smartphone size={16} />
                }
                texto="Compatible con celular"
              />

              <InformacionRapida
                icono={
                  <ShieldCheck size={16} />
                }
                texto="Información protegida"
              />
            </div>
          </div>

          {/* VEHÍCULO */}

          <div className="relative mx-auto flex min-h-[370px] w-full max-w-xl items-center justify-center lg:min-h-[490px]">
            <div className="absolute h-[330px] w-[330px] rounded-full border border-white/15 bg-white/10 backdrop-blur-sm sm:h-[440px] sm:w-[440px]" />

            <div className="absolute h-[280px] w-[280px] rounded-full border-[35px] border-lime-300/10 sm:h-[390px] sm:w-[390px]" />

            <div className="absolute bottom-8 h-20 w-[78%] rounded-[50%] bg-emerald-950/60 blur-xl" />

            <img
              src={noah}
              alt="Vehículo Noah de Trans 2 de Junio"
              className="relative z-10 h-[300px] w-[300px] rounded-[35%] border-4 border-white/30 object-cover object-center shadow-2xl sm:h-[410px] sm:w-[410px]"
            />

            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-2xl bg-white/95 px-5 py-4 text-slate-800 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <BusFront size={25} />
              </div>

              <div className="text-left">
                <p className="text-sm font-black text-emerald-800">
                  Transporte confiable
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Comodidad y seguridad
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ONDA INFERIOR */}

        <svg
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -bottom-1 left-0 z-20 h-24 w-full sm:h-32"
          aria-hidden="true"
        >
          <path
            d="M0,55 C230,125 450,20 720,72 C980,120 1200,24 1440,64 L1440,130 L0,130 Z"
            fill="#f2f8f4"
          />
        </svg>
      </section>

      {/* TARJETAS PRINCIPALES */}

      <section className="relative z-30 -mt-20 px-5 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Funcion
            icono={<Ticket size={29} />}
            titulo="Reserva de pasajes"
            descripcion="Busca tu ruta, selecciona el horario y reserva tu asiento."
          />

          <Funcion
            icono={<QrCode size={29} />}
            titulo="Ticket digital QR"
            descripcion="Recibe un ticket electrónico listo para presentar al abordar."
          />

          <Funcion
            icono={<CalendarDays size={29} />}
            titulo="Viajes programados"
            descripcion="Consulta las fechas y horarios disponibles desde tu celular."
          />

          <Funcion
            icono={
              <ShieldCheck size={29} />
            }
            titulo="Seguridad Blockchain"
            descripcion="Detecta alteraciones y protege la información de cada ticket."
          />
        </div>
      </section>

      {/* PROCESO DE COMPRA */}

      <section className="px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Fácil, rápido y seguro
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
              Compra tu pasaje en tres pasos
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-500">
              Realiza todo el proceso desde tu celular
              sin filas ni complicaciones.
            </p>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            <Paso
              numero="01"
              icono={<UserPlus size={25} />}
              titulo="Crea tu cuenta"
              descripcion="Registra tus datos personales e inicia sesión en el sistema."
            />

            <Paso
              numero="02"
              icono={<Route size={25} />}
              titulo="Elige tu viaje"
              descripcion="Selecciona la ruta, fecha, horario, vehículo y asiento."
            />

            <Paso
              numero="03"
              icono={<QrCode size={25} />}
              titulo="Recibe tu ticket"
              descripcion="Obtén tu pasaje electrónico con código QR para abordar."
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN INSTITUCIONAL */}

      <section className="px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[34px] bg-white shadow-[0_25px_70px_rgba(0,80,40,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[360px] overflow-hidden">
            <img
              src={noah}
              alt="Servicio de transporte Trans 2 de Junio"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/75 via-transparent to-transparent" />

            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm font-black uppercase tracking-widest text-lime-300">
                Nuestro servicio
              </p>

              <p className="mt-2 text-2xl font-black">
                Trans 2 de Junio
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Viaja con nosotros
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
              Un sistema creado para pasajeros y
              administración
            </h2>

            <p className="mt-5 leading-7 text-slate-500">
              La plataforma facilita la venta, reserva,
              generación y validación de tickets para
              mejorar la atención del Sindicato
              Autotransporte Trans 2 de Junio.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Ventaja texto="Reserva desde el celular" />
              <Ventaja texto="Selección de asiento" />
              <Ventaja texto="Ticket electrónico QR" />
              <Ventaja texto="Validación Blockchain" />
            </div>

            <Link
              to="/register"
              className="mt-8 inline-flex w-fit items-center gap-3 rounded-xl bg-emerald-700 px-7 py-4 font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-1 hover:bg-emerald-800"
            >
              Reservar mi pasaje
              <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* PIE DE PÁGINA */}

      <footer className="relative overflow-hidden bg-gradient-to-r from-[#004f28] via-[#006f38] to-[#008442] px-5 pb-8 pt-16 text-white">
        <svg
          viewBox="0 0 1440 75"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-1 left-0 h-16 w-full"
          aria-hidden="true"
        >
          <path
            d="M0,8 C250,65 450,4 720,35 C980,63 1200,4 1440,28 L1440,0 L0,0 Z"
            fill="#f2f8f4"
          />
        </svg>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 text-center md:grid-cols-3 md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white/70 bg-white shadow-lg">
                <img
                  src={noah}
                  alt="Vehículo Noah"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="font-black">
                  Trans 2 de Junio
                </p>

                <p className="mt-1 text-xs text-emerald-100">
                  Transporte de pasajeros
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-black">
              Servicios
            </p>

            <div className="mt-3 space-y-2 text-sm text-emerald-100">
              <p>Venta y reserva de pasajes</p>
              <p>Ticket electrónico QR</p>
              <p>Validación de tickets</p>
            </div>
          </div>

          <div>
            <p className="font-black">
              Información
            </p>

            <div className="mt-3 space-y-2 text-sm text-emerald-100">
              <p className="flex items-center justify-center gap-2 md:justify-start">
                <MapPin size={16} />
                Chimoré, Cochabamba
              </p>

              <p className="flex items-center justify-center gap-2 md:justify-start">
                <Clock3 size={16} />
                Atención todos los días
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-8 max-w-7xl border-t border-white/15 pt-5 text-center text-xs text-emerald-100">
          © 2026 Sindicato Autotransporte Trans 2 de
          Junio. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  );
}

function InformacionRapida({
  icono,
  texto,
}: {
  icono: ReactNode;
  texto: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-black/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm">
      {icono}
      {texto}
    </div>
  );
}

function Funcion({
  icono,
  titulo,
  descripcion,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
}) {
  return (
    <article className="group rounded-[25px] border border-emerald-100 bg-white p-6 shadow-[0_16px_45px_rgba(0,80,40,0.1)] transition duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-[0_25px_60px_rgba(0,80,40,0.17)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
        {icono}
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-900">
        {titulo}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {descripcion}
      </p>

      <div className="mt-5 h-1 w-12 rounded-full bg-emerald-600 transition-all group-hover:w-24" />
    </article>
  );
}

function Paso({
  numero,
  icono,
  titulo,
  descripcion,
}: {
  numero: string;
  icono: ReactNode;
  titulo: string;
  descripcion: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-emerald-100 bg-white p-7 shadow-[0_15px_45px_rgba(0,80,40,0.08)]">
      <span className="absolute right-5 top-2 text-7xl font-black text-emerald-50">
        {numero}
      </span>

      <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-700 p-3 text-white">
        {icono}
      </div>

      <p className="relative mt-5 text-xs font-black uppercase tracking-widest text-emerald-600">
        Paso {numero}
      </p>

      <h3 className="relative mt-2 text-xl font-black text-slate-900">
        {titulo}
      </h3>

      <p className="relative mt-3 text-sm leading-7 text-slate-500">
        {descripcion}
      </p>
    </article>
  );
}

function Ventaja({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={18} />
      </div>

      <p className="text-sm font-bold text-slate-600">
        {texto}
      </p>
    </div>
  );
}

export default Home;