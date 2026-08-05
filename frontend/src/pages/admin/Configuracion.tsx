import {
  Bell,
  Building2,
  Clock3,
  CreditCard,
  Save,
  Settings,
  Ticket,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type ConfiguracionSistema = {
  nombreSindicato: string;
  telefono: string;
  direccion: string;
  correo: string;
  tiempoReserva: number;
  maximoAsientos: number;
  prefijoTicket: string;
  titularPago: string;
  numeroPago: string;
  notificarReservas: boolean;
  notificarPagos: boolean;
  notificarReclamos: boolean;
};

const CONFIGURACION_INICIAL: ConfiguracionSistema = {
  nombreSindicato:
    "Sindicato Autotransporte Trans 2 de Junio",
  telefono: "",
  direccion: "Chimoré, Cochabamba",
  correo: "",
  tiempoReserva: 15,
  maximoAsientos: 4,
  prefijoTicket: "T2J",
  titularPago: "",
  numeroPago: "",
  notificarReservas: true,
  notificarPagos: true,
  notificarReclamos: true,
};

export default function Configuracion() {
  const [configuracion, setConfiguracion] =
    useState<ConfiguracionSistema>(
      CONFIGURACION_INICIAL,
    );

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    const configuracionGuardada =
      localStorage.getItem(
        "configuracionSistema",
      );

    if (!configuracionGuardada) {
      return;
    }

    try {
      const datos = JSON.parse(
        configuracionGuardada,
      ) as Partial<ConfiguracionSistema>;

      setConfiguracion({
        ...CONFIGURACION_INICIAL,
        ...datos,
      });
    } catch {
      localStorage.removeItem(
        "configuracionSistema",
      );
    }
  }, []);

  const cambiarCampo = (
    evento: ChangeEvent<HTMLInputElement>,
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = evento.target;

    setConfiguracion((anterior) => ({
      ...anterior,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const guardarConfiguracion = (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    localStorage.setItem(
      "configuracionSistema",
      JSON.stringify(configuracion),
    );

    setMensaje(
      "Configuración guardada correctamente",
    );

    window.setTimeout(() => {
      setMensaje("");
    }, 3000);
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Settings size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                Configuración
              </h1>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Administra la información y las
                preferencias del sistema.
              </p>
            </div>
          </div>
        </header>

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-700">
            {mensaje}
          </div>
        )}

        <form
          onSubmit={guardarConfiguracion}
          className="space-y-6"
        >
          <Seccion
            titulo="Datos del sindicato"
            descripcion="Información general de Trans 2 de Junio."
            icono={<Building2 size={22} />}
          >
            <Campo
              etiqueta="Nombre del sindicato"
              name="nombreSindicato"
              value={
                configuracion.nombreSindicato
              }
              onChange={cambiarCampo}
            />

            <Campo
              etiqueta="Teléfono"
              name="telefono"
              value={configuracion.telefono}
              onChange={cambiarCampo}
            />

            <Campo
              etiqueta="Dirección"
              name="direccion"
              value={configuracion.direccion}
              onChange={cambiarCampo}
            />

            <Campo
              etiqueta="Correo electrónico"
              name="correo"
              type="email"
              value={configuracion.correo}
              onChange={cambiarCampo}
            />
          </Seccion>

          <Seccion
            titulo="Reservas"
            descripcion="Controla el tiempo y la cantidad de asientos."
            icono={<Clock3 size={22} />}
          >
            <Campo
              etiqueta="Tiempo de reserva (minutos)"
              name="tiempoReserva"
              type="number"
              min={5}
              max={120}
              value={configuracion.tiempoReserva}
              onChange={cambiarCampo}
            />

            <Campo
              etiqueta="Máximo de asientos por compra"
              name="maximoAsientos"
              type="number"
              min={1}
              max={10}
              value={configuracion.maximoAsientos}
              onChange={cambiarCampo}
            />
          </Seccion>

          <Seccion
            titulo="Tickets"
            descripcion="Configura el identificador de los tickets."
            icono={<Ticket size={22} />}
          >
            <Campo
              etiqueta="Prefijo del ticket"
              name="prefijoTicket"
              value={
                configuracion.prefijoTicket
              }
              onChange={cambiarCampo}
            />
          </Seccion>

          <Seccion
            titulo="Pago mediante QR"
            descripcion="Datos que aparecerán en la pantalla de pago."
            icono={<CreditCard size={22} />}
          >
            <Campo
              etiqueta="Nombre del titular"
              name="titularPago"
              value={
                configuracion.titularPago
              }
              onChange={cambiarCampo}
            />

            <Campo
              etiqueta="Número de cuenta o teléfono"
              name="numeroPago"
              value={configuracion.numeroPago}
              onChange={cambiarCampo}
            />
          </Seccion>

          <Seccion
            titulo="Notificaciones"
            descripcion="Selecciona los avisos que recibirá el administrador."
            icono={<Bell size={22} />}
          >
            <Opcion
              etiqueta="Nuevas reservas"
              name="notificarReservas"
              checked={
                configuracion.notificarReservas
              }
              onChange={cambiarCampo}
            />

            <Opcion
              etiqueta="Nuevos pagos"
              name="notificarPagos"
              checked={
                configuracion.notificarPagos
              }
              onChange={cambiarCampo}
            />

            <Opcion
              etiqueta="Nuevos reclamos"
              name="notificarReclamos"
              checked={
                configuracion.notificarReclamos
              }
              onChange={cambiarCampo}
            />
          </Seccion>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-7 py-3.5 font-black text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800"
            >
              <Save size={20} />
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type SeccionProps = {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  children: React.ReactNode;
};

function Seccion({
  titulo,
  descripcion,
  icono,
  children,
}: SeccionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          {icono}
        </div>

        <div>
          <h2 className="font-black text-slate-900">
            {titulo}
          </h2>

          <p className="text-sm text-slate-500">
            {descripcion}
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

type CampoProps = {
  etiqueta: string;
  name: string;
  value: string | number;
  type?: string;
  min?: number;
  max?: number;
  onChange: (
    evento: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function Campo({
  etiqueta,
  name,
  value,
  type = "text",
  min,
  max,
  onChange,
}: CampoProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">
        {etiqueta}
      </span>

      <input
        name={name}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

type OpcionProps = {
  etiqueta: string;
  name: string;
  checked: boolean;
  onChange: (
    evento: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function Opcion({
  etiqueta,
  name,
  checked,
  onChange,
}: OpcionProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <span className="font-bold text-slate-700">
        {etiqueta}
      </span>

      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 accent-emerald-700"
      />
    </label>
  );
}