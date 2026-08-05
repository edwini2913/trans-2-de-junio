import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { obtenerAsientosPorViaje } from "../../services/asientos.service";
import { obtenerRutas } from "../../services/rutas.service";

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
      setAsientos([]);
      setAsientosSeleccionados([]);

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
      (
        asiento: AsientoCompra,
      ) => {
        const disponible =
          normalizarEstado(
            asiento.estado,
          ) === "DISPONIBLE";

        if (
          !disponible ||
          bloqueado
        ) {
          return;
        }

        setAsientosSeleccionados(
          (seleccionados) => {
            const yaSeleccionado =
              seleccionados.some(
                (item) =>
                  item.id ===
                  asiento.id,
              );

            if (yaSeleccionado) {
              return seleccionados.filter(
                (item) =>
                  item.id !==
                  asiento.id,
              );
            }

            return [
              ...seleccionados,
              asiento,
            ].sort(
              (a, b) =>
                Number(a.numero) -
                Number(b.numero),
            );
          },
        );

        mostrarMensaje();
        onCambiarPaso?.(4);
      },
      [
        bloqueado,
        mostrarMensaje,
        onCambiarPaso,
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

          setAsientos(lista);

          setAsientosSeleccionados(
            (seleccionados) =>
              seleccionados.filter(
                (seleccionado) =>
                  lista.some(
                    (asiento) =>
                      asiento.id ===
                        seleccionado.id &&
                      normalizarEstado(
                        asiento.estado,
                      ) ===
                        "DISPONIBLE",
                  ),
              ),
          );

          return lista;
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