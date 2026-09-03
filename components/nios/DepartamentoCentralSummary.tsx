'use client';

import type { DepartamentoDailyReport, DepartamentoWorkSummary } from '@/lib/departamento-central/types';

const HEALTH_DOT: Record<string, string> = {
  HEALTHY: '🟢',
  DEGRADED: '🟡',
  CRITICAL: '🔴',
};

const STATUS_BG: Record<string, string> = {
  ok: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  critical: 'bg-rose-50 border-rose-200',
};

function formatDate(iso: string | null) {
  if (!iso) return 'nunca';
  try {
    return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function DepartamentoCentralSummary({
  report,
  summary,
}: {
  report: DepartamentoDailyReport | null;
  summary: DepartamentoWorkSummary | null;
}) {
  if (!report && !summary) {
    return (
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">🤖 Departamento Central</h1>
        <p className="text-slate-600 mt-2">Todavía no hay un informe generado. El próximo ciclo programado lo creará.</p>
      </section>
    );
  }

  const s = summary;
  const health = s?.health ?? 'HEALTHY';
  const workedAt = s?.lastWorkAt ?? report?.runAt ?? null;

  return (
    <section className={`rounded-2xl border-2 p-6 mb-6 ${STATUS_BG[report?.site.status ?? 'ok']}`}>
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">🤖 Departamento Central</h1>
        {s && (
          <div className="mt-2 p-3 bg-white/70 rounded-xl border border-slate-200">
            <p className="text-slate-700">
              <span className="font-semibold">🤖 Ya trabajé</span> desde tu última visita.
              {' '}
              {s.workDone24h} trabajo{s.workDone24h === 1 ? '' : 's'} realizado{s.workDone24h === 1 ? '' : 's'} en las últimas 24h.
              {' '}Última actividad: <span className="font-medium">{formatDate(workedAt)}</span>.
            </p>
          </div>
        )}
        {!s && report && (
          <p className="text-slate-600">
            Última ronda: <span className="font-medium">{formatDate(report.runAt)}</span>
          </p>
        )}
      </header>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Trabajos 24h</div>
            <div className="text-xl font-bold text-slate-900">{s.workDone24h}</div>
          </div>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Problemas</div>
            <div className={`text-xl font-bold ${s.problemsDetected > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {s.problemsDetected}
            </div>
            <div className="text-[11px] text-slate-600 leading-tight mt-1">{s.problemsResolved} resueltos</div>
          </div>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Oportunidades</div>
            <div className="text-xl font-bold text-slate-900">{s.opportunitiesFound}</div>
          </div>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Salud</div>
            <div className={`text-xl font-bold ${health === 'HEALTHY' ? 'text-emerald-700' : health === 'DEGRADED' ? 'text-amber-700' : 'text-rose-700'}`}>
              {HEALTH_DOT[health]} {health}
            </div>
          </div>
        </div>
      )}

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Pendientes aprobación</div>
            <div className="text-xl font-bold text-slate-900">{s.pendingApprovals}</div>
          </div>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Aprendizajes</div>
            <div className="text-xl font-bold text-slate-900">{s.learnings}</div>
          </div>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Trabajos activos</div>
            <div className="text-xl font-bold text-slate-900">{s.activeJobs}</div>
          </div>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">Fallidos</div>
            <div className={`text-xl font-bold ${s.failedJobs > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {s.failedJobs}
            </div>
          </div>
        </div>
      )}

      {s && s.componentStatus && Object.keys(s.componentStatus).length > 0 && (
        <div className="bg-white/70 rounded-xl border border-slate-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-2">Componentes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.entries(s.componentStatus).map(([component, status]) => (
              <div key={component} className="flex items-center gap-2">
                <span>{HEALTH_DOT[status] ?? '⚪'}</span>
                <span className="capitalize">{component}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {s && s.recentItems.length > 0 && (
        <div className="bg-white/70 rounded-xl border border-slate-200 p-4 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-2">🧾 Últimas acciones</h2>
          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
            {s.recentItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {report && (
        <>
          <div className="bg-white/70 rounded-xl border border-slate-200 p-4 mb-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-2">Resumen del departamento</h2>
            <p className="text-sm text-slate-700 whitespace-pre-line">{report.summary}</p>
          </div>

          <div className="bg-white/70 rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-2">Próximo trabajo</h2>
            <p className="text-sm text-slate-700">{report.nextWork}</p>
          </div>
        </>
      )}
    </section>
  );
}
