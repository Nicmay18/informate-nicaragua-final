'use client';

import { useState } from 'react';
import type { NiosV4Report } from '@/lib/nios/v4-report';
import {
  Sun,
  AlertTriangle,
  Target,
  Send,
  RefreshCw,
  Brain,
  GraduationCap,
  Building2,
  CheckCircle,
} from 'lucide-react';

type TabId = 'morning' | 'alerts' | 'missions' | 'distribution' | 'recycler' | 'brain' | 'learning' | 'business';

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

function MorningTab({ r }: { r: NiosV4Report['morning'] }) {
  return (
    <>
      <Card className="mb-4 p-6">
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">{r.title}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{r.date}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-4xl font-extrabold" style={{ color: scoreColor(r.score) }}>{r.score}</div>
            <div className="text-xs text-[var(--text-secondary)] uppercase">Score editorial</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-[var(--text-primary)]">{r.yesterday.published}</div>
            <div className="text-xs text-[var(--text-secondary)] uppercase">Ayer publicadas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-[var(--text-primary)]">{r.yesterday.totalViews}</div>
            <div className="text-xs text-[var(--text-secondary)] uppercase">Vistas ayer</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-semibold">
            Mejor categoría: {r.yesterday.bestCategory}
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-800 font-semibold">
            Problema: {r.problem}
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="font-bold text-[var(--text-primary)] mb-3">Acciones recomendadas</h3>
        <ol className="list-decimal pl-5 space-y-2 text-[var(--text-secondary)]">
          {r.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function AlertsTab({ alerts }: { alerts: NiosV4Report['watcher'] }) {
  const critical = alerts.filter((a) => a.priority === 'critical');
  const medium = alerts.filter((a) => a.priority === 'medium');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Críticas ({critical.length})</h3>
        <div className="space-y-3">
          {critical.map((a) => (
            <div key={a.id} className="border-l-4 border-red-500 pl-3 py-1">
              <div className="font-semibold text-[var(--text-primary)]">{a.type}</div>
              <div className="text-xs text-[var(--text-secondary)]">{a.reason}</div>
              <div className="text-xs text-red-600 mt-1">Impacto: {a.impact}</div>
              <div className="text-xs font-semibold text-red-700 mt-1">Acción: {a.action}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-bold text-amber-700 mb-3">Medias ({medium.length})</h3>
        <div className="space-y-3">
          {medium.map((a) => (
            <div key={a.id} className="border-l-4 border-amber-500 pl-3 py-1">
              <div className="font-semibold text-[var(--text-primary)]">{a.type}</div>
              <div className="text-xs text-[var(--text-secondary)]">{a.reason}</div>
              <div className="text-xs font-semibold text-amber-700 mt-1">Acción: {a.action}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MissionsTab({ m }: { m: NiosV4Report['mission'] }) {
  const total = m.tasks.length;
  const done = m.tasks.filter((t) => t.done).length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-[var(--text-primary)]">{m.objective}</div>
          <div className="text-2xl font-bold" style={{ color: scoreColor(progress) }}>{progress}%</div>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} />
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {m.tasks.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                {t.done ? <CheckCircle size={16} className="text-emerald-500" /> : <Target size={16} className="text-amber-500" />}
                {t.title}
              </div>
              <Badge text={t.priority} color={t.priority === 'critical' ? '#dc2626' : t.priority === 'high' ? '#ea580c' : '#ca8a04'} />
            </div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Impacto: {t.impact}</div>
            <div className="text-xs text-[var(--text-secondary)] uppercase">Dificultad: {t.difficulty}</div>
          </Card>
        ))}
      </div>
    </>
  );
}

function DistributionTab({ d }: { d: NiosV4Report['distribution'] }) {
  const byChannel: Record<string, NiosV4Report['distribution']['queue']> = {};
  for (const q of d.queue) {
    if (!byChannel[q.channel]) byChannel[q.channel] = [];
    byChannel[q.channel].push(q);
  }
  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-[var(--text-primary)]">Cola de distribución</div>
          <div className="text-sm text-[var(--text-secondary)]">Pendientes: {d.pending} · Enviados: {d.sent}</div>
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(byChannel).map(([channel, items]) => (
          <Card key={channel}>
            <h3 className="font-bold text-[var(--text-primary)] capitalize mb-3">{channel}</h3>
            {items.slice(0, 5).map((q) => (
              <div key={q.id} className="mb-3 p-2 rounded-xl bg-slate-50 text-xs text-[var(--text-secondary)]">
                <div className="font-semibold text-[var(--text-primary)] truncate mb-1">{q.title}</div>
                <div className="line-clamp-3">{q.text}</div>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--primary)] text-white text-[10px] font-bold"
                >
                  Copiar {channel}
                </button>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  );
}

function RecyclerTab({ r }: { r: NiosV4Report['recycler'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {r.slice(0, 24).map((s, i) => (
        <Card key={i}>
          <Badge text={s.type} color={s.type === 'guía' ? '#16a34a' : s.type === 'actualización' ? '#0ea5e9' : s.type === 'especial' ? '#7c3aed' : '#ca8a04'} />
          <div className="font-bold text-[var(--text-primary)] mt-2 mb-1 truncate">{s.sourceTitle}</div>
          <div className="text-sm text-[var(--text-secondary)] mb-2">{s.reason}</div>
          <div className="text-sm font-semibold text-[var(--primary)] mb-2">{s.target}</div>
          <div className="text-xs text-[var(--text-secondary)]">{s.views} vistas · {s.categoria}</div>
        </Card>
      ))}
    </div>
  );
}

function BrainTab({ b }: { b: NiosV4Report['entityBrain'] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {b.slice(0, 20).map((e) => (
        <Card key={e.entity}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-bold text-[var(--text-primary)]">{e.entity}</div>
              <div className="text-xs text-[var(--text-secondary)]">{e.type} · {e.totalNews} noticias · {e.authors.join(', ')}</div>
            </div>
            <Badge text={e.totalNews > 10 ? 'Alto interés' : 'Interés medio'} color={e.totalNews > 10 ? '#16a34a' : '#ca8a04'} />
          </div>
          {e.lastNews && (
            <div className="text-sm text-[var(--text-secondary)] mb-2">
              Última: {e.lastNews.title} ({new Date(e.lastNews.date).toLocaleDateString('es-NI')})
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {e.relatedTopics.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t}</span>
            ))}
          </div>
          <ul className="list-disc pl-5 text-xs text-[var(--text-secondary)]">
            {e.opportunities.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function LearningTab({ l }: { l: NiosV4Report['learning'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {l.insights.map((ins, i) => (
        <Card key={i}>
          <div className="font-bold text-[var(--text-primary)] mb-2">{ins.pattern}</div>
          <div className="text-sm text-[var(--text-secondary)] mb-3">{ins.evidence}</div>
          <div className="text-sm font-semibold text-emerald-700 flex items-start gap-2">
            <GraduationCap size={16} className="mt-0.5" />
            {ins.recommendation}
          </div>
        </Card>
      ))}
    </div>
  );
}

function BusinessTab({ b }: { b: NiosV4Report['businessBrain'] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {b.map((s, i) => (
        <Card key={i}>
          <div className="flex justify-between items-start mb-2">
            <Badge text={s.type} color="#0ea5e9" />
            <Badge
              text={s.potential}
              color={s.potential === 'alto' ? '#16a34a' : s.potential === 'medio' ? '#ca8a04' : '#64748b'}
            />
          </div>
          <div className="font-bold text-[var(--text-primary)] mb-2 truncate">{s.name}</div>
          <div className="text-sm text-[var(--text-secondary)] mb-3">{s.reason}</div>
          <ul className="list-disc pl-5 text-xs text-[var(--text-secondary)]">
            {s.actions.map((a, j) => <li key={j}>{a}</li>)}
          </ul>
        </Card>
      ))}
    </div>
  );
}

export function NiosV4Dashboard({ v4 }: { v4: NiosV4Report }) {
  const [tab, setTab] = useState<TabId>('morning');
  const tabs = [
    { id: 'morning' as TabId, label: 'Morning', icon: Sun },
    { id: 'alerts' as TabId, label: 'Alertas', icon: AlertTriangle },
    { id: 'missions' as TabId, label: 'Misiones', icon: Target },
    { id: 'distribution' as TabId, label: 'Distribución', icon: Send },
    { id: 'recycler' as TabId, label: 'Recycler', icon: RefreshCw },
    { id: 'brain' as TabId, label: 'Cerebro', icon: Brain },
    { id: 'learning' as TabId, label: 'Aprendizaje', icon: GraduationCap },
    { id: 'business' as TabId, label: 'Negocio', icon: Building2 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Brain size={24} />
            NIOS v4.0 — Agente Editorial
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Score: {v4.morning.score} · Alertas: {v4.watcher.length} · Misiones: {v4.mission.completed}/{v4.mission.tasks.length} · Cola: {v4.distribution.pending}
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

      {tab === 'morning' && <MorningTab r={v4.morning} />}
      {tab === 'alerts' && <AlertsTab alerts={v4.watcher} />}
      {tab === 'missions' && <MissionsTab m={v4.mission} />}
      {tab === 'distribution' && <DistributionTab d={v4.distribution} />}
      {tab === 'recycler' && <RecyclerTab r={v4.recycler} />}
      {tab === 'brain' && <BrainTab b={v4.entityBrain} />}
      {tab === 'learning' && <LearningTab l={v4.learning} />}
      {tab === 'business' && <BusinessTab b={v4.businessBrain} />}
    </div>
  );
}
