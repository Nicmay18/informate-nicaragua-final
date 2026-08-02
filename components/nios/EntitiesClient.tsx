'use client';

import { useState, useMemo } from 'react';
import type { KnowledgeGraph, NiosEntity } from '@/lib/nios/knowledge-graph';
import { Search, FileText, BookOpen, User, Calendar } from 'lucide-react';

export function EntitiesClient({ graph }: { graph: KnowledgeGraph }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<NiosEntity | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return graph.entities.slice(0, 50);
    return graph.entities.filter((e) =>
      e.name.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.categories.some((c) => c.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [graph, query]);

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar entidad, tipo o categoría..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--ni-bg)] text-[var(--text-primary)]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3 max-h-[80vh] overflow-y-auto pr-1">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                selected?.id === e.id ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : 'border-[var(--border)] bg-[var(--ni-bg)] text-[var(--text-primary)]'
              }`}
            >
              <div className="font-semibold">{e.name}</div>
              <div className={`text-xs ${selected?.id === e.id ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                {e.type} · {e.count} notas · {e.totalViews} vistas
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{selected.name}</h2>
              <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide mb-6">{selected.type}</div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <div className="text-xl font-bold text-[var(--text-primary)]">{selected.count}</div>
                  <div className="text-xs text-[var(--text-secondary)] uppercase">Noticias</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <div className="text-xl font-bold text-[var(--text-primary)]">{selected.totalViews}</div>
                  <div className="text-xs text-[var(--text-secondary)] uppercase">Vistas</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <div className="text-xl font-bold text-[var(--text-primary)]">{selected.guides.length}</div>
                  <div className="text-xs text-[var(--text-secondary)] uppercase">Guías</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50">
                  <div className="text-xl font-bold text-[var(--text-primary)]">{selected.news.length}</div>
                  <div className="text-xs text-[var(--text-secondary)] uppercase">Relacionadas</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <FileText size={16} /> Últimas noticias
                  </h3>
                  <div className="space-y-2">
                    {selected.news.slice(0, 10).map((slug) => (
                      <a key={slug} href={`/noticias/${slug}`} className="block text-sm text-[var(--primary)] truncate hover:underline">
                        {slug}
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <BookOpen size={16} /> Guías relacionadas
                  </h3>
                  <div className="space-y-2">
                    {selected.guides.length > 0 ? selected.guides.map((g) => (
                      <a key={g} href={`/guia/${g}`} className="block text-sm text-[var(--primary)] truncate hover:underline">
                        {g}
                      </a>
                    )) : <div className="text-sm text-[var(--text-secondary)]">Sin guías</div>}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-[var(--text-secondary)] flex flex-wrap gap-4">
                <span className="flex items-center gap-1"><User size={14} /> {selected.mainAuthor}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(selected.firstSeen).toLocaleDateString('es-NI')} - {new Date(selected.lastSeen).toLocaleDateString('es-NI')}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-12 text-center text-[var(--text-secondary)]">
              Seleccioná una entidad para ver el detalle.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
