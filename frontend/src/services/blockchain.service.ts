import api from './api';

export interface BloqueTicket {
  id: string;
  indice: string;
  ticketId: string;
  codigoTicket: string;
  hashDatos: string;
  hashAnterior: string;
  hashBloque: string;
  fechaBloque: string;
}

export interface ResumenBlockchain {
  ok: boolean;
  cadenaValida: boolean;
  totalBloques: number;
  algoritmo: string;
  tipo: string;
  ultimoHash: string | null;
  bloques: BloqueTicket[];
}

export async function obtenerResumenBlockchain(): Promise<ResumenBlockchain> {
  const respuesta = await api.get<ResumenBlockchain>('/blockchain/resumen');
  return respuesta.data;
}
