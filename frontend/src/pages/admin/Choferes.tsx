import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  BadgeCheck,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import {
  actualizarPermisoEscaneo,
  crearChofer,
  obtenerChoferes,
  type Chofer,
  type CrearChoferDatos,
} from "../../services/choferes.service";

type FormularioChofer = CrearChoferDatos;

const formularioInicial: FormularioChofer = {
  nombre: "",
  apellido: "",
  ci: "",
  telefono: "",
  email: "",
  password: "",
  puedeEscanearTickets: true,
};

function mensajeDeError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error &&
    typeof error.mensaje === "string"
  ) {
    return error.mensaje;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "No se pudo completar la operación. Intenta nuevamente.";
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Choferes() {
  const [formulario, setFormulario] =
    useState<FormularioChofer>(formularioInicial);

  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [actualizandoId, setActualizandoId] =
    useState<string | null>(null);

  const [mostrarPassword, setMostrarPassword] =
    useState(false);

  const [mensajeError, setMensajeError] =
    useState("");
  const [mensajeExito, setMensajeExito] =
    useState("");

  const correoPreview = useMemo(() => {
    return formulario.email.trim() || "chofer1@trans2junio.com";
  }, [formulario.email]);

  const passwordPreview = useMemo(() => {
    return formulario.password.trim() || "Chofer2026*";
  }, [formulario.password]);

  async function cargarChoferes() {
    try {
      setCargando(true);
      setMensajeError("");

      const data = await obtenerChoferes();
      setChoferes(data);
    } catch (error) {
      setMensajeError(mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarChoferes();
  }, []);

  function actualizarCampo(
    campo: keyof FormularioChofer,
    valor: string | boolean,
  ) {
    setFormulario((previo) => ({
      ...previo,
      [campo]: valor,
    }));

    if (mensajeError) setMensajeError("");
    if (mensajeExito) setMensajeExito("");
  }

  async function registrarChofer(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (guardando) return;

    setMensajeError("");
    setMensajeExito("");

    const datos = {
      ...formulario,
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      ci: formulario.ci.trim(),
      telefono: formulario.telefono.trim(),
      email: formulario.email.trim().toLowerCase(),
      password: formulario.password,
    };

    if (
      !datos.nombre ||
      !datos.apellido ||
      !datos.ci ||
      !datos.telefono ||
      !datos.email ||
      !datos.password
    ) {
      setMensajeError(
        "Completa todos los campos para registrar al chofer.",
      );
      return;
    }

    if (!validarEmail(datos.email)) {
      setMensajeError(
        "Ingresa un correo electrónico válido para el chofer.",
      );
      return;
    }

    if (datos.password.length < 8) {
      setMensajeError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    try {
      setGuardando(true);

      const respuesta = await crearChofer(datos);

      setChoferes((previo) => [
        respuesta.usuario,
        ...previo,
      ]);

      setMensajeExito(
        "Chofer registrado correctamente. Ya puede iniciar sesión con los datos generados.",
      );

      setFormulario(formularioInicial);
      setMostrarPassword(false);
    } catch (error) {
      setMensajeError(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarPermisoEscaneo(
    chofer: Chofer,
    nuevoPermiso: boolean,
  ) {
    try {
      setActualizandoId(chofer.id);
      setMensajeError("");
      setMensajeExito("");

      const respuesta = await actualizarPermisoEscaneo(
        chofer.id,
        nuevoPermiso,
      );

      setChoferes((previo) =>
        previo.map((item) =>
          item.id === chofer.id
            ? {
                ...item,
                puedeEscanearTickets:
                  respuesta.usuario.puedeEscanearTickets,
              }
            : item,
        ),
      );

      setMensajeExito(
        nuevoPermiso
          ? `Se habilitó el escaneo para ${chofer.nombre} ${chofer.apellido}.`
          : `Se retiró el permiso de escaneo para ${chofer.nombre} ${chofer.apellido}.`,
      );
    } catch (error) {
      setMensajeError(mensajeDeError(error));
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <section className="space-y-6">
      {/* ENCABEZADO */}
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-emerald-800">
              Acceso de choferes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Registra las cuentas de los choferes y controla
              quién puede validar boletos. El chofer ingresará
              con su correo y contraseña y accederá a su
              escáner de tickets.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-bold">
              Recomendación
            </p>
            <p className="mt-1">
              Usa un correo válido y una contraseña fácil de
              entregar al chofer.
            </p>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {mensajeError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {mensajeError}
        </div>
      )}

      {mensajeExito && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
          {mensajeExito}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        {/* FORMULARIO */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UserPlus size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Registrar chofer
              </h2>

              <p className="text-sm text-slate-500">
                Completa los datos para crear su acceso al sistema.
              </p>
            </div>
          </div>

          <form
            onSubmit={registrarChofer}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* NOMBRES */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <UserRound size={16} className="text-emerald-700" />
                  Nombres
                </label>

                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    actualizarCampo("nombre", e.target.value)
                  }
                  placeholder="Ej.: Edwin"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* APELLIDOS */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <BadgeCheck size={16} className="text-emerald-700" />
                  Apellidos
                </label>

                <input
                  type="text"
                  value={formulario.apellido}
                  onChange={(e) =>
                    actualizarCampo("apellido", e.target.value)
                  }
                  placeholder="Ej.: Lojo Navia"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* CI */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <IdCard size={16} className="text-emerald-700" />
                  Carnet de identidad
                </label>

                <input
                  type="text"
                  value={formulario.ci}
                  onChange={(e) =>
                    actualizarCampo("ci", e.target.value)
                  }
                  placeholder="Ej.: 12744227"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* TELEFONO */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Phone size={16} className="text-emerald-700" />
                  Teléfono
                </label>

                <input
                  type="text"
                  value={formulario.telefono}
                  onChange={(e) =>
                    actualizarCampo("telefono", e.target.value)
                  }
                  placeholder="Ej.: 67542913"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {/* CORREO */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Mail size={16} className="text-emerald-700" />
                  Correo del chofer
                </label>

                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) =>
                    actualizarCampo("email", e.target.value)
                  }
                  placeholder="Ej.: chofer1@trans2junio.com"
                  className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Este correo será el usuario con el que el chofer
                  iniciará sesión.
                </p>
              </div>

              {/* CONTRASEÑA */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <KeyRound size={16} className="text-emerald-700" />
                  Contraseña
                </label>

                <div className="relative">
                  <input
                    type={
                      mostrarPassword ? "text" : "password"
                    }
                    value={formulario.password}
                    onChange={(e) =>
                      actualizarCampo("password", e.target.value)
                    }
                    placeholder="Ej.: Chofer2026*"
                    className="h-14 w-full rounded-2xl border border-slate-300 px-4 pr-14 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPassword((previo) => !previo)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700"
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    title={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Mínimo 8 caracteres. Ejemplo:{" "}
                  <span className="font-semibold text-slate-700">
                    Chofer2026*
                  </span>
                </p>
              </div>
            </div>

            {/* PERMISO */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <input
                type="checkbox"
                checked={formulario.puedeEscanearTickets}
                onChange={(e) =>
                  actualizarCampo(
                    "puedeEscanearTickets",
                    e.target.checked,
                  )
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
              />

              <div>
                <p className="font-bold text-emerald-900">
                  Permitir escaneo de boletos
                </p>

                <p className="mt-1 text-sm text-emerald-800">
                  Si está activado, el chofer podrá validar tickets
                  QR al iniciar sesión en su escáner.
                </p>
              </div>
            </label>

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={guardando}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 text-base font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando
                ? "Creando cuenta de chofer..."
                : "Crear cuenta de chofer"}
            </button>
          </form>
        </div>

        {/* PANEL DE AYUDA */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Acceso que recibirá el chofer
                </h3>
                <p className="text-xs text-slate-500">
                  Vista previa de los datos de acceso.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Rol
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  CHOFER
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Correo de acceso
                </p>
                <p className="mt-1 break-all font-semibold text-slate-800">
                  {correoPreview}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Contraseña inicial
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {mostrarPassword
                    ? passwordPreview
                    : "••••••••••"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Pantalla a la que ingresará
                </p>
                <p className="mt-1 font-semibold text-emerald-700">
                  /chofer/escanear-ticket
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Escaneo habilitado
                </p>
                <p className="mt-1 font-semibold text-slate-800">
                  {formulario.puedeEscanearTickets
                    ? "Sí, podrá validar boletos"
                    : "No, solo tendrá la cuenta creada"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-black text-amber-900">
              Ejemplo rápido
            </h3>

            <ul className="mt-4 space-y-2 text-sm text-amber-900">
              <li>
                <span className="font-bold">Nombre:</span> Edwin
              </li>
              <li>
                <span className="font-bold">Apellido:</span> Lojo
              </li>
              <li>
                <span className="font-bold">CI:</span> 12744227
              </li>
              <li>
                <span className="font-bold">Teléfono:</span> 67542913
              </li>
              <li>
                <span className="font-bold">Correo:</span>{" "}
                chofer1@trans2junio.com
              </li>
              <li>
                <span className="font-bold">Contraseña:</span>{" "}
                Chofer2026*
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* LISTA DE CHOFERES */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              Choferes registrados
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Administra sus permisos de escaneo y revisa su estado.
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Cargando choferes...
          </div>
        ) : choferes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay choferes para mostrar.
          </div>
        ) : (
          <div className="space-y-4">
            {choferes.map((chofer) => (
              <div
                key={chofer.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-800">
                      {chofer.nombre} {chofer.apellido}
                    </h3>

                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-bold">CI:</span>{" "}
                        {chofer.ci}
                      </p>
                      <p>
                        <span className="font-bold">Teléfono:</span>{" "}
                        {chofer.telefono || "Sin dato"}
                      </p>
                      <p>
                        <span className="font-bold">Correo:</span>{" "}
                        {chofer.email}
                      </p>
                      <p>
                        <span className="font-bold">Estado:</span>{" "}
                        {chofer.estado ? "Activo" : "Inactivo"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          chofer.estado
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {chofer.estado ? "Cuenta activa" : "Cuenta inactiva"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          chofer.puedeEscanearTickets
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {chofer.puedeEscanearTickets
                          ? "Puede escanear"
                          : "Sin permiso de escaneo"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {chofer.puedeEscanearTickets ? (
                      <button
                        type="button"
                        disabled={actualizandoId === chofer.id}
                        onClick={() =>
                          cambiarPermisoEscaneo(chofer, false)
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {actualizandoId === chofer.id
                          ? "Actualizando..."
                          : "Retirar permiso de escaneo"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actualizandoId === chofer.id}
                        onClick={() =>
                          cambiarPermisoEscaneo(chofer, true)
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                      >
                        {actualizandoId === chofer.id
                          ? "Actualizando..."
                          : "Habilitar escaneo"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}