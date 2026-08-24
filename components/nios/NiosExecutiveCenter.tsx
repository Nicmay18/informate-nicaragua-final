'use client';

import type { NiosExecutiveData } from '@/lib/nios/executive-center';

type Status = 'ok' | 'warning' | 'critical' | 'missing';

function statusFromScore(score: number, ok = 90, warn = 80): Status {
  if (score >= ok) return 'ok';
  if (score >= warn) return 'warning';
  return 'critical';
}

const STATUS_DOT: Record<Status, string> = {
  ok: '🟢',
  warning: '🟡',
  critical: '🔴',
  missing: '⚪',
};

const STATUS_BG: Record<Status, string> = {
  ok: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  critical: 'bg-rose-50 border-rose-200',
  missing: 'bg-slate-50 border-slate-200',
};

const STATUS_TEXT: Record<Status, string> = {
  ok: 'text-emerald-700',
  warning: 'text-amber-700',
  critical: 'text-rose-700',
  missing: 'text-slate-500',
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-NI', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function number(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-NI');
}

function pct(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(1)}%`;
}

function Metric({ label, value, status }: { label: string; value: string; status?: Status }) {
  const s = status || 'missing';
  return (
    <div className={`rounded-xl border p-4 ${STATUS_BG[s]}`}>
      <div className={`text-2xl font-bold ${STATUS_TEXT[s]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function Card({ title, icon, children, link, linkLabel }: { title: string; icon?: string; children: React.ReactNode; link?: string; linkLabel?: string }) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{icon} {title}</h2>
        {link && <a href={link} className="text-xs text-blue-600 hover:underline">{linkLabel || 'Ver detalle →'}</a>}
      </div>
      {children}
    </section>
  );
}

function EmptyData({ label }: { label: string }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}

const NAV_LINKS = [
  { href: '/admin/nios', label: 'Overview', icon: '🧠' },
  { href: '/admin/nios/google-intelligence', label: 'Google Intelligence', icon: '🔎' },
  { href: '/admin/nios/adsense-recovery', label: 'AdSense Recovery', icon: '💰' },
  { href: '/admin/nios/adsense-report', label: 'AdSense Report', icon: '📊' },
  { href: '/admin/nios/recovery', label: 'Recovery Queue', icon: '🔄' },
  { href: '/admin/nios/weekly', label: 'Weekly Intelligence', icon: '📋' },
  { href: '/panel/nios', label: 'NIOS Panel', icon: '📰' },
  { href: '/panel/nios/performance', label: 'Performance', icon: '⚙️' },
  { href: '/panel/nios/editorial-strategy', label: 'Editorial Strategy', icon: '✍️' },
];

export default function NiosExecutiveCenter({ data }: { data: NiosExecutiveData }) {
  const {
    snapshot, google, trust, adsense, traffic, learningPatterns,
    reliability, weekly, alerts, telemetry, articlesCount, ttlStatus,
    gsc, ga4, contentOpportunity, categoryIntelligence, editorCEOReport,
    snapshotHistory,
  } = data;

  const health = telemetry?.health;
  const report = telemetry?.report;
  const healthStatus = health ? statusFromScore(health.score) : 'missing';
  const reliabilityStatus = reliability ? statusFromScore(reliability.reliabilityScore) : 'missing';
  const pipelineOk = reliability?.pipeline.success ?? null;
  const pipelineStatus: Status = pipelineOk === null ? 'missing' : pipelineOk ? 'ok' : 'critical';

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const alertStatus: Status = criticalAlerts.length > 0 ? 'critical' : alerts.length > 0 ? 'warning' : 'ok';

  const trafficDailyPct = reliability?.trafficMigration.trafficDailyCoverage ?? null;
  const fallbackReads = reliability?.trafficMigration.fallbackReads ?? 0;

  const topSlow = report?.modules
    ? [...report.modules].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5)
    : [];
  const failedModules = report?.modules?.filter((m) => m.status === 'error') || [];

  const discoverImpressions = gsc?.discover?.reduce((s, r) => s + r.impressions, 0) ?? 0;
  const discoverClicks = gsc?.discover?.reduce((s, r) => s + r.clicks, 0) ?? 0;
  const newsImpressions = gsc?.googleNews?.reduce((s, r) => s + r.impressions, 0) ?? 0;
  const newsClicks = gsc?.googleNews?.reduce((s, r) => s + r.clicks, 0) ?? 0;

  const fusedArticles = snapshot?.articlesFused ?? [];
  const meniScores = fusedArticles.map(a => a.scoreMeni).filter((s): s is number => s !== null) ?? [];
  const meniAvg = meniScores.length > 0
    ? Math.round(meniScores.reduce((s, v) => s + v, 0) / meniScores.length)
    : null;
  const trustAvg = trust?.averageGoogleTrustScore ? Math.round(trust.averageGoogleTrustScore) : null;
  const gscMatched = fusedArticles.filter(a => a.hasGscData).length;

  const attentionItems: string[] = [];
  if (criticalAlerts.length > 0) attentionItems.push(`${criticalAlerts.length} alerta(s) crítica(s) activa(s)`);
  if (pipelineOk === false) attentionItems.push('Última ejecución del pipeline falló');
  if (fallbackReads > 0) attentionItems.push(`${fallbackReads} fallback reads en tráfico`);
  if (health && health.score < 80) attentionItems.push(`Health Score bajo: ${health.score}/100`);
  if (trust && trust.thinContentCount > 0) attentionItems.push(`${trust.thinContentCount} artículos thin content`);
  if (adsense && adsense.readyToReapply === 'no') attentionItems.push('AdSense no listo para re-aplicar');
  if (reliability && reliability.pipeline.failedModules.length > 0) attentionItems.push(`${reliability.pipeline.failedModules.length} módulos con fallos`);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex">
        {/* Sidebar navigation */}
        <nav className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-slate-200 p-4 sticky top-0 self-start">
          <a href="/admin/nios" className="text-lg font-bold text-slate-900 mb-6">NIOS</a>
          <div className="space-y-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </a>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100">
            <a href="/admin" className="text-xs text-slate-400 hover:text-slate-600">← Volver al admin</a>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 p-6 md:p-10 max-w-6xl">
          <div className="space-y-6">
            {/* Command Center Header */}
            <header>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">NIOS — Intelligence Command Center</h1>
              <p className="text-slate-500 mt-1">
                Última recopilación: {formatDate(snapshot?.collectedAt)} · Snapshot: {snapshot?.date || '—'} · {articlesCount} artículos
              </p>
            </header>

            {/* Status banner */}
            <section className={`rounded-2xl border-2 p-6 ${STATUS_BG[healthStatus]}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Health Score</div>
                  <div className={`text-2xl font-bold ${STATUS_TEXT[healthStatus]}`}>
                    {STATUS_DOT[healthStatus]} {health ? `${health.score}/100` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Pipeline</div>
                  <div className={`text-2xl font-bold ${STATUS_TEXT[pipelineStatus]}`}>
                    {STATUS_DOT[pipelineStatus]} {pipelineOk === null ? '—' : pipelineOk ? 'OK' : 'FALLÓ'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Última ejecución</div>
                  <div className="text-sm font-medium text-slate-700">{formatDate(telemetry?.date || snapshot?.date)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Reliability 7d</div>
                  <div className={`text-2xl font-bold ${STATUS_TEXT[reliabilityStatus]}`}>
                    {reliability ? `${reliability.reliabilityScore}%` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Traffic Daily</div>
                  <div className={`text-2xl font-bold ${trafficDailyPct !== null ? (trafficDailyPct >= 95 ? STATUS_TEXT.ok : STATUS_TEXT.warning) : STATUS_TEXT.missing}`}>
                    {trafficDailyPct !== null ? `${trafficDailyPct}%` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Fallback</div>
                  <div className={`text-2xl font-bold ${fallbackReads > 0 ? STATUS_TEXT.critical : STATUS_TEXT.ok}`}>
                    {fallbackReads > 0 ? `${fallbackReads}` : '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">Alertas críticas</div>
                  <div className={`text-2xl font-bold ${STATUS_TEXT[alertStatus]}`}>
                    {STATUS_DOT[alertStatus]} {criticalAlerts.length}
                  </div>
                </div>
              </div>
            </section>

            {/* Qué requiere atención hoy */}
            {attentionItems.length > 0 && (
              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-widest mb-3">⚠️ Qué requiere atención hoy</h2>
                <ul className="space-y-2">
                  {attentionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                      <span className="flex-none">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Google Intelligence */}
            <Card title="Google Intelligence" icon="🔎" link="/admin/nios/google-intelligence" linkLabel="Ver análisis completo →">
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric
                    label="GSC"
                    value={gsc?.status ?? 'NO_DATA'}
                    status={gsc?.status === 'REAL' ? 'ok' : gsc?.status === 'ACCESS_BLOCKED' || gsc?.status === 'CONFIG_REQUIRED' || gsc?.status === 'INVALID_CONFIGURATION' ? 'critical' : 'warning'}
                  />
                  <Metric
                    label="GA4"
                    value={ga4?.status ?? 'NO_DATA'}
                    status={ga4?.status === 'REAL' ? 'ok' : ga4?.status === 'ACCESS_BLOCKED' || ga4?.status === 'CONFIG_REQUIRED' || ga4?.status === 'INVALID_CONFIGURATION' ? 'critical' : 'warning'}
                  />
                  <Metric
                    label="Matching GSC/artículo"
                    value={`${gscMatched} / ${articlesCount}`}
                    status={gsc?.status === 'REAL' ? 'ok' : 'missing'}
                  />
                  {google?.hasData && (
                    <>
                      <Metric label="Impresiones (Search)" value={number(gsc?.totalImpressions)} status="ok" />
                      <Metric label="Clics (Search)" value={number(gsc?.totalClicks)} status="ok" />
                      <Metric label="CTR promedio" value={pct(google?.avgCtr)} status={(google?.avgCtr ?? 0) >= 3 ? 'ok' : 'warning'} />
                      <Metric label="Posición promedio" value={(Math.round((google?.avgPosition ?? 0) * 10) / 10).toString()} status={(google?.avgPosition ?? 999) <= 20 ? 'ok' : 'warning'} />
                    </>
                  )}
                </div>
                {gsc?.status === 'REAL' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Discover impresiones" value={number(discoverImpressions)} status={discoverImpressions > 0 ? 'ok' : 'missing'} />
                    <Metric label="Discover clics" value={number(discoverClicks)} status={discoverClicks > 0 ? 'ok' : 'missing'} />
                    <Metric label="News impresiones" value={number(newsImpressions)} status={newsImpressions > 0 ? 'ok' : 'missing'} />
                    <Metric label="News clics" value={number(newsClicks)} status={newsClicks > 0 ? 'ok' : 'missing'} />
                  </div>
                )}
                {gsc?.status !== 'REAL' && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <strong>GSC:</strong> {gsc?.status ?? 'NO_DATA'}. {gsc?.errorMessage || 'Datos de propiedad pendientes o matching no disponible.'}
                  </p>
                )}
                {ga4?.status === 'REAL' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Usuarios GA4" value={number(ga4.totalUsers)} status="ok" />
                    <Metric label="Sesiones" value={number(ga4.totalSessions)} status="ok" />
                    <Metric label="Pageviews" value={number(ga4.totalPageviews)} status="ok" />
                    <Metric label="Engagement" value={`${Math.round(ga4.averageEngagementTimeSec)}s`} status="ok" />
                  </div>
                )}
                {ga4?.status !== 'REAL' && ga4 && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    <strong>GA4:</strong> {ga4.status}. {ga4.errorMessage || 'Configuración o permisos pendientes.'}
                  </p>
                )}
                {google?.topQueries && google.topQueries.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Top queries</h3>
                    <ul className="text-sm space-y-1">
                      {google.topQueries.slice(0, 5).map((q) => (
                        <li key={q.query} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="truncate max-w-[60%]">{q.query}</span>
                          <span className="text-slate-500">{number(q.impressions)} imp · {number(q.clicks)} clics</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>

            {/* NIOS Trust Estimate */}
            <Card title="NIOS Trust Estimate" icon="🛡️" link="/admin/nios/google-intelligence" linkLabel="Ver Trust completo →">
              {trust ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="NIOS Trust Estimate" value={`${Math.round(trust.averageGoogleTrustScore)}/100`} status={statusFromScore(trust.averageGoogleTrustScore, 70, 50)} />
                    <Metric label="Thin content" value={number(trust.thinContentCount)} status={trust.thinContentCount > 0 ? 'warning' : 'ok'} />
                    <Metric label="Riesgo duplicado" value={number(trust.duplicateRiskCount)} status={trust.duplicateRiskCount > 0 ? 'warning' : 'ok'} />
                    <Metric label="Sin autor" value={number(trust.articlesWithoutAuthor)} status={trust.articlesWithoutAuthor > 0 ? 'warning' : 'ok'} />
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{trust.summary}</p>
                </div>
              ) : (
                <EmptyData label="Sin datos de Google Trust disponibles." />
              )}
            </Card>

            {/* AdSense Recovery */}
            <Card title="AdSense Recovery" icon="💰" link="/admin/nios/adsense-recovery" linkLabel="Ver recuperación →">
              {adsense ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric
                      label="Listo para re-aplicar"
                      value={adsense.readyToReapply === 'yes' ? 'Sí' : adsense.readyToReapply === 'maybe' ? 'Quizás' : 'No'}
                      status={adsense.readyToReapply === 'yes' ? 'ok' : adsense.readyToReapply === 'maybe' ? 'warning' : 'critical'}
                    />
                    <Metric label="URLs afectando" value={number(adsense.topAffectingUrls.length)} status={adsense.topAffectingUrls.length > 0 ? 'warning' : 'ok'} />
                    <Metric label="Artículos en recuperación" value={number(adsense.contentRecovery?.articles?.length ?? 0)} />
                    <Metric label="AdSense Trust" value={`${Math.round(adsense.trustCheck?.adSenseTrustScore || 0)}/100`} status={statusFromScore(adsense.trustCheck?.adSenseTrustScore || 0, 70, 50)} />
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong className="text-slate-700">Hipótesis de recuperación:</strong> <span className="text-slate-600">{adsense.likelyRejectionReason}</span></p>
                    <p><strong className="text-slate-700">Nivel de evidencia:</strong> <span className="text-slate-600">Hipótesis basada en datos internos · no constituye rechazo oficial de Google</span></p>
                  </div>
                  {adsense.topAffectingUrls.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Artículos prioritarios</h3>
                      <ul className="text-sm space-y-1">
                        {adsense.topAffectingUrls.slice(0, 5).map((a, i) => (
                          <li key={i} className="flex justify-between py-1 border-b border-slate-100">
                            <span className="truncate max-w-[60%]">{a.slug}</span>
                            <span className={`text-xs font-medium ${a.status === 'red' ? 'text-rose-600' : a.status === 'yellow' ? 'text-amber-600' : 'text-emerald-600'}`}>{a.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <a href="/admin/nios/adsense-recovery" className="text-xs text-blue-600 hover:underline">Recuperación →</a>
                    <a href="/admin/nios/adsense-report" className="text-xs text-blue-600 hover:underline">Reporte completo →</a>
                  </div>
                </div>
              ) : (
                <EmptyData label="Sin reporte de AdSense disponible." />
              )}
            </Card>

            {/* Editorial */}
            <Card title="Editorial" icon="✍️" link="/panel/nios/editorial-strategy" linkLabel="Ver estrategia editorial →">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="Artículos analizados" value={number(articlesCount)} status="ok" />
                <Metric label="MENI promedio" value={meniAvg ? `${meniAvg}/100` : '—'} status={meniAvg ? statusFromScore(meniAvg) : 'missing'} />
                <Metric label="Trust promedio" value={trustAvg ? `${trustAvg}/100` : '—'} status={trustAvg ? statusFromScore(trustAvg, 70, 50) : 'missing'} />
                <Metric label="Oportunidades" value={contentOpportunity ? number(contentOpportunity.opportunities.length) : '—'} status={contentOpportunity && contentOpportunity.opportunities.length > 0 ? 'ok' : 'missing'} />
              </div>
              {editorCEOReport && (
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-3">{editorCEOReport.summary}</p>
              )}
              {categoryIntelligence && categoryIntelligence.categories.length > 0 && (
                <div className="mt-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Categorías</h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryIntelligence.categories.slice(0, 6).map((c) => (
                      <span key={c.categoria} className={`text-xs px-2 py-1 rounded-full ${c.opportunity === 'aumentar' ? 'bg-emerald-100 text-emerald-700' : c.opportunity === 'limitar' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {c.categoria} · {c.opportunity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Traffic Intelligence */}
            <Card title="Traffic Intelligence" icon="📈">
              {traffic ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Visitas 7 días" value={number(Object.values(traffic.dailyGrowth).reduce((a, b) => a + b, 0))} status="ok" />
                    <Metric label="Artículos top" value={number(traffic.topArticles.length)} status="ok" />
                    <Metric label="Fuentes" value={Object.keys(traffic.topSources).length.toString()} status="ok" />
                    <Metric label="Coverage diario" value={trafficDailyPct !== null ? `${trafficDailyPct}%` : '—'} status={trafficDailyPct !== null ? (trafficDailyPct >= 95 ? 'ok' : 'warning') : 'missing'} />
                  </div>
                  {traffic.topArticles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Top artículos</h3>
                      <ul className="text-sm space-y-1">
                        {traffic.topArticles.slice(0, 5).map((a, i) => (
                          <li key={i} className="flex justify-between py-1 border-b border-slate-100">
                            <span className="truncate max-w-[60%]">{a.slug}</span>
                            <span className="font-medium">{number(a.views)} visitas</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyData label="Sin datos de tráfico disponibles." />
              )}
            </Card>

            {/* Performance */}
            <Card title="Performance" icon="⚙️" link="/panel/nios/performance" linkLabel="Ver performance completo →">
              {report ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Duración pipeline" value={`${(report.totalDuration / 1000).toFixed(1)}s`} status={report.totalDuration < 30000 ? 'ok' : 'warning'} />
                    <Metric label="Lecturas Firestore" value={number(report.firestore.reads)} status="ok" />
                    <Metric label="Escrituras Firestore" value={number(report.firestore.writes)} status="ok" />
                    <Metric label="Costo est./mes" value={`$${report.cost?.estimatedMonthlyCostUSD ?? 0}`} status="ok" />
                  </div>
                  {topSlow.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Módulos más lentos</h3>
                      <ul className="text-sm space-y-1">
                        {topSlow.map((m) => (
                          <li key={m.name} className="flex justify-between py-1 border-b border-slate-100">
                            <span>{m.name}</span>
                            <span className="font-medium">{number(m.durationMs)} ms</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {failedModules.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-rose-500 uppercase mb-2">Módulos con error</h3>
                      <ul className="text-sm space-y-1 text-rose-700">
                        {failedModules.map((m) => (
                          <li key={m.name}>✗ {m.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyData label="Sin datos de performance disponibles." />
              )}
            </Card>

            {/* Reliability */}
            <Card title="Reliability" icon="🟢" link="/panel/nios/performance" linkLabel="Ver detalle →">
              {reliability ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Reliability Score" value={`${reliability.reliabilityScore}/100`} status={reliabilityStatus} />
                    <Metric label="Tendencia 7 días" value={reliability.pipeline.weeklyTrend} status="ok" />
                    <Metric label="Módulos con fallos" value={number(reliability.pipeline.failedModules.length)} status={reliability.pipeline.failedModules.length > 0 ? 'critical' : 'ok'} />
                    <Metric label="Crecimiento Firestore" value={reliability.firestore.collectionGrowth} status={reliability.firestore.collectionGrowth === 'normal' ? 'ok' : 'warning'} />
                  </div>
                  {reliability.warnings.length > 0 && (
                    <ul className="text-sm space-y-1 text-amber-700">
                      {reliability.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
                    </ul>
                  )}
                </div>
              ) : (
                <EmptyData label="Sin datos de reliability disponibles." />
              )}
            </Card>

            {/* Alertas */}
            <Card title="Últimas Alertas" icon="🚨">
              {alerts.length > 0 ? (
                <ul className="space-y-2">
                  {alerts.slice(0, 10).map((a, i) => (
                    <li key={i} className={`text-sm p-3 rounded-lg ${a.severity === 'critical' ? 'bg-rose-50 text-rose-800' : a.severity === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                      <span className="font-semibold uppercase text-xs">[{a.severity}] {a.category}</span>
                      <div>{a.message}</div>
                      <div className="text-xs opacity-60">{formatDate(a.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-600">🟢 No hay alertas activas.</p>
              )}
            </Card>

            {/* Google Learning */}
            <Card title="Google Learning" icon="🧠">
              {learningPatterns.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="Patrones totales" value={number(learningPatterns.length)} status="ok" />
                    <Metric label="MENI correcto" value={number(learningPatterns.filter((p) => p.pattern === 'meni_correct').length)} status="ok" />
                    <Metric label="Brecha MENI-GSC (hipótesis)" value={number(learningPatterns.filter((p) => p.pattern === 'meni_gsc_gap_hypothesis').length)} status="warning" />
                    <Metric label="MENI subestima" value={number(learningPatterns.filter((p) => p.pattern === 'meni_underestimates').length)} status="warning" />
                  </div>
                  <p className="text-xs text-slate-500">Observación: no se ajusta automáticamente MENI. Los patrones son de solo lectura.</p>
                </div>
              ) : (
                <EmptyData label="Sin patrones de aprendizaje disponibles." />
              )}
            </Card>

            {/* Weekly Intelligence */}
            <Card title="Weekly Intelligence" icon="📋" link="/admin/nios/weekly" linkLabel="Ver reporte semanal →">
              {weekly ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Metric label="Pipeline OK" value={weekly.questions.pipelineExecutedCorrectly ? 'Sí' : 'No'} status={weekly.questions.pipelineExecutedCorrectly ? 'ok' : 'critical'} />
                    <Metric label="Módulo más lento" value={weekly.questions.slowestModule} status="ok" />
                    <Metric label="Hubo errores" value={weekly.questions.hadErrors ? 'Sí' : 'No'} status={weekly.questions.hadErrors ? 'warning' : 'ok'} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                    <p><strong>Tráfico agregado:</strong> {weekly.questions.trafficAggregatedCorrectly ? 'Sí' : 'No'}</p>
                    <p><strong>Riesgo operacional:</strong> {weekly.questions.operationalRisk}</p>
                  </div>
                  {weekly.questions.requiresAttention.length > 0 && (
                    <>
                      <h3 className="font-semibold text-slate-700">Requiere atención:</h3>
                      <ul className="list-disc pl-5 space-y-1 text-amber-700">
                        {weekly.questions.requiresAttention.map((item: string, i: number) => <li key={i}>{item}</li>)}
                      </ul>
                    </>
                  )}
                  <p className="text-slate-500 italic">{weekly.summary}</p>
                </div>
              ) : (
                <EmptyData label="Sin reporte semanal disponible." />
              )}
            </Card>

            {/* Snapshots history */}
            <Card title="Snapshots — Histórico" icon="📊">
              {snapshotHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-2 text-xs font-semibold text-slate-400 uppercase">Fecha</th>
                        <th className="text-left p-2 text-xs font-semibold text-slate-400 uppercase">Recopilado</th>
                        <th className="text-right p-2 text-xs font-semibold text-slate-400 uppercase">Artículos</th>
                        <th className="text-center p-2 text-xs font-semibold text-slate-400 uppercase">GSC</th>
                        <th className="text-center p-2 text-xs font-semibold text-slate-400 uppercase">GA4</th>
                        <th className="text-right p-2 text-xs font-semibold text-slate-400 uppercase">Trust</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshotHistory.map((s) => (
                        <tr key={s.date} className="border-t border-slate-100">
                          <td className="p-2 font-medium">{s.date}</td>
                          <td className="p-2 text-slate-500 text-xs">{formatDate(s.collectedAt)}</td>
                          <td className="p-2 text-right">{number(s.articlesCount)}</td>
                          <td className="p-2 text-center">{s.hasGsc ? '🟢' : '⚪'}</td>
                          <td className="p-2 text-center">{s.hasGa4 ? '🟢' : '⚪'}</td>
                          <td className="p-2 text-right">{s.trustScore !== null ? `${Math.round(s.trustScore)}/100` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyData label="Sin snapshots históricos disponibles." />
              )}
            </Card>

            {/* Estado del sistema */}
            <Card title="Estado del Sistema" icon="🔧">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Última ejecución</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between"><dt className="text-slate-500">Fecha</dt><dd className="font-medium">{formatDate(telemetry?.date || snapshot?.date)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Guardado</dt><dd className="font-medium">{formatDate(telemetry?.savedAt)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Duración</dt><dd className="font-medium">{report ? `${(report.totalDuration / 1000).toFixed(1)}s` : '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Health</dt><dd className="font-medium">{health ? `${health.score}/100 (${health.level})` : '—'}</dd></div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Módulos y errores</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between"><dt className="text-slate-500">Módulos totales</dt><dd className="font-medium">{report?.modules?.length ?? '—'}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Módulos con error</dt><dd className={`font-medium ${failedModules.length > 0 ? 'text-rose-600' : ''}`}>{failedModules.length}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Errors</dt><dd className={`font-medium ${report?.errors?.length ? 'text-rose-600' : ''}`}>{report?.errors?.length ?? 0}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">TTL tráfico</dt><dd className="font-medium">{ttlStatus}</dd></div>
                  </dl>
                </div>
              </div>
              {health?.warnings && health.warnings.length > 0 && (
                <div className="mt-3">
                  <h3 className="text-xs font-semibold text-amber-500 uppercase mb-1">Warnings</h3>
                  <ul className="text-sm list-disc pl-5 text-amber-700">
                    {health.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </Card>

            {/* Costos */}
            <Card title="Costos" icon="💵">
              {report ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Metric label="Lecturas Firestore/mes" value={number(report.cost?.monthlyFirestoreReads ?? 0)} status="ok" />
                  <Metric label="Escrituras Firestore/mes" value={number(report.cost?.monthlyFirestoreWrites ?? 0)} status="ok" />
                  <Metric label="Costo Firestore est." value={`$${report.cost?.estimatedMonthlyCostUSD ?? 0}`} status="ok" />
                  <Metric label="Tráfico writes" value={number(report.traffic?.trafficLogWrites ?? 0)} status="ok" />
                </div>
              ) : (
                <EmptyData label="Sin datos de costos disponibles." />
              )}
            </Card>

            <footer className="text-xs text-slate-400 pt-4 pb-8">
              NIOS Intelligence Command Center · FASE 3.10 · Datos de solo lectura · No recalcula motores
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
