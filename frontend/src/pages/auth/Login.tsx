import { useState } from "react";
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

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMensaje(
        "Complete el correo electrónico y la contraseña.",
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

      localStorage.setItem(
        "token",
        data.access_token,
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario),
      );

      if (
        data.usuario.rol ===
        "ADMINISTRADOR"
      ) {
        navigate("/admin", {
          replace: true,
        });
        return;
      }

      navigate("/pasajero", {
        replace: true,
      });
    } catch {
      setMensaje(
        "Correo electrónico o contraseña incorrectos.",
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat sm:px-5 sm:py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 65, 32, 0.82), rgba(0, 35, 18, 0.9)), url(${fondo})`,
      }}
    >
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[480px] flex-col overflow-hidden bg-white shadow-2xl sm:min-h-[950px] sm:rounded-[32px]">
        {/* ENCABEZADO VERDE */}

        <header className="relative min-h-[310px] overflow-hidden bg-[#00783c] px-6 pt-5 text-white">
          {/* NOAH COMO MARCA DE AGUA EN TODO EL FONDO */}

          <img
            src={noah}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-25 mix-blend-luminosity"
          />

          {/* CAPA VERDE SOBRE EL NOAH */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00783c]/85 via-[#00783c]/65 to-[#004f28]/80" />

          {/* FORMAS DECORATIVAS */}

          <div className="pointer-events-none absolute -left-24 top-16 h-48 w-80 rotate-[-12deg] rounded-[50%] bg-emerald-950/20" />

          <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full border-[42px] border-white/5" />

          <div className="pointer-events-none absolute right-5 top-14 grid grid-cols-5 gap-2 opacity-35">
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
            <div className="flex h-[112px] w-[225px] items-center justify-center overflow-hidden rounded-[55%] border-4 border-emerald-100 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
              <img
                src={logo}
                alt="Logo de Trans 2 de Junio"
                className="h-full w-full scale-[2.35] object-contain"
              />
            </div>
          </div>

          <div className="relative z-20 mt-5 text-center drop-shadow-md">
            <h1 className="text-[32px] font-black tracking-tight">
              Iniciar Sesión
            </h1>

            <p className="mt-1 text-sm font-bold text-emerald-50">
              Sistema Trans 2 de Junio
            </p>
          </div>

          {/* ONDA BLANCA */}

          <svg
            viewBox="0 0 480 80"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-1 left-0 z-20 h-20 w-full"
            aria-hidden="true"
          >
            <path
              d="M0,38 C75,73 155,15 245,40 C335,64 400,24 480,40 L480,80 L0,80 Z"
              fill="#ffffff"
            />
          </svg>
        </header>

        {/* FORMULARIO */}

        <div className="relative z-30 -mt-[46px] flex-1 px-5 pb-5">
          <div className="rounded-[28px] border border-emerald-50 bg-white px-6 pb-7 pt-6 shadow-[0_20px_50px_rgba(0,73,38,0.16)]">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <UserRound size={29} />
              </div>

              <div>
                <h2 className="text-xl font-black text-emerald-800">
                  Bienvenido nuevamente
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Ingresa tus datos para continuar
                </p>
              </div>
            </div>

            <form
              onSubmit={iniciarSesion}
              className="space-y-5"
            >
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

                <div className="relative">
                  <Mail
                    size={20}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    disabled={cargando}
                    onChange={(event) => {
                      setEmail(
                        event.target.value,
                      );
                      setMensaje("");
                    }}
                    className="h-[58px] w-full rounded-xl border border-emerald-600 bg-white pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
                    required
                  />

                  {email.trim() && (
                    <CheckCircle2
                      size={20}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700"
                    />
                  )}
                </div>
              </div>

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

                <div className="relative">
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
                      setPassword(
                        event.target.value,
                      );
                      setMensaje("");
                    }}
                    className="h-[58px] w-full rounded-xl border border-emerald-600 bg-white pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
                    required
                  />

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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700 hover:text-emerald-900"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={21} />
                    ) : (
                      <Eye size={21} />
                    )}
                  </button>
                </div>

                <div className="mt-2 text-right">
                  <Link
                    to="/recuperar-password"
                    className="text-xs font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {mensaje && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700"
                >
                  {mensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#009649] to-[#00773a] text-base font-black text-white shadow-lg shadow-emerald-800/25 transition hover:-translate-y-0.5 hover:from-[#008440] hover:to-[#006331] focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
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

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />

              <div className="flex flex-col items-center text-emerald-700">
                <UserRound size={20} />

                <span className="mt-1 text-[10px] font-semibold text-slate-400">
                  o continúa con
                </span>
              </div>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm font-semibold text-slate-600">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="font-black text-emerald-700 underline underline-offset-2"
              >
                Crear cuenta
              </Link>
            </p>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900"
              >
                <ArrowLeft size={17} />
                Volver al inicio
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700">
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

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600">
                <Lock size={16} />
              </div>
            </div>
          </div>
        </div>

    {/* PIE DE PÁGINA */}

    <footer className="relative overflow-hidden bg-gradient-to-r from-[#006b35] to-[#008643] px-5 pb-6 pt-8 text-white">
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

      <div className="relative z-10 flex items-center justify-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white shadow-lg">
          <img
            src={noah}
            alt="Vehículo Noah de Trans 2 de Junio"
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div>
          <p className="text-xs font-bold">
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