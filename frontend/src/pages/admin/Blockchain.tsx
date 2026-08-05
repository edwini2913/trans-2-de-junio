import { useCallback, useEffect, useState } from 'react';
import {
  Boxes,
  Database,
  Fingerprint,
  Link2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import {
  obtenerResumenBlockchain,
  type ResumenBlockchain,
} from '../../services/blockchain.service';

function Blockchain() {
  const [resumen, setResumen] = useState<ResumenBlockchain | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      setResumen(await obtenerResumenBlockchain());
    } catch (e: unknown) {
      setError(obtenerMensaje(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Seguridad y trazabilidad
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Blockchain de tickets
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500">
            Cada bloque protege un ticket QR mediante SHA-256 y queda enlazado con el bloque anterior.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={cargando}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
          Verificar cadena
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <Tarjeta
          titulo="Estado de la cadena"
          valor={resumen?.cadenaValida ? 'ÍNTEGRA' : cargando ? 'VERIFICANDO' : 'ALTERADA'}
          icono={resumen?.cadenaValida ? <ShieldCheck size={27} /> : <ShieldAlert size={27} />}
          positiva={Boolean(resumen?.cadenaValida)}
        />
        <Tarjeta
          titulo="Bloques registrados"
          valor={String(resumen?.totalBloques ?? 0)}
          icono={<Boxes size={27} />}
        />
        <Tarjeta
          titulo="Algoritmo de seguridad"
          valor={resumen?.algoritmo ?? 'SHA-256'}
          icono={<Fingerprint size={27} />}
        />
      </div>

      <section className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5">
        <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-6 py-5">
          <Database className="text-emerald-700" size={23} />
          <div>
            <h2 className="font-black text-slate-950">Registro de bloques</h2>
            <p className="text-sm text-slate-500">Últimos 100 tickets protegidos</p>
          </div>
        </div>

        {cargando ? (
          <div className="p-12 text-center font-bold text-slate-500">Comprobando la cadena...</div>
        ) : !resumen?.bloques.length ? (
          <div className="p-12 text-center text-slate-500">
            Aún no existen tickets registrados. El primer bloque se creará con la próxima venta.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {resumen.bloques.map((bloque) => (
              <article key={bloque.id} className="grid gap-4 p-6 lg:grid-cols-[120px_180px_1fr]">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Bloque</p>
                  <p className="mt-1 text-xl font-black text-emerald-700">#{bloque.indice}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Ticket</p>
                  <p className="mt-1 font-black text-slate-900">{bloque.codigoTicket}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatearFecha(bloque.fechaBloque)}</p>
                </div>
                <div className="min-w-0 space-y-3">
                  <Hash titulo="Hash del bloque" valor={bloque.hashBloque} />
                  <Hash titulo="Enlace anterior" valor={bloque.hashAnterior} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Tarjeta({ titulo, valor, icono, positiva = true }: { titulo: string; valor: string; icono: React.ReactNode; positiva?: boolean }) {
  return (
    <div className="rounded-[26px] border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-950/5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${positiva ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
        {icono}
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wider text-slate-400">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{valor}</p>
    </div>
  );
}

function Hash({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
        <Link2 size={14} /> {titulo}
      </p>
      <p className="mt-1 truncate font-mono text-xs text-slate-700" title={valor}>{valor}</p>
    </div>
  );
}

function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(fecha));
}

function obtenerMensaje(error: unknown): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const mensaje = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (mensaje) return mensaje;
  }
  return 'No se pudo consultar la blockchain.';
}

export default Blockchain;
