'use client';

import type { DepartamentoDailyReport } from '@/lib/departamento-central/types';

const STATUS_DOT: Record<string, string> = {
  ok: '🟢',
  warning: '🟡',
  critical: '🔴',
};

const STATUS_TEXT: Record<string, string> = {
  ok: 'text-emerald-700',
  warning: 'text-amber-700',
  critical: 'text-rose-700',
};

const STATUS_BG: Record<string, string> = {
  ok: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  critical: 'bg-rose-50 border-rose-200',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function DepartamentoCentralSummary({ report }: { report: DepartamentoDailyReport | null }) {
  if (!report) {
    return (
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">🤖 Departamento Central</h1>
        <p className="text-slate-600 mt-2">Todavía no hay un informe generado. El próximo ciclo programado lo creará.</p>
      </section>
    );
  }

  const modules = [report.corrections, report.approvals, report.growth, report.editorial];

  return (
    <section className={`rounded-2xl border-2 p-6 mb-6 ${STATUS_BG[report.site.status]}`}>
      <header className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">🤖 Departamento Central</h1>
        <p className="text-slate-600">
          Última ronda: <span className="font-medium">{formatDate(report.runAt)}</span>
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {modules.map((m) => (
          <div key={m.name} className="bg-white/70 rounded-xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500 uppercase font-semibold">{m.name}</div>
            <div className={`text-xl font-bold ${m.ok ? STATUS_TEXT.ok : STATUS_TEXT.warning}`}>
              {m.count}
            </div>
            <div className="text-[11px] text-slate-600 leading-tight mt-1">{m.note}</div>
          </div>
        ))}
        <div className="bg-white/70 rounded-xl border border-slate-200 p-3">
          <div className="text-xs text-slate-500 uppercase font-semibold">Sitio</div>
          <div className={`text-xl font-bold ${STATUS_TEXT[report.site.status]}`}>
            {STATUS_DOT[report.site.status]} {report.site.root.status}
          </div>
          <div className="text-[11px] text-slate-600 leading-tight mt-1">
            Inicio {report.site.root.ok ? 'OK' : 'falla'} · /noticias {report.site.noticias.ok ? 'OK' : 'falla'}
          </div>
        </div>
      </div>

      {report.incidents.items.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-rose-700 uppercase tracking-widest mb-2">🔴 Incidentes detectados</h2>
          <ul className="list-disc pl-5 text-sm text-rose-800 space-y-1">
            {report.incidents.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white/70 rounded-xl border border-slate-200 p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-2">Resumen del departamento</h2>
        <p className="text-sm text-slate-700 whitespace-pre-line">{report.summary}</p>
      </div>

      <div className="bg-white/70 rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest mb-2">Próximo trabajo</h2>
        <p className="text-sm text-slate-700">{report.nextWork}</p>
      </div>
    </section>
  );
}
