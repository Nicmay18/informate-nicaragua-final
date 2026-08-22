'use client';

import { useEffect, useState } from 'react';
import { getAdminToken } from '@/hooks/useAdminFetch';
import type { CEOAnalysis, CEOBriefAction, DataAvailability } from '@/lib/ceo-agent';

const dataStatusColor: Record<DataAvailability, string> = {
  REAL: 'bg-emerald-100 text-emerald-800',
  NO_DATA: 'bg-gray-100 text-gray-700',
  CONNECTED_NO_DATA: 'bg-amber-100 text-amber-800',
  ACCESS_BLOCKED: 'bg-rose-100 text-rose-800',
};

const urgencyColor: Record<CEOAnalysis['urgency'], string> = {
  CRITICAL: 'bg-rose-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-amber-400 text-black',
  LOW: 'bg-slate-200 text-slate-800',
};

const actionIcon: Record<CEOBriefAction['action'], string> = {
  PUBLISH: '🔥',
  IMPROVE_BEFORE_PUBLISH: '✍️',
  REWRITE: '✍️',
  UPDATE_EXISTING: '🛑',
  DO_NOT_PUBLISH: '🛑',
  REPUBLISH: '🔥',
  RECIRCULATE: '📈',
  WRITE_FOLLOWUP: '📈',
  IMPROVE_HEADLINE: '⚠️',
  IMPROVE_SNIPPET: '⚠️',
  ADD_CONTEXT: '✍️',
  ADD_SERVICE_INFORMATION: '📈',
  INVESTIGATE: 'ℹ️',
  MONITOR: 'ℹ️',
  ALERT_EDITOR: '🚨',
  NO_ACTION: 'ℹ️',
};

interface ArticleListItem {
  slug: string;
  titulo: string;
  categoria: string;
}

export default function CEOAgentPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [brief, setBrief] = useState<CEOBriefAction[] | null>(null);
  const [analysis, setAnalysis] = useState<CEOAnalysis | null>(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchDaily() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ceo-agent/daily', {
        headers: { 'x-admin-token': getAdminToken() || '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setBrief((json.actions as CEOBriefAction[]) ?? []);
      setArticles((json.articles as ArticleListItem[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function analyze(slug: string) {
    if (!slug.trim()) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch('/api/admin/ceo-agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() || '' },
        body: JSON.stringify({ slug: slug.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setAnalysis(json as CEOAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDaily();
  }, []);

  const alerts = (brief ?? []).filter(a => a.urgency === 'CRITICAL' || a.urgency === 'HIGH');
  const opportunities = (brief ?? []).filter(a => a.urgency === 'MEDIUM' || a.urgency === 'LOW');

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">CEO AGENT</h1>
          <p className="mt-1 text-lg text-slate-600">¿Qué debemos hacer hoy?</p>
        </div>

        {loading && <p className="text-sm text-slate-500">Cargando decisiones...</p>}
        {error && <p className="rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {brief && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">🔥 ACCIONES DE HOY</h2>
            {brief.length === 0 ? (
              <p className="mt-2 text-sm text-slate-700">Sin evidencia suficiente para actuar hoy.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {brief.map((a, i) => (
                  <li key={i} className="rounded bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{actionIcon[a.action]}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{a.action}</p>
                        <p className="text-sm text-slate-700">{a.headline}</p>
                      </div>
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${urgencyColor[a.urgency]}`}>{a.urgency}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{a.why}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
                      {a.evidence.map((e, j) => <li key={j}>{e}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {brief && alerts.length > 0 && (
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">🚨 ALERTAS</h2>
            <div className="mt-4 space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className="rounded bg-white p-4 shadow-sm">
                  <p className="font-semibold text-rose-700">{a.action} — {a.headline}</p>
                  <p className="text-sm text-slate-700">{a.why}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {brief && opportunities.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">🔎 OPORTUNIDADES</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {opportunities.map((a, i) => (
                <div key={i} className="rounded border border-slate-100 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">{actionIcon[a.action]} {a.action}</p>
                  <p className="text-sm text-slate-600">{a.headline}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">📰 ARTÍCULOS QUE NECESITAN DECISIÓN</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              value={selectedSlug}
              onChange={e => {
                setSelectedSlug(e.target.value);
                if (e.target.value) analyze(e.target.value);
              }}
              className="rounded border px-3 py-2 text-sm"
            >
              <option value="">Seleccionar artículo...</option>
              {articles.map(a => (
                <option key={a.slug} value={a.slug}>{a.titulo}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                value={manualSlug}
                onChange={e => setManualSlug(e.target.value)}
                placeholder="O escribir slug manualmente"
                className="flex-1 rounded border px-3 py-2 text-sm"
              />
              <button
                onClick={() => analyze(manualSlug)}
                disabled={!manualSlug.trim()}
                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Analizar
              </button>
            </div>
          </div>
        </section>

        {analysis && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b pb-4">
              <span className="text-3xl">{analysis.alert ? actionIcon[analysis.action] : 'ℹ️'}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">CEO DECIDE: {analysis.action}</h2>
                <p className="text-sm text-slate-600">Riesgo: <strong>{analysis.risk}</strong> — Urgencia: <span className={`rounded px-2 py-0.5 text-xs font-semibold ${urgencyColor[analysis.urgency]}`}>{analysis.urgency}</span></p>
              </div>
            </div>

            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-500">Resumen ejecutivo</h3>
                <p className="mt-1 text-lg text-slate-900">{analysis.summary}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-slate-500">¿Qué está pasando?</h3>
                <p className="mt-1 text-slate-700">{analysis.whatIsHappening}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-slate-500">¿Por qué importa?</h3>
                <p className="mt-1 text-slate-700">{analysis.whyItMatters}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase text-slate-500">Evidencia</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {analysis.evidence.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded bg-emerald-50 p-4">
                  <h3 className="text-sm font-bold text-emerald-800">QUÉ HACER</h3>
                  <p className="mt-1 text-slate-800">{analysis.whatToDo}</p>
                </div>
                <div className="rounded bg-rose-50 p-4">
                  <h3 className="text-sm font-bold text-rose-800">QUÉ NO HACER</h3>
                  <p className="mt-1 text-slate-800">{analysis.whatNotToDo}</p>
                </div>
              </div>

              {analysis.alert && (
                <div className="rounded border-l-4 border-amber-500 bg-amber-50 p-4">
                  <p className="text-lg font-bold text-amber-900">{analysis.alert.icon} {analysis.alert.title}</p>
                  <p className="text-slate-800">{analysis.alert.message}</p>
                  <p className="mt-1 text-sm font-semibold text-amber-800">Acción: {analysis.alert.action}</p>
                </div>
              )}

              {analysis.existingArticle && (
                <div className="rounded border-l-4 border-rose-500 bg-rose-50 p-4">
                  <h3 className="text-sm font-bold text-rose-900">ARTÍCULO EXISTENTE</h3>
                  <p className="font-semibold text-slate-900">{analysis.existingArticle.titulo}</p>
                  <p className="text-slate-700">{analysis.existingArticle.reason}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Qué hacer:</p>
                  <p className="text-slate-800">{analysis.existingArticle.whatToDo}</p>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {analysis.existingArticle.evidence.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {analysis.relatedArticles.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase text-slate-500">Artículos relacionados</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {analysis.relatedArticles.map((r, i) => (
                      <li key={i}><a href={`/noticias/${r.slug}`} className="hover:underline">{r.titulo}</a> — {r.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold uppercase text-slate-500">Estado de datos</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {analysis.dataStatus.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`rounded px-2 py-0.5 text-xs ${dataStatusColor[d.status]}`}>{d.status}</span>
                      <span className="text-slate-700">{d.source}.{d.field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <p className="text-center text-xs text-slate-400">Sin evidencia suficiente, no actuar.</p>
      </div>
    </main>
  );
}
