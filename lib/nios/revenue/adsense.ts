/**
 * NIOS v2: AdSense & Policy Compliance Auditor
 *
 * Core Principles:
 * - NO artificial filler text or robotic keyword injection.
 * - AdSense approval requires human editorial transparency and verifiable sources.
 * - Distinguish between: COMPLIANT_READY, NEEDS_EDITORIAL_ENRICHMENT, POLICY_REVIEW_REQUIRED, TECHNICAL_DEFECT.
 */

import type { Noticia } from '@/lib/contracts';
import { cleanWordCount } from '@/lib/nios/lifecycle/tracker';

export type AdSenseReadinessStatus =
  | 'COMPLIANT_READY'
  | 'NEEDS_EDITORIAL_ENRICHMENT'
  | 'POLICY_REVIEW_REQUIRED'
  | 'TECHNICAL_DEFECT';

export interface ArticleAdSenseAudit {
  articleId: string;
  slug: string;
  title: string;
  category: string;
  status: AdSenseReadinessStatus;
  wordCount: number;
  checks: {
    hasClearAuthor: boolean;
    hasVerifiableSource: boolean;
    hasSubstantialContent: boolean; // >= 250 words
    hasStructuredElements: boolean; // <h2>, bullet points, or quotes
    hasFeaturedImage: boolean;
    hasSensitiveTopic: boolean;
  };
  issues: string[];
  recommendedAction: string;
}

export interface SiteAdSenseReport {
  generatedAt: string;
  totalAudited: number;
  compliantReadyCount: number;
  needsEnrichmentCount: number;
  policyReviewCount: number;
  technicalDefectCount: number;
  compliancePercentage: number;
  criticalIssues: { issue: string; count: number }[];
  actionPlan: string[];
  articles: ArticleAdSenseAudit[];
}

const SENSITIVE_KEYWORDS = [
  'violación',
  'abuso sexual',
  'suicidio',
  'cadáver desmembrado',
  'pornografía',
  'narcotráfico explícito',
];

export function auditArticleForAdSense(article: Partial<Noticia> & { id: string }): ArticleAdSenseAudit {
  const content = article.contenido || '';
  const title = article.titulo || '';
  const wordCount = cleanWordCount(content);

  const hasClearAuthor = !!article.autor && article.autor.trim().length > 0;
  const hasVerifiableSource = !!(article.fuente || (article.fuentesComplementarias && article.fuentesComplementarias.length > 0));
  const hasSubstantialContent = wordCount >= 250;
  const hasStructuredElements = content.includes('<h2>') || content.includes('<ul>') || content.includes('<blockquote>') || !!(article.puntosClave && article.puntosClave.length > 0);
  const hasFeaturedImage = !!article.imagen && article.imagen.trim().length > 0;

  const lowerText = `${title} ${content}`.toLowerCase();
  const hasSensitiveTopic = SENSITIVE_KEYWORDS.some(kw => lowerText.includes(kw));

  const issues: string[] = [];

  if (!hasFeaturedImage) {
    issues.push('Falta imagen destacada para el bloque de contenido.');
  }

  if (!hasClearAuthor) {
    issues.push('Falta firma o atribución clara de autoría (E-E-A-T).');
  }

  if (!hasVerifiableSource) {
    issues.push('Falta indicar la fuente o entidad que emitió la información.');
  }

  if (wordCount < 150) {
    issues.push(`Extensión insuficiente (${wordCount} palabras). Riesgo de penalización por "Thin Content".`);
  } else if (wordCount < 250) {
    issues.push(`Extensión breve (${wordCount} palabras). Requiere verificar valor informativo para el lector.`);
  }

  if (hasSensitiveTopic) {
    issues.push('Contiene términos sensibles que requieren verificación de contexto no explícito.');
  }

  let status: AdSenseReadinessStatus = 'COMPLIANT_READY';
  let recommendedAction = 'Artículo apto para monetización con anuncios no invasivos.';

  if (hasSensitiveTopic) {
    status = 'POLICY_REVIEW_REQUIRED';
    recommendedAction = 'Revisión editorial: asegurar que el lenguaje sea estrictamente informativo y sin detalles gráficos.';
  } else if (!hasFeaturedImage || !article.slug || !article.categoria) {
    status = 'TECHNICAL_DEFECT';
    recommendedAction = 'Corregir metadatos técnicos (imagen destacada o categoría).';
  } else if (wordCount < 250 || !hasVerifiableSource) {
    status = 'NEEDS_EDITORIAL_ENRICHMENT';
    recommendedAction = 'Enriquecer editorialmente con declaraciones oficiales, contexto histórico o datos complementarios.';
  }

  return {
    articleId: article.id,
    slug: article.slug || article.id,
    title,
    category: article.categoria || 'General',
    status,
    wordCount,
    checks: {
      hasClearAuthor,
      hasVerifiableSource,
      hasSubstantialContent,
      hasStructuredElements,
      hasFeaturedImage,
      hasSensitiveTopic,
    },
    issues,
    recommendedAction,
  };
}

export function generateSiteAdSenseReport(articles: (Partial<Noticia> & { id: string })[]): SiteAdSenseReport {
  const audited = articles.map(a => auditArticleForAdSense(a));

  let compliantReady = 0;
  let needsEnrichment = 0;
  let policyReview = 0;
  let technicalDefect = 0;

  const issueCountMap = new Map<string, number>();

  for (const item of audited) {
    if (item.status === 'COMPLIANT_READY') compliantReady++;
    else if (item.status === 'NEEDS_EDITORIAL_ENRICHMENT') needsEnrichment++;
    else if (item.status === 'POLICY_REVIEW_REQUIRED') policyReview++;
    else if (item.status === 'TECHNICAL_DEFECT') technicalDefect++;

    for (const iss of item.issues) {
      issueCountMap.set(iss, (issueCountMap.get(iss) || 0) + 1);
    }
  }

  const criticalIssues = Array.from(issueCountMap.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count);

  const total = audited.length;
  const compliancePercentage = total > 0 ? Math.round((compliantReady / total) * 100) : 0;

  const actionPlan: string[] = [];
  if (technicalDefect > 0) {
    actionPlan.push(`Corregir ${technicalDefect} artículos con defectos técnicos (imágenes faltantes o metadatos).`);
  }
  if (needsEnrichment > 0) {
    actionPlan.push(`Priorizar enriquecimiento editorial en los ${needsEnrichment} artículos con fuentes incompletas.`);
  }
  if (policyReview > 0) {
    actionPlan.push(`Revisar ${policyReview} notas de sucesos para asegurar tono sobrio sin morbo.`);
  }
  if (actionPlan.length === 0) {
    actionPlan.push('Inventario 100% alineado con políticas de Google AdSense.');
  }

  return {
    generatedAt: new Date().toISOString(),
    totalAudited: total,
    compliantReadyCount: compliantReady,
    needsEnrichmentCount: needsEnrichment,
    policyReviewCount: policyReview,
    technicalDefectCount: technicalDefect,
    compliancePercentage,
    criticalIssues,
    actionPlan,
    articles: audited,
  };
}
