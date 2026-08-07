import {
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Link } from "react-router-dom";

import fondo from "../../assets/fondo.jpg";
import logo from "../../assets/logo.png";

const API_URL = String(
  import.meta.env.VITE_API_URL || "http://localhost:3000",
).replace(/\/$/, "");

function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function enviarSolicitud(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    setCargando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(
        `${API_URL}/auth/recuperar-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailNormalizado,
          }),
        },
      );

      const datos = (await respuesta.json()) as {
        mensaje?: string;
        message?: string | string[];
      };

      if (!respuesta.ok) {
        const detalle = Array.isArray(datos.message)
          ? datos.message.join(" ")
          : datos.message;

        throw new Error(
          detalle || "No se pudo procesar la solicitud.",
        );
      }

      setMensaje(
        datos.mensaje ||
          "Si el correo está registrado, recibirás un enlace de recuperación.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0,65,32,.84),rgba(0,35,18,.92)), url(${fondo})`,
      }}
    >
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border-[50px] border-white/5" />
      <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-lime-300/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <header className="bg-gradient-to-br from-emerald-800 to-emerald-600 px-7 py-8 text-center text-white">
          <img
            src={logo}
            alt="Logo Trans 2 de Junio"
            className="mx-auto h-24 w-44 rounded-2xl bg-white object-contain p-2 shadow-lg"
          />

          <h1 className="mt-6 text-3xl font-black">
            Recuperar contraseña
          </h1>

          <p className="mt-2 text-sm leading-6 text-emerald-100">
            Te enviaremos un enlace seguro a tu correo electrónico.
          </p>
        </header>

        <div className="p-7">
          {mensaje ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={34} />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                Revisa tu correo
              </h2>

              <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                {mensaje}
              </p>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Revisa también la carpeta de spam. El enlace vence en 15 minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={enviarSolicitud} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={cargando}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="ejemplo@correo.com"
                    className="h-14 w-full rounded-xl border border-emerald-300 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 font-black text-white shadow-lg transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {cargando ? (
                  <>
                    <LoaderCircle size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={19} />
                    Enviar enlace
                  </>
                )}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft size={17} />
            Volver a iniciar sesión
          </Link>

          <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
            <ShieldCheck size={24} className="shrink-0" />
            <p className="text-xs leading-5">
              Por seguridad, el sistema no confirma si el correo está registrado.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RecuperarPassword;
