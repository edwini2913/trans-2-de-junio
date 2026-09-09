import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  bloquearAsiento,
  liberarAsiento,
  obtenerAsientosPorViaje,
} from "../../services/asientos.service";
import { obtenerRutas } from "../../services/rutas.service";

import { obtenerUsuarioLocal } from "../../utils/compra/compra.utils";

import {
  obtenerOpcionesDeViaje,
  type HorarioDisponible,
  type VehiculoDisponible,
} from "../../services/viajes.service";

export type RutaCompra = {
  id: string;
  origen: string;
  destino: string;
};

export type VehiculoCompra = {
  id?: string;
  marca?: string;
  modelo?: string;
  placa?: string;
  capacidad?: number;
  tipo?: string;
};

export type ViajeCompra = {
  id: string;
  fecha?: string;
  horaSalida?: string;
  precio?: number | string;
  asientosDisponibles?: number;
  ruta?: RutaCompra;
  vehiculo?: VehiculoCompra;
};

export type AsientoCompra = {
  id: string;
  numero: number | string;
  estado: string;
  bloqueadoPor?: string | null;
  bloqueadoHasta?: string | null;
};

export type MensajeCompra = {
  texto: string;
  exito: boolean;
};

interface UseCompraViajeOpciones {
  bloqueado?: boolean;

  onLimpiarProceso?: () => void;

  onCambiarPaso?: (
    paso: number,
  ) => void;

  onMensaje?: (
    texto: string,
    exito?: boolean,
  ) => void;
}

function useCompraViaje({
  bloqueado = false,
  onLimpiarProceso,
  onCambiarPaso,
  onMensaje,
}: UseCompraViajeOpciones = {}) {
  const [rutas, setRutas] =
    useState<RutaCompra[]>([]);

  const [rutaId, setRutaId] =
    useState("");

  const [fecha, setFecha] =
    useState("");

  const [horarios, setHorarios] =
    useState<HorarioDisponible[]>([]);

  const [
    horarioSeleccionado,
    setHorarioSeleccionado,
  ] = useState("");

  const [
    vehiculoSeleccionado,
    setVehiculoSeleccionado,
  ] =
    useState<VehiculoDisponible | null>(
      null,
    );

  const [viaje, setViaje] =
    useState<ViajeCompra | null>(null);

  const [asientos, setAsientos] =
    useState<AsientoCompra[]>([]);

  const [
    asientosSeleccionados,
    setAsientosSeleccionados,
  ] = useState<AsientoCompra[]>([]);

  const [
    cargandoRutas,
    setCargandoRutas,
  ] = useState(false);

  const [
    cargandoViajes,
    setCargandoViajes,
  ] = useState(false);

  const [
    cargandoAsientos,
    setCargandoAsientos,
  ] = useState(false);

  const asientosSeleccionadosRef =
    useRef<AsientoCompra[]>([]);

  const operacionesAsientoRef =
    useRef<Set<string>>(new Set());

  useEffect(() => {
    asientosSeleccionadosRef.current =
      asientosSeleccionados;
  }, [asientosSeleccionados]);

  const mostrarMensaje = useCallback(
    (
      texto = "",
      exito = false,
    ) => {
      onMensaje?.(texto, exito);
    },
    [onMensaje],
  );

  const limpiarSeleccionAsientos =
    useCallback(() => {
      const usuarioId =
        obtenerUsuarioLocal().id;

      const seleccionados =
        asientosSeleccionadosRef.current;

      if (
        usuarioId &&
        seleccionados.length > 0
      ) {
        void Promise.allSettled(
          seleccionados.map(
            ({ id }) =>
              liberarAsiento(
                id,
                usuarioId,
              ),
          ),
        );
      }

      setAsientos([]);
      setAsientosSeleccionados([]);

      asientosSeleccionadosRef.current = [];

      onLimpiarProceso?.();
    }, [onLimpiarProceso]);

  const limpiarSeleccionViaje =
    useCallback(() => {
      setHorarioSeleccionado("");
      setVehiculoSeleccionado(null);
      setViaje(null);

      limpiarSeleccionAsientos();
    }, [limpiarSeleccionAsientos]);

  const cargarRutas =
    useCallback(async () => {
      setCargandoRutas(true);

      try {
        const respuesta =
          await obtenerRutas();

        setRutas(
          normalizarLista<RutaCompra>(
            respuesta,
          ),
        );
      } catch (error: unknown) {
        mostrarMensaje(
          obtenerMensajeError(
            error,
            "No se pudieron cargar las rutas.",
          ),
        );
      } finally {
        setCargandoRutas(false);
      }
    }, [mostrarMensaje]);

  useEffect(() => {
    void cargarRutas();
  }, [cargarRutas]);

  const cargarSalidasAutomatico =
    useCallback(
      async (
        rutaSeleccionada: string,
        fechaSeleccionada: string,
      ) => {
        limpiarSeleccionViaje();
        setHorarios([]);
        mostrarMensaje();

        if (
          !rutaSeleccionada ||
          !fechaSeleccionada
        ) {
          onCambiarPaso?.(1);
          return;
        }

        onCambiarPaso?.(2);
        setCargandoViajes(true);

        try {
          const respuesta =
            await obtenerOpcionesDeViaje(
              rutaSeleccionada,
              fechaSeleccionada,
            );

          const lista =
            normalizarLista<HorarioDisponible>(
              respuesta,
            );

          setHorarios(lista);

          if (lista.length === 0) {
            mostrarMensaje(
              "No hay salidas disponibles para la ruta y fecha seleccionadas.",
            );
          }
        } catch (error: unknown) {
          mostrarMensaje(
            obtenerMensajeError(
              error,
              "No se pudieron cargar los horarios y vehículos disponibles.",
            ),
          );
        } finally {
          setCargandoViajes(false);
        }
      },
      [
        limpiarSeleccionViaje,
        mostrarMensaje,
        onCambiarPaso,
      ],
    );

  const cambiarRuta = useCallback(
    (
      nuevaRuta: string,
    ) => {
      if (bloqueado) {
        return;
      }

      setRutaId(nuevaRuta);

      void cargarSalidasAutomatico(
        nuevaRuta,
        fecha,
      );
    },
    [
      bloqueado,
      cargarSalidasAutomatico,
      fecha,
    ],
  );

  const cambiarFecha = useCallback(
    (
      nuevaFecha: string,
    ) => {
      if (bloqueado) {
        return;
      }

      setFecha(nuevaFecha);

      void cargarSalidasAutomatico(
        rutaId,
        nuevaFecha,
      );
    },
    [
      bloqueado,
      cargarSalidasAutomatico,
      rutaId,
    ],
  );

  const seleccionarHorario =
    useCallback(
      (
        horaSalida: string,
      ) => {
        if (bloqueado) {
          return;
        }

        setHorarioSeleccionado(
          horaSalida,
        );

        setVehiculoSeleccionado(
          null,
        );

        setViaje(null);

        limpiarSeleccionAsientos();
        mostrarMensaje();
        onCambiarPaso?.(2);
      },
      [
        bloqueado,
        limpiarSeleccionAsientos,
        mostrarMensaje,
        onCambiarPaso,
      ],
    );

  const seleccionarVehiculo =
    useCallback(
      async (
        vehiculoDisponible: VehiculoDisponible,
        horaSalida: string,
      ) => {
        if (bloqueado) {
          return;
        }

        const rutaSeleccionada =
          rutas.find(
            (ruta) =>
              ruta.id === rutaId,
          );

        const viajeSeleccionado: ViajeCompra =
          {
            id:
              vehiculoDisponible.viajeId,

            fecha,

            horaSalida,

            precio: Number(
              vehiculoDisponible.precio ||
                0,
            ),

            asientosDisponibles:
              vehiculoDisponible.asientosDisponibles,

            ruta: rutaSeleccionada,

            vehiculo: {
              id:
                vehiculoDisponible.vehiculoId,

              placa:
                vehiculoDisponible.placa,

              marca:
                vehiculoDisponible.marca,

              modelo:
                vehiculoDisponible.modelo,

              capacidad:
                vehiculoDisponible.capacidad,

              tipo:
                vehiculoDisponible.tipo,
            },
          };

        setHorarioSeleccionado(
          horaSalida,
        );

        setVehiculoSeleccionado(
          vehiculoDisponible,
        );

        setViaje(
          viajeSeleccionado,
        );

        limpiarSeleccionAsientos();
        mostrarMensaje();

        setCargandoAsientos(true);
        onCambiarPaso?.(3);

        try {
          const respuesta =
            await obtenerAsientosPorViaje(
              vehiculoDisponible.viajeId,
            );

          const lista =
            normalizarLista<AsientoCompra>(
              respuesta,
            );

          setAsientos(lista);

          if (lista.length === 0) {
            mostrarMensaje(
              "Este vehículo todavía no tiene asientos registrados.",
            );
          }
        } catch (error: unknown) {
          mostrarMensaje(
            obtenerMensajeError(
              error,
              "No se pudieron cargar los asientos del vehículo.",
            ),
          );
        } finally {
          setCargandoAsientos(false);
        }
      },
      [
        bloqueado,
        fecha,
        limpiarSeleccionAsientos,
        mostrarMensaje,
        onCambiarPaso,
        rutaId,
        rutas,
      ],
    );

  const seleccionarAsiento =
    useCallback(
      async (
        asiento: AsientoCompra,
      ) => {
        if (
          bloqueado ||
          operacionesAsientoRef.current.has(
            asiento.id,
          )
        ) {
          return;
        }

        const usuarioId =
          obtenerUsuarioLocal().id;

        if (!usuarioId) {
          mostrarMensaje(
            "No se encontró el usuario autenticado. Inicia sesión nuevamente.",
          );
          return;
        }

        const yaSeleccionado =
          asientosSeleccionadosRef.current.some(
            (item) =>
              item.id === asiento.id,
          );

        const disponible =
          normalizarEstado(
            asiento.estado,
          ) === "DISPONIBLE";

        if (!yaSeleccionado && !disponible) {
          mostrarMensaje(
            "Este asiento está ocupado o está siendo seleccionado por otro usuario.",
          );
          return;
        }

        operacionesAsientoRef.current.add(
          asiento.id,
        );

        try {
          if (yaSeleccionado) {
            const respuesta =
              await liberarAsiento(
                asiento.id,
                usuarioId,
              );

            setAsientos((lista) =>
              lista.map((item) =>
                item.id === asiento.id
                  ? {
                      ...item,
                      ...respuesta.asiento,
                      estado: "DISPONIBLE",
                    }
                  : item,
              ),
            );

            setAsientosSeleccionados(
              (seleccionados) => {
                const nuevaSeleccion =
                  seleccionados.filter(
                    (item) =>
                      item.id !== asiento.id,
                  );

                asientosSeleccionadosRef.current =
                  nuevaSeleccion;

                return nuevaSeleccion;
              },
            );

            mostrarMensaje(
              "Asiento liberado correctamente.",
              true,
            );
            return;
          }

          const respuesta =
            await bloquearAsiento(
              asiento.id,
              usuarioId,
            );

          const asientoBloqueado: AsientoCompra = {
            ...asiento,
            ...respuesta.asiento,
            /*
             * Para este usuario permanece visualmente seleccionable
             * y puede volver a presionarlo para liberarlo. En la base
             * de datos sí está BLOQUEADO y los demás usuarios lo ven
             * como ocupado.
             */
            estado: "DISPONIBLE",
          };

          setAsientos((lista) =>
            lista.map((item) =>
              item.id === asiento.id
                ? asientoBloqueado
                : item,
            ),
          );

          setAsientosSeleccionados(
            (seleccionados) => {
              const nuevaSeleccion = [
                ...seleccionados.filter(
                  (item) =>
                    item.id !== asiento.id,
                ),
                asientoBloqueado,
              ].sort(
                (a, b) =>
                  Number(a.numero) -
                  Number(b.numero),
              );

              asientosSeleccionadosRef.current =
                nuevaSeleccion;

              return nuevaSeleccion;
            },
          );

          mostrarMensaje(
            "Asiento seleccionado y bloqueado durante 10 minutos.",
            true,
          );
          onCambiarPaso?.(4);
        } catch (error: unknown) {
          mostrarMensaje(
            obtenerMensajeError(
              error,
              yaSeleccionado
                ? "No se pudo liberar el asiento."
                : "Otro usuario acaba de seleccionar este asiento.",
            ),
          );

          if (viaje?.id) {
            try {
              const respuesta =
                await obtenerAsientosPorViaje(
                  viaje.id,
                );

              setAsientos(
                normalizarLista<AsientoCompra>(
                  respuesta,
                ),
              );
            } catch {
              /* Conserva el mensaje principal. */
            }
          }
        } finally {
          operacionesAsientoRef.current.delete(
            asiento.id,
          );
        }
      },
      [
        bloqueado,
        mostrarMensaje,
        onCambiarPaso,
        viaje?.id,
      ],
    );

  const recargarAsientos =
    useCallback(
      async (
        viajeId?: string,
      ): Promise<AsientoCompra[]> => {
        const id =
          viajeId || viaje?.id;

        if (!id) {
          return [];
        }

        try {
          const respuesta =
            await obtenerAsientosPorViaje(
              id,
            );

          const lista =
            normalizarLista<AsientoCompra>(
              respuesta,
            );

          const usuarioId =
            obtenerUsuarioLocal().id;

          const idsSeleccionados = new Set(
            asientosSeleccionadosRef.current.map(
              ({ id }) => id,
            ),
          );

          const listaVisual = lista.map(
            (asiento) =>
              normalizarEstado(asiento.estado) ===
                  "BLOQUEADO" &&
                asiento.bloqueadoPor === usuarioId &&
                idsSeleccionados.has(asiento.id)
                ? {
                    ...asiento,
                    estado: "DISPONIBLE",
                  }
                : asiento,
          );

          setAsientos(listaVisual);

          setAsientosSeleccionados(
            (seleccionados) => {
              const nuevaSeleccion =
                seleccionados
                .map((seleccionado) =>
                  lista.find(
                    (asiento) =>
                      asiento.id === seleccionado.id,
                  ),
                )
                .filter(
                  (
                    asiento,
                  ): asiento is AsientoCompra =>
                    Boolean(asiento) &&
                    normalizarEstado(
                      asiento?.estado,
                    ) === "BLOQUEADO" &&
                    asiento?.bloqueadoPor === usuarioId,
                )
                .map((asiento) => ({
                  ...asiento,
                  estado: "DISPONIBLE",
                }));

              asientosSeleccionadosRef.current =
                nuevaSeleccion;

              return nuevaSeleccion;
            },
          );

          return listaVisual;
        } catch (error: unknown) {
          mostrarMensaje(
            obtenerMensajeError(
              error,
              "No se pudieron actualizar los asientos.",
            ),
          );

          return [];
        }
      },
      [
        mostrarMensaje,
        viaje?.id,
      ],
    );

  useEffect(() => {
    if (!viaje?.id) {
      return;
    }

    const intervalo = window.setInterval(
      () => {
        void recargarAsientos(
          viaje.id,
        );
      },
      3000,
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, [recargarAsientos, viaje?.id]);

  useEffect(() => {
    return () => {
      const usuarioId =
        obtenerUsuarioLocal().id;

      const seleccionados =
        asientosSeleccionadosRef.current;

      if (!usuarioId || seleccionados.length === 0) {
        return;
      }

      void Promise.allSettled(
        seleccionados.map(({ id }) =>
          liberarAsiento(id, usuarioId),
        ),
      );
    };
  }, []);

  const bloquearAsientos =
    useCallback(
      (
        asientoIds: string[],
      ) => {
        const ids =
          new Set(asientoIds);

        setAsientos((lista) =>
          lista.map((asiento) =>
            ids.has(asiento.id)
              ? {
                  ...asiento,
                  estado: "BLOQUEADO",
                }
              : asiento,
          ),
        );
      },
      [],
    );

  const cantidadAsientos =
    asientosSeleccionados.length;

  const precioUnitario =
    Number(viaje?.precio || 0);

  const total = useMemo(
    () =>
      precioUnitario *
      cantidadAsientos,
    [
      cantidadAsientos,
      precioUnitario,
    ],
  );

  const idsAsientosSeleccionados =
    useMemo(
      () =>
        asientosSeleccionados.map(
          ({ id }) => id,
        ),
      [asientosSeleccionados],
    );

  const numerosAsientosSeleccionados =
    useMemo(
      () =>
        asientosSeleccionados.map(
          ({ numero }) => numero,
        ),
      [asientosSeleccionados],
    );

  return {
    rutas,
    rutaId,
    fecha,
    horarios,
    horarioSeleccionado,
    vehiculoSeleccionado,
    viaje,
    asientos,
    asientosSeleccionados,

    cargandoRutas,
    cargandoViajes,
    cargandoAsientos,

    cantidadAsientos,
    precioUnitario,
    total,

    idsAsientosSeleccionados,
    numerosAsientosSeleccionados,

    cambiarRuta,
    cambiarFecha,
    seleccionarHorario,
    seleccionarVehiculo,
    seleccionarAsiento,

    cargarRutas,
    cargarSalidasAutomatico,
    recargarAsientos,
    bloquearAsientos,

    limpiarSeleccionAsientos,
    limpiarSeleccionViaje,

    setRutas,
    setRutaId,
    setFecha,
    setHorarios,
    setHorarioSeleccionado,
    setVehiculoSeleccionado,
    setViaje,
    setAsientos,
    setAsientosSeleccionados,
  };
}

function normalizarLista<T>(
  datos: unknown,
): T[] {
  return Array.isArray(datos)
    ? (datos as T[])
    : [];
}

function normalizarEstado(
  estado?: string,
): string {
  return String(estado || "")
    .trim()
    .toUpperCase();
}

function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "mensaje" in error
  ) {
    const mensaje = (
      error as {
        mensaje?: unknown;
      }
    ).mensaje;

    if (
      typeof mensaje === "string" &&
      mensaje.trim()
    ) {
      return mensaje;
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const respuesta = (
      error as {
        response?: {
          data?: {
            message?:
              | string
              | string[];

            mensaje?: string;
          };
        };
      }
    ).response?.data;

    if (
      Array.isArray(
        respuesta?.message,
      )
    ) {
      return respuesta.message.join(
        ", ",
      );
    }

    if (
      typeof respuesta?.message ===
        "string" &&
      respuesta.message.trim()
    ) {
      return respuesta.message;
    }

    if (
      typeof respuesta?.mensaje ===
        "string" &&
      respuesta.mensaje.trim()
    ) {
      return respuesta.mensaje;
    }
  }

  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return mensajePredeterminado;
}

export default useCompraViaje;
