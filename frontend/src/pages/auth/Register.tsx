import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type HTMLAttributes,
  type HTMLInputTypeAttribute,
  type ReactNode,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  LoaderCircle,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import logo from "../../assets/logo.png";
import { register } from "../../services/auth.service";

type FormularioRegistro = {
  nombre: string;
  apellido: string;
  ci: string;
  telefono: string;
  email: string;
  password: string;
};

const formularioInicial: FormularioRegistro = {
  nombre: "",
  apellido: "",
  ci: "",
  telefono: "",
  email: "",
  password: "",
};

function Register() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<FormularioRegistro>(
      formularioInicial,
    );

  const [mensaje, setMensaje] =
    useState("");

  const [exito, setExito] =
    useState(false);

  const [cargando, setCargando] =
    useState(false);

  const [
    mostrarPassword,
    setMostrarPassword,
  ] = useState(false);

  const cambiar = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;

    let valor = value;

    if (
      name === "ci" ||
      name === "telefono"
    ) {
      valor = value.replace(/\D/g, "");
    }

    setForm((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: valor,
    }));

    setMensaje("");
    setExito(false);
  };

  const registrarUsuario = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !form.nombre.trim() ||
      !form.apellido.trim() ||
      !form.ci.trim() ||
      !form.telefono.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      setExito(false);
      setMensaje(
        "Complete todos los campos para crear su cuenta.",
      );
      return;
    }

    if (form.password.length < 6) {
      setExito(false);
      setMensaje(
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }

    setCargando(true);
    setMensaje("");
    setExito(false);

    try {
      const data = await register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        ci: form.ci.trim(),
        telefono: form.telefono.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        password: form.password,
      });

      setExito(true);

      setMensaje(
        `Registro exitoso. Bienvenido ${data.usuario.nombre} ${data.usuario.apellido}. Ahora puede iniciar sesión.`,
      );

      setForm(formularioInicial);

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 2500);
    } catch (error: unknown) {
      setExito(false);
      setMensaje(obtenerMensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full min-w-0 overflow-x-hidden bg-[#edf8f0] px-0 py-0 sm:px-5 sm:py-7 lg:px-8">
      {/* DECORACIONES DEL FONDO */}

      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-green-400/20 blur-3xl" />

      <section className="relative z-10 mx-auto w-full min-w-0 max-w-5xl overflow-hidden bg-white shadow-[0_25px_80px_rgba(0,91,46,0.18)] sm:rounded-[28px] sm:border sm:border-emerald-100 lg:rounded-[32px]">
        {/* FORMAS ORGÁNICAS SUPERIORES */}

        <div className="pointer-events-none absolute left-0 top-0 h-36 w-32 overflow-hidden sm:h-48 sm:w-52">
          <div className="absolute -left-16 -top-24 h-64 w-72 rotate-[-20deg] rounded-[50%] bg-emerald-700" />

          <div className="absolute -left-24 -top-10 h-56 w-72 rotate-[-20deg] rounded-[50%] bg-emerald-400/55" />

          <div className="absolute -left-20 top-4 h-40 w-64 rotate-[-20deg] rounded-[50%] bg-emerald-200/70" />
        </div>

        <div className="pointer-events-none absolute right-3 top-5 grid grid-cols-5 gap-1.5 opacity-15 sm:right-9 sm:top-9 sm:gap-2 sm:opacity-25">
          {Array.from({ length: 25 }).map(
            (_, indice) => (
              <span
                key={indice}
                className="h-2 w-2 rounded-full bg-emerald-600"
              />
            ),
          )}
        </div>

        {/* FORMAS ORGÁNICAS INFERIORES */}

        <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 overflow-hidden sm:h-64 sm:w-64">
          <div className="absolute -bottom-24 -right-24 h-72 w-80 rotate-[-30deg] rounded-[50%] bg-emerald-700" />

          <div className="absolute -bottom-12 -right-28 h-56 w-80 rotate-[-30deg] rounded-[50%] bg-emerald-400/55" />

          <div className="absolute bottom-5 -right-24 h-40 w-72 rotate-[-30deg] rounded-[50%] bg-emerald-200/70" />
        </div>

        <div className="pointer-events-none absolute bottom-20 left-2 grid grid-cols-5 gap-1.5 opacity-10 sm:left-8 sm:gap-2 sm:opacity-20">
          {Array.from({ length: 20 }).map(
            (_, indice) => (
              <span
                key={indice}
                className="h-2 w-2 rounded-full bg-emerald-600"
              />
            ),
          )}
        </div>

        <div className="relative z-20 min-w-0 px-4 pb-7 pt-6 min-[375px]:px-5 sm:px-10 sm:pb-10 sm:pt-8 lg:px-16">
          {/* LOGO Y TÍTULO */}

          <header className="text-center">
            <div className="mx-auto flex h-20 w-full max-w-[190px] items-center justify-center overflow-hidden min-[375px]:h-24 min-[375px]:max-w-[210px] sm:h-[125px] sm:max-w-[230px]">
              <img
                src={logo}
                alt="Logo de Trans 2 de Junio"
                className="h-full w-full scale-[1.2] object-contain sm:scale-[1.4]"
              />
            </div>

            <div className="mt-2 flex min-w-0 items-center justify-center gap-2 sm:gap-3">
              <span className="text-emerald-700">
                ❧
              </span>

              <h1 className="text-[clamp(1.6rem,7vw,2.25rem)] font-black tracking-tight text-emerald-700 sm:text-4xl">
                Crear Cuenta
              </h1>

              <span className="scale-x-[-1] text-emerald-700">
                ❧
              </span>
            </div>

            <p className="mx-auto mt-2 max-w-[34ch] text-center text-[13px] font-medium leading-5 text-slate-500 sm:max-w-none sm:text-base">
              Regístrate como pasajero de Trans 2 de
              Junio
            </p>
          </header>

          {/* MENSAJES */}

          {mensaje && (
            <div
              role="alert"
              className={`mx-auto mt-5 flex min-w-0 max-w-4xl items-start gap-2.5 rounded-xl border p-3 text-[13px] font-semibold leading-5 sm:mt-6 sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-sm ${
                exito
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${
                  exito
                    ? "bg-emerald-700"
                    : "bg-red-600"
                }`}
              >
                {exito ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>

              <p className="min-w-0 break-words leading-5 sm:leading-6">
                {mensaje}
              </p>
            </div>
          )}

          {/* FORMULARIO */}

          <form
            onSubmit={registrarUsuario}
            className="mx-auto mt-6 grid w-full min-w-0 max-w-4xl grid-cols-1 gap-x-5 gap-y-4 sm:mt-7 sm:gap-x-7 sm:gap-y-5 md:grid-cols-2"
          >
            <CampoRegistro
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              icono={<User size={17} />}
              placeholder="Ingrese su nombre"
              autoComplete="given-name"
              bloqueado={cargando}
            />

            <CampoRegistro
              label="Apellido"
              name="apellido"
              value={form.apellido}
              onChange={cambiar}
              icono={<User size={17} />}
              placeholder="Ingrese su apellido"
              autoComplete="family-name"
              bloqueado={cargando}
            />

            <CampoRegistro
              label="Carnet de identidad"
              name="ci"
              value={form.ci}
              onChange={cambiar}
              icono={<IdCard size={17} />}
              placeholder="Ejemplo: 12744227"
              inputMode="numeric"
              maxLength={12}
              bloqueado={cargando}
            />

            <CampoRegistro
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={cambiar}
              icono={<Phone size={17} />}
              placeholder="Ejemplo: 67542913"
              inputMode="tel"
              autoComplete="tel"
              maxLength={15}
              bloqueado={cargando}
            />

            <CampoRegistro
              label="Correo electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={cambiar}
              icono={<Mail size={17} />}
              placeholder="ejemplo@correo.com"
              autoComplete="email"
              bloqueado={cargando}
            />

            <div className="min-w-0">
              <label
                htmlFor="password"
                className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"
              >
                <Lock
                  size={17}
                  className="text-emerald-700"
                />
                Contraseña
              </label>

              <div className="relative">
                <Lock
                  size={19}
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
                  value={form.password}
                  onChange={cambiar}
                  placeholder="Ingrese su contraseña"
                  autoComplete="new-password"
                  disabled={cargando}
                  minLength={6}
                  required
                  className="h-[52px] w-full min-w-0 rounded-xl border border-emerald-500 bg-white pl-11 pr-20 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-[58px] sm:pl-12"
                />

                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0 sm:right-2 sm:gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPassword(
                        (estado) => !estado,
                      )
                    }
                    disabled={cargando}
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-900"
                  >
                    {mostrarPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                  {form.password.length >= 6 && (
                    <CheckCircle2
                      size={19}
                      className="text-emerald-700"
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="flex min-h-[52px] w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#009348] to-[#00783b] px-5 text-base font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:from-[#00823f] hover:to-[#006432] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {cargando ? (
                <>
                  <LoaderCircle
                    size={21}
                    className="animate-spin"
                  />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus size={22} />
                  Crear cuenta
                </>
              )}
            </button>

            {/* SEGURIDAD */}

            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 sm:gap-4 sm:p-4 md:col-span-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700">
                <ShieldCheck size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-emerald-800">
                  Tus datos están protegidos
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Utilizamos medidas de seguridad para
                  proteger tu información personal.
                </p>
              </div>

              <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-500 min-[390px]:flex">
                <Lock size={17} />
              </div>
            </div>
          </form>

          {/* ENLACES */}

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-slate-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="font-black text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
              >
                Iniciar sesión
              </Link>
            </p>

            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 text-sm font-black text-emerald-700 transition hover:text-emerald-900"
            >
              <ArrowLeft size={18} />
              Volver al inicio
            </Link>
          </div>
        </div>

        {/* PIE DE PÁGINA */}

        <footer className="relative z-20 overflow-hidden bg-gradient-to-r from-[#006b35] to-[#009249] px-4 pb-5 pt-7 text-white sm:px-5 sm:pt-8">
          <svg
            viewBox="0 0 1000 45"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -top-1 left-0 h-12 w-full"
            aria-hidden="true"
          >
            <path
              d="M0,8 C170,40 320,0 500,20 C690,40 830,0 1000,18 L1000,0 L0,0 Z"
              fill="#ffffff"
            />
          </svg>

          <div className="relative z-10 flex min-w-0 items-center justify-center gap-2 text-center">
            <ShieldCheck size={16} />

            <p className="min-w-0 text-[11px] font-semibold leading-4 sm:text-xs">
              © 2026 Sindicato Autotransporte Trans 2
              de Junio
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}

function CampoRegistro({
  label,
  name,
  value,
  onChange,
  icono,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  bloqueado = false,
}: {
  label: string;
  name: keyof FormularioRegistro;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  icono: ReactNode;
  placeholder: string;
  type?: HTMLInputTypeAttribute;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength?: number;
  bloqueado?: boolean;
}) {
  const campoCompleto =
    value.trim().length > 0;

  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-2 flex items-center gap-2 text-sm font-black text-slate-700"
      >
        <span className="text-emerald-700">
          {icono}
        </span>

        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700">
          {icono}
        </span>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          autoCapitalize={type === "email" ? "none" : undefined}
          spellCheck={type === "email" ? false : undefined}
          maxLength={maxLength}
          disabled={bloqueado}
          required
          className="h-[52px] w-full min-w-0 rounded-xl border border-emerald-500 bg-white pl-11 pr-11 text-base font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 sm:h-[58px] sm:pl-12"
        />

        {campoCompleto && (
          <CheckCircle2
            size={19}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700"
          />
        )}
      </div>
    </div>
  );
}

function obtenerMensajeError(
  error: unknown,
): string {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const posibleError = error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
      message?: string;
    };

    const mensajeServidor =
      posibleError.response?.data?.message;

    if (Array.isArray(mensajeServidor)) {
      return mensajeServidor.join(", ");
    }

    if (
      typeof mensajeServidor === "string" &&
      mensajeServidor.trim()
    ) {
      return mensajeServidor;
    }

    if (
      typeof posibleError.message ===
        "string" &&
      posibleError.message.trim()
    ) {
      return posibleError.message;
    }
  }

  return "No se pudo registrar. Verifique los datos e intente nuevamente.";
}

export default Register;