import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

function EstadoConexion() {
  const [online, setOnline] = useState(
    navigator.onLine,
  );

  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    const conectado = () => {
      setOnline(true);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 3000);
    };

    const desconectado = () => {
      setOnline(false);
      setVisible(true);
    };

    window.addEventListener(
      "online",
      conectado,
    );

    window.addEventListener(
      "offline",
      desconectado,
    );

    return () => {
      window.removeEventListener(
        "online",
        conectado,
      );

      window.removeEventListener(
        "offline",
        desconectado,
      );
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed top-5 left-1/2 z-[99999] flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-3 text-white shadow-xl transition-all duration-500 ${
        online
          ? "bg-green-600"
          : "bg-red-600"
      }`}
    >
      {online ? (
        <Wifi size={22} />
      ) : (
        <WifiOff size={22} />
      )}

      <span className="font-semibold">
        {online
          ? "Conexión restablecida"
          : "Sin conexión a Internet"}
      </span>
    </div>
  );
}

export default EstadoConexion;