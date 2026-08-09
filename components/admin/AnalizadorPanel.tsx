'use client';

import { useState } from 'react';
import type { MeniResult } from '@/lib/meni/types';
import { getAdminToken } from '@/hooks/useAdminFetch';

interface Props {
  noticia: {
    titulo: string;
    contenido: string;
    resumen?: string;
    categoria?: string;
    autor?: string;
    slug?: string;
    fecha?: string;
    fechaActualizacion?: string;
    imagen?: string;
    imagenDestacada?: string;
    keywords?: string;
    palabrasClave?: string[];
  };
}

const publicarLabel: Record<string, string> = {
  APROBADO: 'APROBADO',
  NO_PUBLICAR: 'NO PUBLICAR',
  NOT_EVALUATED: 'NO EVALUADA',
};

export default function AnalizadorPanel({ noticia }: Props) {
  const [resultado, setResultado] = useState<MeniResult | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analizar = async () => {
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/meni/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ ...noticia, checkDuplicates: false }),
      });
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();
      const meni = data.result as MeniResult | undefined;
      if (!meni) throw new Error('No se recibió resultado de MENI');
      setResultado(meni);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className="p-6 text-center text-gray-300">Analizando…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400 bg-red-900/20 rounded border border-red-500/40">{error}</div>;
  }

  if (!resultado) {
    return (
      <div className="p-6 text-center">
        <button
          type="button"
          onClick={analizar}
          className="px-6 py-3 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-semibold transition"
        >
          Analizar con Editor IA
        </button>
      </div>
    );
  }

  const puntuacion = typeof resultado.scoreFinal === 'number' ? `${resultado.scoreFinal} / 100` : 'N/A';
  const veredicto = resultado.verdict ?? resultado.estadoFinal ?? '—';
  const publicar = publicarLabel[resultado.publication_decision ?? resultado.estadoFinal ?? ''] ?? veredicto;
  const scoreInvalido = resultado.score_status === 'INVALID';

  return (
    <div className="max-w-2xl mx-auto p-6 text-gray-100 space-y-8">
      <h2 className="text-2xl font-bold text-white border-b border-gray-700 pb-2">Editor IA</h2>

      <div className="space-y-2">
        <Fila label="Puntuación" value={puntuacion} />
        <Fila label="Veredicto" value={veredicto} />
        <Fila label="Publicar" value={publicar} />
        <Fila label="Categoría" value={resultado.categoria} />
        {resultado.score_status && <Fila label="Estado score" value={resultado.score_status} />}
      </div>

      {scoreInvalido && resultado.invalidScoreSource && (
        <div className="p-4 rounded bg-red-900/30 border border-red-700">
          <p className="text-sm text-red-200 font-semibold">Score no calculable</p>
          <p className="text-xs text-red-300 mt-1">{resultado.invalidScoreSource}</p>
        </div>
      )}

      {resultado.diagnostico && (
        <div className="p-4 rounded bg-gray-800/50 border border-gray-700">
          <p className="text-sm text-gray-400">Diagnóstico</p>
          <p className="text-sm text-gray-200 mt-1">{resultado.diagnostico}</p>
        </div>
      )}

      {resultado.recomendaciones.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Recomendaciones</h3>
          <ul className="space-y-2">
            {resultado.recomendaciones.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-yellow-200"><span>•</span><span>{r.mensaje}</span></li>
            ))}
          </ul>
        </section>
      )}

      {resultado.blockingIssues && resultado.blockingIssues.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-red-300 mb-3">Bloqueantes</h3>
          <ul className="space-y-2">
            {resultado.blockingIssues.map((b, i) => (
              <li key={i} className="p-3 rounded bg-red-900/30 border border-red-700 text-sm text-red-100">
                <strong>{b.code}</strong>: {b.title}
                <p className="text-xs text-red-200 mt-1">{b.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resultado.warnings && resultado.warnings.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-amber-300 mb-3">Advertencias</h3>
          <ul className="space-y-2">
            {resultado.warnings.map((w, i) => (
              <li key={i} className="p-3 rounded bg-amber-900/30 border border-amber-700 text-sm text-amber-100">
                <strong>{w.code}</strong>: {w.title}
                <p className="text-xs text-amber-200 mt-1">{w.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={analizar}
          className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-sm text-gray-200 transition"
        >
          Reanalizar
        </button>
      </div>
    </div>
  );
}

function Fila({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-800 py-2">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
