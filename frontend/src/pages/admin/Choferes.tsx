import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  BadgeCheck,
  BusFront,
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

import API from "../../services/auth.service";

import {
  actualizarPermisoEscaneo,
  crearChofer,
  obtenerChoferes,
  type Chofer,
  type CrearChoferDatos,
} from "../../services/choferes.service";

type FormularioChofer = CrearChoferDatos;
type TipoVehiculo = "NOAH" | "HIACE" | "FLOTA";
type ModoVehiculo = "NUEVO" | "EXISTENTE" | "NINGUNO";

type VehiculoConChofer = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  tipo: TipoVehiculo;
  numeroFlota: string | null;
  capacidad: number;
  choferHabitual?: { id: string; nombre: string; apellido: string } | null;
};

const vehiculoInicial = {
  placa: "",
  marca: "",
  modelo: "",
  numeroFlota: "",
  tipo: "NOAH" as TipoVehiculo,
};

const capacidadPorTipo: Record<TipoVehiculo, number> = {
  NOAH: 7,
  HIACE: 10,
  FLOTA: 40,
};


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
  if (error && typeof error === "object" && "response" in error) {
    const datos = (error as { response?: { data?: { message?: string | string[] } } }).response?.data;
    if (Array.isArray(datos?.message)) return datos.message.join(". ");
    if (typeof datos?.message === "string") return datos.message;
  }
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
  const [vehiculos, setVehiculos] = useState<VehiculoConChofer[]>([]);
  const [modoVehiculo, setModoVehiculo] = useState<ModoVehiculo>("NUEVO");
  const [vehiculo, setVehiculo] = useState(vehiculoInicial);
  const [vehiculoExistenteId, setVehiculoExistenteId] = useState("");
  const [asignacionesEnLista, setAsignacionesEnLista] = useState<Record<string, string>>({});
  const [vinculandoChoferId, setVinculandoChoferId] = useState<string | null>(null);
  // Evita crear dos cuentas si la segunda solicitud (vehículo) falla.
  const [choferCreadoPendiente, setChoferCreadoPendiente] = useState<Chofer | null>(null);
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

  async function cargarVehiculos() {
    const respuesta = await API.get<VehiculoConChofer[]>("/vehiculos");
    if (!Array.isArray(respuesta.data)) {
      throw new Error("No se pudo obtener la lista de vehículos.");
    }
    setVehiculos(respuesta.data);
  }

  async function cargarChoferes() {
    try {
      setCargando(true);
      setMensajeError("");

      const [data, respuestaVehiculos] = await Promise.all([
        obtenerChoferes(),
        API.get<VehiculoConChofer[]>("/vehiculos"),
      ]);
      setChoferes(data);
      setVehiculos(
        Array.isArray(respuestaVehiculos.data)
          ? respuestaVehiculos.data
          : [],
      );
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

    const datos: CrearChoferDatos = {
      ...formulario,
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      ci: formulario.ci.trim(),
      telefono: formulario.telefono.trim(),
      email: formulario.email.trim().toLowerCase(),
    };

    // Si ya se creó el chofer, no se vuelve a crear al reintentar.
    if (!choferCreadoPendiente) {
      if (!datos.nombre || !datos.apellido || !datos.ci ||
          !datos.telefono || !datos.email || !datos.password) {
        setMensajeError("Completa todos los datos del chofer.");
        return;
      }
      if (!validarEmail(datos.email)) {
        setMensajeError("Ingresa un correo electrónico válido.");
        return;
      }
      if (datos.password.length < 8) {
        setMensajeError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
    }

    if (modoVehiculo === "NUEVO") {
      if (!vehiculo.placa.trim() || !vehiculo.marca.trim() || !vehiculo.modelo.trim()) {
        setMensajeError("Completa la placa, marca y modelo del vehículo.");
        return;
      }
    } else if (modoVehiculo === "EXISTENTE" && !vehiculoExistenteId) {
      setMensajeError("Selecciona el vehículo existente que vas a vincular.");
      return;
    }

    let cuentaCreadaEnEsteIntento = false;
    try {
      setGuardando(true);
      let choferNuevo = choferCreadoPendiente;

      if (!choferNuevo) {
        const respuesta = await crearChofer(datos);
        choferNuevo = respuesta.usuario;
        setChoferCreadoPendiente(choferNuevo);
        cuentaCreadaEnEsteIntento = true;
        setChoferes((previo) => [choferNuevo!, ...previo]);
      }

      if (modoVehiculo === "NUEVO") {
        await API.post("/vehiculos", {
          placa: vehiculo.placa.trim().toUpperCase(),
          marca: vehiculo.marca.trim(),
          modelo: vehiculo.modelo.trim(),
          tipo: vehiculo.tipo,
          numeroFlota: vehiculo.numeroFlota.trim() || null,
          choferId: choferNuevo.id,
          estado: true,
        });
      } else if (modoVehiculo === "EXISTENTE") {
        await API.patch(`/vehiculos/${vehiculoExistenteId}`, {
          choferId: choferNuevo.id,
        });
      }

      setMensajeExito(
        modoVehiculo === "NINGUNO"
          ? "Chofer registrado correctamente. Puedes asignarle vehículo después."
          : `Chofer ${choferNuevo.nombre} ${choferNuevo.apellido} registrado y vehículo vinculado correctamente.`,
      );
      setFormulario(formularioInicial);
      setVehiculo(vehiculoInicial);
      setVehiculoExistenteId("");
      setChoferCreadoPendiente(null);
      setMostrarPassword(false);
      await cargarVehiculos().catch(() => {
        // El guardado ya fue confirmado: un fallo del refresco no lo revierte.
      });
    } catch (error) {
      setMensajeError(
        (choferCreadoPendiente || cuentaCreadaEnEsteIntento)
          ? `La cuenta ya existe; falta vincular el vehículo. Corrige el dato y usa «Reintentar vínculo». ${mensajeDeError(error)}`
          : mensajeDeError(error),
      );
    } finally {
      setGuardando(false);
    }
  }

  async function vincularChoferExistente(chofer: Chofer) {
    const vehiculoId = asignacionesEnLista[chofer.id];
    if (!vehiculoId) {
      setMensajeError("Selecciona una placa para vincular al chofer.");
      return;
    }
    const elegido = vehiculos.find((v) => v.id === vehiculoId);
    if (!elegido) return;
    if (elegido.choferHabitual?.id && elegido.choferHabitual.id !== chofer.id) {
      const confirmado = window.confirm(
        `La placa ${elegido.placa} ya está asignada a ${elegido.choferHabitual.nombre} ${elegido.choferHabitual.apellido}. ¿Deseas cambiar su chofer habitual?`,
      );
      if (!confirmado) return;
    }
    try {
      setVinculandoChoferId(chofer.id);
      setMensajeError("");
      setMensajeExito("");
      await API.patch(`/vehiculos/${vehiculoId}`, { choferId: chofer.id });
      setMensajeExito(`Se vinculó ${elegido.placa} con ${chofer.nombre} ${chofer.apellido}.`);
      await cargarVehiculos();
    } catch (error) {
      setMensajeError(mensajeDeError(error));
    } finally {
      setVinculandoChoferId(null);
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

            {/* VEHÍCULO DEL CHOFER */}
            <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <BusFront size={23} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Vehículo del chofer</h3>
                  <p className="text-sm text-slate-600">Registra una placa nueva o vincula una ya existente.</p>
                </div>
              </div>

              {choferCreadoPendiente && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  La cuenta de {choferCreadoPendiente.nombre} ya fue creada. Al guardar de nuevo solo se vinculará su vehículo; no se duplicará la cuenta.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  ["NUEVO", "Vehículo nuevo"],
                  ["EXISTENTE", "Ya registrado"],
                  ["NINGUNO", "Por ahora, ninguno"],
                ] as const).map(([valor, texto]) => (
                  <label key={valor} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-bold ${modoVehiculo === valor ? "border-emerald-600 bg-white text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    <input type="radio" name="modoVehiculo" checked={modoVehiculo === valor}
                      onChange={() => setModoVehiculo(valor)} />
                    {texto}
                  </label>
                ))}
              </div>

              {modoVehiculo === "NUEVO" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Placa del vehículo
                    <input required maxLength={20} value={vehiculo.placa}
                      onChange={(e) => setVehiculo((v) => ({ ...v, placa: e.target.value.toUpperCase() }))}
                      placeholder="Ej.: 1234-ABC"
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Tipo de vehículo
                    <select value={vehiculo.tipo}
                      onChange={(e) => setVehiculo((v) => ({ ...v, tipo: e.target.value as TipoVehiculo }))}
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600">
                      <option value="NOAH">Noah — 7 asientos</option>
                      <option value="HIACE">Hiace — 10 asientos</option>
                      <option value="FLOTA">Flota — 40 asientos</option>
                    </select>
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Marca
                    <input required maxLength={100} value={vehiculo.marca}
                      onChange={(e) => setVehiculo((v) => ({ ...v, marca: e.target.value }))}
                      placeholder="Ej.: Toyota"
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Modelo
                    <input required maxLength={100} value={vehiculo.modelo}
                      onChange={(e) => setVehiculo((v) => ({ ...v, modelo: e.target.value }))}
                      placeholder="Ej.: Noah"
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Número interno (opcional)
                    <input maxLength={20} value={vehiculo.numeroFlota}
                      onChange={(e) => setVehiculo((v) => ({ ...v, numeroFlota: e.target.value }))}
                      placeholder="Ej.: 211"
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600" />
                  </label>
                  <div className="flex items-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-800">
                    Capacidad automática: {capacidadPorTipo[vehiculo.tipo]} asientos
                  </div>
                </div>
              )}

              {modoVehiculo === "EXISTENTE" && (
                <label className="block text-sm font-bold text-slate-700">
                  Seleccionar vehículo registrado
                  <select required value={vehiculoExistenteId}
                    onChange={(e) => setVehiculoExistenteId(e.target.value)}
                    className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600">
                    <option value="">Elige la placa...</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.placa} · {v.tipo}{v.choferHabitual ? ` · Actual: ${v.choferHabitual.nombre} ${v.choferHabitual.apellido}` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs font-normal text-slate-500">
                    Si ese vehículo tiene otro chofer habitual, la asignación se reemplazará.
                  </span>
                </label>
              )}

              {modoVehiculo === "NINGUNO" && (
                <p className="text-sm text-slate-600">Se creará la cuenta y podrás vincular la placa después.</p>
              )}
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
                ? "Guardando chofer y vehículo..."
                : choferCreadoPendiente
                  ? "Reintentar vínculo del vehículo"
                  : "Registrar chofer y vehículo"}
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
                      <p className="md:col-span-2">
                        <span className="font-bold">Vehículo habitual:</span>{" "}
                        {vehiculos.filter((v) => v.choferHabitual?.id === chofer.id).map((v) => `${v.tipo} · ${v.placa}`).join(", ") || "Sin vehículo asignado"}
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
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 sm:flex-row sm:items-end">
                  <label className="flex-1 text-sm font-bold text-slate-700">
                    Asignar una placa registrada a este chofer
                    <select value={asignacionesEnLista[chofer.id] || ""}
                      onChange={(e) => setAsignacionesEnLista((previo) => ({ ...previo, [chofer.id]: e.target.value }))}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-600">
                      <option value="">Seleccionar vehículo...</option>
                      {vehiculos.map((v) => (
                        <option key={v.id} value={v.id}>{v.placa} · {v.tipo}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" disabled={vinculandoChoferId === chofer.id || !asignacionesEnLista[chofer.id] || !chofer.estado}
                    onClick={() => void vincularChoferExistente(chofer)}
                    className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                    {vinculandoChoferId === chofer.id ? "Vinculando..." : "Guardar vínculo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}