export type EstadoAsiento =
  | 'DISPONIBLE'
  | 'BLOQUEADO'
  | 'RESERVADO'
  | 'VENDIDO';

export interface Asiento {
  id: string;
  numero: number;
  estado: EstadoAsiento;
  bloqueadoPor?: string | null;
  bloqueadoHasta?: string | null;
}

export interface Vehiculo {
  id: string;
  placa: string;
  modelo: string;
  tipo: 'FLOTA' | 'NOAH';
  capacidad: number;
}

export interface ViajeSeleccionado {
  id: string;
  fecha: string;
  horaSalida: string;
  precio: number;

  ruta: {
    origen: string;
    destino: string;
  };

  vehiculo: Vehiculo;
}

export interface PropsMapaAsientos {
  viaje: ViajeSeleccionado;

  asientos: Asiento[];

  asientoSeleccionado: Asiento | null;

  onSeleccionar: (
    asiento: Asiento,
  ) => void;
}