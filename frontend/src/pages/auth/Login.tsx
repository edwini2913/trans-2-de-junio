
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import fondo from "../../assets/fondo.jpg";
import logo from "../../assets/logo.png";
import noah from "../../assets/noah.jpeg";

import { login } from "../../services/auth.service";

/* =========================================
   ROLES Y DESTINOS
========================================= */

const destinos: Record<string, string> = {
  ADMINISTRADOR: "/admin",
  SECRETARIA: "/admin",
  CHOFER: "/chofer/escanear-ticket",
  PASAJERO: "/pasajero",
};

/* =========================================
   MANEJO DE ERRORES
========================================= */

function obtenerMensajeError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const datos = error as {
      mensaje?: unknown;
      message?: unknown;
      response?: {
        status?: number;
        data?: {
          message?: string | string[];
          mensaje?: string;
        };
      };
    };

    if (typeof datos.mensaje === "string") {
      return datos.mensaje;
    }

    const respuesta = datos.response?.data;

    if (Array.isArray(respuesta?.message)) {
      return respuesta.message.join(". ");
    }

    if (typeof respuesta?.message === "string") {
      return respuesta.message;
    }

    if (typeof respuesta?.mensaje === "string") {
      return respuesta.mensaje;
    }

    if (datos.response?.status === 401) {
      return "Correo electrónico o contraseña incorrectos.";
    }

    if (typeof datos.message === "string") {
      return datos.message;
    }
  }

  return "No se pudo iniciar sesión. Intente nuevamente.";
}

/* =========================================
   COMPONENTE LOGIN
========================================= */

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const correoValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim(),
    );

  /* =====================================
     INICIAR SESIÓN
  ===================================== */

  const iniciarSesion = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (cargando) return;

    if (!email.trim() || !password) {
      setMensaje(
        "Complete el correo electrónico y la contraseña.",
      );
      return;
    }

    if (!correoValido) {
      setMensaje(
        "Ingrese un correo electrónico válido.",
      );
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const data = await login(
        email.trim().toLowerCase(),
        password,
      );

      const rol = data.usuario?.rol?.toUpperCase();
      const destino = rol ? destinos[rol] : undefined;

      if (
        !destino ||
        !data.access_token ||
        !data.usuario?.id
      ) {
        setMensaje(
          "No se pudo iniciar sesión: datos del usuario no válidos.",
        );
        return;
      }

      /* Guardar nueva sesión */

      localStorage.removeItem("access_token");

      localStorage.setItem(
        "token",
        data.access_token,
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify({
          ...data.usuario,
          rol,
        }),
      );

      /* Redirigir según el rol */

      navigate(destino, {
        replace: true,
      });
    } catch (error: unknown) {
      setMensaje(obtenerMensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  /* =====================================
     DISEÑO DEL LOGIN
  ===================================== */

  return (
    <main
      className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-cover bg-center bg-no-repeat sm:px-5 sm:py-6 lg:py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 65, 32, 0.82), rgba(0, 35, 18, 0.9)), url(${fondo})`,
      }}
    >
      <section className="relative z-10 mx-auto flex min-h-[100dvh] w-full min-w-0 max-w-[480px] flex-col overflow-hidden bg-white shadow-2xl sm:min-h-0 sm:rounded-[28px] lg:rounded-[32px]">

        {/* =================================
            ENCABEZADO VERDE
        ================================= */}

        <header className="relative min-h-[235px] shrink-0 overflow-hidden bg-[#00783c] px-3 pt-5 text-white min-[375px]:min-h-[255px] min-[375px]:px-5 sm:min-h-[300px] sm:px-6 sm:pt-7">

          {/* VEHÍCULO NOAH DE FONDO */}

          <img
            src={noah}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-25 mix-blend-luminosity"
          />

          {/* CAPA VERDE */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00783c]/85 via-[#00783c]/65 to-[#004f28]/80" />

          {/* DECORACIÓN */}

          <div className="pointer-events-none absolute -left-24 top-16 h-48 w-80 rotate-[-12deg] rounded-[50%] bg-emerald-950/20" />

          <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full border-[42px] border-white/5" />

          <div className="pointer-events-none absolute right-3 top-12 hidden grid-cols-5 gap-2 opacity-35 min-[375px]:grid sm:right-5 sm:top-14">
            {Array.from({ length: 20 }).map(
              (_, indice) => (
                <span
                  key={indice}
                  className="h-1.5 w-1.5 rounded-full bg-lime-200"
                />
              ),
            )}
          </div>

          {/* LOGO */}

          <div className="relative z-20 flex justify-center">
            <div className="flex h-[82px] w-[170px] max-w-full items-center justify-center overflow-hidden rounded-[55%] border-[3px] border-emerald-100 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.3)] min-[375px]:h-[95px] min-[375px]:w-[195px] sm:h-[112px] sm:w-[225px] sm:border-4">
              <img
                src={logo}
                alt="Logo de Trans 2 de Junio"
                className="h-full w-full scale-[2.35] object-contain"
              />
            </div>
          </div>

          {/* TÍTULO */}

          <div className="relative z-20 mt-3 text-center drop-shadow-md sm:mt-5">
            <h1 className="text-[clamp(1.5rem,7vw,2rem)] font-black leading-tight tracking-tight">
              Iniciar Sesión
            </h1>

            <p className="mt-1 text-xs font-bold text-emerald-50 min-[375px]:text-sm">
              Sistema Trans 2 de Junio
            </p>
          </div>

          {/* ONDA BLANCA */}

          <svg
            viewBox="0 0 480 80"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-1 left-0 z-20 h-12 w-full sm:h-20"
            aria-hidden="true"
          >
            <path
              d="M0,38 C75,73 155,15 245,40 C335,64 400,24 480,40 L480,80 L0,80 Z"
              fill="#ffffff"
            />
          </svg>
        </header>

        {/* =================================
            FORMULARIO
        ================================= */}

        <div className="relative z-30 -mt-6 flex-1 px-2.5 pb-3 min-[375px]:px-4 sm:-mt-[46px] sm:px-5 sm:pb-5">
          <div className="min-w-0 rounded-2xl border border-emerald-50 bg-white px-3 pb-5 pt-4 shadow-[0_20px_50px_rgba(0,73,38,0.16)] min-[375px]:px-4 sm:rounded-[28px] sm:px-6 sm:pb-7 sm:pt-6">

            {/* BIENVENIDA */}

            <div className="mb-4 flex min-w-0 items-center gap-2.5 sm:mb-7 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 sm:h-14 sm:w-14">
                <UserRound size={29} />
              </div>

              <div>
                <h2 className="text-base font-black leading-tight text-emerald-800 min-[375px]:text-lg sm:text-xl">
                  Bienvenido nuevamente
                </h2>

                <p className="mt-1 text-xs font-medium leading-4 text-slate-500 sm:text-sm">
                  Ingresa tus datos para continuar
                </p>
              </div>
            </div>

            <form
              onSubmit={iniciarSesion}
              className="space-y-4 sm:space-y-5"
            >
              {/* CORREO ELECTRÓNICO */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700"
                >
                  <Mail
                    size={16}
                    className="text-emerald-700"
                  />
                  Correo electrónico
                </label>

                <div className="relative min-w-0">
                  <Mail
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="ejemplo@correo.com"
                    value={email}
                    disabled={cargando}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setMensaje("");
                    }}
                    className="min-h-12 w-full min-w-0 max-w-full rounded-xl border border-emerald-600 bg-white py-3 pl-11 pr-11 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 sm:min-h-[58px] sm:pl-12 sm:pr-12"
                    required
                  />

                  {correoValido && (
                    <CheckCircle2
                      size={20}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700"
                    />
                  )}
                </div>
              </div>

              {/* CONTRASEÑA */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700"
                >
                  <Lock
                    size={16}
                    className="text-emerald-700"
                  />
                  Contraseña
                </label>

                <div className="relative min-w-0">
                  <Lock
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    disabled={cargando}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setMensaje("");
                    }}
                    className="min-h-12 w-full min-w-0 max-w-full rounded-xl border border-emerald-600 bg-white py-3 pl-11 pr-11 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 sm:min-h-[58px] sm:pl-12 sm:pr-12"
                    required
                  />

                  {/* MOSTRAR CONTRASEÑA */}

                  <button
                    type="button"
                    disabled={cargando}
                    onClick={() =>
                      setMostrarPassword(
                        (estado) => !estado,
                      )
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={mostrarPassword}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700 sm:right-2"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>

                {/* RECUPERAR CONTRASEÑA */}

                <div className="mt-2 text-right">
                  <Link
                    to="/recuperar-password"
                    className="inline-flex min-h-10 items-center text-xs font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {/* MENSAJE DE ERROR */}

              {mensaje && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700"
                >
                  {mensaje}
                </div>
              )}

              {/* BOTÓN INICIAR SESIÓN */}

              <button
                type="submit"
                disabled={cargando}
                className="flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#009649] to-[#00773a] px-3 py-3 text-base font-black text-white shadow-lg shadow-emerald-800/25 transition hover:from-[#008440] hover:to-[#006331] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[56px]"
              >
                {cargando ? (
                  <>
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <Lock size={19} />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>

            {/* SEPARADOR */}

            <div className="my-4 flex items-center gap-3 sm:my-6">
              <div className="h-px flex-1 bg-slate-200" />

              <div className="flex flex-col items-center text-emerald-700">
                <UserRound size={20} />

                <span className="mt-1 text-[10px] font-semibold text-slate-400">
                  o continúa con
                </span>
              </div>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* CREAR CUENTA */}

            <p className="text-center text-sm font-semibold text-slate-600">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="inline-flex min-h-10 items-center font-black text-emerald-700 underline underline-offset-2"
              >
                Crear cuenta
              </Link>
            </p>

            {/* VOLVER AL INICIO */}

            <div className="mt-4 text-center sm:mt-6">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900"
              >
                <ArrowLeft size={17} />
                Volver al inicio
              </Link>
            </div>

            {/* INFORMACIÓN DE SEGURIDAD */}

            <div className="mt-5 flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 sm:mt-7 sm:gap-3 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 sm:h-12 sm:w-12">
                <ShieldCheck size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-emerald-800">
                  Tu información está segura
                </p>

                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Protegemos tus datos personales y
                  garantizamos la seguridad de tu
                  información.
                </p>
              </div>

              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 min-[375px]:flex">
                <Lock size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* =================================
            PIE DE PÁGINA
        ================================= */}

        <footer className="relative overflow-hidden bg-gradient-to-r from-[#006b35] to-[#008643] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 text-white sm:px-5 sm:pb-6 sm:pt-8">
          <svg
            viewBox="0 0 480 38"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -top-1 left-0 h-10 w-full"
            aria-hidden="true"
          >
            <path
              d="M0,6 C85,27 165,1 255,14 C350,28 410,3 480,11 L480,0 L0,0 Z"
              fill="#ffffff"
            />
          </svg>

          <div className="relative z-10 flex min-w-0 items-center justify-center gap-2 sm:gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white shadow-lg sm:h-14 sm:w-14">
              <img
                src={noah}
                alt="Vehículo Noah de Trans 2 de Junio"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div>
              <p className="break-words text-[11px] font-bold sm:text-xs">
                Sindicato Autotransporte Trans 2 de Junio
              </p>

              <p className="mt-1 text-[10px] text-emerald-100">
                © 2026 Todos los derechos reservados
              </p>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default Login;