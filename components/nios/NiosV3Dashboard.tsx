'use client';

import { useState } from 'react';
import type { NiosV3Report } from '@/lib/nios/v3-report';
import type { NiosEntity } from '@/lib/nios/knowledge-graph';
import {
  Brain,
  Network,
  Search,
  History,
  Target,
  Award,
  DollarSign,
  Link,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

type TabId = 'copilot' | 'entities' | 'content' | 'business' | 'score' | 'missions' | 'links' | 'memory';

function scoreColor(n: number): string {
  if (n >= 80) return '#16a34a';
  if (n >= 60) return '#ca8a04';
  return '#dc2626';
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Badge({ text, color = '#64748b' }: { text: string; color?: string }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
      {text}
    </span>
  );
}

function PriorityBadge({ p }: { p: 'critical' | 'high' | 'medium' | 'low' }) {
  const colors: Record<string, string> = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a' };
  return <Badge text={p} color={colors[p]} />;
}

function CopilotTab({ copilot }: { copilot: NiosV3Report['copilot'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {copilot.map((c, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm text-[var(--text-secondary)]">{c.question}</div>
            <PriorityBadge p={c.priority} />
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)] mb-2">{c.answer}</div>
          {c.title && <div className="text-xs text-[var(--text-secondary)] mb-3 truncate">{c.title}</div>}
          <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity">
            {c.action}
            <ArrowUpRight size={14} />
          </button>
        </Card>
      ))}
    </div>
  );
}

function EntitiesTab({ entities }: { entities: NiosEntity[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entities.slice(0, 30).map((e) => (
        <Card key={e.id}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-[var(--text-primary)] truncate">{e.name}</div>
            <Badge text={e.type} color="#0ea5e9" />
          </div>
          <div className="text-xs text-[var(--text-secondary)] mb-2">
            {e.count} noticia{e.count === 1 ? '' : 's'} · {e.totalViews} vistas
          </div>
          <div className="text-xs text-[var(--text-secondary)] mb-2">
            Autor: {e.mainAuthor} · {e.categories.join(', ')}
          </div>
          {e.guides.length > 0 && <div className="text-xs text-emerald-600 font-semibold">Guías: {e.guides.length}</div>}
        </Card>
      ))}
    </div>
  );
}

function ContentTab({ ci }: { ci: NiosV3Report['contentIntelligence'] }) {
  const counts = [
    { label: 'Duplicados', value: ci.duplicateGroups.length, color: '#dc2626' },
    { label: 'Canibalización', value: ci.cannibalization.length, color: '#ca8a04' },
    { label: 'Abandonadas', value: ci.abandoned.length, color: '#64748b' },
    { label: 'Evergreen', value: ci.evergreenCandidates.length, color: '#16a34a' },
    { label: 'Actualizar', value: ci.updateCandidates.length, color: '#0ea5e9' },
    { label: 'Sin enlaces', value: ci.withoutInternalLinks.length, color: '#ca8a04' },
    { label: 'Cortas', value: ci.tooShort.length, color: '#ca8a04' },
    { label: 'Largas', value: ci.tooLong.length, color: '#ca8a04' },
    { label: 'Vistas bajas', value: ci.lowViews.length, color: '#64748b' },
    { label: 'Creciendo', value: ci.growing.length, color: '#16a34a' },
    { label: 'Virales', value: ci.viral.length, color: '#7c3aed' },
    { label: 'Portada', value: ci.featuredCandidates.length, color: '#0ea5e9' },
  ];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {counts.map((c) => (
          <Card key={c.label} className="text-center">
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">{c.label}</div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="font-bold text-[var(--text-primary)] mb-3">Evergreen candidatas</div>
          {ci.evergreenCandidates.slice(0, 5).map((n) => (
            <div key={n.slug} className="flex justify-between text-sm py-2 border-b border-[var(--border)]">
              <span className="truncate">{n.title}</span>
              <span className="text-[var(--text-secondary)]">{n.views} vistas</span>
            </div>
          ))}
        </div>
        <div>
          <div className="font-bold text-[var(--text-primary)] mb-3">Para actualizar</div>
          {ci.updateCandidates.slice(0, 5).map((n) => (
            <div key={n.slug} className="flex justify-between text-sm py-2 border-b border-[var(--border)]">
              <span className="truncate">{n.title}</span>
              <span className="text-[var(--text-secondary)]">{n.ageDays} días</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BusinessTab({ business }: { business: NiosV3Report['business'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { title: 'Categorías rentables', items: business.profitableCategories },
        { title: 'Guías de valor', items: business.valuableGuides },
        { title: 'Temas comerciales', items: business.commercialTopics },
        { title: 'Temas recurrentes', items: business.recurrentThemes },
        { title: 'Afiliados', items: business.affiliateCandidates },
        { title: 'Patrocinables', items: business.sponsorCandidates },
        { title: 'Descargables', items: business.downloadableCandidates },
        { title: 'Premium', items: business.premiumCandidates },
        { title: 'Newsletter', items: business.newsletterCandidates },
        { title: 'Autores top', items: business.topAuthors },
      ].map((group) => (
        <Card key={group.title}>
          <div className="font-bold text-[var(--text-primary)] mb-3">{group.title}</div>
          {group.items.slice(0, 5).map((item, i) => (
            <div key={i} className="py-1.5 border-b border-[var(--border)] last:border-0">
              <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">{item.metric} · {item.insight}</div>
            </div>
          ))}
          {group.items.length === 0 && <div className="text-xs text-[var(--text-secondary)]">Sin datos</div>}
        </Card>
      ))}
    </div>
  );
}

function ScoreTab({ score }: { score: NiosV3Report['editorialScore'] }) {
  return (
    <Card className="flex flex-col md:flex-row items-center gap-8 p-6">
      <div
        className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-extrabold"
        style={{ background: `${scoreColor(score.total)}15`, color: scoreColor(score.total), border: `4px solid ${scoreColor(score.total)}` }}
      >
        {score.total}
      </div>
      <div className="flex-1">
        <div className="text-xl font-bold text-[var(--text-primary)] mb-2">{score.verdict}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {score.components.map((c) => (
            <div key={c.label} className="text-sm">
              <div className="text-[var(--text-secondary)]">{c.label}</div>
              <div className="font-bold" style={{ color: scoreColor(c.score) }}>{c.score}</div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MissionsTab({ mission }: { mission: NiosV3Report['missionCenter'] }) {
  const progress = mission.total ? Math.round((mission.completed / mission.total) * 100) : 0;
  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-[var(--text-primary)]">{mission.headline}</div>
          <div className="text-2xl font-bold" style={{ color: scoreColor(progress) }}>{progress}%</div>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: scoreColor(progress) }} />
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mission.missions.map((m) => (
          <Card key={m.id}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-[var(--text-primary)]">{m.title}</div>
                <div className="text-xs text-[var(--text-secondary)]">{m.target}</div>
              </div>
              <PriorityBadge p={m.priority} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-2xl font-bold text-[var(--text-primary)]">{m.current}</div>
              <div className="text-sm text-[var(--text-secondary)]">/ {m.goal} {m.unit}</div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${Math.min(100, (m.current / m.goal) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">{m.action}</div>
          </Card>
        ))}
      </div>
    </>
  );
}

function LinksTab({ links }: { links: NiosV3Report['smartLinks'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {links.slice(0, 20).map((l, i) => (
        <Card key={i}>
          <div className="text-xs text-[var(--text-secondary)] uppercase mb-1">{l.targetType}</div>
          <div className="font-bold text-[var(--text-primary)] mb-1 truncate">{l.sourceTitle}</div>
          <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] mb-2">
            <ChevronRight size={14} />
            <span className="truncate">{l.targetTitle}</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">{l.reason}</div>
        </Card>
      ))}
      {links.length === 0 && <div className="text-[var(--text-secondary)]">Sin sugerencias de enlace.</div>}
    </div>
  );
}

function MemoryTab({ memory }: { memory: NiosV3Report['editorialMemory'] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {memory.memories.slice(0, 20).map((m) => (
        <Card key={m.entity}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-[var(--text-primary)]">{m.entity} <span className="text-xs text-[var(--text-secondary)] font-normal">({m.type})</span></div>
            <Badge text={`${m.count} notas`} color="#0ea5e9" />
          </div>
          <div className="text-sm text-[var(--text-secondary)] mb-3">{m.message}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {m.chronology.map((c, i) => (
              <div key={i} className="flex-shrink-0 w-48 p-2 rounded-xl border border-[var(--border)] bg-[var(--ni-bg)]">
                <div className="text-xs text-[var(--text-secondary)] mb-1">{new Date(c.date).toLocaleDateString('es-NI')}</div>
                <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.title}</div>
                <div className="text-xs text-[var(--text-secondary)]">{c.views} vistas</div>
              </div>
            ))}
          </div>
          {m.guides.length > 0 && <div className="text-xs text-emerald-600 font-semibold mt-2">Guías: {m.guides.join(', ')}</div>}
        </Card>
      ))}
      {memory.orphanNews.length > 0 && (
        <Card>
          <div className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Noticias huérfanas ({memory.orphanNews.length})
          </div>
          {memory.orphanNews.slice(0, 10).map((n) => (
            <div key={n.slug} className="text-sm text-[var(--text-secondary)] truncate py-1">{n.title}</div>
          ))}
        </Card>
      )}
    </div>
  );
}

export function NiosV3Dashboard({ v3 }: { v3: NiosV3Report }) {
  const [tab, setTab] = useState<TabId>('copilot');
  const tabs = [
    { id: 'copilot' as TabId, label: 'AI Copilot', icon: Brain },
    { id: 'entities' as TabId, label: 'Entidades', icon: Network },
    { id: 'content' as TabId, label: 'Content Intelligence', icon: Search },
    { id: 'business' as TabId, label: 'Negocio', icon: DollarSign },
    { id: 'score' as TabId, label: 'Editorial Score', icon: Award },
    { id: 'missions' as TabId, label: 'Misiones', icon: Target },
    { id: 'links' as TabId, label: 'Enlaces', icon: Link },
    { id: 'memory' as TabId, label: 'Memoria', icon: History },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Brain size={24} />
            NIOS v3.0 — Copiloto Editorial
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Estado: {v3.status} · Score: {v3.editorialScore.total} · Entidades: {v3.knowledgeGraph.entities.length} · Misiones: {v3.missionCenter.completed}/{v3.missionCenter.total}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                tab === t.id ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--ni-bg)] text-[var(--text-secondary)] border-[var(--border)]'
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'copilot' && <CopilotTab copilot={v3.copilot} />}
      {tab === 'entities' && <EntitiesTab entities={v3.knowledgeGraph.entities} />}
      {tab === 'content' && <ContentTab ci={v3.contentIntelligence} />}
      {tab === 'business' && <BusinessTab business={v3.business} />}
      {tab === 'score' && <ScoreTab score={v3.editorialScore} />}
      {tab === 'missions' && <MissionsTab mission={v3.missionCenter} />}
      {tab === 'links' && <LinksTab links={v3.smartLinks} />}
      {tab === 'memory' && <MemoryTab memory={v3.editorialMemory} />}
    </div>
  );
}
