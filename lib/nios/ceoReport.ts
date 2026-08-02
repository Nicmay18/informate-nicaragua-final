import type { NiosCeoReport, NiosModuleReport, NiosReport } from './types';

export function buildCeoReport(report: NiosReport, modules: Record<string, NiosModuleReport>): NiosCeoReport {
  const allRecs = Object.values(modules).flatMap((m) => m.recommendations);
  const critical = allRecs.filter((r) => r.priority === 'critical').slice(0, 3);
  const high = allRecs.filter((r) => r.priority === 'high').slice(0, 5);
  const opportunities = allRecs.filter((r) => r.priority === 'medium' || r.priority === 'low').slice(0, 5);
  const risks = allRecs.filter((r) => r.priority === 'critical' || r.priority === 'high' || r.module === 'competitors').slice(0, 5);

  const growth = modules.growth;
  const totalNews = (growth.metrics.find((m) => m.label === 'Noticias activas')?.value as number) || 0;
  const totalViews = (growth.metrics.find((m) => m.label === 'Vistas totales')?.value as number) || 0;
  const recentVisits = (growth.metrics.find((m) => m.label === 'Visitas últimas 24h')?.value as number) || 0;

  return {
    headline: `NIOS reporta ${allRecs.length} recomendaciones: ${critical.length} críticas, ${high.length} altas.`,
    whatHappened: [
      `El medio cuenta con ${totalNews} noticias activas y ${totalViews.toLocaleString('es-NI')} vistas totales.`,
      `Visitas recientes: ${recentVisits}.`,
      `Se analizaron ${Object.keys(modules).length} módulos de inteligencia.`,
    ],
    whatWorked: [
      modules.growth?.status === 'ok' || modules.growth?.status === 'opportunity' ? 'Crecimiento y tráfico con datos disponibles.' : '',
      modules.audience?.status === 'ok' || modules.audience?.status === 'opportunity' ? 'Análisis de categorías con datos reales.' : '',
      modules.revenue?.status === 'ok' || modules.revenue?.status === 'opportunity' ? 'Inventario publicitario identificado.' : '',
    ].filter(Boolean),
    whatDidNotWork: [
      ...report.errors || [],
      ...critical.map((r) => r.title),
    ],
    opportunities: opportunities.map((r) => `${r.title}: ${r.action}`),
    risks: risks.map((r) => `${r.title}: ${r.description}`),
    actionsForToday: allRecs.slice(0, 7).map((r) => `[${r.priority.toUpperCase()}] ${r.title} → ${r.action}`),
  };
}
