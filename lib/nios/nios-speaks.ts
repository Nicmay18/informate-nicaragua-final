/**
 * NIOS TE HABLA
 * =============
 * Convierte los datos reales del executive center en un resumen ejecutivo
 * humano, con estructura y sin inventar métricas.
 */

import type { NiosExecutiveData } from './executive-center';

export interface NiosBriefSection {
  title: string;
  icon: string;
  items: { label?: string; value: string; status?: 'ok' | 'warning' | 'alert' | 'neutral' }[];
}

export interface NiosBrief {
  generatedAt: string;
  greeting: string;
  status: 'ok' | 'warning' | 'alert';
  statusLabel: string;
  headline: string;
  sections: NiosBriefSection[];
  plan: { text: string; source: 'ceo' | 'repair' | 'human' }[];
  sources: { name: string; status: string; note: string }[];
  freshness: { ageHours: number | null; stale: boolean; note: string };
}

function statusFromVerdict(s: string): 'ok' | 'warning' | 'alert' {
  if (s === 'SALUDABLE') return 'ok';
  if (s === 'RIESGO_CRITICO') return 'alert';
  return 'warning';
}

function statusLabel(s: string): string {
  switch (s) {
    case 'SALUDABLE':
      return 'Todo en orden';
    case 'REQUIERE_ATENCION':
      return 'Requiere atención';
    case 'RIESGO_CRITICO':
      return 'Riesgo crítico';
    default:
      return 'Datos insuficientes';
  }
}

export function buildNiosBrief(data: NiosExecutiveData): NiosBrief {
  const generatedAt = new Date().toISOString();
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? 'Buenos días, Nicaragua Informate'
      : hour < 19
        ? 'Buenas tardes, Nicaragua Informate'
        : 'Buenas noches, Nicaragua Informate';

  const status = statusFromVerdict(data.ceoVerdict.status);
  const statusLabelText = statusLabel(data.ceoVerdict.status);

  const sections: NiosBriefSection[] = [];

  // 1. Tráfico
  const trafficItems: NiosBriefSection['items'] = [];
  if (data.trafficIntelligence?.hasData && data.traffic?.topArticles?.length) {
    trafficItems.push({
      label: 'Top artículos recientes',
      value: `${data.traffic.topArticles.length} artículos medidos`,
      status: 'ok',
    });
    data.traffic.topArticles.slice(0, 3).forEach((a) => {
      trafficItems.push({
        value: `${a.slug}: ${a.views ?? 0} vistas`,
        status: 'neutral',
      });
    });
  } else {
    trafficItems.push({
      value: data.trafficIntelligence?.message || 'No hay datos de tráfico confirmados aún.',
      status: 'warning',
    });
  }

  if (data.topLifetimeArticles && data.topLifetimeArticles.length > 0) {
    trafficItems.push({
      label: 'Más vistos históricos',
      value: data.topLifetimeArticles
        .slice(0, 3)
        .map((a) => `${a.titulo || a.slug} (${a.vistas ?? 0})`)
        .join(' · '),
      status: 'neutral',
    });
  }

  sections.push({ title: 'Tráfico', icon: '📈', items: trafficItems });

  // 2. Google
  const googleItems: NiosBriefSection['items'] = [];
  if (data.gsc?.status === 'REAL') {
    googleItems.push({
      label: 'Search Console',
      value: `${data.gsc.totalClicks ?? 0} clics · ${data.gsc.totalImpressions ?? 0} impresiones · CTR ${((data.gsc.avgCtr ?? 0) * 100).toFixed(1)}% · posición ${(data.gsc.avgPosition ?? 0).toFixed(1)}`,
      status: 'ok',
    });
  } else {
    googleItems.push({
      label: 'Search Console',
      value:
        data.gsc?.status === 'ACCESS_BLOCKED'
          ? 'Acceso bloqueado. Revisar permisos del service account.'
          : data.gsc?.errorMessage || data.gsc?.status || 'Sin datos',
      status: 'warning',
    });
  }

  if (data.ga4?.status === 'REAL') {
    googleItems.push({
      label: 'Analytics 4',
      value: `${(data.ga4 as any).totalUsers ?? 0} usuarios · ${(data.ga4 as any).totalSessions ?? 0} sesiones · ${(data.ga4 as any).totalPageviews ?? 0} páginas vistas`,
      status: 'ok',
    });
  } else {
    googleItems.push({
      label: 'Analytics 4',
      value: data.ga4?.errorMessage || data.ga4?.status || 'Sin datos',
      status: 'warning',
    });
  }
  sections.push({ title: 'Google', icon: '🔎', items: googleItems });

  // 3. Oportunidades / contenido
  const contentItems: NiosBriefSection['items'] = [];
  const contentOpps = (data.contentOpportunity as any)?.opportunities;
  if (contentOpps?.length) {
    contentOpps.slice(0, 3).forEach((o: any) => {
      contentItems.push({
        label: 'Oportunidad',
        value: `${o.query || o.tema || 'Tema'}${o.reason ? ` — ${o.reason}` : ''}`,
        status: 'ok',
      });
    });
  } else if (
    data.ceoVerdict.whatToDoToday.some(
      (t) => t.toLowerCase().includes('cubrir') || t.toLowerCase().includes('oportunidad'),
    )
  ) {
    data.ceoVerdict.whatToDoToday
      .filter((t) => t.toLowerCase().includes('cubrir') || t.toLowerCase().includes('oportunidad'))
      .slice(0, 3)
      .forEach((t) => contentItems.push({ value: t, status: 'ok' }));
  } else {
    contentItems.push({
      value: 'No se detectaron oportunidades de contenido nuevas en este ciclo.',
      status: 'neutral',
    });
  }

  if (data.topMovingArticles && data.topMovingArticles.length > 0) {
    data.topMovingArticles.slice(0, 3).forEach((a) => {
      contentItems.push({
        label: 'Momentum',
        value: `${a.slug} ${a.trend} ${a.delta >= 0 ? '+' : ''}${a.delta} vistas`,
        status: a.level === 'ACTIONABLE' ? 'ok' : 'neutral',
      });
    });
  }
  sections.push({ title: 'Oportunidades', icon: '🚀', items: contentItems });

  // 4. Dinero
  const moneyItems: NiosBriefSection['items'] = [];
  if (data.adsense) {
    moneyItems.push({
      label: 'AdSense',
      value: 'Datos de AdSense disponibles. Revisar panel de monetización para detalle.',
      status: 'ok',
    });
  } else {
    moneyItems.push({
      label: 'AdSense',
      value: 'AdSense no está configurado. Ingresos reales aún no disponibles.',
      status: 'neutral',
    });
  }
  moneyItems.push({
    label: 'Top artículo rentable',
    value: data.topLifetimeArticles?.[0]
      ? `${data.topLifetimeArticles[0].titulo || data.topLifetimeArticles[0].slug} (${data.topLifetimeArticles[0].vistas ?? 0} vistas)`
      : 'Sin datos de monetización por artículo.',
    status: 'neutral',
  });
  sections.push({ title: 'Dinero', icon: '💰', items: moneyItems });

  // 5. Problemas
  const problemItems: NiosBriefSection['items'] = [];
  data.ceoVerdict.whatMatters.slice(0, 3).forEach((m) => {
    problemItems.push({ value: m, status: 'alert' });
  });
  if (data.diagnostics) {
    data.diagnostics
      .filter((d) => d.severity === 'critical' || d.severity === 'high')
      .slice(0, 2)
      .forEach((d) => {
        problemItems.push({
          label: d.source,
          value: `${d.problem}: ${d.recommendedAction}`,
          status: 'alert',
        });
      });
  }
  if (problemItems.length === 0) {
    problemItems.push({ value: 'No se detectaron problemas críticos.', status: 'ok' });
  }
  sections.push({ title: 'Problemas', icon: '🚨', items: problemItems });

  // Plan
  const plan: NiosBrief['plan'] = [];
  data.ceoVerdict.whatToDoToday.slice(0, 5).forEach((t) => plan.push({ text: t, source: 'ceo' }));
  data.ceoVerdict.niosRepairs.slice(0, 2).forEach((r) => plan.push({ text: r, source: 'repair' }));
  data.ceoVerdict.needsHuman.slice(0, 2).forEach((h) => plan.push({ text: h, source: 'human' }));

  // Fuentes
  const sources = data.ceoVerdict.evidence.map((e) => ({
    name: e.source,
    status: e.status,
    note: e.note,
  }));

  // Frescura
  const age = data.dataAgeHours ?? null;
  const freshnessNote =
    age === null
      ? 'Sin marca de tiempo del último snapshot.'
      : data.stale
        ? `Datos con ${age}h de antigüedad. Considerar recolección.`
        : `Datos de hace ${age}h.`;

  return {
    generatedAt,
    greeting,
    status,
    statusLabel: statusLabelText,
    headline: data.ceoVerdict.whatIsHappening,
    sections,
    plan,
    sources,
    freshness: { ageHours: age, stale: data.stale ?? false, note: freshnessNote },
  };
}
