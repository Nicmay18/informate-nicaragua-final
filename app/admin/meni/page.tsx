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

const estadoEditorialInfo: Record<string, { label: string; badge: string; dot: string }> = {
  excelente: { label: 'Excelente', badge: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' },
  muy_buena: { label: 'Muy buena', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  necesita_explicacion: { label: 'Necesita explicación', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-500' },
  demasiado_parecida: { label: 'Demasiado parecida', badge: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' },
  no_aporta: { label: 'No aporta', badge: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' },
};

const recomendacionInfo: Record<string, { label: string; badge: string }> = {
  publicar: { label: 'Publicar', badge: 'bg-green-100 text-green-800 border-green-300' },
  mejorar: { label: 'Mejorar', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  revisar: { label: 'Revisar', badge: 'bg-red-100 text-red-800 border-red-300' },
};

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
            <h1 className="text-3xl font-bold text-slate-900">MENI — Diagnóstico editorial</h1>
            <p className="text-slate-600">Veredicto editorial del editor y diagnóstico técnico de respaldo.</p>
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
              {/* Veredicto Editorial */}
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Veredicto Editorial</h2>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {result.estadoEditorial && estadoEditorialInfo[result.estadoEditorial] && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${estadoEditorialInfo[result.estadoEditorial].badge}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${estadoEditorialInfo[result.estadoEditorial].dot}`} />
                      {estadoEditorialInfo[result.estadoEditorial].label}
                    </div>
                  )}
                  {result.recomendacionEditorial && recomendacionInfo[result.recomendacionEditorial] && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${recomendacionInfo[result.recomendacionEditorial].badge}`}>
                      {recomendacionInfo[result.recomendacionEditorial].label}
                    </div>
                  )}
                </div>
                {result.mensajeEditor && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                    <p className="text-xs font-semibold text-indigo-600 mb-2">Mensaje del Editor</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.mensajeEditor}</p>
                  </div>
                )}
                {result.razonamientoEditorial && result.razonamientoEditorial.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-600 mb-3">Razonamiento Editorial</p>
                    <ul className="space-y-2">
                      {result.razonamientoEditorial.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={`mt-0.5 font-bold ${r.positivo ? 'text-green-600' : 'text-yellow-600'}`}>
                            {r.positivo ? '✓' : '⚠'}
                          </span>
                          <span className="text-slate-700">{r.punto}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Diagnóstico Editorial */}
              {result.diagnosticoEditorial && (
                <div className="rounded-2xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold">Diagnóstico Editorial</h2>
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-1">¿Vale la pena publicar?</p>
                      <p className="text-slate-700">{result.diagnosticoEditorial.valeLaPenaPublicar.razon}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-1">¿Qué aprenderá que no en otro medio?</p>
                      <p className="text-slate-700">{result.diagnosticoEditorial.queAprenderaQueNoEnOtroMedio.respuesta}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-1">¿Qué aporta Nicaragua Informate?</p>
                      <p className="text-slate-700">{result.diagnosticoEditorial.queAportaNicaraguaInformate.respuesta}</p>
                    </div>
                    {result.diagnosticoEditorial.queLeFaltaParaReferencia.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-600 mb-1">¿Qué le falta para ser referencia?</p>
                        <ul className="space-y-1">
                          {result.diagnosticoEditorial.queLeFaltaParaReferencia.map((f, i) => (
                            <li key={i} className="text-slate-700">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 mb-1">¿Publicar en portada?</p>
                      <p className="text-slate-700">{result.diagnosticoEditorial.publicarEnPortada.razon}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnóstico técnico de respaldo */}
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-slate-500">Diagnóstico técnico de respaldo</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-slate-700">SEO</span>
                    <span className="text-sm font-bold text-slate-600">{result.seo.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-slate-700">EEAT</span>
                    <span className="text-sm font-bold text-slate-600">{result.eeat.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-slate-700">Google Discover</span>
                    <span className="text-sm font-bold text-slate-600">{result.discover.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-slate-700">AdSense</span>
                    <span className="text-sm font-bold text-slate-600">{result.adsense.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-slate-700">Forense</span>
                    <span className="text-sm font-bold text-slate-600">{result.forense.score}/100</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium text-slate-700">Valor editorial</span>
                    <span className="text-sm font-bold text-slate-600">{result.auditoria.utilidad}/100</span>
                  </div>
                </div>
                {result.riesgo && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Riesgo editorial</p>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${result.riesgo.nivel === 'VERDE' ? 'bg-emerald-500' : result.riesgo.nivel === 'AMARILLO' ? 'bg-amber-500' : 'bg-rose-500'}`}
                      />
                      <span className="text-sm font-semibold text-slate-600">{result.riesgo.nivel}</span>
                    </div>
                    <p className="text-sm text-slate-500">{result.riesgo.motivo}</p>
                  </div>
                )}
              </div>

              {result.recomendaciones && result.recomendaciones.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold text-slate-500">Recomendaciones técnicas</h2>
                  <div className="space-y-2">
                    {result.recomendaciones.map((r, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                        <div>
                          <p className="text-xs text-slate-400">{r.area}</p>
                          <p className="text-sm text-slate-600">{r.mensaje}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
