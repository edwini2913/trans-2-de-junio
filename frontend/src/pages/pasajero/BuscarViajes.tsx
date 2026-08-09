import {
  useState,
  type FormEvent,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  Search,
  BusFront,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";

import logo from "../../assets/logo.png";

import {
  buscarViajes,
} from "../../services/viajes.service";

type ViajeEncontrado = {
  id: string;

  horaSalida: string;

  precio: number | string;

  asientosDisponibles:
    number;

  ruta: {
    origen: string;
    destino: string;
  };

  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
  };
};

function BuscarViajes() {
  const [
    origen,
    setOrigen,
  ] = useState("");

  const [
    destino,
    setDestino,
  ] = useState("");

  const [
    fecha,
    setFecha,
  ] = useState("");

  const [
    viajes,
    setViajes,
  ] = useState<ViajeEncontrado[]>(
    [],
  );

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    cargando,
    setCargando,
  ] = useState(false);

  async function buscar(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setCargando(true);
    setMensaje("");
    setViajes([]);

    try {
      const data =
        await buscarViajes(
          origen.trim(),
          destino.trim(),
          fecha,
        );

      const resultados =
        Array.isArray(data)
          ? data
          : [];

      if (
        resultados.length ===
        0
      ) {
        setMensaje(
          "No se encontraron viajes disponibles.",
        );

        return;
      }

      setViajes(
        resultados as
          ViajeEncontrado[],
      );
    } catch {
      setMensaje(
        "No se pudieron buscar los viajes.",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="
        min-h-screen
        bg-slate-100
      "
    >
      <header
        className="
          flex flex-col gap-4
          bg-blue-950 px-4 py-4
          text-white
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            flex min-w-0
            items-center gap-3
            sm:gap-4
          "
        >
          <img
            src={logo}
            alt="Logo Trans 2 de Junio"
            className="
              w-16 shrink-0
              rounded-xl bg-white
              p-1 sm:w-20
            "
          />

          <div className="min-w-0">
            <h1
              className="
                text-lg font-black
                text-yellow-400
                sm:text-2xl
              "
            >
              TRANS 2 DE JUNIO
            </h1>

            <p
              className="
                text-sm
                text-blue-200
              "
            >
              Búsqueda de viajes
            </p>
          </div>
        </div>

        <Link
          to="/pasajero"
          className="
            flex w-full
            items-center
            justify-center gap-2
            rounded-xl bg-white
            px-4 py-3
            font-bold text-blue-950
            transition
            hover:bg-blue-50
            sm:w-auto sm:py-2
          "
        >
          <ArrowLeft size={18} />

          Volver
        </Link>
      </header>

      <main
        className="
          p-3
          sm:p-6
          lg:p-8
        "
      >
        <section
          className="
            rounded-2xl
            bg-white p-4
            shadow
            sm:rounded-3xl
            sm:p-8
          "
        >
          <h2
            className="
              text-2xl
              font-black
              text-slate-900
              sm:text-3xl
            "
          >
            Buscar viaje disponible
          </h2>

          <form
            onSubmit={buscar}
            className="
              mt-6 grid gap-4
              sm:grid-cols-2
              lg:mt-8
              lg:grid-cols-4
              lg:gap-5
            "
          >
            <input
              value={origen}
              onChange={(
                event,
              ) =>
                setOrigen(
                  event.target.value,
                )
              }
              placeholder="Origen: Chimoré"
              className="
                w-full rounded-xl
                border border-slate-300
                p-4 outline-none
                transition
                focus:border-blue-700
                focus:ring-4
                focus:ring-blue-100
              "
              required
            />

            <input
              value={destino}
              onChange={(
                event,
              ) =>
                setDestino(
                  event.target.value,
                )
              }
              placeholder="Destino: Cochabamba"
              className="
                w-full rounded-xl
                border border-slate-300
                p-4 outline-none
                transition
                focus:border-blue-700
                focus:ring-4
                focus:ring-blue-100
              "
              required
            />

            <input
              type="date"
              value={fecha}
              onChange={(
                event,
              ) =>
                setFecha(
                  event.target.value,
                )
              }
              className="
                w-full rounded-xl
                border border-slate-300
                p-4 outline-none
                transition
                focus:border-blue-700
                focus:ring-4
                focus:ring-blue-100
              "
              required
            />

            <button
              type="submit"
              disabled={cargando}
              className="
                flex min-h-14
                items-center
                justify-center gap-2
                rounded-xl
                bg-blue-800
                px-4 py-4
                font-black text-white
                transition
                hover:bg-blue-900
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Search size={20} />

              {cargando
                ? "Buscando..."
                : "Buscar"}
            </button>
          </form>
        </section>

        {mensaje && (
          <div
            className="
              mt-6 rounded-2xl
              border border-yellow-300
              bg-yellow-100 p-4
              font-bold
              text-yellow-800
            "
          >
            {mensaje}
          </div>
        )}

        <section
          className="
            mt-6 grid gap-4
            lg:mt-8
            lg:grid-cols-2
            lg:gap-6
          "
        >
          {viajes.map(
            (viaje) => (
              <article
                key={viaje.id}
                className="
                  rounded-2xl border
                  bg-white p-4
                  shadow transition
                  hover:shadow-xl
                  sm:rounded-3xl
                  sm:p-6
                "
              >
                <div
                  className="
                    flex min-w-0
                    items-start gap-3
                    sm:items-center
                    sm:gap-4
                  "
                >
                  <div
                    className="
                      shrink-0 rounded-2xl
                      bg-blue-100 p-3
                      text-blue-800
                      sm:p-4
                    "
                  >
                    <BusFront
                      size={38}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3
                      className="
                        break-words
                        text-lg font-black
                        text-slate-900
                        sm:text-2xl
                      "
                    >
                      {viaje.ruta.origen}
                      {" → "}
                      {viaje.ruta.destino}
                    </h3>

                    <p
                      className="
                        mt-1 break-words
                        text-sm
                        text-slate-500
                        sm:text-base
                      "
                    >
                      {viaje.vehiculo.marca}
                      {" "}
                      {viaje.vehiculo.modelo}
                      {" - "}
                      {viaje.vehiculo.placa}
                    </p>
                  </div>
                </div>

                <div
                  className="
                    mt-5 grid
                    grid-cols-1 gap-3
                    min-[380px]:grid-cols-3
                    sm:mt-6 sm:gap-4
                  "
                >
                  <InformacionViaje
                    icono={
                      <Clock
                        size={24}
                      />
                    }
                    titulo="Salida"
                    valor={
                      viaje.horaSalida
                    }
                  />

                  <InformacionViaje
                    icono={
                      <Users
                        size={24}
                      />
                    }
                    titulo="Asientos"
                    valor={
                      String(
                        viaje.asientosDisponibles,
                      )
                    }
                  />

                  <InformacionViaje
                    icono={
                      <DollarSign
                        size={24}
                      />
                    }
                    titulo="Precio"
                    valor={
                      `Bs ${viaje.precio}`
                    }
                  />
                </div>

                <Link
                  to="/pasajero/comprar"
                  state={{
                    viaje,
                  }}
                  className="
                    mt-6 block w-full
                    rounded-xl
                    bg-yellow-400
                    px-4 py-4
                    text-center
                    font-black
                    text-slate-950
                    transition
                    hover:bg-yellow-300
                  "
                >
                  Reservar pasaje
                </Link>
              </article>
            ),
          )}
        </section>
      </main>
    </div>
  );
}

function InformacionViaje({
  icono,
  titulo,
  valor,
}: {
  icono:
    React.ReactNode;

  titulo:
    string;

  valor:
    string;
}) {
  return (
    <div
      className="
        min-w-0 rounded-2xl
        bg-slate-100 p-4
      "
    >
      <div className="text-blue-800">
        {icono}
      </div>

      <p
        className="
          mt-2 text-sm
          text-slate-500
        "
      >
        {titulo}
      </p>

      <h4
        className="
          break-words
          font-black
          text-slate-900
        "
      >
        {valor}
      </h4>
    </div>
  );
}

export default BuscarViajes;