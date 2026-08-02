'use client';

import { useState } from 'react';
import type { DailyEditorReport } from '@/lib/nios/daily-editor';
import type { Kpi, Priority, RadarSignal, ArticleAudit, OpportunityCard, CategoryMapItem, BusinessAsset, DistributionChannel } from '@/lib/nios/executive-report';
import {
  Newspaper,
  Clock,
  Eye,
  BarChart3,
  MousePointer,
  Hourglass,
  TrendingUp,
  TrendingDown,
  Minus,
  Flag,
  DollarSign,
  User,
  BookOpen,
  BookMarked,
  FileText,
  Tag,
  Activity,
  Search,
  Award,
  Zap,
  AlertTriangle,
  Target,
  LayoutDashboard,
  Globe,
  Star,
  Send,
  MessageCircle,
  Mail,
  Bell,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

type IconComponent = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

const kpiIcons: Record<string, IconComponent> = {
  Newspaper,
  Clock,
  Eye,
  BarChart3,
  MousePointer,
  Hourglass,
  TrendingUp,
  TrendingDown,
  Flag,
  DollarSign,
  User,
  BookOpen,
  BookMarked,
  FileText,
  Tag,
  Activity,
  Search,
  Award,
  Zap,
};

const socialIcons: Record<string, IconComponent> = { Facebook: Globe, Send, MessageCircle, Mail, Bell, Twitter: Globe };

function statusColor(status: 'green' | 'yellow' | 'red' | 'gray'): string {
  switch (status) {
    case 'green':
      return '#16a34a';
    case 'yellow':
      return '#ca8a04';
    case 'red':
      return '#dc2626';
    default:
      return '#64748b';
  }
}

function articleStatusColor(status: string): string {
  switch (status) {
    case 'excellent':
      return '#16a34a';
    case 'good':
      return '#0ea5e9';
    case 'needs':
      return '#ca8a04';
    default:
      return '#dc2626';
  }
}

function levelColor(level: string): string {
  switch (level) {
    case 'alto':
      return '#16a34a';
    case 'medio':
      return '#ca8a04';
    default:
      return '#dc2626';
  }
}

function Trend({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp size={16} className="text-emerald-600" />;
  if (trend === 'down') return <TrendingDown size={16} className="text-red-600" />;
  return <Minus size={16} className="text-slate-400" />;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpiIcons[kpi.icon] || BarChart3;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ background: `${kpi.color}15` }}>
          <Icon size={22} style={{ color: kpi.color }} />
        </div>
        <Trend trend={kpi.trend} />
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{kpi.value}</div>
      <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{kpi.label}</div>
      <div className="text-xs text-[var(--text-secondary)] mt-1">{kpi.delta}</div>
    </div>
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </div>
  );
}

function PriorityCard({ p }: { p: Priority }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: p.stars === 5 ? '#fee2e2' : '#ffedd5', color: p.stars === 5 ? '#dc2626' : '#c2410c' }}
        >
          {p.label}
        </span>
        <StarRating value={p.stars} />
      </div>
      <div className="text-sm text-[var(--text-secondary)] mb-1">{p.title}</div>
      <div className="text-lg font-bold text-[var(--text-primary)] mb-2 truncate">{p.target}</div>
      <div className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">{p.impact}</div>
      {p.href ? (
        <a
          href={p.href}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity"
        >
          {p.action}
          <ArrowUpRight size={14} />
        </a>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--primary)] hover:opacity-90 transition-opacity"
        >
          {p.action}
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}

function ScoreRing({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-2"
        style={{ background: `${color}15`, color, border: `3px solid ${color}` }}
      >
        {value}
      </div>
      <span className="text-xs font-semibold text-[var(--text-secondary)] text-center uppercase tracking-wide">{label}</span>
    </div>
  );
}

function CategoryBar({ item }: { item: CategoryMapItem }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)] text-sm">{item.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${levelColor(item.level)}15`, color: levelColor(item.level) }}>
            {item.level}
          </span>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {item.noticias} notas · {item.views} vistas
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${item.bar}%`, background: levelColor(item.level) }}
        />
      </div>
      <div className="text-[10px] text-[var(--text-secondary)] mt-1">
        Promedio {item.avgViews} vistas · {item.growth === 'up' ? 'creciendo' : item.growth === 'down' ? 'decreciendo' : 'estable'}
      </div>
    </div>
  );
}

function OpportunityRow({ o }: { o: OpportunityCard }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Crear {o.type}</div>
          <div className="text-base font-bold text-[var(--text-primary)]">{o.topic}</div>
        </div>
        <div className="text-xs text-[var(--text-secondary)] bg-slate-100 px-2 py-1 rounded-lg">{o.timeHours}h</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Demanda</div>
          <StarRating value={o.demand} />
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Competencia</div>
          <StarRating value={o.competition} />
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">SEO</div>
          <StarRating value={o.seoGain} />
        </div>
      </div>
      <div className="text-sm text-[var(--text-secondary)]">{o.action}</div>
    </div>
  );
}

function AuditRow({ a }: { a: ArticleAudit }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--ni-bg)]">
      <div
        className="w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0"
        style={{ background: articleStatusColor(a.status) }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-[var(--text-primary)] truncate">{a.title}</div>
        <div className="text-xs text-[var(--text-secondary)] mb-1.5">{a.categoria}</div>
        <div className="text-xs text-[var(--text-secondary)]">{a.reason}</div>
        {a.missing.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {a.missing.map((m) => (
              <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m}</span>
            ))}
          </div>
        )}
      </div>
      <div
        className="text-[10px] font-bold uppercase px-2 py-1 rounded-full"
        style={{ background: `${articleStatusColor(a.status)}15`, color: articleStatusColor(a.status) }}
      >
        {a.status}
      </div>
    </div>
  );
}

function BusinessCard({ b }: { b: BusinessAsset }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">{b.type}</div>
      <div className="text-base font-bold text-[var(--text-primary)] mb-1 truncate">{b.name}</div>
      <div className="text-sm font-semibold text-[var(--primary)] mb-2">{b.metric}</div>
      <div className="text-xs text-[var(--text-secondary)]">{b.insight}</div>
    </div>
  );
}

function DistributionCard({ c }: { c: DistributionChannel }) {
  const Icon = socialIcons[c.icon] || Globe;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100">
            <Icon size={20} className="text-slate-700" />
          </div>
          <span className="font-bold text-[var(--text-primary)]">{c.name}</span>
        </div>
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: statusColor(c.status === 'ok' ? 'green' : c.status === 'warning' ? 'yellow' : 'red') }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-[var(--text-primary)]">{c.published}</div>
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Publicado</div>
        </div>
        <div>
          <div className="text-lg font-bold text-[var(--primary)]">{c.pending}</div>
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Pendiente</div>
        </div>
        <div>
          <div className="text-lg font-bold text-[var(--text-secondary)]">{c.scheduled}</div>
          <div className="text-[10px] text-[var(--text-secondary)] uppercase">Programado</div>
        </div>
      </div>
      <button
        type="button"
        disabled={c.pending === 0}
        className="mt-4 w-full py-2 rounded-lg text-sm font-semibold text-white bg-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        Distribuir ahora
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: IconComponent; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={20} className="text-[var(--primary)]" />}
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function GoogleRadar({ radar }: { radar: RadarSignal[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {radar.map((r) => (
        <div key={r.label} className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-5 shadow-sm flex items-center gap-4">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ background: statusColor(r.status) }}
          />
          <div className="flex-1">
            <div className="font-semibold text-[var(--text-primary)]">{r.label}</div>
            <div className="text-xs text-[var(--text-secondary)]">{r.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NiosExecutiveDashboard({ daily }: { daily: DailyEditorReport }) {
  const [tab, setTab] = useState<'overview' | 'radar' | 'newsroom' | 'distribution'>('overview');
  const e = daily.executive;

  if (!e) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
        <AlertTriangle size={24} className="mb-2" />
        <p className="font-semibold">Datos no disponibles</p>
        <p className="text-sm">El reporte ejecutivo no pudo generarse. Revisá la conexión a Firestore.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'CEO Dashboard', icon: LayoutDashboard },
    { id: 'radar', label: 'Google Radar', icon: Search },
    { id: 'newsroom', label: 'Sala de Redacción', icon: Newspaper },
    { id: 'distribution', label: 'Centro de Distribución', icon: Send },
  ] as const;

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] mb-1">
            NIOS Executive Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {daily.date} · {daily.publishedCount} noticias publicadas · {e.status === 'ok' ? 'Datos completos' : 'Datos parciales'}
          </p>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                tab === t.id
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--ni-bg)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          <Section title="CEO Dashboard" icon={LayoutDashboard}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {e.kpis.map((k) => (
                <KpiCard key={k.id} kpi={k} />
              ))}
            </div>
          </Section>

          <Section title="Health & Readiness" icon={Activity}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-6 shadow-sm">
              <div className="flex flex-wrap justify-center sm:justify-start gap-8">
                <ScoreRing label="Health" value={e.scores.health} color={levelColor(e.scores.health >= 80 ? 'alto' : e.scores.health >= 60 ? 'medio' : 'bajo')} />
                <ScoreRing label="Google" value={e.scores.googleReadiness} color={e.scores.googleReadiness >= 80 ? '#16a34a' : e.scores.googleReadiness >= 60 ? '#ca8a04' : '#dc2626'} />
                <ScoreRing label="Revenue" value={e.scores.revenue} color={e.scores.revenue >= 60 ? '#16a34a' : '#ca8a04'} />
                <ScoreRing label="EEAT" value={e.scores.eeats} color={e.scores.eeats >= 80 ? '#16a34a' : e.scores.eeats >= 60 ? '#ca8a04' : '#dc2626'} />
                <ScoreRing label="Discover" value={e.scores.discover} color={e.scores.discover >= 60 ? '#16a34a' : '#ca8a04'} />
              </div>
            </div>
          </Section>

          <Section title="Centro de Prioridades" icon={Target}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {e.priorities.map((p) => (
                <PriorityCard key={p.id} p={p} />
              ))}
            </div>
          </Section>

          <Section title="Centro de Oportunidades" icon={Zap}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {e.opportunities.map((o) => (
                <OpportunityRow key={o.id} o={o} />
              ))}
            </div>
          </Section>

          <Section title="Mapa de Categorías" icon={BarChart3}>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-6 shadow-sm">
              {e.categoryMap.map((c) => (
                <CategoryBar key={c.name} item={c} />
              ))}
            </div>
          </Section>

          <Section title="Inteligencia de Negocio" icon={DollarSign}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {e.business.map((b, i) => (
                <BusinessCard key={`${b.type}-${i}`} b={b} />
              ))}
            </div>
          </Section>

          <Section title="CEO Report" icon={Award}>
            <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--ni-bg)] to-slate-50 p-8 shadow-sm">
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{e.ceo.headline}</h3>
                <div className="text-5xl font-extrabold mb-6" style={{ color: e.scores.health >= 80 ? '#16a34a' : e.scores.health >= 60 ? '#ca8a04' : '#dc2626' }}>
                  {e.ceo.healthScore}
                  <span className="text-lg text-[var(--text-secondary)] font-semibold ml-2">Health Score</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {e.ceo.actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-[var(--text-secondary)] text-sm">
                      <ChevronRight size={16} className="mt-0.5 text-[var(--primary)]" />
                      {a}
                    </li>
                  ))}
                </ul>
                <div className="text-lg font-semibold text-[var(--primary)]">{e.ceo.projectedTraffic}</div>
              </div>
            </div>
          </Section>
        </>
      )}

      {tab === 'radar' && (
        <Section title="Radar de Google" icon={Search}>
          <GoogleRadar radar={e.radar} />
        </Section>
      )}

      {tab === 'newsroom' && (
        <>
          <Section title="Estado de la Redacción" icon={Newspaper}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Publicadas hoy', value: e.newsroom.publishedToday },
                { label: 'Programadas', value: e.newsroom.scheduled },
                { label: 'Sin revisar', value: e.newsroom.unreviewed },
                { label: 'Sin imagen', value: e.newsroom.withoutImage },
                { label: 'Sin meta', value: e.newsroom.withoutMeta },
                { label: 'Sin keyword', value: e.newsroom.withoutKeyword },
                { label: 'Sin distribución', value: e.newsroom.withoutDistribution },
                { label: 'Sin redes', value: e.newsroom.withoutSocial },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--ni-bg)] p-4 text-center shadow-sm">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
                  <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {e.newsroom.articles.slice(0, 20).map((a) => (
                <AuditRow key={a.id} a={a} />
              ))}
            </div>
          </Section>
        </>
      )}

      {tab === 'distribution' && (
        <Section title="Centro de Distribución" icon={Send}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {e.distribution.map((c) => (
              <DistributionCard key={c.name} c={c} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
