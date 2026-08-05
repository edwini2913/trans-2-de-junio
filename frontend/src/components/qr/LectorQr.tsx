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

type Html5QrcodeScannerInstance = {
  render: (
    onScanSuccess: (
      decodedText: string,
      decodedResult: unknown,
    ) => void | Promise<void>,
    onScanFailure?: (
      errorMessage: string,
    ) => void,
  ) => void;

  clear: () => Promise<void>;
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

function LectorQr({
  activo,
  procesando = false,
  onCodigoDetectado,
  onEstadoActivo,
}: LectorQrProps) {
  const scannerRef =
    useRef<Html5QrcodeScannerInstance | null>(
      null,
    );

  const procesandoRef =
    useRef(false);

  const montadoRef =
    useRef(true);

  const [
    cargandoLibreria,
    setCargandoLibreria,
  ] = useState(false);

  const [
    scannerPreparado,
    setScannerPreparado,
  ] = useState(false);

  const [
    mensajeError,
    setMensajeError,
  ] = useState("");

  const detenerScanner =
    useCallback(async () => {
      const scanner =
        scannerRef.current;

      scannerRef.current = null;

      if (!scanner) {
        return;
      }

      try {
        await scanner.clear();
      } catch {
        // Se ignora si la cámara ya fue detenida.
      }

      if (montadoRef.current) {
        setScannerPreparado(false);
        onEstadoActivo?.(false);
      }
    }, [onEstadoActivo]);

  const iniciarScanner =
    useCallback(async () => {
      if (
        scannerRef.current ||
        cargandoLibreria ||
        procesandoRef.current
      ) {
        return;
      }

      try {
        setCargandoLibreria(true);
        setMensajeError("");

        /*
         * html5-qrcode se descarga solamente
         * cuando el usuario activa la cámara.
         */
        const modulo =
          await import("html5-qrcode");

        if (!montadoRef.current) {
          return;
        }

        const scanner =
          new modulo.Html5QrcodeScanner(
            "lector-ticket-qr",
            {
              fps: 10,

              qrbox: {
                width: 260,
                height: 260,
              },

              rememberLastUsedCamera:
                true,

              showTorchButtonIfSupported:
                true,

              showZoomSliderIfSupported:
                true,
            },
            false,
          ) as Html5QrcodeScannerInstance;

        scannerRef.current =
          scanner;

        scanner.render(
          async (textoEscaneado) => {
            if (
              procesandoRef.current
            ) {
              return;
            }

            procesandoRef.current =
              true;

            try {
              await detenerScanner();

              await onCodigoDetectado(
                textoEscaneado,
              );
            } finally {
              procesandoRef.current =
                false;
            }
          },

          () => {
            /*
             * Los errores normales mientras
             * la cámara busca un QR se ignoran.
             */
          },
        );

        setScannerPreparado(true);
        onEstadoActivo?.(true);
      } catch (error) {
        console.error(
          "No se pudo iniciar el lector QR:",
          error,
        );

        setMensajeError(
          "No se pudo acceder a la cámara. Verifica los permisos del navegador e intenta nuevamente.",
        );

        setScannerPreparado(false);
        onEstadoActivo?.(false);
      } finally {
        if (montadoRef.current) {
          setCargandoLibreria(false);
        }
      }
    }, [
      cargandoLibreria,
      detenerScanner,
      onCodigoDetectado,
      onEstadoActivo,
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
      void detenerScanner();
      return;
    }

    void iniciarScanner();
  }, [
    activo,
    detenerScanner,
    iniciarScanner,
  ]);

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
          La cámara se activará únicamente cuando
          presiones el botón para iniciar el
          escáner.
        </p>
      </div>
    );
  }

  if (
    cargandoLibreria &&
    !scannerPreparado
  ) {
    return (
      <div className="mt-6 flex aspect-square flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-slate-50 p-6 text-center">
        <Loader2
          size={52}
          className="animate-spin text-emerald-700"
        />

        <h3 className="mt-5 text-lg font-black text-slate-900">
          Preparando cámara
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Cargando el módulo del escáner QR...
        </p>
      </div>
    );
  }

  if (mensajeError) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <QrCode
          size={48}
          className="mx-auto text-red-500"
        />

        <h3 className="mt-4 font-black text-red-700">
          No se pudo iniciar la cámara
        </h3>

        <p className="mt-2 text-sm leading-6 text-red-600">
          {mensajeError}
        </p>

        <button
          type="button"
          onClick={() =>
            void iniciarScanner()
          }
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white transition hover:bg-red-700"
        >
          <RotateCcw size={19} />
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="relative mt-6">
      <div
        id="lector-ticket-qr"
        className="overflow-hidden rounded-2xl border border-emerald-100 bg-black"
      />

      {procesando && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-emerald-950/85 text-white backdrop-blur-sm">
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