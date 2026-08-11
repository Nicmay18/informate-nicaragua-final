/**
 * NIOS Intelligence Platform — FASE 2.5.3: AdSense Trust Checklist
 * ================================================================
 * Evalúa señales de confianza editorial, calidad, experiencia de usuario y
 * confianza general. Genera AdSense Trust Score 0-100 y recomendaciones.
 *
 * Basado en datos reales de:
 * - Google Search Console API
 * - Google Analytics 4 Data API
 * - Firestore (artículos, autores, fechas, fuentes)
 * - Google Trust Score FASE 2
 *
 * Estados:
 * - 90-100: Preparado para revisión
 * - 70-89: Mejorar antes de solicitar
 * - <70: No solicitar todavía
 */

import type {
  ArticleFusion,
  AdSenseTrustCheck,
  GoogleTrustReport,
  NIOSRecommendation,
  NIOSEvidence,
} from './types';
import { logger } from '@/lib/logger';

export interface TrustCheckInputs {
  articles: ArticleFusion[];
  trust: GoogleTrustReport;
  aboutPage?: { exists: boolean; words: number } | null;
  teamPage?: { exists: boolean; members: number } | null;
  contactPage?: { exists: boolean } | null;
  editorialPolicy?: { exists: boolean } | null;
  privacyPolicy?: { exists: boolean } | null;
  correctionsPage?: { exists: boolean } | null;
}

function makeEvidence(source: NIOSEvidence['source'], metric: string, value: string | number, now: string): NIOSEvidence {
  return {
    source,
    api: 'NIOS Trust Check',
    dateRange: 'Actual',
    metric,
    value,
    collectedAt: now,
  };
}

function scoreEditorialIdentity(
  inputs: TrustCheckInputs,
  now: string,
): { score: number; data: AdSenseTrustCheck['identity']; evidence: NIOSEvidence[] } {
  const { aboutPage, teamPage, contactPage, editorialPolicy, privacyPolicy, correctionsPage } = inputs;
  const data: AdSenseTrustCheck['identity'] = {
    aboutComplete: aboutPage?.exists ?? null,
    teamVisible: teamPage ? teamPage.members > 0 : null,
    contact: contactPage?.exists ?? null,
    editorialPolicy: editorialPolicy?.exists ?? null,
    privacyPolicy: privacyPolicy?.exists ?? null,
    corrections: correctionsPage?.exists ?? null,
  };

  const checks = [
    data.aboutComplete,
    data.teamVisible,
    data.contact,
    data.editorialPolicy,
    data.privacyPolicy,
    data.corrections,
  ];

  const passed = checks.filter(Boolean).length;
  const score = Math.round((passed / 6) * 100);

  const evidences: NIOSEvidence[] = [
    makeEvidence('Firestore', 'aboutPage', data.aboutComplete === true ? 'existe' : 'no detectado', now),
    makeEvidence('Firestore', 'teamPage', data.teamVisible === true ? 'existe' : 'no detectado', now),
    makeEvidence('Firestore', 'contactPage', data.contact === true ? 'existe' : 'no detectado', now),
    makeEvidence('Firestore', 'editorialPolicy', data.editorialPolicy === true ? 'existe' : 'no detectado', now),
    makeEvidence('Firestore', 'privacyPolicy', data.privacyPolicy === true ? 'existe' : 'no detectado', now),
    makeEvidence('Firestore', 'correctionsPage', data.corrections === true ? 'existe' : 'no detectado', now),
  ];

  return { score, data, evidence: evidences };
}

function scoreContentQuality(
  articles: ArticleFusion[],
  trust: GoogleTrustReport,
  now: string,
): { score: number; data: AdSenseTrustCheck['contentQuality']; evidence: NIOSEvidence[] } {
  if (articles.length === 0) {
    return {
      score: 0,
      data: {
        originalContentPct: 0,
        depthPct: 0,
        contextPct: 0,
        sourcesPct: 0,
        updatedPct: 0,
      },
      evidence: [makeEvidence('Firestore', 'artículos analizados', 0, now)],
    };
  }

  const original = articles.filter(a => a.scoreMeni !== null && a.scoreMeni >= 70 && a.palabras >= 300).length;
  const depth = articles.filter(a => a.palabras >= 600).length;
  const context = articles.filter(a => a.tags.length >= 2 && a.relatedLinksCount >= 1).length;
  const sources = articles.filter(a => a.palabras > 300).length;
  const days90 = 90 * 24 * 60 * 60 * 1000;
  const updated = articles.filter(a => (Date.now() - new Date(a.fechaPublicacion).getTime()) < days90).length;

  const total = articles.length;
  const data = {
    originalContentPct: Math.round((original / total) * 100),
    depthPct: Math.round((depth / total) * 100),
    contextPct: Math.round((context / total) * 100),
    sourcesPct: Math.round((sources / total) * 100),
    updatedPct: Math.round((updated / total) * 100),
  };

  const score = Math.round(
    data.originalContentPct * 0.25 +
    data.depthPct * 0.25 +
    data.contextPct * 0.20 +
    data.sourcesPct * 0.15 +
    data.updatedPct * 0.15,
  );

  const evidences = [
    makeEvidence('Firestore', 'originalContentPct', `${data.originalContentPct}%`, now),
    makeEvidence('Firestore', 'depthPct', `${data.depthPct}%`, now),
    makeEvidence('Google Search Console', 'trust.averageGoogleTrustScore', trust.averageGoogleTrustScore, now),
    makeEvidence('Firestore', 'thinContentCount', trust.thinContentCount, now),
  ];

  return { score, data, evidence: evidences };
}

function scoreUserExperience(
  articles: ArticleFusion[],
  ga4: { totalUsers: number; averageEngagementTimeSec: number; devices: { device: string; users: number }[] } | null,
  now: string,
): { score: number; data: AdSenseTrustCheck['userExperience']; evidence: NIOSEvidence[] } {
  if (articles.length === 0 || !ga4) {
    return {
      score: 0,
      data: {
        avgEngagementTimeSec: 0,
        mobileSharePct: 0,
        internalLinksCoveragePct: 0,
      },
      evidence: [makeEvidence('Google Analytics 4', 'datos GA4', 'insuficientes', now)],
    };
  }

  const withLinks = articles.filter(a => a.relatedLinksCount >= 1).length;
  const internalLinksCoveragePct = Math.round((withLinks / articles.length) * 100);

  const mobileUsers = ga4.devices.find(d => d.device === 'mobile')?.users || 0;
  const mobileSharePct = ga4.totalUsers > 0 ? Math.round((mobileUsers / ga4.totalUsers) * 100) : 0;

  const data = {
    avgEngagementTimeSec: Math.round(ga4.averageEngagementTimeSec),
    mobileSharePct,
    internalLinksCoveragePct,
  };

  let score = 0;
  if (data.avgEngagementTimeSec >= 120) score += 40;
  else if (data.avgEngagementTimeSec >= 60) score += 25;
  else if (data.avgEngagementTimeSec >= 30) score += 15;
  else score += 5;

  if (data.mobileSharePct >= 50) score += 30;
  else if (data.mobileSharePct >= 30) score += 20;
  else score += 10;

  if (data.internalLinksCoveragePct >= 70) score += 30;
  else if (data.internalLinksCoveragePct >= 40) score += 20;
  else score += 10;

  const evidences = [
    makeEvidence('Google Analytics 4', 'avgEngagementTimeSec', data.avgEngagementTimeSec, now),
    makeEvidence('Google Analytics 4', 'mobileSharePct', `${data.mobileSharePct}%`, now),
    makeEvidence('Firestore', 'internalLinksCoveragePct', `${data.internalLinksCoveragePct}%`, now),
  ];

  return { score, data, evidence: evidences };
}

function scoreTrust(
  articles: ArticleFusion[],
  trust: GoogleTrustReport,
  now: string,
): { score: number; evidence: NIOSEvidence[] } {
  if (articles.length === 0) {
    return { score: 0, evidence: [makeEvidence('Firestore', 'artículos', 0, now)] };
  }
  const withAutor = articles.filter(a => a.autor && a.autor.trim().length > 0).length;
  const withFecha = articles.filter(a => a.fechaPublicacion.length > 0).length;
  const withInstituciones = articles.filter(a => a.tags.includes('instituciones') || a.palabras > 600).length;

  const autorPct = Math.round((withAutor / articles.length) * 100);
  const fechaPct = Math.round((withFecha / articles.length) * 100);
  const instPct = Math.round((withInstituciones / articles.length) * 100);

  const score = Math.round(
    trust.averageGoogleTrustScore * 0.5 +
    (autorPct + fechaPct + instPct) / 3 * 0.5,
  );

  const evidences = [
    makeEvidence('Firestore', 'autorPct', `${autorPct}%`, now),
    makeEvidence('Firestore', 'fechaPct', `${fechaPct}%`, now),
    makeEvidence('Google Search Console', 'avgGoogleTrustScore', trust.averageGoogleTrustScore, now),
  ];

  return { score, evidence: evidences };
}

/**
 * Ejecuta el AdSense Trust Checklist.
 */
export async function generateAdSenseTrustCheck(
  inputs: TrustCheckInputs,
  ga4: { totalUsers: number; averageEngagementTimeSec: number; devices: { device: string; users: number }[] } | null,
): Promise<AdSenseTrustCheck> {
  const now = new Date().toISOString();
  const { articles, trust } = inputs;

  if (articles.length === 0) {
    return {
      generatedAt: now,
      adSenseTrustScore: 0,
      editorialIdentityScore: 0,
      contentQualityScore: 0,
      userExperienceScore: 0,
      trustScore: 0,
      status: 'no_solicitar',
      identity: {
        aboutComplete: null,
        teamVisible: null,
        contact: null,
        editorialPolicy: null,
        privacyPolicy: null,
        corrections: null,
      },
      contentQuality: {
        originalContentPct: 0,
        depthPct: 0,
        contextPct: 0,
        sourcesPct: 0,
        updatedPct: 0,
      },
      userExperience: {
        avgEngagementTimeSec: 0,
        mobileSharePct: 0,
        internalLinksCoveragePct: 0,
      },
      recommendations: [],
      summary: 'Datos insuficientes para evaluar.',
    };
  }

  const identity = scoreEditorialIdentity(inputs, now);
  const quality = scoreContentQuality(articles, trust, now);
  const ux = scoreUserExperience(articles, ga4, now);
  const trustScore = scoreTrust(articles, trust, now);

  const adSenseTrustScore = Math.round(
    identity.score * 0.20 +
    quality.score * 0.30 +
    ux.score * 0.20 +
    trustScore.score * 0.30,
  );

  let status: AdSenseTrustCheck['status'];
  if (adSenseTrustScore >= 90) status = 'preparado';
  else if (adSenseTrustScore >= 70) status = 'mejorar';
  else status = 'no_solicitar';

  const recommendations: NIOSRecommendation[] = [];

  if (identity.score < 80) {
    const missing: string[] = [];
    if (inputs.aboutPage?.exists !== true) missing.push('página About');
    if (inputs.teamPage?.exists !== true) missing.push('equipo visible');
    if (inputs.contactPage?.exists !== true) missing.push('página de contacto');
    if (inputs.editorialPolicy?.exists !== true) missing.push('política editorial');
    if (inputs.privacyPolicy?.exists !== true) missing.push('política de privacidad');
    if (inputs.correctionsPage?.exists !== true) missing.push('página de correcciones');

    recommendations.push({
      id: 'adsense-trust-identity-missing',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'eeat',
      severity: missing.length >= 3 ? 'critical' : 'warning',
      title: 'Señales de identidad editorial incompletas',
      description: `AdSense y Google valoran transparencia. Faltan: ${missing.join(', ') || 'algunos elementos'}.`,
      evidence: identity.evidence,
      confidence: 'high',
      createdAt: now,
    });
  }

  if (quality.score < 70) {
    recommendations.push({
      id: 'adsense-trust-content-quality',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'depth',
      severity: 'critical',
      title: 'Calidad de contenido por debajo del umbral',
      description: `Originalidad ${quality.data.originalContentPct}%, profundidad ${quality.data.depthPct}%, contexto ${quality.data.contextPct}%. Mejorar antes de solicitar AdSense.`,
      evidence: quality.evidence,
      confidence: 'high',
      createdAt: now,
    });
  }

  if (ux.score < 60) {
    recommendations.push({
      id: 'adsense-trust-ux',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'originality',
      severity: 'warning',
      title: 'Experiencia de usuario puede mejorar',
      description: `Engagement promedio ${ux.data.avgEngagementTimeSec}s, tráfico móvil ${ux.data.mobileSharePct}%, cobertura de enlaces internos ${ux.data.internalLinksCoveragePct}%.`,
      evidence: ux.evidence,
      confidence: 'medium',
      createdAt: now,
    });
  }

  if (trustScore.score < 70) {
    recommendations.push({
      id: 'adsense-trust-trust-signals',
      articleSlug: 'site',
      articleTitle: 'Sitio',
      type: 'eeat',
      severity: 'critical',
      title: 'Señales de confianza insuficientes',
      description: `Google Trust Score promedio ${trust.averageGoogleTrustScore}/100. Revisar thin content, autoría, fuentes y contexto.`,
      evidence: trustScore.evidence,
      confidence: 'high',
      createdAt: now,
    });
  }

  const summary = `AdSense Trust Check: ${adSenseTrustScore}/100. Estado: ${status === 'preparado' ? 'PREPARADO' : status === 'mejorar' ? 'MEJORAR ANTES DE SOLICITAR' : 'NO SOLICITAR TODAVÍA'}. Identidad ${identity.score}, contenido ${quality.score}, UX ${ux.score}, confianza ${trustScore.score}.`;
  logger.info(`[adsense-trust-check] ${summary}`);

  return {
    generatedAt: now,
    adSenseTrustScore,
    editorialIdentityScore: identity.score,
    contentQualityScore: quality.score,
    userExperienceScore: ux.score,
    trustScore: trustScore.score,
    status,
    identity: identity.data,
    contentQuality: quality.data,
    userExperience: ux.data,
    recommendations,
    summary,
  };
}
