import MapaAsientosFlota from "./MapaAsientosFlota";
import MapaAsientosNoah from "./MapaAsientosNoah";

import type {
  PropsMapaAsientos,
} from "./asiento.types";

export default function MapaAsientosVehiculo(
  props: PropsMapaAsientos,
) {
  const tipo =
    props.viaje.vehiculo.tipo.toUpperCase();

  if (tipo === "NOAH") {
    return <MapaAsientosNoah {...props} />;
  }

  return <MapaAsientosFlota {...props} />;
}