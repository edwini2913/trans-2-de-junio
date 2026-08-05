import api from "./api";

export type ResultadoAuditoria =
  | "EXITOSO"
  | "FALLIDO";

export interface AuditoriaRegistro {
  id: string;

  usuarioId?: string | null;
  usuarioNombre?: string | null;
  usuarioEmail?: string | null;
  usuarioRol?: string | null;

  accion: string;
  modulo: string;
  descripcion: string;

  entidad?: string | null;
  entidadId?: string | null;

  resultado: ResultadoAuditoria;

  datosAnteriores?: Record<
    string,
    unknown
  > | null;

  datosNuevos?: Record<
    string,
    unknown
  > | null;

  informacionAdicional?: Record<
    string,
    unknown
  > | null;

  direccionIp?: string | null;
  userAgent?: string | null;
  metodoHttp?: string | null;
  rutaHttp?: string | null;
  mensajeError?: string | null;

  fechaRegistro: string;
}

export interface FiltrosAuditoria {
  usuarioId?: string;
  accion?: string;
  modulo?: string;
  resultado?: ResultadoAuditoria;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  limite?: number;
}

export interface RespuestaAuditoria {
  registros: AuditoriaRegistro[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

function construirParametros(
  filtros: FiltrosAuditoria,
): URLSearchParams {
  const parametros =
    new URLSearchParams();

  if (filtros.usuarioId) {
    parametros.set(
      "usuarioId",
      filtros.usuarioId,
    );
  }

  if (filtros.accion) {
    parametros.set(
      "accion",
      filtros.accion,
    );
  }

  if (filtros.modulo) {
    parametros.set(
      "modulo",
      filtros.modulo,
    );
  }

  if (filtros.resultado) {
    parametros.set(
      "resultado",
      filtros.resultado,
    );
  }

  if (filtros.fechaDesde) {
    parametros.set(
      "fechaDesde",
      filtros.fechaDesde,
    );
  }

  if (filtros.fechaHasta) {
    parametros.set(
      "fechaHasta",
      filtros.fechaHasta,
    );
  }

  parametros.set(
    "pagina",
    String(filtros.pagina ?? 1),
  );

  parametros.set(
    "limite",
    String(filtros.limite ?? 20),
  );

  return parametros;
}

export async function obtenerAuditorias(
  filtros: FiltrosAuditoria = {},
): Promise<RespuestaAuditoria> {
  const parametros =
    construirParametros(filtros);

  const respuesta =
    await api.get<RespuestaAuditoria>(
      `/auditoria?${parametros.toString()}`,
    );

  return {
    registros:
      Array.isArray(
        respuesta.data.registros,
      )
        ? respuesta.data.registros
        : [],

    total:
      Number(
        respuesta.data.total ?? 0,
      ),

    pagina:
      Number(
        respuesta.data.pagina ?? 1,
      ),

    limite:
      Number(
        respuesta.data.limite ?? 20,
      ),

    totalPaginas:
      Number(
        respuesta.data.totalPaginas ??
          1,
      ),
  };
}

export async function obtenerAuditoriaPorId(
  id: string,
): Promise<AuditoriaRegistro> {
  const respuesta =
    await api.get<AuditoriaRegistro>(
      `/auditoria/${encodeURIComponent(
        id,
      )}`,
    );

  return respuesta.data;
}

export async function obtenerAuditoriasPorUsuario(
  usuarioId: string,
): Promise<AuditoriaRegistro[]> {
  const respuesta =
    await api.get<AuditoriaRegistro[]>(
      `/auditoria/usuario/${encodeURIComponent(
        usuarioId,
      )}`,
    );

  return Array.isArray(
    respuesta.data,
  )
    ? respuesta.data
    : [];
}

export async function obtenerAuditoriasPorModulo(
  modulo: string,
): Promise<AuditoriaRegistro[]> {
  const respuesta =
    await api.get<AuditoriaRegistro[]>(
      `/auditoria/modulo/${encodeURIComponent(
        modulo,
      )}`,
    );

  return Array.isArray(
    respuesta.data,
  )
    ? respuesta.data
    : [];
}