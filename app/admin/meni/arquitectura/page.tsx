'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAdminToken } from '@/hooks/useAdminFetch';
import type { MeniRegistry, MeniAsset } from '@/lib/meni/registry/registry-types';

type FilterKey = 'type' | 'domain' | 'status' | 'risk';

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
  critical: 'bg-red-200 text-red-900',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  experimental: 'bg-blue-100 text-blue-700',
  deprecated: 'bg-slate-200 text-slate-700',
  orphan: 'bg-rose-100 text-rose-700',
  broken: 'bg-red-200 text-red-900',
};

export default function ArquitecturaPage() {
  const [registry, setRegistry] = useState<MeniRegistry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    type: '',
    domain: '',
    status: '',
    risk: '',
  });

  async function fetchRegistry() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/meni/registry', {
        headers: { 'x-admin-token': getAdminToken() || '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al cargar MENI Registry');
      setRegistry(json.registry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  async function syncRegistry() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/meni/registry/sync', {
        method: 'POST',
        headers: { 'x-admin-token': getAdminToken() || '' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al sincronizar MENI Registry');
      setRegistry(json.registry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistry();
  }, []);

  const filtered = useMemo(() => {
    if (!registry) return [];
    const q = query.trim().toLowerCase();
    return registry.assets.filter((a: MeniAsset) => {
      if (q && !a.id.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q) && !a.exports.some((e) => e.toLowerCase().includes(q))) return false;
      if (filters.type && a.type !== filters.type) return false;
      if (filters.domain && a.domain !== filters.domain) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.risk && a.risk !== filters.risk) return false;
      return true;
    });
  }, [registry, query, filters]);

  const domains = useMemo(() => registry ? Object.keys(registry.domains).sort() : [], [registry]);

  const updateFilter = (key: FilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">MENI OS v3.0 — Registry</h1>
              <p className="text-slate-600">Inventario oficial, dominios, riesgo y estados del sistema</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/meni" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Volver a Evaluar
              </Link>
              <button
                onClick={fetchRegistry}
                disabled={loading}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:opacity-60"
              >
                Cargar
              </button>
              <button
                onClick={syncRegistry}
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? 'Sincronizando...' : 'Sincronizar ahora'}
              </button>
            </div>
          </div>
        </header>

        {registry && (
          <p className="mb-4 text-sm text-slate-500">
            Última sincronización: {new Date(registry.generatedAt).toLocaleString('es-NI')}
          </p>
        )}

        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}

        {registry && (
          <>
            <section className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              <div className="rounded-xl bg-white p-4 text-center shadow">
                <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-800">{registry.summary.total}</p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow">
                <p className="text-xs font-semibold uppercase text-slate-500">Dominios</p>
                <p className="text-2xl font-bold text-slate-800">{domains.length}</p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow">
                <p className="text-xs font-semibold uppercase text-emerald-600">Activos</p>
                <p className="text-2xl font-bold text-emerald-700">{registry.summary.byStatus.active ?? 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow">
                <p className="text-xs font-semibold uppercase text-rose-600">Huérfanos</p>
                <p className="text-2xl font-bold text-rose-700">{registry.summary.orphans}</p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow">
                <p className="text-xs font-semibold uppercase text-rose-600">Alto riesgo</p>
                <p className="text-2xl font-bold text-rose-700">{registry.summary.highRisk}</p>
              </div>
              <div className="rounded-xl bg-white p-4 text-center shadow">
                <p className="text-xs font-semibold uppercase text-amber-600">Advertencias</p>
                <p className="text-2xl font-bold text-amber-700">{registry.audit.warnings.length}</p>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
              <input
                type="text"
                placeholder="Buscar por nombre, ruta o export..."
                className="rounded-lg border p-2 text-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="rounded-lg border p-2 text-sm"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
              >
                <option value="">Todos los tipos</option>
                {Object.keys(registry.summary.byType).sort().map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                className="rounded-lg border p-2 text-sm"
                value={filters.domain}
                onChange={(e) => updateFilter('domain', e.target.value)}
              >
                <option value="">Todos los dominios</option>
                {domains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                className="rounded-lg border p-2 text-sm"
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="active">active</option>
                <option value="experimental">experimental</option>
                <option value="orphan">orphan</option>
                <option value="deprecated">deprecated</option>
                <option value="broken">broken</option>
              </select>
              <select
                className="rounded-lg border p-2 text-sm"
                value={filters.risk}
                onChange={(e) => updateFilter('risk', e.target.value)}
              >
                <option value="">Todos los riesgos</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </section>

            {registry.audit.warnings.length > 0 && (
              <section className="mb-6 rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold">Advertencias ({registry.audit.warnings.length})</h2>
                <div className="space-y-2">
                  {registry.audit.warnings.map((w) => (
                    <div key={w.code} className={`rounded-lg border-l-4 p-3 ${w.severity === 'high' ? 'border-rose-500 bg-rose-50' : w.severity === 'medium' ? 'border-amber-500 bg-amber-50' : 'border-blue-500 bg-blue-50'}`}>
                      <p className="text-sm font-semibold">{w.code}: {w.message}</p>
                      <p className="text-xs text-slate-600">{w.assetIds.length} activo(s) afectado(s)</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Inventario ({filtered.length})</h2>
              </div>
              <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                {filtered.map((a: MeniAsset) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">{a.type}</span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{a.domain}</span>
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${RISK_COLORS[a.risk] ?? 'bg-slate-100 text-slate-600'}`}>{a.risk}</span>
                      {a.apiRoutes.length > 0 && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{a.apiRoutes[0]}</span>
                      )}
                      {a.firestoreCollections.length > 0 && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{a.firestoreCollections.length} colección(es)</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-800">{a.id}</p>
                    <p className="text-xs text-slate-500">
                      exports: {a.exports.join(', ') || '—'} · depende de {a.dependsOn.length} · usado por {a.usedBy.length}
                    </p>
                    {a.dependsOn.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">dependencias: {a.dependsOn.slice(0, 5).join(', ')}{a.dependsOn.length > 5 ? '...' : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
