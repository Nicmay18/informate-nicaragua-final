import type { TrafficPerformance, GSCSnapshot, GA4Snapshot } from './types';

export type ReconciledSourceStatus = 'NO_DATA' | 'REAL' | 'ZERO' | 'ACCESS_BLOCKED' | 'INVALID_CONFIGURATION';

export interface ReconciledTrafficSource {
  id: 'traffic' | 'gsc' | 'ga4' | 'firebase' | 'social';
  name: string;
  status: ReconciledSourceStatus;
  value: number | null;
  unit: string;
  note: string;
}

export interface ReconciledTrafficIntelligence {
  hasData: boolean;
  message: string;
  sources: ReconciledTrafficSource[];
  trafficPerformance: TrafficPerformance | null;
  totalTrafficViews7d: number | null;
  gscClicks: number | null;
  ga4Users: number | null;
  ga4Sessions: number | null;
}

/**
 * Reconcilia fuentes de tráfico sin mezclar métricas incompatibles.
 * Cada fuente se reporta con su propio estado y su propia unidad.
 * hasData = true si al menos una fuente REAL aporta datos.
 */
export function reconcileTraffic(
  traffic: TrafficPerformance | null,
  gsc: GSCSnapshot | null,
  ga4: GA4Snapshot | null,
): ReconciledTrafficIntelligence {
  const totalTrafficViews7d = traffic
    ? Object.values(traffic.dailyGrowth).reduce((s, v) => s + v, 0)
    : null;
  const trafficHasReal = traffic && (traffic.topArticles.length > 0 || Object.keys(traffic.topSources).length > 0);
  const trafficStatus: ReconciledSourceStatus = traffic
    ? (totalTrafficViews7d && totalTrafficViews7d > 0) || trafficHasReal
      ? 'REAL'
      : 'ZERO'
    : 'NO_DATA';

  const gscStatus: ReconciledSourceStatus = gsc?.status === 'REAL' ? 'REAL' : (gsc?.status as ReconciledSourceStatus) ?? 'NO_DATA';
  const ga4Status: ReconciledSourceStatus = ga4?.status === 'REAL' ? 'REAL' : (ga4?.status as ReconciledSourceStatus) ?? 'NO_DATA';

  const gscClicks = gscStatus === 'REAL' ? (gsc?.totalClicks ?? null) : null;
  const ga4Users = ga4Status === 'REAL' ? (ga4?.totalUsers ?? null) : null;
  const ga4Sessions = ga4Status === 'REAL' ? (ga4?.totalSessions ?? null) : null;

  const sources: ReconciledTrafficSource[] = [
    {
      id: 'traffic',
      name: 'Traffic Log / Daily',
      status: trafficStatus,
      value: totalTrafficViews7d,
      unit: 'visitas',
      note: 'Vistas propias del sitio desde logs y resúmenes diarios. No sumar con GA4/GSC.',
    },
    {
      id: 'gsc',
      name: 'Google Search Console',
      status: gscStatus,
      value: gscClicks,
      unit: 'clics',
      note: 'Clics orgánicos. Métrica distinta a visitas; no sumar con traffic ni GA4.',
    },
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      status: ga4Status,
      value: ga4Users,
      unit: 'usuarios',
      note: 'Usuarios medidos por GA4. No sumar con traffic views ni GSC clicks.',
    },
  ];

  const hasData = sources.some((s) => s.status === 'REAL');

  return {
    hasData,
    message: hasData ? 'Traffic Intelligence - Data available' : 'No traffic data',
    sources,
    trafficPerformance: traffic,
    totalTrafficViews7d,
    gscClicks,
    ga4Users,
    ga4Sessions,
  };
}
