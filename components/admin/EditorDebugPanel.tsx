'use client';

import type { DebugTrace, NormalizedResults, ResultadoEditorial } from '@/lib/editor-jefe-v4/types';

interface TraceTableProps {
  trace: DebugTrace;
}

function TraceTable({ trace }: TraceTableProps) {
  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead>
        <tr className="border-b border-gray-700 text-gray-500">
          <th className="py-1 pr-2 font-medium">Origen</th>
          <th className="py-1 pr-2 font-medium">Módulo</th>
          <th className="py-1 pr-2 font-medium">Regla</th>
          <th className="py-1 pr-2 font-medium">Motivo</th>
          <th className="py-1 pr-2 font-medium text-right">Δ</th>
          <th className="py-1 pr-2 font-medium text-right">Score</th>
        </tr>
      </thead>
      <tbody>
        {trace.entries.map(entry => {
          const deltaClass =
            entry.delta > 0 ? 'text-green-400' : entry.delta < 0 ? 'text-red-400' : 'text-gray-500';
          const deltaText = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`;
          return (
            <tr key={entry.id} className="border-b border-gray-800/50">
              <td className="py-1 pr-2 text-gray-400 whitespace-nowrap">{entry.source}</td>
              <td className="py-1 pr-2 text-gray-300 whitespace-nowrap">{entry.modulo}</td>
              <td className="py-1 pr-2 text-gray-300 font-mono">{entry.rule}</td>
              <td className="py-1 pr-2 text-gray-200">{entry.motivo}</td>
              <td className={`py-1 pr-2 text-right font-medium ${deltaClass}`}>{deltaText}</td>
              <td className="py-1 pr-2 text-right text-white font-semibold">{entry.scoreAfter}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface EditorDebugPanelProps {
  resultado: ResultadoEditorial;
}

export default function EditorDebugPanel({ resultado }: EditorDebugPanelProps) {
  const modulos: (keyof Omit<NormalizedResults, 'penalizacionesDeduplicadas'>)[] = [
    'seo',
    'eeat',
    'forense',
    'adsense',
    'discover',
    'valorEditorial',
  ];

  return (
    <section className="mt-6 p-4 rounded-xl bg-gray-900/60 border border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Editor IA — Modo Debug</h3>
        <span className="text-xs text-gray-400">Traza cada cambio de score</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span className="text-gray-500 block">Score inicial</span>
          <span className="text-white font-semibold">{resultado.debugTrace.scoreInicial}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Score final</span>
          <span className="text-white font-semibold">{resultado.debugTrace.scoreFinal}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Veredicto</span>
          <span className="text-cyan-300 font-semibold">{resultado.veredicto}</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-cyan-300 mb-2">Trace del Editor Jefe</h4>
        <TraceTable trace={resultado.debugTrace} />
      </div>

      {resultado.consistencia.violaciones.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-300 mb-2">Violaciones de consistencia</h4>
          <ul className="space-y-1">
            {resultado.consistencia.violaciones.map(v => (
              <li key={v.descripcion} className="text-xs text-red-200 bg-red-900/20 p-2 rounded">
                <span className="font-semibold">{v.tipo}</span>: {v.descripcion} (score esperado{' '}
                {v.scoreEsperado}, obtenido {v.scoreObtenido})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-cyan-300 mb-2">Trazas por módulo</h4>
        <div className="space-y-3">
          {modulos.map(mod => {
            const moduleTrace = resultado.results[mod].trace;
            if (!moduleTrace) return null;
            return (
              <div key={mod}>
                <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">
                  {mod} ({moduleTrace.scoreFinal})
                </h5>
                <TraceTable trace={moduleTrace} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
