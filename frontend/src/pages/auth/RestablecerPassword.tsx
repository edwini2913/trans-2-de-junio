import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import fondo from "../../assets/fondo.jpg";
import logo from "../../assets/logo.png";

const API_URL = String(
  import.meta.env.VITE_API_URL ||
    "http://localhost:3000",
).replace(/\/+$/, "");

type RespuestaServidor = {
  mensaje?: string;
  message?: string | string[];
};

function RestablecerPassword() {
  const navigate =
    useNavigate();

  const [
    parametros,
  ] = useSearchParams();

  const token =
    useMemo(
      () =>
        parametros
          .get("token")
          ?.trim() || "",
      [parametros],
    );

  const tokenValido =
    /^[a-f0-9]{64}$/i.test(
      token,
    );

  const [
    nuevaPassword,
    setNuevaPassword,
  ] = useState("");

  const [
    confirmarPassword,
    setConfirmarPassword,
  ] = useState("");

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  async function guardarPassword(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!tokenValido) {
      setError(
        "El enlace de recuperación no contiene un token válido.",
      );

      return;
    }

    if (
      nuevaPassword.length < 8
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );

      return;
    }

    if (
      nuevaPassword !==
      confirmarPassword
    ) {
      setError(
        "Las contraseñas no coinciden.",
      );

      return;
    }

    setCargando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta =
        await fetch(
          `${API_URL}/auth/restablecer-password`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                token,

                nuevaPassword,

                confirmarPassword,
              }),
          },
        );

      let datos:
        RespuestaServidor = {};

      try {
        datos =
          (await respuesta.json()) as
            RespuestaServidor;
      } catch {
        datos = {};
      }

      if (!respuesta.ok) {
        const detalle =
          Array.isArray(
            datos.message,
          )
            ? datos.message.join(
                " ",
              )
            : datos.message;

        throw new Error(
          detalle ||
            "No se pudo cambiar la contraseña.",
        );
      }

      setMensaje(
        datos.mensaje ||
          "Contraseña actualizada correctamente.",
      );

      setNuevaPassword("");
      setConfirmarPassword("");

      window.setTimeout(
        () => {
          navigate(
            "/login",
            {
              replace:
                true,
            },
          );
        },
        2500,
      );
    } catch (err: unknown) {
      if (
        err instanceof TypeError
      ) {
        setError(
          "No se pudo conectar con el backend. Verifica que esté funcionando en el puerto 3000.",
        );

        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      className="
        relative flex min-h-screen
        items-center justify-center
        overflow-hidden bg-cover
        bg-center px-4 py-8
      "
      style={{
        backgroundImage:
          `linear-gradient(
            rgba(0, 65, 32, 0.84),
            rgba(0, 35, 18, 0.92)
          ), url(${fondo})`,
      }}
    >
      <div
        className="
          absolute -left-24 top-20
          h-72 w-72 rounded-full
          border-[50px] border-white/5
        "
      />

      <div
        className="
          absolute -right-20 bottom-10
          h-80 w-80 rounded-full
          bg-lime-300/10 blur-3xl
        "
      />

      <section
        className="
          relative z-10 w-full
          max-w-md overflow-hidden
          rounded-[30px] bg-white
          shadow-2xl
        "
      >
        <header
          className="
            bg-gradient-to-br
            from-emerald-800
            to-emerald-600
            px-7 py-8 text-center
            text-white
          "
        >
          <img
            src={logo}
            alt="Logo Trans 2 de Junio"
            className="
              mx-auto h-24 w-44
              rounded-2xl bg-white
              object-contain p-2
              shadow-lg
            "
          />

          <h1
            className="
              mt-6 text-3xl
              font-black
            "
          >
            Nueva contraseña
          </h1>

          <p
            className="
              mt-2 text-sm
              leading-6
              text-emerald-100
            "
          >
            Crea una contraseña segura para recuperar tu cuenta.
          </p>
        </header>

        <div className="p-7">
          {mensaje ? (
            <div className="text-center">
              <div
                className="
                  mx-auto flex h-16 w-16
                  items-center justify-center
                  rounded-full bg-emerald-100
                  text-emerald-700
                "
              >
                <CheckCircle2
                  size={34}
                />
              </div>

              <h2
                className="
                  mt-5 text-xl
                  font-black
                  text-slate-900
                "
              >
                Contraseña actualizada
              </h2>

              <p
                className="
                  mt-3 text-sm
                  leading-6
                  text-slate-600
                "
              >
                {mensaje}
              </p>

              <p
                className="
                  mt-3 text-xs
                  text-slate-400
                "
              >
                Te estamos enviando al inicio de sesión...
              </p>
            </div>
          ) : (
            <form
              onSubmit={
                guardarPassword
              }
              className="space-y-5"
            >
              {!tokenValido && (
                <div
                  role="alert"
                  className="
                    rounded-xl border
                    border-red-200
                    bg-red-50 px-4 py-3
                    text-sm font-bold
                    text-red-700
                  "
                >
                  El enlace no contiene un token de recuperación válido.
                </div>
              )}

              <CampoPassword
                id="nueva-password"
                etiqueta="Nueva contraseña"
                valor={nuevaPassword}
                mostrar={mostrarPassword}
                disabled={cargando}
                onChange={(
                  valor,
                ) => {
                  setNuevaPassword(
                    valor,
                  );

                  setError("");
                }}
              />

              <CampoPassword
                id="confirmar-password"
                etiqueta="Confirmar contraseña"
                valor={
                  confirmarPassword
                }
                mostrar={mostrarPassword}
                disabled={cargando}
                onChange={(
                  valor,
                ) => {
                  setConfirmarPassword(
                    valor,
                  );

                  setError("");
                }}
              />

              <button
                type="button"
                disabled={cargando}
                onClick={() =>
                  setMostrarPassword(
                    (
                      estado,
                    ) =>
                      !estado,
                  )
                }
                className="
                  flex items-center
                  gap-2 text-xs
                  font-black
                  text-emerald-700
                  disabled:opacity-60
                "
              >
                {mostrarPassword ? (
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}

                {mostrarPassword
                  ? "Ocultar contraseñas"
                  : "Mostrar contraseñas"}
              </button>

              {error && (
                <div
                  role="alert"
                  className="
                    rounded-xl border
                    border-red-200
                    bg-red-50 px-4 py-3
                    text-sm font-bold
                    text-red-700
                  "
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  cargando ||
                  !tokenValido
                }
                className="
                  flex h-14 w-full
                  items-center justify-center
                  gap-2 rounded-xl
                  bg-emerald-700
                  font-black text-white
                  shadow-lg transition
                  hover:bg-emerald-800
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {cargando ? (
                  <>
                    <LoaderCircle
                      size={20}
                      className="
                        animate-spin
                      "
                    />

                    Guardando...
                  </>
                ) : (
                  <>
                    <Lock size={19} />

                    Guardar contraseña
                  </>
                )}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="
              mt-6 flex items-center
              justify-center gap-2
              text-sm font-black
              text-emerald-700
              hover:text-emerald-900
            "
          >
            <ArrowLeft size={17} />

            Volver a iniciar sesión
          </Link>

          <div
            className="
              mt-6 flex items-center
              gap-3 rounded-xl
              bg-emerald-50 p-4
              text-emerald-800
            "
          >
            <ShieldCheck
              size={24}
              className="shrink-0"
            />

            <p className="text-xs leading-5">
              El enlace es de un solo uso y vence después de 15 minutos.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function CampoPassword({
  id,
  etiqueta,
  valor,
  mostrar,
  disabled,
  onChange,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  mostrar: boolean;
  disabled: boolean;
  onChange: (
    valor: string,
  ) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2 block text-sm
          font-black
          text-slate-700
        "
      >
        {etiqueta}
      </label>

      <div className="relative">
        <Lock
          size={20}
          className="
            absolute left-4
            top-1/2
            -translate-y-1/2
            text-emerald-700
          "
        />

        <input
          id={id}
          name={id}
          type={
            mostrar
              ? "text"
              : "password"
          }
          autoComplete="new-password"
          value={valor}
          disabled={disabled}
          onChange={(
            event,
          ) =>
            onChange(
              event.target.value,
            )
          }
          placeholder="Mínimo 8 caracteres"
          className="
            h-14 w-full rounded-xl
            border border-emerald-300
            pl-12 pr-4
            text-sm font-semibold
            outline-none transition
            focus:border-emerald-600
            focus:ring-4
            focus:ring-emerald-100
            disabled:cursor-not-allowed
            disabled:bg-slate-100
          "
          required
          minLength={8}
        />
      </div>
    </div>
  );
}

export default RestablecerPassword;