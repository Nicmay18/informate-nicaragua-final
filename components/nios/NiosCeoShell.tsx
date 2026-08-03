'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Heart,
  LayoutTemplate,
  Rocket,
  TrendingUp,
} from 'lucide-react';
import type { BusinessCommandCenter, CeoCard } from '@/lib/nios/command-center';

const KIND_CONFIG: Record<CeoCard['kind'], { label: string; icon: typeof AlertTriangle; color: string }> = {
  reparar: { label: 'Reparar', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  crecer: { label: 'Crecer', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  google: { label: 'Google', icon: Globe, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  negocio: { label: 'Negocio', icon: BarChart3, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  marca: { label: 'Marca', icon: Heart, color: 'text-violet-600 bg-violet-50 border-violet-200' },
};

const SEVERITY_DOT: Record<CeoCard['severity'], string> = {
  critica: 'bg-rose-500',
  alta: 'bg-amber-500',
  media: 'bg-blue-500',
  baja: 'bg-slate-400',
};

export default function NiosCeoShell({ cc }: { cc: BusinessCommandCenter }) {
  const { ceo } = cc;
  const [showChecklist, setShowChecklist] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());

  if (!ceo) return null;

  const allDone = done.size >= ceo.checklist.length;

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">NIOS CEO</h1>
            <p className="text-sm text-slate-500">{cc.date} · {cc.analyzed} piezas analizadas</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className={`w-2 h-2 rounded-full ${cc.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {cc.status === 'ok' ? 'Sistema operativo' : 'Datos parciales'}
          </div>
        </header>

        {/* CEO Intelligence */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">CEO Intelligence</h2>
          <div className="space-y-2 text-slate-800 leading-relaxed">
            <p className="text-lg font-medium">{ceo.briefing.greeting} {ceo.briefing.state}</p>
            {ceo.briefing.bestYesterday && (
              <p>La mejor noticia publicada ayer fue: <span className="font-semibold">{ceo.briefing.bestYesterday}</span>.</p>
            )}
            <p>El mayor riesgo hoy es: <span className="font-semibold text-rose-600">{ceo.briefing.biggestRisk}</span>.</p>
            <p>La mayor oportunidad es: <span className="font-semibold text-emerald-600">{ceo.briefing.biggestOpportunity}</span>.</p>
            <p className="pt-1">La prioridad absoluta es: <span className="font-semibold text-slate-900">{ceo.briefing.absolutePriority}</span>.</p>
          </div>
          {ceo.memory.pending > 0 && (
            <div className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              {ceo.memory.message}
            </div>
          )}
        </section>

        {/* Media Health */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Media Health</h2>
            <div className="text-3xl font-bold text-slate-900">{ceo.mediaHealth.score}<span className="text-base text-slate-400 font-normal">/100</span></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {ceo.mediaHealth.pillars.map((p) => (
              <div key={p.id} className="text-center">
                <div className={`mx-auto w-3 h-3 rounded-full mb-2 ${p.status === 'green' ? 'bg-emerald-500' : p.status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <div className="text-xs text-slate-500">{p.label}</div>
                <div className="text-sm font-semibold text-slate-800">{p.score}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Five Decision Cards */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Cinco decisiones de hoy</h2>
          <div className="grid grid-cols-1 gap-4">
            {ceo.cards.map((card) => {
              const config = KIND_CONFIG[card.kind];
              const Icon = config.icon;
              return (
                <div key={card.kind} className={`bg-white border rounded-2xl p-5 shadow-sm ${config.color.replace('bg-', 'border-').split(' ')[2]}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${config.color.split(' ')[1]}`}>
                      <Icon size={22} className={config.color.split(' ')[0]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[card.severity]}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{config.label}</span>
                        <span className="text-xs text-slate-400">· {card.source}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{card.headline}</h3>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p><span className="font-semibold text-slate-800">Qué hacer:</span> {card.what}</p>
                        <p><span className="font-semibold text-slate-800">Por qué:</span> {card.why}</p>
                        {card.ifNot !== '—' && <p><span className="font-semibold text-slate-800">Si no se hace:</span> {card.ifNot}</p>}
                      </div>
                    </div>
                    {card.href && (
                      <a href={card.href} className="text-slate-400 hover:text-slate-600" target="_blank" rel="noreferrer">
                        <ArrowUpRight size={18} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Start My Day */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <button
            onClick={() => setShowChecklist((s) => !s)}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Rocket size={20} className="text-slate-700" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-slate-900">Iniciar mi día</h2>
                <p className="text-sm text-slate-500">Checklist accionable generado desde las 5 decisiones</p>
              </div>
            </div>
            {showChecklist ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
          </button>

          {showChecklist && (
            <div className="mt-4 space-y-2 pt-4 border-t border-slate-100">
              {ceo.checklist.map((item) => {
                const isDone = done.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                      {isDone && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isDone} onChange={() => toggle(item.id)} />
                    <span className={`text-sm ${isDone ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{item.label}</span>
                    <span className="ml-auto text-xs text-slate-400">{item.source}</span>
                  </label>
                );
              })}
              {allDone && (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
                  Excelente. Todas las tareas del día están completadas.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Home Warnings */}
        {cc.home.violations.length > 0 && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <LayoutTemplate size={18} className="text-amber-600" />
              <h2 className="font-semibold text-amber-800">Home Quality</h2>
            </div>
            <ul className="space-y-1 text-sm text-amber-700">
              {cc.home.violations.map((v, i) => (
                <li key={i}>· {v}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
