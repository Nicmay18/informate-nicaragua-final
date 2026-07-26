'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAdminToken } from '@/hooks/useAdminFetch';
import type { MeniArchitectGraph, MeniArchitectNode } from '@/lib/meni/architect';

function countMap(nodes: MeniArchitectNode[], key: 'collections' | 'route') {
  const out = new Set<string>();
  for (const n of nodes) {
    if (key === 'route' && n.route) out.add(n.route);
    if (key === 'collections' && n.collections) {
      for (const c of n.collections) out.add(c);
    }
  }
  return Array.from(out).sort();
}

export default function ArquitecturaPage() {
  const [graph, setGraph] = useState<MeniArchitectGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  async function fetchGraph() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/meni/arquitectura', {
        headers: { 'x-admin-token': getAdminToken() || '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al escanear arquitectura');
      setGraph(json.graph);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGraph();
  }, []);

  const routes = graph ? countMap(graph.nodes, 'route') : [];
  const collections = graph ? countMap(graph.nodes, 'collections') : [];
  const filtered = graph
    ? graph.nodes.filter((n) =>
        n.id.toLowerCase().includes(filter.toLowerCase()) ||
        n.exports.some((e) => e.toLowerCase().includes(filter.toLowerCase()))
      )
    : [];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">MENI v2.1 — Arquitectura</h1>
              <p className="text-slate-600">Mapa de componentes, dependencias y servicios del sistema</p>
            </div>
            <Link href="/admin/meni" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Volver a Evaluar
            </Link>
          </div>
        </header>

        <div className="mb-6 flex gap-2">
          <button
            onClick={fetchGraph}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Escaneando...' : 'Sincronizar ahora'}
          </button>
          {graph && (
            <span className="self-center text-sm text-slate-500">
              Última sincronización: {new Date(graph.generatedAt).toLocaleString('es-NI')}
            </span>
          )}
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}

        {graph && (
          <>
            <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              {Object.entries(graph.summary).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white p-4 text-center shadow">
                  <p className="text-xs font-semibold uppercase text-slate-500">{k}</p>
                  <p className="text-2xl font-bold text-slate-800">{v as number}</p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Componentes ({graph.nodes.length})</h2>
                  <input
                    type="text"
                    placeholder="Filtrar por archivo o export..."
                    className="ml-auto rounded-lg border p-2 text-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                  {filtered.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">
                          {n.type}
                        </span>
                        {n.route && (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            {n.route}
                          </span>
                        )}
                        {n.collections && n.collections.length > 0 && (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            {n.collections.length} colección(es)
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800">{n.id}</p>
                      <p className="text-xs text-slate-500">
                        exports: {n.exports.join(', ') || '—'} · imports: {n.imports.length}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold">APIs / Rutas ({routes.length})</h2>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                    {routes.map((r) => (
                      <li key={r} className="rounded bg-slate-50 p-2 font-mono text-slate-700">{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold">Colecciones Firestore ({collections.length})</h2>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                    {collections.map((c) => (
                      <li key={c} className="rounded bg-slate-50 p-2 font-mono text-slate-700">{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow">
                  <h2 className="mb-4 text-lg font-semibold">Dependencias ({graph.edges.length})</h2>
                  <p className="text-sm text-slate-600">
                    Cada arista conecta un archivo con un módulo importado. MENI conoce {graph.nodes.length} nodos.
                  </p>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
