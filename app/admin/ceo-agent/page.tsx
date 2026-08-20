'use client';

import { useState } from 'react';
import type { CEOAnalysis, CEOBriefAction, DataAvailability } from '@/lib/ceo-agent';

const dataStatusColor: Record<DataAvailability, string> = {
  REAL: 'bg-emerald-100 text-emerald-800',
  NO_DATA: 'bg-gray-100 text-gray-700',
  CONNECTED_NO_DATA: 'bg-amber-100 text-amber-800',
  ACCESS_BLOCKED: 'bg-rose-100 text-rose-800',
};

export default function CEOAgentPage() {
  const [slug, setSlug] = useState('');
  const [analysis, setAnalysis] = useState<CEOAnalysis | null>(null);
  const [brief, setBrief] = useState<CEOBriefAction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!slug.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ceo-agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setAnalysis(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function daily() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ceo-agent/daily');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setBrief(json.actions as CEOBriefAction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">CEO Agent</h1>

        <div className="mt-6 rounded border bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">Slug del artículo</label>
          <div className="mt-2 flex gap-2">
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="inss-que-familiares-tienen-cobertura-por-fallecimiento"
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button
              onClick={analyze}
              disabled={loading || !slug.trim()}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Analizar
            </button>
            <button
              onClick={daily}
              disabled={loading}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
            >
              Daily Brief
            </button>
          </div>
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Cargando...</p>}
        {error && <p className="mt-4 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {analysis && (
          <section className="mt-6 rounded border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Decisión</h2>
            <div className="mt-2 inline-block rounded bg-slate-900 px-3 py-1 text-sm font-bold text-white">
              {analysis.decision}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Confianza: {analysis.confidence}% — {analysis.confidenceReason}
            </p>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Calidad editorial (MENI)</h3>
              <p className="mt-1 text-sm text-slate-700"><strong>{analysis.editorialQuality}</strong></p>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">¿Por qué?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {analysis.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Evidencia</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {analysis.evidence.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Heurísticas aplicadas</h3>
              {analysis.heuristics.length === 0 ? (
                <p className="text-sm text-slate-500">Ninguna.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {analysis.heuristics.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Cambios recomendados</h3>
              {analysis.recommendedChanges.length === 0 ? (
                <p className="text-sm text-slate-500">Sin cambios.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {analysis.recommendedChanges.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Tráfico</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {analysis.trafficEvidence.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${dataStatusColor[s.status]}`}>{s.status}</span>
                    <span>{s.source}.{s.field}: {String(s.value)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-slate-700">Interés del lector: <strong>{analysis.readerInterest}</strong></p>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Google / SEO</h3>
              {analysis.seoEvidence.map((s, i) => (
                <div key={i} className="mt-1 flex gap-2 text-sm">
                  <span className={`rounded px-2 py-0.5 text-xs ${dataStatusColor[s.status]}`}>{s.status}</span>
                  <span>{s.source}.{s.field}: {String(s.value)}</span>
                </div>
              ))}
              <div className="mt-3 space-y-2">
                {analysis.opportunities.map((o, i) => (
                  <div key={i} className="rounded border border-slate-200 p-3 text-sm">
                    <p className="font-semibold">{o.type} <span className="text-xs font-normal text-slate-500">({o.severity})</span></p>
                    <p className="text-slate-700">{o.reason}</p>
                    <p className="mt-1 text-slate-600">Acción: {o.action}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Artículos relacionados</h3>
              {analysis.relatedArticles.length === 0 ? (
                <p className="text-sm text-slate-500">No hay datos.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {analysis.relatedArticles.map((r, i) => (
                    <li key={i}><a href={`/noticias/${r.slug}`} className="text-slate-900 hover:underline">{r.titulo}</a> — {r.reason}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">¿Actualizar existente?</h3>
              {analysis.existingArticleOpportunity ? (
                <div className="text-sm text-slate-700">
                  <p><strong>{analysis.existingArticleOpportunity.titulo}</strong> ({analysis.existingArticleOpportunity.slug})</p>
                  <p>{analysis.existingArticleOpportunity.reason}</p>
                  <p className="mt-1 font-semibold text-slate-900">Recomendación:</p>
                  <p>{analysis.existingArticleOpportunity.recommendation}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-600">
                    {analysis.existingArticleOpportunity.evidence.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin artículo similar.</p>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Riesgo</h3>
              <p className="text-sm text-slate-700"><strong>{analysis.risk}</strong></p>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Siguiente acción</h3>
              <p className="text-sm text-slate-700">{analysis.nextAction}</p>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Estado de datos</h3>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {analysis.dataStatus.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`rounded px-2 py-0.5 text-xs ${dataStatusColor[d.status]}`}>{d.status}</span>
                    <span className="text-slate-700">{d.source}.{d.field}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {brief && (
          <section className="mt-6 rounded border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">CEO Daily Brief</h2>
            {brief.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sin acciones.</p>
            ) : (
              <ol className="mt-3 list-decimal space-y-3 pl-5">
                {brief.map((a, i) => (
                  <li key={i} className="text-sm text-slate-800">
                    <p className="font-semibold">{a.action} — {a.targetSlug}</p>
                    <p className="text-slate-600">{a.reason}</p>
                    <p className="text-xs text-slate-500">Fuente: {a.source} — Confianza: {a.confidence}</p>
                    <ul className="mt-1 list-disc pl-5 text-xs text-slate-500">
                      {a.evidence.map((e, j) => <li key={j}>{e}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
