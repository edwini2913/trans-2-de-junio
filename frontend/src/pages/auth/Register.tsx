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
    <main className="relative min-h-screen overflow-hidden bg-[#edf8f0] px-3 py-4 sm:px-6 sm:py-8">
      {/* DECORACIONES DEL FONDO */}

      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-green-400/20 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-[0_25px_80px_rgba(0,91,46,0.18)]">
        {/* FORMAS ORGÁNICAS SUPERIORES */}

        <div className="pointer-events-none absolute left-0 top-0 h-48 w-52 overflow-hidden">
          <div className="absolute -left-16 -top-24 h-64 w-72 rotate-[-20deg] rounded-[50%] bg-emerald-700" />

          <div className="absolute -left-24 -top-10 h-56 w-72 rotate-[-20deg] rounded-[50%] bg-emerald-400/55" />

          <div className="absolute -left-20 top-4 h-40 w-64 rotate-[-20deg] rounded-[50%] bg-emerald-200/70" />
        </div>

        <div className="pointer-events-none absolute right-9 top-9 grid grid-cols-5 gap-2 opacity-25">
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

        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 overflow-hidden">
          <div className="absolute -bottom-24 -right-24 h-72 w-80 rotate-[-30deg] rounded-[50%] bg-emerald-700" />

          <div className="absolute -bottom-12 -right-28 h-56 w-80 rotate-[-30deg] rounded-[50%] bg-emerald-400/55" />

          <div className="absolute bottom-5 -right-24 h-40 w-72 rotate-[-30deg] rounded-[50%] bg-emerald-200/70" />
        </div>

        <div className="pointer-events-none absolute bottom-20 left-8 grid grid-cols-5 gap-2 opacity-20">
          {Array.from({ length: 20 }).map(
            (_, indice) => (
              <span
                key={indice}
                className="h-2 w-2 rounded-full bg-emerald-600"
              />
            ),
          )}
        </div>

        <div className="relative z-20 px-5 pb-8 pt-8 sm:px-10 sm:pb-10 lg:px-16">
          {/* LOGO Y TÍTULO */}

          <header className="text-center">
            <div className="mx-auto flex h-[125px] w-[230px] items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="Logo de Trans 2 de Junio"
                className="h-full w-full scale-[1.4] object-contain"
              />
            </div>

            <div className="mt-1 flex items-center justify-center gap-3">
              <span className="text-emerald-700">
                ❧
              </span>

              <h1 className="text-3xl font-black tracking-tight text-emerald-700 sm:text-4xl">
                Crear Cuenta
              </h1>

              <span className="scale-x-[-1] text-emerald-700">
                ❧
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
              Regístrate como pasajero de Trans 2 de
              Junio
            </p>
          </header>

          {/* MENSAJES */}

          {mensaje && (
            <div
              role="alert"
              className={`mx-auto mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${
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

              <p className="leading-6">
                {mensaje}
              </p>
            </div>
          )}

          {/* FORMULARIO */}

          <form
            onSubmit={registrarUsuario}
            className="mx-auto mt-7 grid max-w-4xl gap-x-7 gap-y-5 md:grid-cols-2"
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

            <div>
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
                  className="h-[58px] w-full rounded-xl border border-emerald-500 bg-white pl-12 pr-20 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
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
                    className="text-slate-400 transition hover:text-emerald-700"
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
              className="flex h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#009348] to-[#00783b] px-5 text-base font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:from-[#00823f] hover:to-[#006432] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
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

            <div className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 md:col-span-2">
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

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-500">
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

        <footer className="relative z-20 overflow-hidden bg-gradient-to-r from-[#006b35] to-[#009249] px-5 pb-5 pt-8 text-white">
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

          <div className="relative z-10 flex items-center justify-center gap-2 text-center">
            <ShieldCheck size={16} />

            <p className="text-xs font-semibold">
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
    <div>
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
          maxLength={maxLength}
          disabled={bloqueado}
          required
          className="h-[58px] w-full rounded-xl border border-emerald-500 bg-white pl-12 pr-11 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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