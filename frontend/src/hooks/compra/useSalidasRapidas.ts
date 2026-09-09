import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  obtenerFilaSalida,
} from "../../services/salidas-rapidas.service";

import type {
  TurnoSalidaRapida,
} from "../../services/salidas-rapidas.service";
interface UseSalidasRapidasParametros {
  rutaId?: string;
  fecha?: string;
  activo?: boolean;
}

const obtenerMensajeError = (
  error: unknown,
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const errorHttp = error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    };

    const mensaje =
      errorHttp.response?.data?.message;

    if (Array.isArray(mensaje)) {
      return mensaje.join(" ");
    }

    if (typeof mensaje === "string") {
      return mensaje;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return (
    "No se pudo obtener la información " +
    "de las salidas rápidas."
  );
};

export const useSalidasRapidas = ({
  rutaId,
  fecha,
  activo = true,
}: UseSalidasRapidasParametros) => {
  const [
    fila,
    setFila,
  ] = useState<TurnoSalidaRapida[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const refrescar =
    useCallback(
      async (
        mostrarCarga = false,
      ) => {
        if (
          !activo ||
          !rutaId ||
          !fecha
        ) {
          setFila([]);
          setError(null);
          return;
        }

        try {
          if (mostrarCarga) {
            setCargando(true);
          } else {
            setActualizando(true);
          }

          const respuesta =
            await obtenerFilaSalida(
              rutaId,
              fecha,
            );

          setFila(respuesta);
          setError(null);
        } catch (errorPeticion) {
          setError(
            obtenerMensajeError(
              errorPeticion,
            ),
          );
        } finally {
          setCargando(false);
          setActualizando(false);
        }
      },
      [
        activo,
        fecha,
        rutaId,
      ],
    );

  useEffect(() => {
    if (
      !activo ||
      !rutaId ||
      !fecha
    ) {
      setFila([]);
      setError(null);
      return;
    }

    void refrescar(true);

    const intervalo =
      window.setInterval(
        () => {
          void refrescar(false);
        },
        3000,
      );

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, [
    activo,
    fecha,
    refrescar,
    rutaId,
  ]);

  const salidaActual =
    useMemo(
      () =>
        fila.find(
          (turno) =>
            turno.estado ===
            "VENDIENDO",
        ) ?? null,
      [fila],
    );

  const siguiente =
    useMemo(
      () =>
        fila.find(
          (turno) =>
            turno.estado ===
            "SIGUIENTE",
        ) ?? null,
      [fila],
    );

  const enEspera =
    useMemo(
      () =>
        fila.filter(
          (turno) =>
            turno.estado ===
            "EN_ESPERA",
        ),
      [fila],
    );

  const hayFilaDisponible =
    fila.length > 0 &&
    salidaActual !== null;

  return {
    fila,
    salidaActual,
    siguiente,
    enEspera,
    hayFilaDisponible,
    cargando,
    actualizando,
    error,
    refrescar,
  };
};