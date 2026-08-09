import {
  Camera,
  Loader2,
  QrCode,
  RotateCcw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type ConfiguracionCamara = {
  fps: number;
  qrbox: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  disableFlip: boolean;
};

type Html5QrcodeInstance = {
  start: (
    camara:
      | string
      | {
          facingMode:
            | string
            | {
                ideal: string;
              };
        },
    configuracion: ConfiguracionCamara,
    onLecturaCorrecta: (
      texto: string,
      resultado: unknown,
    ) => void | Promise<void>,
    onErrorLectura?: (
      error: string,
    ) => void,
  ) => Promise<unknown>;

  stop: () => Promise<unknown>;

  clear: () => void | Promise<void>;

  isScanning?: boolean;
};

type CamaraDisponible = {
  id: string;
  label: string;
};

interface LectorQrProps {
  activo: boolean;
  procesando?: boolean;

  onCodigoDetectado: (
    contenidoQr: string,
  ) => Promise<void> | void;

  onEstadoActivo?: (
    activo: boolean,
  ) => void;
}

const ID_LECTOR =
  "lector-ticket-qr";

function obtenerMensajeCamara(
  error: unknown,
): string {
  const nombre =
    error instanceof DOMException
      ? error.name
      : "";

  const mensaje =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error || "")
          .toLowerCase();

  if (
    nombre === "NotAllowedError" ||
    mensaje.includes(
      "permission denied",
    ) ||
    mensaje.includes(
      "permission",
    ) ||
    mensaje.includes(
      "notallowed",
    )
  ) {
    return "El navegador bloqueó el permiso de la cámara. Presiona el candado de la dirección, permite la cámara, recarga la página e intenta nuevamente.";
  }

  if (
    nombre === "NotFoundError" ||
    mensaje.includes(
      "requested device not found",
    ) ||
    mensaje.includes(
      "no cameras",
    ) ||
    mensaje.includes(
      "notfound",
    )
  ) {
    return "No se encontró ninguna cámara disponible en este dispositivo.";
  }

  if (
    nombre === "NotReadableError" ||
    mensaje.includes(
      "could not start video source",
    ) ||
    mensaje.includes(
      "notreadable",
    ) ||
    mensaje.includes(
      "trackstart",
    )
  ) {
    return "La cámara está siendo utilizada por otra aplicación. Cierra otras aplicaciones que usen la cámara e intenta nuevamente.";
  }

  if (
    nombre === "OverconstrainedError" ||
    mensaje.includes(
      "overconstrained",
    )
  ) {
    return "La cámara seleccionada no es compatible. Intentaremos utilizar otra cámara disponible.";
  }

  if (
    mensaje.includes(
      "element with id",
    ) ||
    mensaje.includes(
      "not found",
    )
  ) {
    return "No se pudo preparar el lector QR. Recarga la página e intenta nuevamente.";
  }

  return "No se pudo acceder a la cámara. Revisa los permisos del navegador y vuelve a intentarlo.";
}

function seleccionarCamaraPreferida(
  camaras: CamaraDisponible[],
): CamaraDisponible | null {
  if (camaras.length === 0) {
    return null;
  }

  const expresionCamaraTrasera =
    /back|rear|environment|trasera|posterior/i;

  const camaraTrasera =
    camaras.find((camara) =>
      expresionCamaraTrasera.test(
        camara.label || "",
      ),
    );

  return (
    camaraTrasera ??
    camaras[0]
  );
}

function LectorQr({
  activo,
  procesando = false,
  onCodigoDetectado,
  onEstadoActivo,
}: LectorQrProps) {
  const scannerRef =
    useRef<Html5QrcodeInstance | null>(
      null,
    );

  const iniciandoRef =
    useRef(false);

  const procesandoRef =
    useRef(false);

  const montadoRef =
    useRef(true);

  const onCodigoDetectadoRef =
    useRef(onCodigoDetectado);

  const onEstadoActivoRef =
    useRef(onEstadoActivo);

  const [
    cargandoCamara,
    setCargandoCamara,
  ] = useState(false);

  const [
    scannerPreparado,
    setScannerPreparado,
  ] = useState(false);

  const [
    mensajeError,
    setMensajeError,
  ] = useState("");

  const [
    intento,
    setIntento,
  ] = useState(0);

  useEffect(() => {
    onCodigoDetectadoRef.current =
      onCodigoDetectado;
  }, [onCodigoDetectado]);

  useEffect(() => {
    onEstadoActivoRef.current =
      onEstadoActivo;
  }, [onEstadoActivo]);

  const detenerScanner =
    useCallback(async () => {
      const scanner =
        scannerRef.current;

      scannerRef.current = null;
      iniciandoRef.current = false;

      if (scanner) {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch {
          // La cámara ya estaba detenida.
        }

        try {
          await scanner.clear();
        } catch {
          // El lector ya estaba limpio.
        }
      }

      if (montadoRef.current) {
        setScannerPreparado(false);
        setCargandoCamara(false);

        onEstadoActivoRef.current?.(
          false,
        );
      }
    }, []);

  const iniciarScanner =
    useCallback(async () => {
      if (
        !activo ||
        iniciandoRef.current ||
        scannerRef.current ||
        procesandoRef.current
      ) {
        return;
      }

      if (
        !window.isSecureContext &&
        window.location.hostname !==
          "localhost" &&
        window.location.hostname !==
          "127.0.0.1"
      ) {
        setMensajeError(
          "La cámara solamente funciona mediante una conexión segura HTTPS. Abre el sistema desde su dirección HTTPS.",
        );

        return;
      }

      const elemento =
        document.getElementById(
          ID_LECTOR,
        );

      if (!elemento) {
        setMensajeError(
          "No se encontró el espacio del lector QR. Recarga la página e intenta nuevamente.",
        );

        return;
      }

      iniciandoRef.current = true;

      setCargandoCamara(true);
      setScannerPreparado(false);
      setMensajeError("");

      try {
        const modulo =
          await import(
            "html5-qrcode"
          );

        if (
          !montadoRef.current ||
          !activo
        ) {
          return;
        }

        const scanner =
          new modulo.Html5Qrcode(
            ID_LECTOR,
            {
              verbose: false,
            },
          ) as Html5QrcodeInstance;

        scannerRef.current =
          scanner;

        const configuracion: ConfiguracionCamara =
          {
            fps: 12,

            qrbox: {
              width: 260,
              height: 260,
            },

            aspectRatio: 1,

            disableFlip: false,
          };

        const manejarLectura =
          async (
            textoEscaneado: string,
          ) => {
            if (
              procesandoRef.current ||
              !textoEscaneado.trim()
            ) {
              return;
            }

            procesandoRef.current =
              true;

            try {
              await detenerScanner();

              await onCodigoDetectadoRef.current(
                textoEscaneado.trim(),
              );
            } finally {
              procesandoRef.current =
                false;
            }
          };

        try {
          /*
           * Primera opción:
           * cámara trasera en celulares.
           */
          await scanner.start(
            {
              facingMode: {
                ideal:
                  "environment",
              },
            },
            configuracion,
            manejarLectura,
            () => {
              /*
               * Se ignoran los errores
               * normales mientras busca
               * un código QR.
               */
            },
          );
        } catch (
          errorCamaraTrasera
        ) {
          try {
            await scanner.clear();
          } catch {
            // Continúa con otra cámara.
          }

          if (
            !montadoRef.current ||
            !activo
          ) {
            return;
          }

          /*
           * Segunda opción:
           * buscar todas las cámaras y
           * seleccionar una disponible.
           */
          const camaras =
            (await modulo.Html5Qrcode
              .getCameras()) as
              CamaraDisponible[];

          const camara =
            seleccionarCamaraPreferida(
              Array.isArray(camaras)
                ? camaras
                : [],
            );

          if (!camara) {
            throw errorCamaraTrasera;
          }

          const scannerAlternativo =
            new modulo.Html5Qrcode(
              ID_LECTOR,
              {
                verbose: false,
              },
            ) as Html5QrcodeInstance;

          scannerRef.current =
            scannerAlternativo;

          await scannerAlternativo.start(
            camara.id,
            configuracion,
            manejarLectura,
            () => {
              /*
               * Se ignoran los errores
               * de lectura mientras no
               * exista un QR enfocado.
               */
            },
          );
        }

        if (
          !montadoRef.current
        ) {
          await detenerScanner();
          return;
        }

        setScannerPreparado(true);
        setMensajeError("");

        onEstadoActivoRef.current?.(
          true,
        );
      } catch (error) {
        console.error(
          "No se pudo iniciar el lector QR:",
          error,
        );

        const scanner =
          scannerRef.current;

        scannerRef.current = null;

        if (scanner) {
          try {
            if (
              scanner.isScanning
            ) {
              await scanner.stop();
            }
          } catch {
            // La cámara no llegó a iniciar.
          }

          try {
            await scanner.clear();
          } catch {
            // El lector ya fue limpiado.
          }
        }

        if (montadoRef.current) {
          setMensajeError(
            obtenerMensajeCamara(
              error,
            ),
          );

          setScannerPreparado(false);

          onEstadoActivoRef.current?.(
            false,
          );
        }
      } finally {
        iniciandoRef.current =
          false;

        if (montadoRef.current) {
          setCargandoCamara(false);
        }
      }
    }, [
      activo,
      detenerScanner,
    ]);

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      void detenerScanner();
    };
  }, [detenerScanner]);

  useEffect(() => {
    if (!activo) {
      setMensajeError("");
      void detenerScanner();
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        void iniciarScanner();
      }, 100);

    return () => {
      window.clearTimeout(
        temporizador,
      );
    };
  }, [
    activo,
    intento,
    detenerScanner,
    iniciarScanner,
  ]);

  const intentarNuevamente =
    async () => {
      await detenerScanner();

      if (!montadoRef.current) {
        return;
      }

      setMensajeError("");
      setIntento(
        (valorActual) =>
          valorActual + 1,
      );
    };

  if (!activo) {
    return (
      <div className="mt-6 flex aspect-square flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
          <Camera size={38} />
        </div>

        <h3 className="mt-5 text-lg font-black text-slate-900">
          Cámara desactivada
        </h3>

        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
          La cámara se activará
          únicamente cuando presiones
          el botón para iniciar el
          escáner.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mt-6 min-h-[360px] overflow-hidden rounded-2xl border border-emerald-100 bg-black">
      <div
        id={ID_LECTOR}
        className="min-h-[360px] w-full overflow-hidden bg-black"
      />

      {cargandoCamara &&
        !scannerPreparado &&
        !mensajeError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white">
            <Loader2
              size={52}
              className="animate-spin text-emerald-400"
            />

            <h3 className="mt-5 text-lg font-black">
              Preparando cámara
            </h3>

            <p className="mt-2 text-sm text-slate-300">
              Acepta el permiso de la
              cámara cuando el navegador
              lo solicite.
            </p>
          </div>
        )}

      {mensajeError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-50 p-6 text-center">
          <QrCode
            size={48}
            className="text-red-500"
          />

          <h3 className="mt-4 font-black text-red-700">
            No se pudo iniciar la cámara
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-red-600">
            {mensajeError}
          </p>

          <button
            type="button"
            onClick={() =>
              void intentarNuevamente()
            }
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-700"
          >
            <RotateCcw size={19} />
            Intentar nuevamente
          </button>
        </div>
      )}

      {procesando && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-emerald-950/90 p-6 text-center text-white backdrop-blur-sm">
          <Loader2
            size={46}
            className="animate-spin"
          />

          <p className="mt-4 font-black">
            Procesando ticket...
          </p>
        </div>
      )}
    </div>
  );
}

export default LectorQr;