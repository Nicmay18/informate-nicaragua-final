/**
 * NIOS Command Center — Tablero Swiss Watch.
 *
 * Componente de presentacion puro. No calcula estado: solo muestra el
 * tablero que produce `lib/nios/swiss-watch`. Nunca embellece un estado:
 * si algo es UNKNOWN o RED, se muestra tal cual.
 */

import type {
  ExpertReport,
  SwissStatus,
  SwissTask,
  SwissWatchBoard as Board,
} from '@/lib/nios/swiss-watch/types';

const STATUS_STYLE: Record<SwissStatus, { bg: string; text: string; label: string }> = {
  GREEN: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'GREEN' },
  YELLOW: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'YELLOW' },
  RED: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'RED' },
  BLOCKED_EXTERNAL: {
    bg: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
    label: 'BLOCKED_EXTERNAL',
  },
  UNKNOWN: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: 'UNKNOWN' },
};

const PRIORITY_STYLE: Record<SwissTask['priority'], string> = {
  P0: 'bg-red-100 text-red-700',
  P1: 'bg-orange-100 text-orange-700',
  P2: 'bg-sky-100 text-sky-700',
  P3: 'bg-slate-100 text-slate-600',
};

function StatusBadge({ status }: { status: SwissStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function ExpertCard({ expert }: { expert: ExpertReport }) {
  const style = STATUS_STYLE[expert.status];
  return (
    <article className={`rounded-lg border p-4 ${style.bg}`}>
      <header className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{expert.name}</h3>
          <p className="mt-0.5 text-xs text-slate-600">{expert.domain}</p>
        </div>
        <StatusBadge status={expert.status} />
      </header>

      <p className="text-xs leading-relaxed text-slate-700">{expert.reason}</p>

      {expert.currentAction && (
        <p className="mt-2 text-xs font-medium text-slate-800">
          Accion actual: {expert.currentAction}
        </p>
      )}

      {expert.evidence.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-700">
            Evidencia ({expert.evidence.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {expert.evidence.map((ev, i) => (
              <li key={`${expert.id}-ev-${i}`} className="text-xs text-slate-600">
                <span className={ev.passed ? 'text-emerald-600' : 'text-red-600'}>
                  {ev.passed ? 'PASS' : 'FAIL'}
                </span>{' '}
                <strong>{ev.check}:</strong> {ev.observed}{' '}
                <em className="text-slate-400">({ev.source})</em>
              </li>
            ))}
          </ul>
        </details>
      )}

      {expert.tasks.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {expert.tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-2 text-xs">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-bold ${PRIORITY_STYLE[task.priority]}`}
              >
                {task.priority}
              </span>
              <span className="text-slate-700">
                <strong>{task.status}</strong> — {task.title}
                {task.nextAction && (
                  <span className="block text-slate-500">{task.nextAction}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-3 text-[11px] text-slate-400">
        Ultima comprobacion: {expert.lastCheckedAt}
      </footer>
    </article>
  );
}

export default function SwissWatchBoard({ board }: { board: Board }) {
  const { adsense } = board;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          NIOS Command Center — {board.mode}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Estado global</h1>
          <StatusBadge status={board.status} />
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">{board.summary}</p>
        <p className="mt-1 text-xs text-slate-400">Generado: {board.generatedAt}</p>
      </header>

      {/* Contadores por color */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(STATUS_STYLE) as SwissStatus[]).map((status) => (
          <div
            key={status}
            className={`rounded-lg border p-3 text-center ${STATUS_STYLE[status].bg}`}
          >
            <p className={`text-2xl font-bold ${STATUS_STYLE[status].text}`}>
              {board.counters[status]}
            </p>
            <p className="text-[11px] font-semibold text-slate-600">{status}</p>
          </div>
        ))}
      </div>

      {board.errors.length > 0 && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-bold text-red-800">Errores del tablero</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {board.errors.map((err, i) => (
              <li key={`err-${i}`} className="text-xs text-red-700">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AdSense Readiness */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">AdSense Readiness</h2>
          <StatusBadge status={adsense.status} />
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
            {adsense.verdict}
          </span>
          <span className="text-xs text-slate-600">Score interno: {adsense.score}/100</span>
        </div>

        <p className="mt-2 text-xs italic text-slate-500">{adsense.disclaimer}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Comprobaciones ({adsense.checks.length})
            </h3>
            <ul className="mt-2 space-y-1.5">
              {adsense.checks.map((check) => (
                <li key={check.id} className="text-xs text-slate-700">
                  <span className={check.passed ? 'text-emerald-600' : 'text-red-600'}>
                    {check.passed ? 'PASS' : 'FAIL'}
                  </span>{' '}
                  <strong>{check.label}</strong> — {check.detail}
                  <span className="block text-slate-400">Politica: {check.policy}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Bloqueadores internos ({adsense.internalBlockers.length})
            </h3>
            {adsense.internalBlockers.length === 0 ? (
              <p className="mt-2 text-xs text-emerald-700">
                Cero bloqueadores internos. La solicitud de revision depende ya solo de Google.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {adsense.internalBlockers.map((b) => (
                  <li key={b.id} className="rounded border border-slate-200 p-2 text-xs">
                    <p className="font-semibold text-slate-800">
                      [{b.severity.toUpperCase()}] {b.problem}
                    </p>
                    <p className="text-slate-600">Politica: {b.policy}</p>
                    <p className="text-slate-700">Accion: {b.correctiveAction}</p>
                    <p className="text-slate-500">
                      Resoluble internamente: {b.fixableInternally ? 'si' : 'no'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Bloqueos externos */}
      {board.externalBlockers.length > 0 && (
        <div className="mb-8 rounded-lg border border-violet-200 bg-violet-50 p-5">
          <h2 className="text-lg font-bold text-violet-900">
            Pendientes externos ({board.externalBlockers.length})
          </h2>
          <p className="mt-1 text-xs text-violet-700">
            Estos elementos no pueden resolverse desde el repositorio.
          </p>
          <div className="mt-4 space-y-3">
            {board.externalBlockers.map((b, i) => (
              <div key={`ext-${i}`} className="rounded border border-violet-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">
                  {b.expert}: {b.missing}
                </p>
                <dl className="mt-1.5 space-y-0.5 text-xs text-slate-700">
                  <div>
                    <dt className="inline font-semibold">Quien: </dt>
                    <dd className="inline">{b.owner}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Donde: </dt>
                    <dd className="inline">{b.where}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">Como comprobar: </dt>
                    <dd className="inline">{b.howToVerify}</dd>
                  </div>
                </dl>
                <code className="mt-2 block overflow-x-auto rounded bg-slate-900 p-2 text-[11px] text-slate-100">
                  {b.verificationCommand}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tareas abiertas */}
      {board.openTasks.length > 0 && (
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Tareas abiertas ({board.openTasks.length})
          </h2>
          <table className="mt-3 w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1.5 pr-3">Prioridad</th>
                <th className="py-1.5 pr-3">Owner</th>
                <th className="py-1.5 pr-3">Estado</th>
                <th className="py-1.5 pr-3">Tarea</th>
                <th className="py-1.5">Siguiente accion</th>
              </tr>
            </thead>
            <tbody>
              {board.openTasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100">
                  <td className="py-1.5 pr-3">
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold ${PRIORITY_STYLE[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 font-medium text-slate-700">{task.owner}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{task.status}</td>
                  <td className="py-1.5 pr-3 text-slate-800">{task.title}</td>
                  <td className="py-1.5 text-slate-600">{task.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sala de expertos */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Sala de Expertos ({board.experts.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {board.experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </div>
    </section>
  );
}
