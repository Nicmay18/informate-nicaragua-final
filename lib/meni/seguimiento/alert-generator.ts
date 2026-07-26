/**
 * Alert Generator — Sistema de Seguimiento
 * ==========================================
 * Genera alertas cuando un caso necesita seguimiento o tiene novedades.
 */

import type { TrackingCase, CaseAlert, SeguimientoConfig } from './types';

function makeId(type: string, caseId: string): string {
  return `alert-${type}-${caseId}-${Date.now()}`;
}

export function generateAlerts(
  cases: TrackingCase[],
  config: SeguimientoConfig,
): CaseAlert[] {
  const alerts: CaseAlert[] = [];
  const now = Date.now();

  for (const c of cases) {
    if (c.status === 'cerrado' || c.status === 'archivado') continue;

    const lastUpdate = new Date(c.lastUpdateAt).getTime();
    const lastArticle = c.lastArticleAt ? new Date(c.lastArticleAt).getTime() : 0;
    const daysSinceUpdate = Math.floor((now - lastUpdate) / (24 * 60 * 60 * 1000));
    const daysSinceArticle = Math.floor((now - lastArticle) / (24 * 60 * 60 * 1000));

    // Caso stale: sin actualizaciones recientes
    if (daysSinceUpdate >= config.staleThresholdDays && daysSinceArticle >= config.staleThresholdDays) {
      const severity = daysSinceUpdate >= config.urgentThresholdDays ? 'critical' : 'warning';
      alerts.push({
        id: makeId('stale', c.id),
        caseId: c.id,
        caseTitle: c.title,
        type: 'stale',
        severity,
        message: `Caso "${c.title}" sin actualizaciones hace ${daysSinceUpdate} días.`,
        suggestedAction: daysSinceUpdate >= config.urgentThresholdDays
          ? `URGENTE: Investigar estado actual del caso o cerrarlo si ya no es relevante.`
          : `Buscar novedades o actualizar el caso. Si no hay cambios, considerar pausarlo.`,
        createdAt: new Date().toISOString(),
        resolved: false,
      });
    }

    // Caso urgente con prioridad alta sin cobertura reciente
    if (c.priority === 'urgente' && daysSinceArticle >= 3) {
      alerts.push({
        id: makeId('deadline', c.id),
        caseId: c.id,
        caseTitle: c.title,
        type: 'deadline',
        severity: 'critical',
        message: `Caso urgente "${c.title}" sin cobertura en ${daysSinceArticle} días.`,
        suggestedAction: `Publicar actualización inmediatamente. Los lectores esperan seguimiento de casos urgentes.`,
        createdAt: new Date().toISOString(),
        resolved: false,
      });
    }

    // Caso con próxima revisión vencida
    if (c.nextCheckDate) {
      const nextCheck = new Date(c.nextCheckDate).getTime();
      if (nextCheck < now) {
        alerts.push({
          id: makeId('deadline', c.id),
          caseId: c.id,
          caseTitle: c.title,
          type: 'deadline',
          severity: 'warning',
          message: `Fecha de revisión vencida para "${c.title}".`,
          suggestedAction: `Revisar el caso y actualizar su estado o programar nueva fecha de revisión.`,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    // Caso en desarrollo sin artículos recientes
    if (c.status === 'en_desarrollo' && daysSinceArticle >= 5) {
      alerts.push({
        id: makeId('stale', c.id),
        caseId: c.id,
        caseTitle: c.title,
        type: 'stale',
        severity: 'warning',
        message: `Caso en desarrollo "${c.title}" sin nuevos artículos en ${daysSinceArticle} días.`,
        suggestedAction: `El caso sigue en desarrollo pero sin cobertura. Verificar si hay novedades o cambiar a "en pausa".`,
        createdAt: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export function generateEntityMatchAlert(
  caseItem: TrackingCase,
  matchedEntities: string[],
): CaseAlert {
  return {
    id: makeId('entity_match', caseItem.id),
    caseId: caseItem.id,
    caseTitle: caseItem.title,
    type: 'entity_match',
    severity: 'info',
    message: `Nuevo artículo coincide con entidades del caso "${caseItem.title}": ${matchedEntities.join(', ')}.`,
    suggestedAction: `Vincular el artículo al caso y evaluar si es una novedad significativa.`,
    createdAt: new Date().toISOString(),
    resolved: false,
  };
}
