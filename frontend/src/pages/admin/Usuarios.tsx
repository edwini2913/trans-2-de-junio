import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CheckCircle2,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users as UsersIcon,
} from "lucide-react";

import {
  eliminarUsuario,
  obtenerUsuarios,
} from "../../services/users.service";

type TipoMensaje =
  | "exito"
  | "error"
  | "informacion";

type Usuario = {
  id: string;
  codigoUsuario?: string;
  nombre?: string;
  apellido?: string;
  ci?: string;
  telefono?: string;
  email?: string;
  rol?: string;
  estado?: boolean;
};

function Usuarios() {
  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  const [
    eliminandoId,
    setEliminandoId,
  ] = useState<string | null>(null);

  const [mensaje, setMensaje] =
    useState("");

  const [
    tipoMensaje,
    setTipoMensaje,
  ] =
    useState<TipoMensaje>(
      "informacion",
    );

  const [
    ultimaActualizacion,
    setUltimaActualizacion,
  ] = useState("");

  useEffect(() => {
    void cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setCargando(true);
    setMensaje("");

    try {
      const data =
        await obtenerUsuarios();

      setUsuarios(
        Array.isArray(data)
          ? data
          : [],
      );

      setUltimaActualizacion(
        new Date().toLocaleString(
          "es-BO",
        ),
      );
    } catch (error: unknown) {
      console.error(
        "Error al cargar usuarios:",
        error,
      );

      setMensaje(
        "No se pudieron cargar los usuarios.",
      );

      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  }

  async function borrarUsuario(
    usuario: Usuario,
  ) {
    if (
      usuario.rol ===
      "ADMINISTRADOR"
    ) {
      setMensaje(
        "No se puede eliminar al administrador principal.",
      );

      setTipoMensaje(
        "informacion",
      );

      return;
    }

    const nombreCompleto =
      `${usuario.nombre ?? ""} ${
        usuario.apellido ?? ""
      }`.trim();

    const confirmar =
      window.confirm(
        `¿Seguro que deseas eliminar a ${
          nombreCompleto ||
          "este usuario"
        }?`,
      );

    if (!confirmar) {
      return;
    }

    try {
      setEliminandoId(usuario.id);
      setMensaje("");

      await eliminarUsuario(
        usuario.id,
      );

      setMensaje(
        "Usuario eliminado correctamente.",
      );

      setTipoMensaje("exito");

      await cargarUsuarios();
    } catch (error: unknown) {
      console.error(
        "Error al eliminar usuario:",
        error,
      );

      const mensajeError =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el usuario. Puede tener reservas relacionadas.";

      setMensaje(mensajeError);
      setTipoMensaje("error");
    } finally {
      setEliminandoId(null);
    }
  }

  const usuariosFiltrados =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLocaleLowerCase();

      if (!texto) {
        return usuarios;
      }

      return usuarios.filter(
        (usuario) => {
          const contenido = `
            ${usuario.codigoUsuario ?? ""}
            ${usuario.nombre ?? ""}
            ${usuario.apellido ?? ""}
            ${usuario.ci ?? ""}
            ${usuario.telefono ?? ""}
            ${usuario.email ?? ""}
            ${usuario.rol ?? ""}
            ${
              usuario.estado
                ? "activo"
                : "inactivo"
            }
          `.toLocaleLowerCase();

          return contenido.includes(
            texto,
          );
        },
      );
    }, [usuarios, busqueda]);

  const usuariosActivos =
    useMemo(
      () =>
        usuarios.filter(
          (usuario) =>
            usuario.estado,
        ).length,
      [usuarios],
    );

  const usuariosInactivos =
    useMemo(
      () =>
        usuarios.filter(
          (usuario) =>
            !usuario.estado,
        ).length,
      [usuarios],
    );

  const pasajeros =
    useMemo(
      () =>
        usuarios.filter(
          (usuario) =>
            usuario.rol ===
            "PASAJERO",
        ).length,
      [usuarios],
    );

  const claseMensaje = {
    exito:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    error:
      "border-red-200 bg-red-50 text-red-700",
    informacion:
      "border-amber-200 bg-amber-50 text-amber-800",
  }[tipoMensaje];

  return (
    <main className="min-h-screen bg-[#f2f8f4] p-4 sm:p-6 lg:p-8">
      {/* ENCABEZADO */}

      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#006331] via-[#007a3d] to-[#009149] px-6 py-7 text-white shadow-xl shadow-emerald-900/15 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" />

        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-96 rotate-[-10deg] rounded-[50%] bg-lime-300/10" />

        <div className="pointer-events-none absolute right-8 top-7 grid grid-cols-5 gap-2 opacity-20">
          {Array.from({
            length: 20,
          }).map((_, indice) => (
            <span
              key={indice}
              className="h-1.5 w-1.5 rounded-full bg-lime-200"
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm sm:flex">
              <UsersIcon size={32} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">
                Administración
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Gestión de usuarios
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
                Consulta los pasajeros y administradores
                registrados en el sistema Trans 2 de
                Junio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void cargarUsuarios()
            }
            disabled={cargando}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-black text-emerald-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={20}
              className={
                cargando
                  ? "animate-spin"
                  : ""
              }
            />

            {cargando
              ? "Actualizando..."
              : "Actualizar usuarios"}
          </button>
        </div>
      </section>

      {/* MENSAJE */}

      {mensaje && (
        <div
          role="alert"
          className={`mt-6 flex items-center gap-3 rounded-2xl border p-4 font-bold shadow-sm ${claseMensaje}`}
        >
          {tipoMensaje === "exito" && (
            <CheckCircle2
              size={21}
              className="shrink-0"
            />
          )}

          <span>{mensaje}</span>
        </div>
      )}

      {/* RESUMEN */}

      <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaResumen
          icono={<UsersIcon size={25} />}
          titulo="Total de usuarios"
          valor={usuarios.length}
          descripcion="Registros del sistema"
        />

        <TarjetaResumen
          icono={<UserCheck size={25} />}
          titulo="Usuarios activos"
          valor={usuariosActivos}
          descripcion="Cuentas habilitadas"
        />

        <TarjetaResumen
          icono={<UserX size={25} />}
          titulo="Usuarios inactivos"
          valor={usuariosInactivos}
          descripcion="Cuentas deshabilitadas"
        />

        <TarjetaResumen
          icono={<UsersIcon size={25} />}
          titulo="Pasajeros"
          valor={pasajeros}
          descripcion="Pasajeros registrados"
        />
      </section>

      {/* CONTENIDO PRINCIPAL */}

      <section className="mt-8 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_18px_55px_rgba(0,83,42,0.09)]">
        {/* ENCABEZADO Y BUSCADOR */}

        <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-lime-50 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                Registro general
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                Usuarios registrados
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Mostrando{" "}
                <span className="font-black text-emerald-700">
                  {usuariosFiltrados.length}
                </span>{" "}
                de{" "}
                <span className="font-black text-emerald-700">
                  {usuarios.length}
                </span>{" "}
                usuarios.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Última actualización:{" "}
                {ultimaActualizacion ||
                  "Nunca"}
              </p>
            </div>

            <div className="relative w-full xl:max-w-xl">
              <Search
                size={21}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600"
              />

              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value,
                  )
                }
                placeholder="Buscar por código, nombre, CI, correo, teléfono o rol..."
                className="h-14 w-full rounded-2xl border border-emerald-200 bg-white py-3.5 pl-12 pr-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {/* TABLA */}

        <div className="p-5 sm:p-7">
          <div className="overflow-x-auto rounded-[22px] border border-emerald-100">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-emerald-100 bg-emerald-50 text-left text-sm text-emerald-900">
                  <th className="px-4 py-4">
                    Código
                  </th>

                  <th className="px-4 py-4">
                    Nombre completo
                  </th>

                  <th className="px-4 py-4">
                    CI
                  </th>

                  <th className="px-4 py-4">
                    Teléfono
                  </th>

                  <th className="px-4 py-4">
                    Correo
                  </th>

                  <th className="px-4 py-4">
                    Rol
                  </th>

                  <th className="px-4 py-4">
                    Estado
                  </th>

                  <th className="px-4 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map(
                  (usuario) => {
                    const esAdministrador =
                      usuario.rol ===
                      "ADMINISTRADOR";

                    const eliminando =
                      eliminandoId ===
                      usuario.id;

                    return (
                      <tr
                        key={usuario.id}
                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-emerald-50/40"
                      >
                        <td className="px-4 py-5">
                          <span className="inline-flex min-w-20 justify-center rounded-xl bg-emerald-100 px-3 py-2 font-black text-emerald-800">
                            {usuario.codigoUsuario ||
                              "---"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <p className="font-black text-slate-900">
                            {usuario.nombre ||
                              "Sin nombre"}{" "}
                            {usuario.apellido ||
                              ""}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID interno:{" "}
                            {usuario.id
                              ? usuario.id.substring(
                                  0,
                                  8,
                                )
                              : "---"}
                          </p>
                        </td>

                        <td className="px-4 py-5 text-slate-700">
                          {usuario.ci ||
                            "---"}
                        </td>

                        <td className="px-4 py-5 text-slate-700">
                          {usuario.telefono ||
                            "---"}
                        </td>

                        <td className="px-4 py-5 text-slate-700">
                          {usuario.email ||
                            "---"}
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-black ${
                              esAdministrador
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {usuario.rol ||
                              "SIN ROL"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-2 text-xs font-black ${
                              usuario.estado
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {usuario.estado
                              ? "ACTIVO"
                              : "INACTIVO"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <button
                            type="button"
                            onClick={() =>
                              void borrarUsuario(
                                usuario,
                              )
                            }
                            disabled={
                              esAdministrador ||
                              eliminando
                            }
                            title={
                              esAdministrador
                                ? "No se puede eliminar al administrador"
                                : "Eliminar usuario"
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                          >
                            {eliminando ? (
                              <RefreshCw
                                size={18}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={18}
                              />
                            )}

                            {eliminando
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {/* SIN RESULTADOS */}

          {!cargando &&
            usuariosFiltrados.length ===
              0 && (
              <div className="mt-6 flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-10 text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <UsersIcon size={32} />
                  </div>

                  <h3 className="mt-5 text-2xl font-black text-slate-800">
                    No se encontraron usuarios
                  </h3>

                  <p className="mx-auto mt-2 max-w-lg text-slate-500">
                    Prueba con otro código, nombre,
                    correo, CI, teléfono o rol.
                  </p>
                </div>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}

interface TarjetaResumenProps {
  icono: ReactNode;
  titulo: string;
  valor: number;
  descripcion: string;
}

function TarjetaResumen({
  icono,
  titulo,
  valor,
  descripcion,
}: TarjetaResumenProps) {
  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-emerald-100 bg-white p-6 shadow-[0_12px_35px_rgba(0,83,42,0.07)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_45px_rgba(0,83,42,0.14)]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-50 transition group-hover:bg-emerald-100" />

      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
        {icono}
      </div>

      <p className="relative mt-5 text-sm font-bold text-slate-500">
        {titulo}
      </p>

      <h3 className="relative mt-2 text-3xl font-black text-slate-900">
        {valor.toLocaleString("es-BO")}
      </h3>

      <p className="relative mt-2 text-xs text-slate-400">
        {descripcion}
      </p>

      <div className="relative mt-5 h-1 w-14 rounded-full bg-emerald-600 transition-all group-hover:w-24" />
    </article>
  );
}

export default Usuarios;