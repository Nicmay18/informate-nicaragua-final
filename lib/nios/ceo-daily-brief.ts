/**
 * CEO Daily Brief
 * ===============
 * Genera un resumen ejecutivo diario a partir del resultado del CEO loop.
 * No inventa métricas; si un dato no existe, dice "NO HAY DATOS".
 */

import type { CEOLoopResult } from './ceo-loop';

export interface CEOBriefPoint {
  area: 'Autonomía' | 'Negocio' | 'SEO' | 'Técnico' | 'Editorial' | 'Aprendizaje';
  status: 'alert' | 'warning' | 'ok' | 'opportunity';
  headline: string;
  diagnosis: string;
  evidence: string;
  action: string;
  expectedImpact: string;
  dataStatus: 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'UNKNOWN';
}

export interface CEODailyBrief {
  generatedAt: string;
  date: string;
  period: { from: string; to: string };
  overallStatus: 'ok' | 'warning' | 'alert';
  autonomyScore: string;
  autonomyReport: Record<string, 'REAL' | 'PARTIAL' | 'DEAD'>;
  points: CEOBriefPoint[];
  /** V2: resumen ejecutivo de 'HOY' con acciones priorizadas. */
  hoy: CEOBriefPoint[];
  humanQueue: { id: string; reason: string }[];
  autoActions: { id: string; result: string }[];
  learnings: { pattern: string; confidence: number }[];
  dataStatus: 'DATA_AVAILABLE' | 'DATA_EMPTY' | 'UNKNOWN';
}

export function generateCEODailyBrief(ceo: CEOLoopResult, date = new Date().toISOString()): CEODailyBrief {
  const record = ceo.record;
  const points: CEOBriefPoint[] = [];
  const today = date.split('T')[0];
  const overallStatus =
    record.mode === 'CRITICAL' || record.failedRepairs > 0
      ? 'alert'
      : record.mode === 'WAITING_HUMAN' || record.pendingHuman > 0
        ? 'warning'
        : 'ok';

  // 1. Autonomy pulse
  const allReal = Object.values(ceo.autonomy.report).every((v) => v === 'REAL');
  points.push({
    area: 'Autonomía',
    status: allReal ? 'ok' : 'warning',
    headline: allReal ? 'Ciclo CEO autónomo completo' : 'Algunas fases del CEO no son REAL',
    diagnosis: allReal
      ? 'Todas las fases del ciclo (OBSERVE → MEMORY) están operativas.'
      : 'Una o más fases del ciclo CEO están parciales o muertas.',
    evidence: `Score: ${ceo.autonomy.score}/${ceo.autonomy.max}. ${Object.entries(ceo.autonomy.report)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')}`,
    action: allReal ? 'Mantener y monitorear.' : 'Revisar la fase con estado no REAL.',
    expectedImpact: 'Asegurar continuidad operativa.',
    dataStatus: 'DATA_AVAILABLE',
  });

  // 2. Business pulse
  const business = (record.report as Record<string, unknown> | undefined) || {};
  const trafficArticles = typeof business.trafficArticles === 'number' ? business.trafficArticles : null;
  const totalViews24h = typeof business.totalViews24h === 'number' ? business.totalViews24h : null;
  const hasTraffic = trafficArticles !== null && totalViews24h !== null;
  points.push({
    area: 'Negocio',
    status: hasTraffic ? 'ok' : 'warning',
    headline: hasTraffic
      ? `${totalViews24h} views en las últimas 24h sobre ${trafficArticles} artículos`
      : 'No hay datos de tráfico confirmados en esta corrida',
    diagnosis: hasTraffic
      ? 'El lector de tráfico reportó métricas en el periodo.'
      : 'El lector de tráfico no reportó artículos con views o el dato es 0.',
    evidence: `trafficArticles=${trafficArticles ?? 'N/A'}, totalViews24h=${totalViews24h ?? 'N/A'}`,
    action: hasTraffic ? 'Monitorear tendencias.' : 'Verificar traffic-reader y ventana horaria.',
    expectedImpact: 'Tener tráfico real en cada ciclo.',
    dataStatus: hasTraffic ? 'DATA_AVAILABLE' : 'DATA_EMPTY',
  });

  // 3. SEO / external data pulse
  const gsc = record.observations.find((o) => o.source === 'GSC');
  const ga4 = record.observations.find((o) => o.source === 'GA4');
  const gscBlocked = gsc?.status === 'ACCESS_BLOCKED';
  const ga4NoData = ga4?.status === 'NO_DATA';
  points.push({
    area: 'SEO',
    status: gscBlocked || ga4NoData ? 'warning' : 'ok',
    headline: gscBlocked || ga4NoData ? 'GSC o GA4 sin datos reales' : 'Fuentes SEO accesibles',
    diagnosis: gscBlocked
      ? 'Google Search Console está bloqueado por permisos.'
      : ga4NoData
        ? 'GA4 no devuelve datos o no está configurado.'
        : 'GSC y GA4 reportan correctamente.',
    evidence: `GSC=${gsc?.status ?? 'N/A'}, GA4=${ga4?.status ?? 'N/A'}`,
    action: gscBlocked
      ? 'Asignar permisos al service account de GSC.'
      : ga4NoData
        ? 'Configurar NIOS_GA4_PROPERTY_ID.'
        : 'Mantener conexión.',
    expectedImpact: 'Activar inteligencia SEO real.',
    dataStatus: gscBlocked || ga4NoData ? 'DATA_EMPTY' : 'DATA_AVAILABLE',
  });

  // 4. Technical pulse
  const cacheRepair = record.repaired.find((r) => r.repairId === 'nios-cache-refresh');
  const snapshotRepair = record.repaired.find((r) => r.repairId === 'nios-snapshot-inconsistent');
  points.push({
    area: 'Técnico',
    status: cacheRepair || snapshotRepair ? 'ok' : 'warning',
    headline: record.repaired.length > 0
      ? `${record.repaired.length} reparación(es) automática(s) verificada(s)`
      : 'Ninguna reparación automática ejecutada',
    diagnosis: record.repaired.length > 0
      ? 'El motor de reparación automática ejecutó y verificó acciones seguras.'
      : 'No se ejecutaron reparaciones automáticas en este ciclo.',
    evidence: record.repaired.map((r) => `${r.repairId}=${r.status}`).join(', ') || 'N/A',
    action: record.repaired.length > 0 ? 'Mantener monitor.' : 'Revisar si existen diagnósticos reparables.',
    expectedImpact: 'Mantener el sistema estable sin intervención humana.',
    dataStatus: 'DATA_AVAILABLE',
  });

  // 5. Editorial pulse
  const needsUpdate = record.observations.filter((o) => o.note?.toLowerCase().includes('actualiza')).length;
  points.push({
    area: 'Editorial',
    status: needsUpdate > 0 ? 'opportunity' : 'ok',
    headline: needsUpdate > 0 ? `${needsUpdate} observación(es) editorial(es) con acción` : 'Sin oportunidades editoriales críticas',
    diagnosis: needsUpdate > 0
      ? 'El sistema detectó notas que podrían actualizarse o mejorarse.'
      : 'No se detectaron oportunidades editoriales prioritarias.',
    evidence: record.observations
      .filter((o) => o.note?.toLowerCase().includes('actualiza'))
      .map((o) => `${o.source}: ${o.note}`)
      .join('; ') || 'N/A',
    action: needsUpdate > 0 ? 'Revisar oportunidades en /admin/nios.' : 'Continuar publicación.',
    expectedImpact: 'Aprovechar contenido recuperable.',
    dataStatus: needsUpdate > 0 ? 'DATA_AVAILABLE' : 'DATA_EMPTY',
  });

  // 6. Learning pulse
  const learningPatterns = typeof business.learningPatterns === 'number' ? business.learningPatterns : 0;
  points.push({
    area: 'Aprendizaje',
    status: learningPatterns > 0 ? 'ok' : 'warning',
    headline: learningPatterns > 0 ? `${learningPatterns} patrones de aprendizaje aplicados` : 'Sin patrones de aprendizaje',
    diagnosis: learningPatterns > 0
      ? 'El sistema leyó memoria previa y ajustó decisiones.'
      : 'No se encontraron patrones de aprendizaje del ciclo anterior.',
    evidence: `learningPatterns=${learningPatterns}`,
    action: learningPatterns > 0 ? 'Mantener acumulación de memoria.' : 'Verificar nios_memory y loadCeoLearningPatterns.',
    expectedImpact: 'Mejorar priorización de decisiones futuras.',
    dataStatus: 'DATA_AVAILABLE',
  });

  const humanQueue = record.decisions
    .filter((d) => d.decision === 'QUEUE_FOR_HUMAN')
    .map((d) => ({ id: d.id, reason: d.reason }));

  // V2: HOY — 4 acciones priorizadas
  const hoy: CEOBriefPoint[] = [];

  // 1. Top de tráfico
  const topTraffic = record.observations.find((o) => o.source === 'TRAFFIC' && o.status === 'TOP_ARTICLE');
  hoy.push({
    area: 'Negocio',
    status: topTraffic ? 'ok' : 'warning',
    headline: topTraffic?.note ?? 'No se identificó la noticia líder de tráfico hoy',
    diagnosis: topTraffic
      ? 'El tráfico del día tiene un claro líder medible.'
      : 'Faltan datos de tráfico para saber qué artículo lidera.',
    evidence: topTraffic ? `note=${topTraffic.note}` : 'N/A',
    action: topTraffic ? 'Impulsar recirculación desde el hero.' : 'Verificar traffic-reader y GSC/GA4.',
    expectedImpact: 'Maximizar lecturas del contenido ganador.',
    dataStatus: topTraffic ? 'DATA_AVAILABLE' : 'DATA_EMPTY',
  });

  // 2. SEO hoy
  hoy.push({
    area: 'SEO',
    status: gscBlocked || ga4NoData ? 'warning' : 'ok',
    headline: gscBlocked || ga4NoData
      ? 'No hay datos SEO de hoy; el CEO no puede priorizar clicks'
      : 'Datos SEO disponibles para decisiones',
    diagnosis: gscBlocked
      ? 'GSC bloqueado.'
      : ga4NoData
        ? 'GA4 sin datos.'
        : 'Fuentes SEO accesibles.',
    evidence: `GSC=${gsc?.status ?? 'N/A'}, GA4=${ga4?.status ?? 'N/A'}`,
    action: gscBlocked || ga4NoData ? 'Solicitar credenciales/cargos.' : 'Usar queries ganadoras en próximos artículos.',
    expectedImpact: 'Incrementar tráfico orgánico.',
    dataStatus: gscBlocked || ga4NoData ? 'DATA_EMPTY' : 'DATA_AVAILABLE',
  });

  // 3. Reparación del día
  const p0Repair = record.repaired.find((r) => r.repairId.toLowerCase().includes('p0') || r.problem.toLowerCase().includes('p0'));
  hoy.push({
    area: 'Técnico',
    status: record.repaired.length > 0 ? 'ok' : 'warning',
    headline: p0Repair
      ? `Reparado hoy: ${p0Repair.repairId}`
      : 'Ninguna reparación P0 ejecutada hoy',
    diagnosis: p0Repair
      ? 'El sistema reparó un P0 automáticamente.'
      : 'No se detectaron reparaciones P0 en este ciclo.',
    evidence: p0Repair ? `${p0Repair.repairId}=${p0Repair.status}` : 'N/A',
    action: p0Repair ? 'Verificar en producción.' : 'Revisar diagnósticos pendientes.',
    expectedImpact: 'Mantener o mejorar UX/seguridad.',
    dataStatus: p0Repair ? 'DATA_AVAILABLE' : 'DATA_EMPTY',
  });

  // 4. Aprobación humana más urgente
  const topHuman = humanQueue[0];
  hoy.push({
    area: 'Autonomía',
    status: topHuman ? 'warning' : 'ok',
    headline: topHuman ? `Requiere aprobación: ${topHuman.id}` : 'No hay items en cola humana',
    diagnosis: topHuman ? `Motivo: ${topHuman.reason}` : 'El CEO no bloqueó decisiones hoy.',
    evidence: topHuman ? `reason=${topHuman.reason}` : 'N/A',
    action: topHuman ? 'Revisar y aprobar/rechazar en /panel/nios.' : 'Continuar ciclo autónomo.',
    expectedImpact: 'Desbloquear decisiones críticas.',
    dataStatus: topHuman ? 'DATA_AVAILABLE' : 'DATA_EMPTY',
  });

  const autoActions = record.repaired.map((r) => ({ id: r.repairId, result: r.verification }));

  const learnings = record.learnings.map((l) => ({
    pattern: String(l.problem || l.decisionId || 'unknown'),
    confidence: typeof l.confidence === 'number' ? l.confidence : 0,
  }));

  return {
    generatedAt: new Date().toISOString(),
    date: today,
    period: { from: record.startedAt ?? today, to: record.finishedAt ?? today },
    overallStatus,
    autonomyScore: `${ceo.autonomy.score}/${ceo.autonomy.max}`,
    autonomyReport: ceo.autonomy.report,
    points,
    hoy,
    humanQueue,
    autoActions,
    learnings,
    dataStatus: record.observations.length > 0 ? 'DATA_AVAILABLE' : 'UNKNOWN',
  };
}
