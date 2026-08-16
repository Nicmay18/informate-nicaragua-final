/**
 * NIOS v2: CEO Morning Brief ("Buenos Días, Nicaragua Infórmate")
 *
 * Executive Daily Operating Intelligence:
 * - 0 invented scores.
 * - Max 5 high-impact factual summaries.
 * - Top 3 prioritized editorial & business actions for the day.
 */

import type { GSCSnapshot, GA4Snapshot, Noticia } from '@/lib/contracts';
import type { LifecycleInsight } from '@/lib/nios/lifecycle/tracker';
import type { GrowthOpportunity } from '@/lib/nios/growth/opportunities';
import type { SiteAdSenseReport } from '@/lib/nios/revenue/adsense';

export interface CEOMorningBrief {
  date: string;
  generatedAt: string;
  headline: string;
  dataIntegrity: {
    gscStatus: string;
    ga4Status: string;
    articlesTracked: number;
  };
  audiencePulse: {
    users24h: number | null;
    sessions24h: number | null;
    avgEngagementSec: number | null;
    summary: string;
  };
  searchPulse: {
    impressions7d: number | null;
    clicks7d: number | null;
    avgCtrPercent: number | null;
    topRisingQuery: string | null;
    summary: string;
  };
  editorialPulse: {
    articlesInObservation: number;
    articlesNeedingUpdate: number;
    substanceBreakdown: {
      complete: number;
      shortUseful: number;
      thinConfirmed: number;
    };
    summary: string;
  };
  monetizationPulse: {
    adSenseCompliantPercent: number;
    policyReviewCount: number;
    technicalDefectCount: number;
    summary: string;
  };
  topPrioritiesToday: {
    priority: number;
    title: string;
    reason: string;
    action: string;
  }[];
}

export function generateCEOMorningBrief(params: {
  date?: string;
  gsc: GSCSnapshot;
  ga4: GA4Snapshot;
  noticias: (Partial<Noticia> & { id: string })[];
  lifecycleInsights: LifecycleInsight[];
  growthOpportunities: GrowthOpportunity[];
  adSenseReport: SiteAdSenseReport;
}): CEOMorningBrief {
  const { gsc, ga4, noticias, lifecycleInsights, growthOpportunities, adSenseReport } = params;
  const today = params.date || new Date().toISOString().split('T')[0];

  // 1. Audience pulse
  const users = ga4.totalUsers;
  const sessions = ga4.totalSessions;
  const avgEng = ga4.averageEngagementTimeSec;
  const audienceSummary = users > 0
    ? `${users} lectores activos en las últimas 24h con ${avgEng}s de lectura promedio por sesión.`
    : 'Sin datos recientes de tráfico en GA4.';

  // 2. Search pulse
  const imps = gsc.totalImpressions;
  const clicks = gsc.totalClicks;
  const ctrPct = gsc.avgCtr ? Math.round(gsc.avgCtr * 1000) / 10 : null;
  const topQuery = gsc.queries?.[0]?.query || null;
  const searchSummary = imps > 0
    ? `${imps} impresiones en Google (${clicks} clics, CTR ${ctrPct}%). Posición media: ${gsc.avgPosition}.`
    : 'Search Console sin impresiones registradas en el período.';

  // 3. Editorial pulse
  const inObs = lifecycleInsights.filter(i => i.stage === 'OBSERVED' || i.stage === 'LEARNING').length;
  const needUp = lifecycleInsights.filter(i => i.stage === 'UPDATE_REQUIRED').length;
  const complete = lifecycleInsights.filter(i => i.substance === 'EDITORIALLY_COMPLETE').length;
  const shortUseful = lifecycleInsights.filter(i => i.substance === 'SHORT_USEFUL').length;
  const thinConf = lifecycleInsights.filter(i => i.substance === 'THIN_CONFIRMED').length;

  const editorialSummary = `${noticias.length} notas en el catálogo. ${complete + shortUseful} con sustancia sólida, ${inObs} en seguimiento activo.`;

  // 4. Monetization pulse
  const adCompliantPct = adSenseReport.compliancePercentage;
  const monetizationSummary = `${adCompliantPct}% del inventario alineado con políticas de AdSense. ${adSenseReport.policyReviewCount} notas en revisión.`;

  // 5. Top 3 Priorities for Today
  const topPriorities: CEOMorningBrief['topPrioritiesToday'] = [];

  // Priority 1: Critical editorial updates
  if (needUp > 0) {
    const target = lifecycleInsights.find(i => i.stage === 'UPDATE_REQUIRED');
    topPriorities.push({
      priority: 1,
      title: `Actualizar cobertura en desarrollo: "${target?.title || 'Nota prioritaria'}"`,
      reason: 'Se detectaron nuevos datos o evolución de la noticia tras la publicación original.',
      action: 'Añadir último reporte oficial y actualizar fecha de modificación.',
    });
  }

  // Priority 2: Growth / Search CTR opportunities
  if (growthOpportunities.length > 0 && topPriorities.length < 3) {
    const opp = growthOpportunities[0];
    topPriorities.push({
      priority: topPriorities.length + 1,
      title: opp.headline,
      reason: opp.expectedOutcome,
      action: opp.recommendedAction,
    });
  }

  // Priority 3: Technical or monetization defects
  if (adSenseReport.technicalDefectCount > 0 && topPriorities.length < 3) {
    topPriorities.push({
      priority: topPriorities.length + 1,
      title: `Resolver ${adSenseReport.technicalDefectCount} notas con metadatos o imágenes faltantes`,
      reason: 'Artículos sin imagen o categoría reducen la monetización y el tráfico social.',
      action: 'Asignar imagen destacada y categoría canónica.',
    });
  }

  // Fallback priorities if clean
  if (topPriorities.length < 3) {
    topPriorities.push({
      priority: topPriorities.length + 1,
      title: 'Enriquecer recirculación interna en notas de Economía y Nacionales',
      reason: 'Asegurar que cada nota publicada hoy enlace a 2 artículos afines.',
      action: 'Insertar enlaces cruzados de contexto.',
    });
  }

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    headline: `Brief Ejecutivo — ${today}: ${users} Lectores | ${imps} Impresiones Google`,
    dataIntegrity: {
      gscStatus: gsc.totalImpressions > 0 ? 'CONNECTED_WITH_DATA' : 'CONNECTED_NO_DATA',
      ga4Status: ga4.totalUsers > 0 ? 'CONNECTED_WITH_DATA' : 'CONNECTED_NO_DATA',
      articlesTracked: noticias.length,
    },
    audiencePulse: {
      users24h: users,
      sessions24h: sessions,
      avgEngagementSec: avgEng,
      summary: audienceSummary,
    },
    searchPulse: {
      impressions7d: imps,
      clicks7d: clicks,
      avgCtrPercent: ctrPct,
      topRisingQuery: topQuery,
      summary: searchSummary,
    },
    editorialPulse: {
      articlesInObservation: inObs,
      articlesNeedingUpdate: needUp,
      substanceBreakdown: {
        complete,
        shortUseful,
        thinConfirmed: thinConf,
      },
      summary: editorialSummary,
    },
    monetizationPulse: {
      adSenseCompliantPercent: adCompliantPct,
      policyReviewCount: adSenseReport.policyReviewCount,
      technicalDefectCount: adSenseReport.technicalDefectCount,
      summary: monetizationSummary,
    },
    topPrioritiesToday: topPriorities.slice(0, 3),
  };
}
