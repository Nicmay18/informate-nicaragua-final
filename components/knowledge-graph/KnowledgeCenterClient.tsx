'use client';

import { useState } from 'react';
import type { KnowledgeHealth } from '@/lib/meni/knowledge-base/knowledge-health';
import type { BusinessOpportunity } from '@/lib/meni/knowledge-base/business-value';

const SALUD_COLORS: Record<string, string> = {
  excelente: 'bg-green-100 text-green-800',
  buena: 'bg-blue-100 text-blue-800',
  regular: 'bg-yellow-100 text-yellow-800',
  deficiente: 'bg-red-100 text-red-800',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  alta: 'bg-red-100 text-red-800',
  media: 'bg-yellow-100 text-yellow-800',
  baja: 'bg-gray-100 text-gray-600',
};

const SUGERENCIA_LABELS: Record<string, string> = {
  micrositio: 'Micrositio',
  especial: 'Especial Editorial',
  serie: 'Serie Editorial',
  guia: 'Guía Premium',
  cobertura: 'Cobertura Permanente',
};

type Tab = 'overview' | 'entities' | 'coverage' | 'opportunities';

export default function KnowledgeCenterClient({
  health,
  opportunities,
}: {
  health: KnowledgeHealth;
  opportunities: BusinessOpportunity[];
}) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Center</h1>
            <p className="text-sm text-gray-500">Centro de inteligencia del Knowledge Graph</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${SALUD_COLORS[health.saludGeneral]}`}>
              Salud: {health.saludGeneral}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {([
            { id: 'overview', label: 'Resumen' },
            { id: 'entities', label: 'Entidades' },
            { id: 'coverage', label: 'Cobertura' },
            { id: 'opportunities', label: 'Oportunidades' },
          ] as Array<{ id: Tab; label: string }>).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Entidades" value={health.totalEntities} color="blue" />
              <StatCard label="Relaciones" value={health.totalRelations} color="purple" />
              <StatCard label="Entradas Timeline" value={health.totalTimelineEntries} color="green" />
              <StatCard
                label="Noticias sin entidad"
                value={`${health.noticiasSinEntidad}/${health.totalNoticias}`}
                color={health.noticiasSinEntidad > health.totalNoticias * 0.3 ? 'red' : 'yellow'}
              />
            </div>

            {/* Entity types breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Entidades por tipo</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(health.entitiesByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600 capitalize">{type}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Growing topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Temas creciendo</h2>
                <div className="space-y-2">
                  {health.growingTopics.length === 0 && (
                    <p className="text-sm text-gray-400">Sin datos suficientes.</p>
                  )}
                  {health.growingTopics.map((t) => (
                    <div key={t.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{t.count}</span>
                        {t.trend === 'up' && (
                          <span className="text-green-500 text-xs">↑ activo</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Temas olvidados</h2>
                <div className="space-y-2">
                  {health.forgottenTopics.length === 0 && (
                    <p className="text-sm text-gray-400">No hay temas olvidados.</p>
                  )}
                  {health.forgottenTopics.map((t) => (
                    <div key={t.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t.name}</span>
                      <span className="text-xs text-gray-400">
                        {t.count} noticias · {new Date(t.lastSeen).toLocaleDateString('es-NI')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Entities Tab */}
        {tab === 'entities' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top entidades</h2>
              <div className="space-y-2">
                {health.topEntities.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-gray-800">{e.name}</span>
                      <span className="ml-2 text-xs text-gray-400 capitalize">{e.type}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{e.articleCount} noticias</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Entidades huérfanas (1 noticia)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {health.orphanEntities.slice(0, 20).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="text-gray-700">{e.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{e.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Coverage Tab */}
        {tab === 'coverage' && (
          <div className="space-y-6">
            <CoverageCard title="Cobertura por departamento" data={health.coverageByDepartamento} />
            <CoverageCard title="Cobertura por institución" data={health.coverageByInstitucion} />
            <CoverageCard title="Cobertura por persona" data={health.coverageByPersona} />
          </div>
        )}

        {/* Opportunities Tab */}
        {tab === 'opportunities' && (
          <div className="space-y-4">
            {opportunities.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                No hay oportunidades detectadas aún. Se necesitan al menos 5 noticias por tema.
              </div>
            )}
            {opportunities.map((opp) => (
              <div key={opp.tema} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{opp.tema}</h3>
                    <p className="text-sm text-gray-500 mt-1">{opp.razon}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORIDAD_COLORS[opp.prioridad]}`}>
                      {opp.prioridad}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {SUGERENCIA_LABELS[opp.sugerencia] || opp.sugerencia}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500 mt-3">
                  <span>{opp.totalNoticias} noticias</span>
                  <span>{opp.entidadesRelacionadas} entidades</span>
                  <span>Última: {new Date(opp.ultimaActualizacion).toLocaleDateString('es-NI')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    green: 'bg-green-50 text-green-900 border-green-200',
    red: 'bg-red-50 text-red-900 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-70 mt-1">{label}</div>
    </div>
  );
}

function CoverageCard({ title, data }: { title: string; data: Array<{ name: string; count: number }> }) {
  const max = data[0]?.count || 1;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {data.length === 0 && <p className="text-sm text-gray-400">Sin datos.</p>}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-sm text-gray-700 w-40 truncate">{item.name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full flex items-center justify-end px-2"
                style={{ width: `${(item.count / max) * 100}%` }}
              >
                <span className="text-xs text-white font-semibold">{item.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
