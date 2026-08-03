'use client';

import Link from 'next/link';
import type { EntityPageData } from '@/lib/meni/knowledge-base/entity-page';

const TYPE_LABELS: Record<string, string> = {
  persona: 'Persona',
  institucion: 'Institución',
  empresa: 'Empresa',
  hospital: 'Hospital',
  ciudad: 'Ciudad',
  departamento: 'Departamento',
  ministerio: 'Ministerio',
  evento: 'Evento',
  equipo: 'Equipo Deportivo',
  organizacion: 'Organización',
  programa: 'Programa',
  ley: 'Ley',
  proyecto: 'Proyecto',
  infraestructura: 'Infraestructura',
  universidad: 'Universidad',
  volcan: 'Volcán',
  rio: 'Río',
  carretera: 'Carretera',
  festival: 'Festival',
  lugar: 'Lugar',
  tema: 'Tema',
  categoria: 'Categoría',
};

export default function EntityPageClient({ data }: { data: EntityPageData }) {
  const { entity, timeline, relatedEntities } = data;
  const typeLabel = TYPE_LABELS[entity.type] || entity.type;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-gray-700">Inicio</Link>
        {' / '}
        <span className="text-gray-700">{entity.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-blue-100 text-blue-800 rounded-full">
            {typeLabel}
          </span>
          <span className="text-sm text-gray-500">
            {entity.articleCount} {entity.articleCount === 1 ? 'noticia' : 'noticias'}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {entity.name}
        </h1>
        {entity.description && (
          <p className="text-lg text-gray-600 leading-relaxed">
            {entity.description}
          </p>
        )}
        {entity.categoriasRelacionadas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {entity.categoriasRelacionadas.map((cat) => (
              <Link
                key={cat}
                href={`/categoria/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline */}
          {timeline.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Cronología</h2>
              <div className="space-y-4">
                {timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <time className="text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString('es-NI', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    <h3 className="font-semibold text-gray-800 mt-1">
                      <Link
                        href={`/noticias/${entry.articleSlug}`}
                        className="hover:text-blue-600"
                      >
                        {entry.articleTitle}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{entry.summary}</p>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {entry.category}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related entities */}
          {relatedEntities.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Entidades relacionadas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {relatedEntities.map((rel) => (
                  <Link
                    key={rel.entity.id}
                    href={`/entidad/${rel.entity.slug}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {rel.entity.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {TYPE_LABELS[rel.entity.type] || rel.entity.type}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {rel.strength} {rel.strength === 1 ? 'co-ocurrencia' : 'co-ocurrencias'}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Estadísticas</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Total noticias</dt>
                <dd className="font-semibold text-gray-800">{entity.articleCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Primera mención</dt>
                <dd className="font-semibold text-gray-800">
                  {new Date(entity.firstSeen).toLocaleDateString('es-NI')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Última mención</dt>
                <dd className="font-semibold text-gray-800">
                  {new Date(entity.lastSeen).toLocaleDateString('es-NI')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Entidades relacionadas</dt>
                <dd className="font-semibold text-gray-800">{relatedEntities.length}</dd>
              </div>
            </dl>
          </div>

          {/* Keywords */}
          {entity.keywords.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Palabras clave</h3>
              <div className="flex flex-wrap gap-2">
                {entity.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded text-gray-600"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
