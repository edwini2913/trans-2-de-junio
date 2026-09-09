export enum TipoVehiculo {
  FLOTA = "FLOTA",
  NOAH = "NOAH",
  HIACE = "HIACE",
}

export const CAPACIDAD_POR_TIPO: Record<
  TipoVehiculo,
  number
> = {
  [TipoVehiculo.FLOTA]: 40,
  [TipoVehiculo.NOAH]: 7,
  [TipoVehiculo.HIACE]: 10,
};

export const TIPOS_SECTOR_RAPIDO: TipoVehiculo[] = [
  TipoVehiculo.NOAH,
  TipoVehiculo.HIACE,
];

export function obtenerCapacidadPorTipo(
  tipo: TipoVehiculo,
): number {
  return CAPACIDAD_POR_TIPO[tipo];
}

export function esVehiculoSectorRapido(
  tipo: TipoVehiculo,
): boolean {
  return TIPOS_SECTOR_RAPIDO.includes(tipo);
}

export function obtenerNombreTipoVehiculo(
  tipo: TipoVehiculo,
): string {
  switch (tipo) {
    case TipoVehiculo.FLOTA:
      return "Flota";

    case TipoVehiculo.NOAH:
      return "Toyota Noah";

    case TipoVehiculo.HIACE:
      return "Toyota Hiace";

    default:
      return "Vehículo";
  }
}