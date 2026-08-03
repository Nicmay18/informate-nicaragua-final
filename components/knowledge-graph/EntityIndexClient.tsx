'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { KnowledgeEntity } from '@/lib/meni/knowledge-base/types';

const TYPE_LABELS: Record<string, string> = {
  persona: 'Personas',
  institucion: 'Instituciones',
  empresa: 'Empresas',
  hospital: 'Hospitales',
  ciudad: 'Ciudades',
  departamento: 'Departamentos',
  ministerio: 'Ministerios',
  evento: 'Eventos',
  equipo: 'Equipos',
  organizacion: 'Organizaciones',
  programa: 'Programas',
  ley: 'Leyes',
  proyecto: 'Proyectos',
  infraestructura: 'Infraestructura',
  universidad: 'Universidades',
  volcan: 'Volcanes',
  rio: 'Ríos',
  carretera: 'Carreteras',
  festival: 'Festivales',
  lugar: 'Lugares',
  tema: 'Temas',
  categoria: 'Categorías',
};

export default function EntityIndexClient({ entities }: { entities: KnowledgeEntity[] }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const types = useMemo(() => {
    const set = new Set(entities.map((e) => e.type));
    return ['all', ...[...set].sort()];
  }, [entities]);

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [entities, search, filterType]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Enciclopedia de Nicaragua
        </h1>
        <p className="text-gray-600">
          Base de conocimiento sobre personas, instituciones, lugares y temas de Nicaragua.
          {entities.length} entidades registradas.
        </p>
      </header>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar entidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t === 'all' ? 'Todos los tipos' : TYPE_LABELS[t] || t}
            </option>
          ))}
        </select>
      </div>

      {/* Entity grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((entity) => (
          <Link
            key={entity.id}
            href={`/entidad/${entity.slug}`}
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {TYPE_LABELS[entity.type] || entity.type}
              </span>
              <span className="text-xs text-gray-400">{entity.articleCount} noticias</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{entity.name}</h3>
            {entity.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{entity.description}</p>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No se encontraron entidades con los criterios seleccionados.
        </div>
      )}
    </div>
  );
}
