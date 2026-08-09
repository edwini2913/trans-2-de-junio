import {
  Fragment,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  BusFront,
  CalendarDays,
  Home,
  LogOut,
  QrCode,
  Ticket,
  User,
  CheckCircle,
} from "lucide-react";

import {
  obtenerAsientosPorViaje,
} from "../../services/asientos.service";

import {
  crearReserva,
} from "../../services/reservas.service";

type Asiento = {
  id: string;
  numero: number;
  estado: string;
};

function ComprarPasaje() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const viaje =
    location.state?.viaje;

  const usuario =
    JSON.parse(
      localStorage.getItem(
        "usuario",
      ) || "{}",
    );

  const [
    asientos,
    setAsientos,
  ] = useState<Asiento[]>([]);

  const [
    asientoSeleccionado,
    setAsientoSeleccionado,
  ] = useState<Asiento | null>(
    null,
  );

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    exito,
    setExito,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  useEffect(() => {
    async function cargarAsientos() {
      if (!viaje?.id) {
        setCargando(false);
        return;
      }

      try {
        const data =
          await obtenerAsientosPorViaje(
            viaje.id,
          );

        setAsientos(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch {
        setMensaje(
          "No se pudieron cargar los asientos.",
        );

        setExito(false);
      } finally {
        setCargando(false);
      }
    }

    void cargarAsientos();
  }, [viaje?.id]);

  function cerrarSesion() {
    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "usuario",
    );

    navigate("/");
  }

  async function confirmarReserva() {
    if (!asientoSeleccionado) {
      setMensaje(
        "Selecciona un asiento para continuar.",
      );

      setExito(false);

      return;
    }

    try {
      const reserva =
        await crearReserva({
          usuarioId:
            usuario.id,

          viajeId:
            viaje.id,

          asientoIds: [
            asientoSeleccionado.id,
          ],
        });

      setMensaje(
        `Reserva confirmada correctamente. Código: ${reserva.codigoReserva}`,
      );

      setExito(true);

      setAsientos(
        (
          anteriores,
        ) =>
          anteriores.map(
            (
              asiento,
            ) =>
              asiento.id ===
              asientoSeleccionado.id
                ? {
                    ...asiento,

                    estado:
                      "OCUPADO",
                  }
                : asiento,
          ),
      );

      setAsientoSeleccionado(
        null,
      );
    } catch {
      setMensaje(
        "No se pudo confirmar la reserva.",
      );

      setExito(false);
    }
  }

  if (!viaje) {
    return (
      <div
        className="
          flex min-h-screen
          items-center justify-center
          bg-[#070b16]
          px-4 text-white
        "
      >
        <div
          className="
            w-full max-w-lg
            rounded-3xl border
            border-white/10
            bg-[#111827]
            p-6 text-center
            sm:p-10
          "
        >
          <h1
            className="
              text-2xl font-black
              text-red-400
              sm:text-3xl
            "
          >
            No se seleccionó ningún viaje
          </h1>

          <Link
            to="/pasajero/comprar-reservar"
            className="
              mt-6 inline-block
              rounded-xl
              bg-yellow-400
              px-6 py-4
              font-black
              text-slate-950
              sm:px-8
            "
          >
            Volver a comprar
          </Link>
        </div>
      </div>
    );
  }

  const disponibles =
    asientos.filter(
      (
        asiento,
      ) =>
        asiento.estado ===
        "DISPONIBLE",
    ).length;

  const ocupados =
    asientos.filter(
      (
        asiento,
      ) =>
        asiento.estado !==
        "DISPONIBLE",
    ).length;

  return (
    <div
      className="
        min-h-screen
        bg-[#070b16]
        text-white
      "
    >
      <nav
        className="
          flex flex-col gap-4
          border-b
          border-white/10
          bg-[#0b1020]
          px-4 py-4
          sm:px-6
          lg:flex-row
          lg:items-center
          lg:justify-between
          lg:px-10
        "
      >
        <div
          className="
            flex items-center
            gap-4
          "
        >
          <div
            className="
              shrink-0
              rounded-2xl
              bg-yellow-400
              p-3 text-slate-950
            "
          >
            <BusFront size={26} />
          </div>

          <div className="min-w-0">
            <h1
              className="
                truncate text-xl
                font-black
              "
            >
              Trans 2 de Junio
            </h1>

            <p
              className="
                text-xs
                text-slate-400
              "
            >
              SISTEMA DE PASAJES
            </p>
          </div>
        </div>

        <div
          className="
            flex w-full
            items-center gap-4
            overflow-x-auto
            pb-1 text-sm
            font-semibold
            text-slate-300
            lg:w-auto
            lg:gap-7
            lg:overflow-visible
            lg:pb-0
          "
        >
          <Link
            to="/pasajero"
            className="
              flex shrink-0
              items-center gap-2
              hover:text-yellow-400
            "
          >
            <Home size={18} />

            Inicio
          </Link>

          <Link
            to="/pasajero/comprar-reservar"
            className="
              flex shrink-0
              items-center gap-2
              rounded-xl border
              border-yellow-400/40
              px-4 py-2
              text-yellow-400
              sm:px-5
            "
          >
            <Ticket size={18} />

            Comprar / Reservar
          </Link>

          <Link
            to="/pasajero/mis-reservas"
            className="
              flex shrink-0
              items-center gap-2
              hover:text-yellow-400
            "
          >
            <CalendarDays
              size={18}
            />

            Mis reservas
          </Link>

          <Link
            to="/pasajero/tickets"
            className="
              flex shrink-0
              items-center gap-2
              hover:text-yellow-400
            "
          >
            <QrCode size={18} />

            Mis tickets
          </Link>

          <span
            className="
              hidden text-sm
              text-slate-400
              xl:inline
            "
          >
            {usuario.email}
          </span>

          <button
            type="button"
            onClick={
              cerrarSesion
            }
            className="
              flex shrink-0
              items-center gap-2
              hover:text-red-400
            "
          >
            <LogOut size={18} />

            Salir
          </button>
        </div>
      </nav>

      <main
        className="
          mx-auto max-w-6xl
          px-3 py-6
          sm:px-6 sm:py-8
          lg:px-8 lg:py-10
        "
      >
        <h2
          className="
            text-3xl
            font-black
            sm:text-4xl
          "
        >
          Comprar o reservar pasaje
        </h2>

        <p
          className="
            mt-2
            text-slate-400
          "
        >
          Selecciona tu asiento y confirma tu reserva.
        </p>

        <section
          className="
            mt-6 rounded-2xl
            border border-white/10
            bg-[#111827] p-4
            sm:mt-8
            sm:rounded-3xl
            sm:p-7
          "
        >
          <TituloPaso
            numero="1"
            titulo="Ruta y fecha"
          />

          <div
            className="
              grid gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <Info
              titulo="Ruta"
              valor={
                `${viaje.ruta.origen} → ${viaje.ruta.destino}`
              }
            />

            <Info
              titulo="Fecha"
              valor={
                viaje.fecha ||
                viaje.fechaSalida
              }
            />

            <Info
              titulo="Salida"
              valor={
                viaje.horaSalida
              }
            />

            <Info
              titulo="Precio"
              valor={
                `Bs. ${viaje.precio}`
              }
            />
          </div>
        </section>

        <section
          className="
            mt-6 rounded-2xl
            border border-white/10
            bg-[#111827] p-4
            sm:rounded-3xl
            sm:p-7
          "
        >
          <TituloPaso
            numero="2"
            titulo="Elige tu asiento"
          />

          <div
            className="
              mb-6 flex
              flex-wrap gap-3
              text-sm
              sm:gap-6
            "
          >
            <Leyenda
              color="bg-emerald-500"
              texto={
                `Disponible (${disponibles})`
              }
            />

            <Leyenda
              color="bg-red-500"
              texto={
                `Ocupado (${ocupados})`
              }
            />

            <Leyenda
              color="bg-yellow-400"
              texto="Seleccionado"
            />
          </div>

          {cargando ? (
            <p className="text-slate-400">
              Cargando asientos...
            </p>
          ) : (
            <div
              className="
                rounded-2xl border
                border-white/10
                bg-[#0b1020] p-3
                sm:rounded-3xl
                sm:p-8
              "
            >
              <div
                className="
                  mb-6 flex
                  flex-col gap-3
                  border-b
                  border-white/10
                  pb-5
                  sm:mb-8
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div
                  className="
                    flex items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      rounded-full
                      border
                      border-white/10
                      bg-white/5 p-3
                    "
                  >
                    <User size={22} />
                  </div>

                  <div>
                    <p className="font-black">
                      CONDUCTOR
                    </p>

                    <p
                      className="
                        text-sm
                        text-slate-500
                      "
                    >
                      Parte frontal del bus
                    </p>
                  </div>
                </div>

                <span
                  className="
                    self-start
                    rounded-xl border
                    border-white/10
                    px-4 py-2
                    text-slate-400
                    sm:self-auto
                  "
                >
                  {viaje.vehiculo.modelo}
                </span>
              </div>

              <div
                className="
                  mx-auto
                  max-w-xl
                "
              >
                <div
                  className="
                    grid grid-cols-5
                    gap-2 sm:gap-4
                  "
                >
                  {asientos.map(
                    (
                      asiento,
                      index,
                    ) => {
                      const ocupado =
                        asiento.estado !==
                        "DISPONIBLE";

                      const seleccionado =
                        asientoSeleccionado?.id ===
                        asiento.id;

                      const pasillo =
                        index % 4 ===
                        2;

                      return (
                        <Fragment
                          key={
                            asiento.id
                          }
                        >
                          {pasillo && (
                            <div
                              aria-hidden="true"
                            />
                          )}

                          <button
                            type="button"
                            disabled={
                              ocupado
                            }
                            onClick={() =>
                              setAsientoSeleccionado(
                                asiento,
                              )
                            }
                            className={`
                              min-h-12
                              min-w-0
                              rounded-xl
                              border px-1
                              font-black
                              transition
                              ${
                                ocupado
                                  ? "cursor-not-allowed border-red-500 bg-red-500/20 text-red-400"
                                  : seleccionado
                                    ? "scale-105 border-yellow-400 bg-yellow-400 text-slate-950"
                                    : "border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                              }
                            `}
                          >
                            {asiento.numero}
                          </button>
                        </Fragment>
                      );
                    },
                  )}
                </div>

                <div
                  className="
                    mt-8 border-t
                    border-white/10
                    pt-4 text-center
                    text-slate-500
                  "
                >
                  PARTE TRASERA
                </div>
              </div>
            </div>
          )}
        </section>

        <section
          className="
            mt-6 rounded-2xl
            border border-white/10
            bg-[#111827] p-4
            sm:rounded-3xl
            sm:p-7
          "
        >
          <TituloPaso
            numero="3"
            titulo="Resumen del viaje"
          />

          <div
            className="
              grid gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <Info
              titulo="Pasajero"
              valor={
                usuario.nombre ||
                "Pasajero"
              }
            />

            <Info
              titulo="Asiento"
              valor={
                asientoSeleccionado
                  ? `#${asientoSeleccionado.numero}`
                  : "No seleccionado"
              }
            />

            <Info
              titulo="Fecha"
              valor={
                viaje.fecha ||
                viaje.fechaSalida
              }
            />

            <Info
              titulo="Total"
              valor={
                `Bs. ${viaje.precio}`
              }
              destacado
            />
          </div>

          <button
            type="button"
            onClick={
              confirmarReserva
            }
            disabled={
              !asientoSeleccionado
            }
            className="
              mt-7 flex w-full
              items-center
              justify-center gap-2
              rounded-2xl
              bg-emerald-500
              px-4 py-4
              font-black text-white
              transition
              hover:bg-emerald-400
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <CheckCircle size={22} />

            Confirmar reserva
          </button>

          {mensaje && (
            <div
              className={`
                mt-5 rounded-2xl
                border p-4
                font-bold
                ${
                  exito
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }
              `}
            >
              {mensaje}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function TituloPaso({
  numero,
  titulo,
}: {
  numero: string;
  titulo: string;
}) {
  return (
    <div
      className="
        mb-6 flex
        items-center gap-3
      "
    >
      <span
        className="
          flex h-9 w-9
          shrink-0 items-center
          justify-center
          rounded-full
          bg-yellow-400
          font-black
          text-slate-950
        "
      >
        {numero}
      </span>

      <h3
        className="
          text-xl
          font-black
          sm:text-2xl
        "
      >
        {titulo}
      </h3>
    </div>
  );
}

function Info({
  titulo,
  valor,
  destacado = false,
}: {
  titulo: string;
  valor: string;
  destacado?: boolean;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-2xl
        border
        border-white/10
        bg-[#0b1020]
        p-5
      "
    >
      <p
        className="
          text-sm
          text-slate-500
        "
      >
        {titulo}
      </p>

      <h4
        className={`
          mt-2 break-words
          font-black
          ${
            destacado
              ? "text-2xl text-yellow-400"
              : "text-lg text-white"
          }
        `}
      >
        {valor}
      </h4>
    </div>
  );
}

function Leyenda({
  color,
  texto,
}: {
  color: string;
  texto: string;
}) {
  return (
    <div
      className="
        flex items-center
        gap-2
        text-slate-400
      "
    >
      <span
        className={`
          h-4 w-4
          shrink-0 rounded-full
          ${color}
        `}
      />

      {texto}
    </div>
  );
}

export default ComprarPasaje;