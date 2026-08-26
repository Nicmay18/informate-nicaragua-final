import type { NiosExecutiveData } from './executive-center';

export type CeoVerdictStatus = 'VAS_BIEN' | 'CORREGIR' | 'LA_ESTAS_CAGANDO' | 'SIN_EVIDENCIA';

export interface CeoVerdict {
  generatedAt: string;
  status: CeoVerdictStatus;
  statusIcon: string;
  statusLabel: string;
  whatIsHappening: string;
  whatMatters: string[];
  whatToDoToday: string[];
  niosRepairs: string[];
  needsHuman: string[];
  doNotDo: string[];
  expectedResult: string;
  confidence: number;
  evidence: { source: string; status: string; note: string }[];
}

/**
 * Construye el veredicto CEO final que el panel debe mostrar primero.
 * No audita. Decide. Limita problemas a 3 y acciones a 5.
 */
export type CeoVerdictInput = Omit<NiosExecutiveData, 'ceoVerdict'>;

function buildDoNotDo(data: CeoVerdictInput): string[] {
  const { articlesCount, trafficIntelligence, gsc, ga4, trust, alerts, editorCEOReport, socialConversion } = data;
  const d: string[] = [];

  // Políticas editoriales explícitas (legítimamente estáticas)
  d.push('No publicar artículos sin autor.');

  // Evidence-driven: inventario
  if (articlesCount === 0) {
    d.push('No publicar ni decidir sin inventario de noticias.');
  }

  // Evidence-driven: métricas incompatibles
  if (trafficIntelligence.sources.length > 1) {
    const sourceUnits = trafficIntelligence.sources
      .filter((s) => s.value !== null && s.value !== undefined)
      .map((s) => `${s.name} (${s.unit})`);
    if (sourceUnits.length > 1) {
      d.push(`No sumar métricas incompatibles: ${sourceUnits.join(' / ')}.`);
    }
  }

  // Evidence-driven: sin fuentes reales
  const hasReal = trafficIntelligence.sources.some((s) => s.status === 'REAL') || gsc?.status === 'REAL' || ga4?.status === 'REAL';
  if (!hasReal) {
    d.push('No tomar decisiones de tráfico sin al menos una fuente de datos REAL.');
  }

  // Evidence-driven: GSC/GA4 ausente
  if (gsc?.status !== 'REAL' && ga4?.status !== 'REAL') {
    d.push('No estimar tráfico orgánico o de usuario sin GSC/GA4 conectado.');
  }

  // Evidence-driven: alertas críticas
  if (alerts.some((a) => a.severity === 'critical')) {
    d.push('No ignorar alertas críticas: detener la línea editorial causante.');
  }

  // Evidence-driven: trust
  if (trust?.averageGoogleTrustScore !== undefined && trust.averageGoogleTrustScore < 50) {
    d.push('No escalar distribución con Trust Score < 50.');
  }

  // Evidence-driven: acciones que el Editor CEO ya demostró que hay que parar
  if (editorCEOReport?.whatToStop?.length) {
    d.push(...editorCEOReport.whatToStop.slice(0, 2).map((w) => `NO repetir: ${w.action} — ${w.reasoning}`));
  }

  // Evidence-driven: Facebook
  if (socialConversion) {
    d.push(...socialConversion.doNotDo.slice(0, 2));
  }

  return d;
}

export function buildCeoVerdict(data: CeoVerdictInput): CeoVerdict {
  const now = new Date().toISOString();
  const { articlesCount, trafficIntelligence, trust, alerts, gsc, ga4 } = data;

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  const hasRealData = trafficIntelligence.hasData;
  const hasGsc = gsc?.status === 'REAL';
  const hasGa4 = ga4?.status === 'REAL';
  const hasTraffic = hasRealData;
  const trustAvg = trust?.averageGoogleTrustScore ?? null;

  let status: CeoVerdictStatus;
  let statusIcon: string;
  let statusLabel: string;

  if (articlesCount === 0 || criticalAlerts.length > 0 || (trustAvg !== null && trustAvg < 50)) {
    status = 'LA_ESTAS_CAGANDO';
    statusIcon = '🔴';
    statusLabel = 'LA ESTÁS CAGANDO';
  } else if (!hasTraffic && !hasGsc && !hasGa4) {
    status = 'SIN_EVIDENCIA';
    statusIcon = '🔵';
    statusLabel = 'SIN EVIDENCIA SUFICIENTE';
  } else if (warningAlerts.length > 0 || !hasGsc || !hasGa4 || (trustAvg !== null && trustAvg < 70)) {
    status = 'CORREGIR';
    statusIcon = '🟡';
    statusLabel = 'HAY QUE CORREGIR';
  } else {
    status = 'VAS_BIEN';
    statusIcon = '🟢';
    statusLabel = 'VAS BIEN';
  }

  const whatIsHappening =
    articlesCount === 0
      ? 'El pipeline no cargó artículos hoy. No hay inventario editorial para decidir.'
      : `Sistema operativo con ${articlesCount} artículos. ${
          trafficIntelligence.message
        }. Fuentes Google: ${hasGsc ? 'GSC REAL' : 'GSC no disponible'}, ${
          hasGa4 ? 'GA4 REAL' : 'GA4 no disponible'
        }.`;

  const whatMatters: string[] = [
    criticalAlerts[0]?.message,
    criticalAlerts[1]?.message,
    warningAlerts[0]?.message,
  ].filter(Boolean).slice(0, 3);

  if (data.socialConversion && data.socialConversion.status !== 'SIN_EVIDENCIA' && data.socialConversion.mainProblem !== 'NONE') {
    whatMatters.unshift(`Facebook: ${data.socialConversion.mainProblem} (${data.socialConversion.confidence}% confianza).`);
  }

  if (whatMatters.length === 0) {
    if (!hasGsc) whatMatters.push('GSC no aporta datos: métricas orgánicas son estimaciones.');
    if (!hasGa4) whatMatters.push('GA4 no aporta datos: tráfico del sitio no medido.');
    if (trustAvg !== null && trustAvg < 70) whatMatters.push(`Trust Score bajo (${trustAvg}). Revisar calidad editorial.`);
  }

  const whatToDoToday: string[] = [];
  if (data.socialConversion && data.socialConversion.actions.length > 0) {
    whatToDoToday.push(...data.socialConversion.actions.slice(0, 1));
  }
  data.editorCEOReport?.whatToRepeat?.slice(0, 2).forEach((a) => whatToDoToday.push(`Repetir: ${a}`));
  data.editorCEOReport?.articlesToUpdate?.slice(0, 2).forEach((a) => whatToDoToday.push(`Actualizar: "${a.titulo}"`));
  data.contentOpportunity?.opportunities?.slice(0, 2).forEach((o) => whatToDoToday.push(`Cubrir oportunidad: "${o.query}"`));
  whatToDoToday.push(...(data.weekly?.questions.requiresAttention || []).slice(0, 2));

  const niosRepairs: string[] = [];
  if (articlesCount === 0) niosRepairs.push('Reparar recolección de noticias y regenerar snapshot.');
  if (!hasGsc) niosRepairs.push('Verificar configuración GSC.');
  if (!hasGa4) niosRepairs.push('Verificar configuración GA4.');
  if (trafficIntelligence.sources.some((s) => s.id === 'traffic' && s.status !== 'REAL')) {
    niosRepairs.push('Recalcular resumen de tráfico traffic_daily.');
  }

  const needsHuman: string[] = [];
  if (criticalAlerts.length > 0) needsHuman.push('Revisar alertas críticas.');
  if (data.editorCEOReport?.whatToStop && data.editorCEOReport.whatToStop.length > 0) {
    needsHuman.push('Confirmar líneas editoriales a detener.');
  }
  if (!hasGsc && !hasGa4 && !hasTraffic) needsHuman.push('Conectar al menos una fuente de datos.');

  const doNotDo = buildDoNotDo(data);

  const expectedResult =
    status === 'VAS_BIEN'
      ? 'Mantener ritmo editorial y tráfico. 100% de snapshots con datos.'
      : status === 'CORREGIR'
        ? 'Recuperar datos de GSC/GA4 o subir Trust Score 10 puntos en 7 días.'
        : status === 'LA_ESTAS_CAGANDO'
          ? 'Restaurar inventario de artículos o eliminar bloqueos críticos en 24h.'
          : 'Conectar al menos una fuente de datos antes de emitir recomendaciones.';

  const evidence = [
    { source: 'Traffic', status: hasTraffic ? 'REAL' : 'NO_DATA', note: trafficIntelligence.message },
    { source: 'GSC', status: hasGsc ? 'REAL' : gsc?.status || 'NO_DATA', note: hasGsc ? `${gsc?.totalClicks ?? 0} clics` : 'Sin datos orgánicos' },
    { source: 'GA4', status: hasGa4 ? 'REAL' : ga4?.status || 'NO_DATA', note: hasGa4 ? `${ga4?.totalUsers ?? 0} usuarios` : 'Sin sesiones' },
    { source: 'MENI/Trust', status: trustAvg !== null ? 'REAL' : 'NO_DATA', note: trustAvg !== null ? `Trust ${trustAvg}/100` : 'Sin trust' },
  ];

  if (data.socialConversion) {
    evidence.push({
      source: 'Facebook',
      status: data.socialConversion.facebook.status,
      note: data.socialConversion.facebook.summary,
    });
  }

  const sourcesReal = [hasTraffic, hasGsc, hasGa4].filter(Boolean).length;
  const confidence = sourcesReal === 0 ? 30 : sourcesReal === 1 ? 55 : sourcesReal === 2 ? 80 : 95;

  return {
    generatedAt: now,
    status,
    statusIcon,
    statusLabel,
    whatIsHappening,
    whatMatters: whatMatters.slice(0, 3),
    whatToDoToday: whatToDoToday.slice(0, 5),
    niosRepairs,
    needsHuman,
    doNotDo,
    expectedResult,
    confidence,
    evidence,
  };
}
