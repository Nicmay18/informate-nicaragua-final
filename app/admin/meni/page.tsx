'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAdminToken } from '@/hooks/useAdminFetch';
import type { MeniResult } from '@/lib/meni';

const CATEGORIAS = [
  'General',
  'Nacionales',
  'Sucesos',
  'Internacionales',
  'Deportes',
  'Tecnología',
  'Espectáculos',
];

const severidadColor: Record<string, string> = {
  baja: 'bg-blue-100 text-blue-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-red-100 text-red-800',
};

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${color}`}>{score}/100</span>
    </div>
  );
}

export default function MeniPage() {
  const [form, setForm] = useState({
    titulo: '',
    contenido: '',
    resumen: '',
    categoria: 'General',
    autor: '',
    departamento: '',
  });
  const [result, setResult] = useState<MeniResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/meni/evaluar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken() || '',
        },
        body: JSON.stringify({
          ...form,
          fecha: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en MENI');
      setResult(json.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">MENI — Diagnóstico técnico avanzado</h1>
            <p className="text-slate-600">Auditoría técnica y arquitectura. El flujo editorial diario ahora vive en Editor IA.</p>
          </div>
          <Link href="/admin/meni/arquitectura" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Arquitectura
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Noticia a evaluar</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Título</label>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Contenido</label>
                <textarea
                  className="mt-1 h-48 w-full rounded-lg border p-2"
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Resumen</label>
                <textarea
                  className="mt-1 h-20 w-full rounded-lg border p-2"
                  value={form.resumen}
                  onChange={(e) => setForm({ ...form, resumen: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Categoría</label>
                  <select
                    className="mt-1 w-full rounded-lg border p-2"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Autor</label>
                  <input
                    className="mt-1 w-full rounded-lg border p-2"
                    value={form.autor}
                    onChange={(e) => setForm({ ...form, autor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Departamento</label>
                  <input
                    className="mt-1 w-full rounded-lg border p-2"
                    value={form.departamento}
                    onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? 'Analizando...' : 'Auditoría MENI avanzada'}
              </button>
            </form>
            {error && <p className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}
          </section>

          {result && (
            <section className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Diagnóstico</h2>
                    <p className="text-sm text-slate-500">{result.diagnostico}</p>
                  </div>
                  <span className={`rounded-full px-4 py-2 font-bold ${result.aprobado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {result.aprobado ? 'APROBADO' : 'RECHAZADO'} · {result.calificacion}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="text-xl font-bold">{result.scoreFinal}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Categoría</p>
                    <p className="text-sm font-bold">{result.categoria}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Módulo</p>
                    <p className="text-sm font-bold">{result.modulo}</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 text-center">
                    <p className="text-xs text-slate-500">Prioridad</p>
                    <p className="text-sm font-bold">{result.prioridad}</p>
                  </div>
                </div>
                {result.editorialTier && (
                  <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                        {result.editorialTier}
                      </span>
                      <span className="text-sm font-semibold text-indigo-900">Tier Editorial</span>
                    </div>
                    {result.editorialReason && (
                      <p className="mt-2 text-sm text-indigo-800">{result.editorialReason.resumen}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Auditoría por dimensiones</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ScoreBadge label="SEO" score={result.seo.score} />
                  <ScoreBadge label="EEAT" score={result.eeat.score} />
                  <ScoreBadge label="Google Discover" score={result.discover.score} />
                  <ScoreBadge label="AdSense" score={result.adsense.score} />
                  <ScoreBadge label="Forense" score={result.forense.score} />
                  <ScoreBadge label="Valor editorial" score={result.auditoria.utilidad} />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Riesgo editorial</h2>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`h-4 w-4 rounded-full ${result.riesgo.nivel === 'VERDE' ? 'bg-emerald-500' : result.riesgo.nivel === 'AMARILLO' ? 'bg-amber-500' : 'bg-rose-500'}`}
                  />
                  <span className="font-semibold">{result.riesgo.nivel}</span>
                </div>
                <p className="text-sm text-slate-600">{result.riesgo.motivo}</p>
                {result.riesgo.advertencias.length > 0 && (
                  <ul className="mt-3 list-inside list-disc text-sm text-slate-700">
                    {result.riesgo.advertencias.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Recomendaciones</h2>
                <div className="space-y-2">
                  {result.recomendaciones.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${severidadColor[r.severidad]}`}>
                        {r.severidad.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs text-slate-500">{r.area}</p>
                        <p className="text-sm text-slate-800">{r.mensaje}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Artículo optimizado</h2>
                {result.articulo && (
                  <div className="space-y-3 text-sm">
                    <p><strong>Título SEO:</strong> {result.articulo.titulo}</p>
                    <p><strong>Slug:</strong> {result.articulo.slug}</p>
                    <p><strong>Meta descripción:</strong> {result.articulo.resumen}</p>
                    <p><strong>Palabras clave:</strong> {result.seo.keywords.join(', ')}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
