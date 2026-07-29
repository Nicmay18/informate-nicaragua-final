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
  const [showTechnical, setShowTechnical] = useState(false);

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
            <h1 className="text-3xl font-bold text-slate-900">Criterio Editorial</h1>
            <p className="text-slate-600">El Editor Jefe decide si la historia merece publicarse en Nicaragua Informate.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/meni-dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Dashboard MENI
            </Link>
            <Link href="/admin/meni/arquitectura" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Arquitectura
            </Link>
          </div>
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
                {loading ? 'Analizando...' : 'Evaluar criterio editorial'}
              </button>
            </form>
            {error && <p className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}
          </section>

          {result && (
            <section className="space-y-6">
              {/* ═══════════════════════════════════════════════════════════
                  PANEL EDITORIAL — única fuente de verdad: EditorialDecision
                  Campos planos, no 20 métricas dispersas.
              ═══════════════════════════════════════════════════════════ */}
              {/* MENI Editor Jefe Ejecutivo — única salida visible */}
              {result.editorialDecision?.veredictoEjecutivo && (
                <div className={`rounded-2xl p-6 shadow border-l-4 ${result.editorialDecision.veredictoEjecutivo.publicar === 'SI' ? 'bg-green-50 border-green-500' : result.editorialDecision.veredictoEjecutivo.publicar === 'MEJORAR' ? 'bg-amber-50 border-amber-500' : 'bg-red-50 border-red-500'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Veredicto del Editor Jefe</h2>
                    <span className="text-xs font-semibold text-slate-500">Score: {result.scoreFinal} · {result.calificacion}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`text-4xl font-black ${result.editorialDecision.veredictoEjecutivo.publicar === 'SI' ? 'text-green-700' : result.editorialDecision.veredictoEjecutivo.publicar === 'MEJORAR' ? 'text-amber-700' : 'text-red-700'}`}>
                      {result.editorialDecision.veredictoEjecutivo.publicar}
                    </div>
                    <div className="text-lg text-slate-700">
                      {result.editorialDecision.veredictoEjecutivo.publicar === 'SI' ? 'Se publica' : result.editorialDecision.veredictoEjecutivo.publicar === 'NO' ? 'No se publica' : 'Mejorar antes de publicar'}
                    </div>
                  </div>
                  <p className="text-slate-700 mb-4 leading-relaxed">{result.editorialDecision.veredictoEjecutivo.respuestaEjecutiva}</p>

                  {result.editorialDecision.veredictoEjecutivo.wowIdea && result.editorialDecision.veredictoEjecutivo.wowIdea !== 'Nada' && (
                    <div className="mb-4 rounded-lg bg-amber-50 p-4 border border-amber-100">
                      <p className="text-xs font-bold uppercase text-amber-600 mb-1">Momento WOW</p>
                      <p className="text-lg font-bold text-amber-900">{result.editorialDecision.veredictoEjecutivo.wowIdea}</p>
                    </div>
                  )}

                  {result.editorialDecision.veredictoEjecutivo.worthReading && (
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold uppercase text-slate-500 mb-1">¿Por qué abrir Nicaragua Informate?</p>
                      <p className="text-base font-medium text-slate-800">{result.editorialDecision.veredictoEjecutivo.worthReading}</p>
                    </div>
                  )}

                  {result.editorialDecision.veredictoEjecutivo.evaluacionCategoria && (
                    <div className="mb-6 rounded-lg bg-indigo-50 p-4 border border-indigo-100">
                      <p className="text-xs font-bold uppercase text-indigo-700 mb-3">
                        Matriz de {result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.categoria}
                      </p>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-800">{result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.contexto}%</p>
                          <p className="text-xs text-indigo-600">Contexto</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-800">{result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.explicacion}%</p>
                          <p className="text-xs text-indigo-600">Explicación</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-800">{result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.servicio}%</p>
                          <p className="text-xs text-indigo-600">Servicio</p>
                        </div>
                      </div>
                      {result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.faltantes.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-indigo-600 mb-1">Criterios a reforzar</p>
                          <ul className="space-y-1 text-sm">
                            {result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.faltantes.map((c, i) => (
                              <li key={i} className="text-slate-700">□ {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.cumplidos.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-indigo-600 mb-1">Cumplidos</p>
                          <p className="text-sm text-slate-700">{result.editorialDecision.veredictoEjecutivo.evaluacionCategoria.cumplidos.join(' • ')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {result.puntosPerdidos && result.puntosPerdidos.length > 0 && (
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Puntos perdidos</p>
                      <ul className="space-y-2 text-sm">
                        {result.puntosPerdidos.map((p, i) => (
                          <li key={i} className="flex justify-between">
                            <span className="text-slate-700">• {p.concepto}</span>
                            <span className="font-semibold text-red-600">-{p.puntos}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-slate-500 text-right">Total: -{result.puntosPerdidos.reduce((s, p) => s + p.puntos, 0)}</p>
                    </div>
                  )}

                  {result.editorialDecision.veredictoEjecutivo.journalistChecklist.length > 0 && (
                    <div className="mb-6 rounded-lg bg-sky-50 p-4 border border-sky-100">
                      <p className="text-xs font-bold uppercase text-sky-700 mb-2">Checklist del periodista — buscar antes de redactar</p>
                      <ul className="space-y-1 text-sm">
                        {result.editorialDecision.veredictoEjecutivo.journalistChecklist.map((item, i) => (
                          <li key={i} className="text-slate-700">□ {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.editorialDecision.veredictoEjecutivo.fuentesFaltan.length > 0 && (
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold uppercase text-slate-500 mb-2">Preguntas que la fuente aún no responde</p>
                      <ul className="space-y-1 text-sm">
                        {result.editorialDecision.veredictoEjecutivo.fuentesFaltan.map((q, i) => (
                          <li key={i} className="text-slate-700">• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Portada</p>
                      <p className="font-bold text-slate-800">{result.editorialDecision.veredictoEjecutivo.recomendacionPortada}</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Facebook</p>
                      <p className="font-bold text-slate-800">{result.editorialDecision.veredictoEjecutivo.probabilidadFacebook} probabilidad</p>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold text-slate-500 mb-1">Google Discover</p>
                      <p className="font-bold text-slate-800">{result.editorialDecision.veredictoEjecutivo.probabilidadDiscover} probabilidad</p>
                    </div>
                  </div>

                  {/* ¿Por qué? — evidencia desplegable */}
                  <details className="group rounded-lg bg-white/70 shadow-sm open:bg-white">
                    <summary className="cursor-pointer p-4 text-sm font-semibold text-slate-700 list-none flex items-center justify-between">
                      <span>Criterio Editorial</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 pb-4 space-y-3 text-sm text-slate-700">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Valor para el lector</p>
                        <p>{result.editorialDecision.veredictoEjecutivo.valorParaLector}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Valor frente a la competencia</p>
                        <p>{result.editorialDecision.veredictoEjecutivo.valorFrenteCompetencia}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Riesgo editorial</p>
                        <p className={`font-semibold ${result.editorialDecision.veredictoEjecutivo.riesgoEditorial === 'BAJO' ? 'text-green-600' : result.editorialDecision.veredictoEjecutivo.riesgoEditorial === 'MEDIO' ? 'text-amber-600' : 'text-red-600'}`}>{result.editorialDecision.veredictoEjecutivo.riesgoEditorial}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">✓ ¿Vale la pena publicar?</p>
                        <p>{result.editorialDecision.veredictoEjecutivo.publicar === 'SI' ? 'Sí' : result.editorialDecision.veredictoEjecutivo.publicar === 'NO' ? 'No' : 'Con mejoras'} — {result.editorialDecision.veredictoEjecutivo.respuestaEjecutiva}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">✓ ¿Qué aprende el lector?</p>
                        <p>{result.editorialDecision.veredictoEjecutivo.readerLearning}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">✓ ¿Qué aporta Nicaragua Informate?</p>
                        <p>{result.editorialDecision.veredictoEjecutivo.editorialContribution}</p>
                      </div>
                      {result.editorialDecision.veredictoEjecutivo.loQueOtrosNoContaran.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">✓ Lo que otros medios probablemente no contarán</p>
                          <ul className="space-y-1">
                            {result.editorialDecision.veredictoEjecutivo.loQueOtrosNoContaran.map((q, i) => (
                              <li key={i}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.editorialDecision.veredictoEjecutivo.queFalta.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">✓ ¿Qué debería mejorar el periodista?</p>
                          <ul className="space-y-1">
                            {result.editorialDecision.veredictoEjecutivo.queFalta.map((q, i) => (
                              <li key={i}>• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.editorialDecision.veredictoEjecutivo.antecedentesUsados.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Antecedentes utilizados</p>
                          <ul className="space-y-1">
                            {result.editorialDecision.veredictoEjecutivo.antecedentesUsados.map((a, i) => (
                              <li key={i}>• {a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.editorialDecision.veredictoEjecutivo.patronesAplicados.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Patrones aplicados</p>
                          <p>{result.editorialDecision.veredictoEjecutivo.patronesAplicados.join('; ')}</p>
                        </div>
                      )}
                      {result.editorialDecision.veredictoEjecutivo.correccionesEditor.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Correcciones sugeridas por el Editor Jefe</p>
                          <ul className="space-y-1">
                            {result.editorialDecision.veredictoEjecutivo.correccionesEditor.map((c, i) => (
                              <li key={i}>• {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* EditorialDecision — campos planos */}
              {result.editorialDecision && (
                <div className="rounded-2xl bg-white p-6 shadow border-l-4 border-indigo-500">
                  <h2 className="mb-4 text-lg font-semibold">Decisión Editorial</h2>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 text-lg ${result.editorialDecision.valeLaPenaPublicar ? 'text-green-600' : 'text-red-600'}`}>
                        {result.editorialDecision.valeLaPenaPublicar ? '✓' : '✗'}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-indigo-600">¿Vale la pena publicar?</p>
                        <p className="text-slate-700">{result.editorialDecision.valeLaPenaPublicar ? 'Sí' : 'No'}</p>
                      </div>
                    </div>
                    {result.editorialDecision.motivoPrincipal && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Motivo principal</p>
                        <p className="text-slate-700">{result.editorialDecision.motivoPrincipal}</p>
                      </div>
                    )}
                    {result.editorialDecision.aportaAlLector && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Aporta al lector</p>
                        <p className="text-slate-700">{result.editorialDecision.aportaAlLector}</p>
                      </div>
                    )}
                    {result.editorialDecision.diferenciaCompetencia && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Diferencia frente a competencia</p>
                        <p className="text-slate-700">{result.editorialDecision.diferenciaCompetencia}</p>
                      </div>
                    )}
                    {result.editorialDecision.utilidadReal && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Utilidad real</p>
                        <p className="text-slate-700">{result.editorialDecision.utilidadReal}</p>
                      </div>
                    )}
                    {result.editorialDecision.explicacion && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Explicación</p>
                        <p className="text-slate-700">{result.editorialDecision.explicacion}</p>
                      </div>
                    )}
                    {result.editorialDecision.contexto && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Contexto</p>
                        <p className="text-slate-700">{result.editorialDecision.contexto}</p>
                      </div>
                    )}
                    {result.editorialDecision.servicio && (
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 mb-1">Servicio</p>
                        <p className="text-slate-700">{result.editorialDecision.servicio}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-500">Riesgo editorial:</span>
                      <span className={`text-sm font-bold ${result.editorialDecision.riesgoEditorial === 'BAJO' ? 'text-green-600' : result.editorialDecision.riesgoEditorial === 'MEDIO' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.editorialDecision.riesgoEditorial}
                      </span>
                    </div>
                    {result.editorialDecision.acciones.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-yellow-600 mb-2">Acciones requeridas</p>
                        <ul className="space-y-1">
                          {result.editorialDecision.acciones.map((a, i) => (
                            <li key={i} className="text-slate-700">• {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Editor Jefe — Ranking Editorial */}
              {result.editorialDecision?.ranking && (
                <div className="rounded-2xl bg-white p-6 shadow border-l-4 border-amber-500">
                  <h2 className="mb-4 text-lg font-semibold">Ranking Editorial</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">
                      {'★'.repeat(result.editorialDecision.ranking.estrellas)}
                      <span className="text-slate-300">{'★'.repeat(5 - result.editorialDecision.ranking.estrellas)}</span>
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{result.editorialDecision.ranking.etiqueta}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-slate-500">Google Discover</p>
                      <p className={`font-bold ${result.editorialDecision.ranking.valorDiscover === 'Alta' ? 'text-green-600' : result.editorialDecision.ranking.valorDiscover === 'Media' ? 'text-yellow-600' : 'text-slate-400'}`}>
                        {result.editorialDecision.ranking.valorDiscover}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-slate-500">Facebook</p>
                      <p className={`font-bold ${result.editorialDecision.ranking.valorFacebook === 'Alta' ? 'text-green-600' : result.editorialDecision.ranking.valorFacebook === 'Media' ? 'text-yellow-600' : 'text-slate-400'}`}>
                        {result.editorialDecision.ranking.valorFacebook}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-slate-500">Servicio al lector</p>
                      <p className={`font-bold ${result.editorialDecision.ranking.valorServicio === 'Muy alto' || result.editorialDecision.ranking.valorServicio === 'Alto' ? 'text-green-600' : result.editorialDecision.ranking.valorServicio === 'Medio' ? 'text-yellow-600' : 'text-slate-400'}`}>
                        {result.editorialDecision.ranking.valorServicio}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-slate-500">Valor para portada</p>
                      <p className="font-bold text-slate-700 capitalize">{result.editorialDecision.ranking.valorPortada.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{result.editorialDecision.ranking.razon}</p>
                </div>
              )}

              {/* Editor Jefe — Saturación de Portada */}
              {result.editorialDecision?.saturacion && (
                <div className={`rounded-2xl bg-white p-6 shadow border-l-4 ${result.editorialDecision.saturacion.nivelSaturacion === 'rojo' ? 'border-red-500' : result.editorialDecision.saturacion.nivelSaturacion === 'amarillo' ? 'border-yellow-500' : 'border-green-500'}`}>
                  <h2 className="mb-4 text-lg font-semibold">Editor de Portada</h2>
                  <div className="space-y-3 text-sm">
                    <div className={`rounded-lg p-3 ${result.editorialDecision.saturacion.nivelSaturacion === 'rojo' ? 'bg-red-50' : result.editorialDecision.saturacion.nivelSaturacion === 'amarillo' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <p className="text-slate-700">{result.editorialDecision.saturacion.recomendacion}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2">Distribución actual de portada</p>
                      <div className="space-y-1">
                        {result.editorialDecision.saturacion.distribucion.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{d.categoria}</span>
                            <span className={`font-semibold ${d.porcentaje >= 40 ? 'text-red-600' : 'text-slate-500'}`}>{d.cantidad} ({d.porcentaje}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {result.editorialDecision.saturacion.categoriasFaltantes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Categorías ausentes</p>
                        <p className="text-xs text-slate-600">{result.editorialDecision.saturacion.categoriasFaltantes.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Editor Jefe — Aprendizaje del Editor */}
              {result.editorialDecision?.patronesAplicados && result.editorialDecision.patronesAplicados.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow border-l-4 border-purple-500">
                  <h2 className="mb-4 text-lg font-semibold">Aprendizaje del Editor</h2>
                  <p className="text-xs text-slate-500 mb-3">Patrones detectados de correcciones manuales anteriores</p>
                  <div className="space-y-2 text-sm">
                    {result.editorialDecision.patronesAplicados.map((p, i) => (
                      <div key={i} className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <p className="text-xs font-semibold text-purple-600 capitalize">{p.campo}</p>
                        <p className="text-slate-700">{p.descripcion}</p>
                        <p className="text-xs text-slate-500 mt-1">Frecuencia: {p.frecuencia} correcciones</p>
                      </div>
                    ))}
                  </div>
                  {result.editorialDecision.correccionesSugeridas.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-purple-600 mb-2">Correcciones sugeridas para esta nota</p>
                      <ul className="space-y-1">
                        {result.editorialDecision.correccionesSugeridas.map((c, i) => (
                          <li key={i} className="text-sm text-slate-700">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Editor Jefe — Memoria Editorial */}
              {result.editorialDecision?.memoriaEditorial && (
                <div className="rounded-2xl bg-white p-6 shadow border-l-4 border-teal-500">
                  <h2 className="mb-4 text-lg font-semibold">Memoria Editorial</h2>
                  <div className="space-y-3 text-sm">
                    {result.editorialDecision.memoriaEditorial.tendencia && (
                      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                        <p className="text-xs font-semibold text-teal-600 mb-1">Tendencia detectada</p>
                        <p className="text-slate-700">{result.editorialDecision.memoriaEditorial.tendencia}</p>
                      </div>
                    )}
                    {result.editorialDecision.memoriaEditorial.contextoNarrativo && (
                      <div>
                        <p className="text-xs font-semibold text-teal-600 mb-1">Contexto narrativo</p>
                        <p className="text-slate-700">{result.editorialDecision.memoriaEditorial.contextoNarrativo}</p>
                      </div>
                    )}
                    {result.editorialDecision.memoriaEditorial.cronologia.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Noticias relacionadas ({result.editorialDecision.memoriaEditorial.totalRelacionadas})</p>
                        <ul className="space-y-1">
                          {result.editorialDecision.memoriaEditorial.cronologia.map((c, i) => (
                            <li key={i} className="text-xs text-slate-600">
                              <span className="font-semibold">{new Date(c.fecha).toLocaleDateString('es-NI')}</span> — {c.titulo}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.editorialDecision.memoriaEditorial.entidadesRelacionadas.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Entidades relacionadas</p>
                        <p className="text-xs text-slate-600">{result.editorialDecision.memoriaEditorial.entidadesRelacionadas.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ADN NI — Sello editorial */}
              {result.editorialDna && (
                <div className="rounded-2xl bg-white p-6 shadow border-l-4 border-indigo-500">
                  <h2 className="mb-4 text-lg font-semibold">APORTE AL LECTOR</h2>
                  <div className="mb-4 rounded-lg bg-indigo-50 p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-700 tracking-widest">
                      {Array.from({ length: Math.max(1, Math.min(5, Math.round(result.scoreFinal / 20))) }).map(() => '★').join('')}
                    </p>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">
                    {result.editorialDecision?.veredictoEjecutivo?.editorialContribution || 'Sin aporte editorial.'}
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium text-slate-700">WOW (¿aprendió algo?)</span>
                      <span className="font-bold text-slate-600">{result.editorialDna.wow.score}/100</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <span className="font-medium text-slate-700">Sello NI</span>
                      <span className="font-bold text-slate-600">
                        {Math.round(
                          (result.editorialDna.selloNI.explica +
                            result.editorialDna.selloNI.contextualiza +
                            result.editorialDna.selloNI.servicio +
                            result.editorialDna.selloNI.originalidad +
                            result.editorialDna.selloNI.competencia +
                            result.editorialDna.selloNI.utilidad +
                            result.editorialDna.selloNI.valor) / 7
                        )}/100
                      </span>
                    </div>
                    {result.editorialDna.bloquear && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-sm font-semibold text-red-700">Bloqueado: {result.editorialDna.motivoBloqueo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Artículo optimizado */}
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

              {/* ═══════════════════════════════════════════════════════════
                  PANEL TÉCNICO SECUNDARIO — colapsable
                  SEO, EEAT, Discover, AdSense, Forense = respaldo
              ═══════════════════════════════════════════════════════════ */}
              <div className="rounded-2xl bg-slate-100 p-4 shadow-sm">
                <button
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h2 className="text-sm font-semibold text-slate-500">Herramientas técnicas de respaldo</h2>
                  <span className="text-xs text-slate-400">{showTechnical ? '▼ ocultar' : '▶ mostrar'}</span>
                </button>
                {showTechnical && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg bg-white p-3 text-center">
                        <p className="text-xs text-slate-500">Score</p>
                        <p className="text-xl font-bold">{result.scoreFinal}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <p className="text-xs text-slate-500">Categoría</p>
                        <p className="text-sm font-bold">{result.categoria}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <p className="text-xs text-slate-500">Módulo</p>
                        <p className="text-sm font-bold">{result.modulo}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 text-center">
                        <p className="text-xs text-slate-500">Prioridad</p>
                        <p className="text-sm font-bold">{result.prioridad}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                        <span className="text-sm font-medium text-slate-700">SEO</span>
                        <span className="text-sm font-bold text-slate-600">{result.seo.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                        <span className="text-sm font-medium text-slate-700">EEAT</span>
                        <span className="text-sm font-bold text-slate-600">{result.eeat.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                        <span className="text-sm font-medium text-slate-700">Google Discover</span>
                        <span className="text-sm font-bold text-slate-600">{result.discover.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                        <span className="text-sm font-medium text-slate-700">AdSense</span>
                        <span className="text-sm font-bold text-slate-600">{result.adsense.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                        <span className="text-sm font-medium text-slate-700">Forense</span>
                        <span className="text-sm font-bold text-slate-600">{result.forense.score}/100</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                        <span className="text-sm font-medium text-slate-700">Valor editorial</span>
                        <span className="text-sm font-bold text-slate-600">{result.auditoria.utilidad}/100</span>
                      </div>
                    </div>
                    {result.riesgo && (
                      <div className="pt-2 border-t border-slate-200">
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
                    {result.recomendaciones && result.recomendaciones.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Recomendaciones técnicas</p>
                        <div className="space-y-2">
                          {result.recomendaciones.map((r, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-lg bg-white border p-3">
                              <div>
                                <p className="text-xs text-slate-400">{r.area}</p>
                                <p className="text-sm text-slate-600">{r.mensaje}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Widget de calificación del periodista */}
          {result && <RatingWidget />}
        </div>
      </div>
    </main>
  );
}

function RatingWidget() {
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [razones, setRazones] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const RAZONES = [
    { id: 'buen_contexto', label: 'Buen contexto' },
    { id: 'buen_titulo', label: 'Buen título' },
    { id: 'buena_estructura', label: 'Buena estructura' },
    { id: 'explico_bien', label: 'Explicó bien' },
    { id: 'perdio_tiempo', label: 'Perdió tiempo' },
    { id: 'no_aporto', label: 'No aportó nada' },
  ];

  function toggleRazon(id: string) {
    setRazones(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  }

  async function enviar() {
    if (estrellas === 0) return;
    setEnviando(true);
    try {
      const token = getAdminToken();
      await fetch('/api/admin/meni-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          articleId: 'meni-eval',
          estrellas,
          razones,
          comentario,
        }),
      });
      setEnviado(true);
    } catch {
      // non-blocking
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
        <p className="text-green-700 font-semibold">¡Gracias por calificar a MENI!</p>
        <p className="text-sm text-green-600 mt-1">Tu feedback ayuda al sistema a aprender.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow border-l-4 border-amber-400">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">¿Te ayudó MENI?</h2>
      <p className="text-sm text-slate-500 mb-4">Califica tu experiencia con el Editor Jefe</p>

      {/* Estrellas */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setEstrellas(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className={`text-3xl transition ${(hover || estrellas) >= star ? 'text-amber-400' : 'text-slate-300'}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Razones */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {RAZONES.map((r) => (
          <button
            key={r.id}
            onClick={() => toggleRazon(r.id)}
            className={`rounded-lg border p-2 text-sm transition ${
              razones.includes(r.id)
                ? 'border-amber-400 bg-amber-50 text-amber-700 font-semibold'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {razones.includes(r.id) ? '✓ ' : '□ '}
            {r.label}
          </button>
        ))}
      </div>

      {/* Comentario opcional */}
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Comentario (opcional)..."
        className="mb-4 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
        rows={2}
      />

      <button
        onClick={enviar}
        disabled={estrellas === 0 || enviando}
        className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40"
      >
        {enviando ? 'Enviando...' : 'Enviar calificación'}
      </button>
    </div>
  );
}
