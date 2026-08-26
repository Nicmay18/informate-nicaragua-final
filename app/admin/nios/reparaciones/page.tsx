'use client';

import { useState } from 'react';
import { executeNiosRepair } from './actions';
import type { NiosRepairEngineResult, NiosRepairAction } from '@/lib/nios/repair-engine';

function statusStyle(status: NiosRepairAction['status']): string {
  switch (status) {
    case 'VERIFIED':
      return 'text-emerald-700 bg-emerald-50';
    case 'REPAIRED':
      return 'text-blue-700 bg-blue-50';
    case 'FAILED':
      return 'text-rose-700 bg-rose-50';
    case 'WAITING_HUMAN':
      return 'text-amber-700 bg-amber-50';
    case 'SKIPPED':
      return 'text-slate-600 bg-slate-50';
    default:
      return 'text-slate-800 bg-slate-100';
  }
}

export default function NiosReparacionesPage() {
  const [result, setResult] = useState<NiosRepairEngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executeNiosRepair();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">NIOS — Motor de Reparación Autónoma</h1>
      <p className="text-slate-600 mb-6">
        Ejecuta el ciclo DETECT → CLASSIFY → PLAN → REPAIR → VERIFY → PERSIST → REPORT.
      </p>

      <button
        onClick={handleRun}
        disabled={loading}
        className="px-5 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Ejecutando reparación...' : 'Ejecutar reparación NIOS'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-rose-50 text-rose-700 rounded-md border border-rose-200">{error}</div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <section className="p-4 rounded-md border">
            <div className="text-sm text-slate-500">Modo operativo final</div>
            <div className="text-3xl font-bold mt-1">{result.mode}</div>
            {result.modeChanged && (
              <div className="text-sm text-emerald-600 mt-1">El modo cambió durante la reparación.</div>
            )}
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-md border">
              <div className="text-sm text-slate-500">Reparaciones verificadas</div>
              <div className="text-2xl font-bold text-emerald-700">{result.repaired.length}</div>
            </div>
            <div className="p-4 rounded-md border">
              <div className="text-sm text-slate-500">Acciones humanas pendientes</div>
              <div className="text-2xl font-bold text-amber-700">{result.pendingHuman.length}</div>
            </div>
            <div className="p-4 rounded-md border">
              <div className="text-sm text-slate-500">Reparaciones fallidas</div>
              <div className="text-2xl font-bold text-rose-700">{result.failedRepairs.length}</div>
            </div>
          </section>

          <section className="p-4 rounded-md border bg-slate-50">
            <h2 className="font-semibold mb-2">Resumen</h2>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{result.summary}</pre>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Acciones detectadas ({result.actions.length})</h2>
            <div className="space-y-3">
              {result.actions.map((action) => (
                <div
                  key={action.id}
                  className={`p-4 rounded-md border ${statusStyle(action.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{action.title}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded bg-white/60">
                      {action.type} / {action.status}
                    </span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{action.reason}</p>
                  {action.after && action.status !== 'PLANNED' && (
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer opacity-80">Ver verificación</summary>
                      <pre className="mt-2 p-2 bg-white/50 rounded text-xs overflow-auto">
                        {JSON.stringify({ before: action.before, after: action.after }, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
