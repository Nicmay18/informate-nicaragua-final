'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAdminFetch } from '@/hooks/useAdminFetch';

type DeptoJob = {
  jobId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retry' | 'dead-letter';
  createdAt: string;
  completedAt?: string;
  startedAt?: string;
  error?: string;
  payload?: Record<string, unknown>;
};

type Incident = {
  id?: string;
  severity: 'critical' | 'warning' | 'ok';
  title: string;
  status: 'active' | 'resolved' | 'monitoring';
  detectedAt: string;
  resolvedAt?: string;
  diagnosis?: string;
  correction?: string;
  verification?: string;
};

type PendingAction = {
  id: string;
  title: string;
  evidence: string;
  proposal: string;
  kind: string;
  impact: string;
  confidence: string;
  createdAt: string;
  target: string;
};

type Learning = {
  id: string;
  text: string;
  timestamp: string;
  kind: string;
};

type Summary = {
  workDone24h: number;
  problemsDetected: number;
  problemsResolved: number;
  opportunitiesFound: number;
  learnings: number;
  pendingApprovals: number;
  activeJobs: number;
  failedJobs: number;
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  componentStatus: Record<string, 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'>;
  recentItems: string[];
};

type ContentHealth = {
  total: number;
  approved: number;
  pendingReview: number;
  withOpportunities: number;
};

type NiosData = {
  articlesCount: number;
  lastRunAt?: string | null;
  ceoVerdict?: {
    statusLabel: string;
    status: string;
    whatIsHappening: string;
    whatMatters: string[];
    whatToDoToday: string[];
  } | null;
  growth?: {
    speaks: string;
    plan: {
      rank: number;
      title: string;
      explanation: string;
      requiresApproval: boolean;
      impact: string;
      confidence: string;
      effort: string;
      metric: string;
      opportunity: { evidence: { source: string; metric: string; value: string | number; note?: string }[] };
    }[];
    summary: string;
    opportunities: { id: string }[];
  } | null;
  google?: {
    avgCtr: number | null;
    avgPosition: number | null;
    topQueries: { query: string; impressions: number; clicks: number }[];
  } | null;
  gsc?: {
    status: string;
    totalImpressions?: number;
    totalClicks?: number;
    discover?: { impressions: number; clicks: number }[];
    googleNews?: { impressions: number; clicks: number }[];
  } | null;
  ga4?: {
    status: string;
    totalUsers?: number;
    totalSessions?: number;
    totalPageviews?: number;
    averageEngagementTimeSec?: number;
    errorMessage?: string;
  } | null;
  trafficIntelligence?: {
    hasData: boolean;
    message: string;
    sources: { id: string; name: string; status: string; value: number; unit: string; note: string }[];
  } | null;
  adsense?: {
    readyToReapply: 'yes' | 'maybe' | 'no';
    topAffectingUrls: { slug: string; status: string }[];
    likelyRejectionReason: string;
    trustCheck?: { adSenseTrustScore: number };
  } | null;
  meniLearning?: { summary?: string } | null;
  contentOpportunity?: { opportunities: { id: string }[] } | null;
  topMovingArticles?: { slug: string; titulo: string; momentum: number }[];
};

type LoopObservation = { source: string; status: string; note: string; dataAgeHours: number | null };
type LoopDiagnosis = { id: string; source: string; severity: string; status: string; problem: string; expectedResult: string };
type LoopDecision = { id: string; source: string; problem: string; decision: string; priority: number; reason: string; expectedResult?: string };
type LoopRepaired = { repairId: string; problem: string; action: string; status: string; verification: string };
type LoopLearning = { decisionId: string; problem: string; impact: string; confidence: number; timestamp: string };

type NiosLoop = {
  record: {
    id?: string;
    status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
    timestamp: string;
    summary: string;
    observations: LoopObservation[];
    diagnoses: LoopDiagnosis[];
    decisions: LoopDecision[];
    repaired: LoopRepaired[];
    pendingHuman: number;
    failedRepairs: number;
    learnings: LoopLearning[];
  } | null;
  autonomyScore: number;
  autonomyMax: number;
  autonomyReport: Record<string, 'REAL' | 'PARTIAL' | 'DEAD'>;
};

type Data = {
  greeting: string;
  generatedAt: string;
  estadoGeneral: {
    level: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    label: 'OPERATIVO' | 'DEGRADADO' | 'CRÍTICO';
    dot: '🟢' | '🟡' | '🔴';
    lastWorkAt: string | null;
    lastHeartbeatAt: string | null;
    workDone24h: number;
    activeIncidents: number;
    pendingApprovals: number;
  };
  summary: Summary | null;
  report: { site: { status: 'ok' | 'warning' | 'critical' }; summary: string; nextWork: string } | null;
  jobs: DeptoJob[];
  deadLetter: DeptoJob[];
  incidents: Incident[];
  pendingActions: PendingAction[];
  learnings: Learning[];
  content: ContentHealth | null;
  nios: NiosData | null;
  niosLoop: NiosLoop | null;
};

const STATUS_EMOJI: Record<string, string> = {
  HEALTHY: '🟢', DEGRADED: '🟡', CRITICAL: '🔴', UNKNOWN: '⚪',
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function fmtAgo(iso?: string | null) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'hace un momento';
  if (ms < 3_600_000) return `hace ${Math.round(ms / 60_000)} minutos`;
  if (ms < 86_400_000) return `hace ${Math.round(ms / 3_600_000)} horas`;
  return `hace ${Math.round(ms / 86_400_000)} días`;
}

function n(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-NI');
}

function pct(x: number | null | undefined) {
  if (x === null || x === undefined) return '—';
  return `${x.toFixed(1)}%`;
}

function Card({ title, emoji, children, link, linkLabel }: { title: string; emoji?: string; children: React.ReactNode; link?: string; linkLabel?: string }) {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">{emoji ? `${emoji} ${title}` : title}</h2>
        {link && <Link href={link} className="text-xs text-blue-600 hover:underline">{linkLabel || 'Ver detalle →'}</Link>}
      </div>
      {children}
    </section>
  );
}

function EstadoPill({ dot, label, sub }: { dot: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl" aria-hidden="true">{dot}</span>
      <div>
        <div className="text-2xl font-bold text-slate-900">{label}</div>
        <div className="text-sm text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

export default function CentroDeComandoPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState(false);
  const [runningCycle, setRunningCycle] = useState(false);
  const prevLastWork = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { adminFetch } = useAdminFetch();

  const fetchData = async () => {
    try {
      const res = await adminFetch('/api/admin/centro-de-comando', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error cargando Centro de Comando');
      const d = json.data as Data;
      if (prevLastWork.current && d.estadoGeneral.lastWorkAt && prevLastWork.current !== d.estadoGeneral.lastWorkAt) {
        setNewActivity(true);
        setTimeout(() => setNewActivity(false), 8000);
      }
      prevLastWork.current = d.estadoGeneral.lastWorkAt;
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const runNiosLoop = async () => {
    if (runningCycle) return;
    setRunningCycle(true);
    try {
      const res = await adminFetch('/api/admin/nios/loop', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error ejecutando ciclo NIOS');
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error ejecutando ciclo NIOS');
    } finally {
      setRunningCycle(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-7xl mx-auto text-slate-500">Cargando Centro de Comando…</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-7xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <p className="font-semibold">No pude cargar el Centro de Comando.</p>
          <p className="text-sm mt-1">{error || 'Sin datos'}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700">
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const { estadoGeneral, summary, jobs, incidents, pendingActions, learnings, content, nios } = data;
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const runningJobs = jobs.filter((j) => j.status === 'running');
  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const failedJobs = jobs.filter((j) => j.status === 'failed');
  const activeIncidents = incidents.filter((i) => i.status === 'active' || i.status === 'monitoring');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
  const recentCompletedJobs = completedJobs.slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-50">
      {newActivity && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          🔔 El Departamento acaba de completar un trabajo.
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <header>
          <div className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">Centro de Comando</div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-1">🤖 NIOS — Centro de Comando</h1>
          <p className="text-xl text-slate-700 mt-3">
            <span className="font-semibold">{data.greeting}</span> {data.nios?.lastRunAt ? `Ya trabajé desde tu última visita. Última recopilación: ${fmtAgo(nios?.lastRunAt)}.` : 'Ya trabajé desde tu última visita.'}
          </p>
          <p className="text-xs text-slate-400 mt-2">Actualizado: {fmtDate(data.generatedAt)}</p>
        </header>

        {/* Estado general */}
        <Card title="Estado general" emoji="🌡️" link="/admin/nios" linkLabel="Ir a NIOS →">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <EstadoPill dot={estadoGeneral.dot} label={estadoGeneral.label} sub="sistema operativo" />
            <div>
              <div className="text-2xl font-bold text-slate-900">{fmtAgo(estadoGeneral.lastWorkAt)}</div>
              <div className="text-sm text-slate-500">Último trabajo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{fmtAgo(estadoGeneral.lastHeartbeatAt)}</div>
              <div className="text-sm text-slate-500">Último heartbeat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{n(estadoGeneral.workDone24h)}</div>
              <div className="text-sm text-slate-500">trabajos 24h</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-700">{n(estadoGeneral.activeIncidents)}</div>
              <div className="text-sm text-slate-500">incidentes activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700">{n(estadoGeneral.pendingApprovals)}</div>
              <div className="text-sm text-slate-500">aprobaciones pendientes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{n(summary?.activeJobs ?? 0)}</div>
              <div className="text-sm text-slate-500">trabajos activos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-700">{n(summary?.failedJobs ?? 0)}</div>
              <div className="text-sm text-slate-500">trabajos fallidos</div>
            </div>
          </div>
        </Card>

        {/* Ciclo operativo NIOS */}
        <Card title="Ciclo operativo NIOS" emoji="🧠">
          <div className="mb-4">
            <button
              onClick={runNiosLoop}
              disabled={runningCycle}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {runningCycle ? '⏳ Ejecutando ciclo…' : '▶ Ejecutar ciclo NIOS ahora'}
            </button>
            {runningCycle && <p className="text-xs text-slate-500 mt-2">El ciclo puede tardar hasta 60s. Se refrescará automáticamente.</p>}
          </div>
          {data.niosLoop?.record ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-3xl font-bold text-indigo-700">{data.niosLoop.autonomyScore}<span className="text-base text-slate-500 font-medium">/{data.niosLoop.autonomyMax}</span></div>
                <div className="text-sm text-slate-600">puntos de autonomía del ciclo OODA</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.niosLoop.autonomyReport).map(([stage, status]) => (
                  <span key={stage} className={`text-xs px-2 py-1 rounded-full border font-medium ${status === 'REAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {stage}: {status === 'REAL' ? '✅' : status === 'PARTIAL' ? '⚠️' : '—'}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{data.niosLoop.record.summary}</p>
              {data.niosLoop.record.pendingHuman > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  🟡 {data.niosLoop.record.pendingHuman} acción{data.niosLoop.record.pendingHuman === 1 ? '' : 'es'} pendiente{data.niosLoop.record.pendingHuman === 1 ? '' : 's'} de aprobación humana.
                </div>
              )}
              {data.niosLoop.record.failedRepairs > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
                  🔴 {data.niosLoop.record.failedRepairs} reparación{data.niosLoop.record.failedRepairs === 1 ? '' : 'es'} fallida{data.niosLoop.record.failedRepairs === 1 ? '' : 's'}.
                </div>
              )}
              {data.niosLoop.record.observations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Observaciones</h3>
                  <ul className="space-y-2 text-sm">
                    {data.niosLoop.record.observations.slice(0, 5).map((o, i) => (
                      <li key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="font-semibold text-slate-800">{o.source}</span> — {o.note} <span className="text-xs text-slate-400 ml-1">({o.status})</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {data.niosLoop.record.decisions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Decisiones</h3>
                  <ul className="space-y-2 text-sm">
                    {data.niosLoop.record.decisions.slice(0, 5).map((d, i) => (
                      <li key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="font-semibold text-slate-800">{d.source}</span> — {d.problem} <span className="text-xs text-slate-400 ml-1">({d.decision})</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {data.niosLoop.record.learnings.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Aprendizajes</h3>
                  <ul className="space-y-2 text-sm">
                    {data.niosLoop.record.learnings.slice(0, 5).map((l, i) => (
                      <li key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">{l.impact} <span className="text-xs text-slate-400 ml-1">{fmtAgo(l.timestamp)}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">NIOS aún no ha completado un ciclo operativo. El próximo cron o una ejecución manual lo generará.</p>
          )}
        </Card>

        {/* Mientras no estabas */}
        <Card title="Mientras no estabas" emoji="☕">
          {summary ? (
            <div className="space-y-3">
              <p className="text-slate-700">
                <strong>Mientras no estabas, el Departamento trabajó por Nicaragua Informate.</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500">🔍 Trabajos revisados</div>
                  <div className="text-xl font-bold text-slate-900">{n(summary.workDone24h)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500">📰 Artículos analizados</div>
                  <div className="text-xl font-bold text-slate-900">{n(content?.total ?? nios?.articlesCount ?? 0)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500">🛠️ Problemas detectados</div>
                  <div className="text-xl font-bold text-slate-900">{n(summary.problemsDetected)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500">✅ Resueltos</div>
                  <div className="text-xl font-bold text-emerald-700">{n(summary.problemsResolved)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500">📈 Oportunidades encontradas</div>
                  <div className="text-xl font-bold text-slate-900">{n(summary.opportunitiesFound)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-slate-500">🧠 Aprendizajes registrados</div>
                  <div className="text-xl font-bold text-slate-900">{n(summary.learnings)}</div>
                </div>
              </div>
              {summary.recentItems.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                  {summary.recentItems.slice(0, 8).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-slate-500">Aún no hay datos del Departamento. El próximo ciclo los generará.</p>
          )}
        </Card>

        {/* Críticos */}
        {activeIncidents.length > 0 && (
          <Card title="Atención" emoji="🔴">
            <div className="space-y-3">
              {activeIncidents.map((inc) => (
                <div key={inc.id || inc.title} className={`p-4 rounded-xl border ${inc.severity === 'critical' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="text-sm font-semibold uppercase">{inc.severity === 'critical' ? '🔴 CRÍTICO' : '🟡 IMPORTANTE'}</div>
                  <div className="font-medium text-slate-900 mt-1">{inc.title}</div>
                  <div className="text-sm text-slate-600 mt-1">Detectado: {fmtDate(inc.detectedAt)}</div>
                  {inc.diagnosis && <div className="text-sm text-slate-600 mt-1"><strong>Diagnóstico:</strong> {inc.diagnosis}</div>}
                  <div className="text-sm font-medium mt-2 text-amber-800">Estado: {inc.status === 'monitoring' ? 'INVESTIGANDO' : 'ACTIVO'}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Lo que resolví */}
        <Card title="Lo que resolví" emoji="🛠️" link="/admin/nios/reparaciones" linkLabel="Reparaciones →">
          {resolvedIncidents.length > 0 ? (
            <div className="space-y-3">
              {resolvedIncidents.slice(0, 5).map((inc) => (
                <div key={inc.id || inc.title} className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-sm font-semibold text-emerald-800">🟢 RESUELTO · {inc.title}</div>
                  <div className="text-sm text-slate-600 mt-1">Detectado: {fmtDate(inc.detectedAt)} · Resuelto: {fmtDate(inc.resolvedAt)}</div>
                  {inc.diagnosis && <div className="text-sm text-slate-600 mt-1"><strong>Diagnóstico:</strong> {inc.diagnosis}</div>}
                  {inc.correction && <div className="text-sm text-slate-600 mt-1"><strong>Corrección:</strong> {inc.correction}</div>}
                  {inc.verification && <div className="text-sm text-slate-600 mt-1"><strong>Verificación:</strong> {inc.verification}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No hay incidentes resueltos recientes visibles.</p>
          )}
        </Card>

        {/* Lo que necesito de ti */}
        <Card title="Necesito de ti" emoji="🟡" link="/admin/nios/recovery" linkLabel="Acciones →">
          {pendingActions.length > 0 ? (
            <div className="space-y-3">
              {pendingActions.slice(0, 5).map((a) => (
                <div key={a.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="font-medium text-slate-900">{a.title}</div>
                  <p className="text-sm text-slate-700 mt-1">{a.proposal}</p>
                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-2">
                    <span className="bg-white px-2 py-1 rounded-full border border-amber-100">Impacto: {a.impact}</span>
                    <span className="bg-white px-2 py-1 rounded-full border border-amber-100">Confianza: {a.confidence}</span>
                    <span className="bg-white px-2 py-1 rounded-full border border-amber-100">Propuesto: {fmtAgo(a.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No hay acciones que requieran tu aprobación ahora.</p>
          )}
        </Card>

        {/* Plan de hoy */}
        <Card title="Plan de hoy" emoji="🎯" link="/admin/nios" linkLabel="NIOS →">
          {nios?.growth && nios.growth.plan.length > 0 ? (
            <div className="space-y-3">
              <p className="text-slate-700 text-sm">{nios.growth.speaks}</p>
              {nios.growth.plan.slice(0, 5).map((item) => (
                <div key={item.rank} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">#{item.rank} · {item.title}</div>
                      <p className="text-sm text-slate-600 mt-1">{item.explanation}</p>
                    </div>
                    <span className={`flex-none text-xs px-2 py-1 rounded-full ${item.requiresApproval ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.requiresApproval ? 'Requiere aprobación' : 'Auto'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-2">
                    <span className="bg-white px-2 py-0.5 rounded-full border">Impacto: {item.impact}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full border">Confianza: {item.confidence}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full border">Esfuerzo: {item.effort}</span>
                    <span className="bg-white px-2 py-0.5 rounded-full border">Métrica: {item.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">{nios?.growth?.summary || 'Hoy no hay un plan de crecimiento claro con los datos actuales.'}</p>
          )}
        </Card>

        {/* Salud del contenido */}
        <Card title="Salud del contenido" emoji="📰" link="/admin/meni" linkLabel="MENI →">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">Notas revisadas</div>
              <div className="text-xl font-bold text-slate-900">{n(content?.total ?? nios?.articlesCount ?? 0)}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="text-xs text-emerald-700 uppercase">Aprobadas</div>
              <div className="text-xl font-bold text-emerald-700">{n(content?.approved ?? 0)}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-xs text-amber-700 uppercase">Requieren revisión</div>
              <div className="text-xl font-bold text-amber-700">{n(content?.pendingReview ?? 0)}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="text-xs text-blue-700 uppercase">Con oportunidades</div>
              <div className="text-xl font-bold text-blue-700">{n(content?.withOpportunities ?? nios?.contentOpportunity?.opportunities.length ?? 0)}</div>
            </div>
          </div>
          {nios?.meniLearning?.summary && (
            <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg">{nios.meniLearning.summary}</p>
          )}
        </Card>

        {/* Crecimiento */}
        <Card title="Crecimiento" emoji="📈" link="/admin/nios/google-intelligence" linkLabel="Google Intelligence →">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">Impresiones (GSC)</div>
              <div className="text-xl font-bold text-slate-900">{n(nios?.gsc?.totalImpressions)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">Clics (GSC)</div>
              <div className="text-xl font-bold text-slate-900">{n(nios?.gsc?.totalClicks)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">CTR promedio</div>
              <div className="text-xl font-bold text-slate-900">{pct(nios?.google?.avgCtr)}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase">Posición promedio</div>
              <div className="text-xl font-bold text-slate-900">{nios?.google?.avgPosition ? nios.google.avgPosition.toFixed(1) : '—'}</div>
            </div>
          </div>
          {nios?.google?.topQueries && nios.google.topQueries.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Top queries</h3>
              <ul className="text-sm space-y-1">
                {nios.google.topQueries.slice(0, 5).map((q) => (
                  <li key={q.query} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="truncate max-w-[60%]">{q.query}</span>
                    <span className="text-slate-500">{n(q.impressions)} imp · {n(q.clicks)} clics</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nios?.topMovingArticles && nios.topMovingArticles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Artículos con momentum</h3>
              <ul className="text-sm space-y-1">
                {nios.topMovingArticles.slice(0, 5).map((a) => (
                  <li key={a.slug} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="truncate max-w-[70%]">{a.titulo || a.slug}</span>
                    <span className="text-emerald-600 font-medium">+{a.momentum.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Negocio */}
        <Card title="Negocio" emoji="💰" link="/admin/nios/adsense-recovery" linkLabel="AdSense →">
          {nios?.adsense ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase">Listo para re-aplicar</div>
                  <div className="text-xl font-bold text-slate-900">{nios.adsense.readyToReapply === 'yes' ? 'Sí' : nios.adsense.readyToReapply === 'maybe' ? 'Quizás' : 'No'}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase">URLs afectando</div>
                  <div className="text-xl font-bold text-slate-900">{n(nios.adsense.topAffectingUrls.length)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xs text-slate-500 uppercase">AdSense Trust</div>
                  <div className="text-xl font-bold text-slate-900">{nios.adsense.trustCheck ? Math.round(nios.adsense.trustCheck.adSenseTrustScore) : '—'}/100</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">{nios.adsense.likelyRejectionReason}</p>
            </div>
          ) : (
            <p className="text-slate-500">Todavía no tengo datos suficientes para atribuir ingresos por artículo.</p>
          )}
        </Card>

        {/* Lo que estoy haciendo ahora */}
        <Card title="Lo que estoy haciendo ahora" emoji="🤖">
          {runningJobs.length > 0 || pendingJobs.length > 0 ? (
            <div className="space-y-2">
              {runningJobs.slice(0, 6).map((j) => (
                <div key={j.jobId} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                  <span>🟡</span>
                  <span className="font-medium uppercase w-32 shrink-0">{j.type}</span>
                  <span className="text-slate-600">RUNNING</span>
                  <span className="ml-auto text-slate-400 text-xs">{fmtAgo(j.startedAt || j.createdAt)}</span>
                </div>
              ))}
              {pendingJobs.slice(0, 6).map((j) => (
                <div key={j.jobId} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-500">
                  <span>⏳</span>
                  <span className="font-medium uppercase w-32 shrink-0">{j.type}</span>
                  <span>PENDING</span>
                  <span className="ml-auto text-xs">{fmtAgo(j.createdAt)}</span>
                </div>
              ))}
              {failedJobs.slice(0, 3).map((j) => (
                <div key={j.jobId} className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  <span>🔴</span>
                  <span className="font-medium uppercase w-32 shrink-0">{j.type}</span>
                  <span>FAILED</span>
                  <span className="ml-auto text-xs truncate max-w-[40%]">{j.error}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No hay trabajos activos en este momento. El Departamento espera el próximo ciclo.</p>
          )}
        </Card>

        {/* Actividad */}
        <Card title="Actividad del departamento" emoji="🕒">
          {recentCompletedJobs.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {recentCompletedJobs.slice(0, 12).map((j) => (
                <li key={j.jobId} className="flex items-start gap-3 py-2 border-b border-slate-100">
                  <span className="text-emerald-600">🟢</span>
                  <span className="font-medium uppercase w-32 shrink-0">{j.type}</span>
                  <span className="text-slate-600">completado</span>
                  <span className="ml-auto text-slate-400 text-xs whitespace-nowrap">{fmtAgo(j.completedAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No hay trabajos completados recientes.</p>
          )}
        </Card>

        {/* Memoria */}
        <Card title="Lo que aprendí" emoji="🧠">
          {learnings.length > 0 ? (
            <ul className="space-y-3 text-sm text-slate-700">
              {learnings.slice(0, 6).map((l) => (
                <li key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {l.text}
                  <span className="block text-xs text-slate-400 mt-1">{fmtDate(l.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Aún no hay aprendizajes registrados con evidencia.</p>
          )}
        </Card>

        {/* Salud del departamento */}
        <Card title="Salud del departamento" emoji="🏢">
          {summary?.componentStatus && Object.keys(summary.componentStatus).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(summary.componentStatus).map(([component, status]) => (
                    <tr key={component} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 capitalize">{component.replace(/-/g, ' ')}</td>
                      <td className="py-2"><span className="mr-2">{STATUS_EMOJI[status] || '⚪'}</span>{status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500">El Departamento aún no ha reportado estado por componente.</p>
          )}
        </Card>

        <p className="text-center text-xs text-slate-400 pt-4">
          Se actualiza automáticamente cada 30 segundos ·
          <button onClick={fetchData} className="ml-1 text-blue-600 hover:underline">Actualizar ahora</button>
        </p>
      </div>
    </main>
  );
}
