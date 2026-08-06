/**
 * NIOS Intelligence Platform — FASE 2.5.4: Content Improvement Engine
 * =================================================================
 * Genera recomendaciones automáticas de mejora basadas en datos reales.
 *
 * No inventa. Cada recomendación incluye evidencia con fuente, métrica y fecha.
 */

import type {
  ArticleFusion,
  ImprovementRecommendation,
  NIOSEvidence,
} from './types';

function evidence(source: NIOSEvidence['source'], metric: string, value: string | number, now: string): NIOSEvidence {
  return {
    source,
    api: 'NIOS Content Improvement Engine',
    dateRange: 'Últimos 28 días',
    metric,
    value,
    collectedAt: now,
  };
}

function addIfNotExists(recs: ImprovementRecommendation[], slug: string, trigger: string): boolean {
  return !recs.some(r => r.slug === slug && r.trigger === trigger);
}

/**
 * Genera recomendaciones de mejora para cada artículo.
 */
export function generateImprovementRecommendations(
  articles: ArticleFusion[],
  sourceTraffic: Record<string, number> = {},
): ImprovementRecommendation[] {
  const now = new Date().toISOString();
  const recs: ImprovementRecommendation[] = [];

  for (const article of articles) {
    // 1. MENI > 90 pero GSC < 100 impresiones
    if (article.scoreMeni > 90 && article.gscImpressions < 100) {
      if (addIfNotExists(recs, article.slug, 'high-meni-low-google')) {
        recs.push({
          id: `improve-${article.slug}-high-meni-low-google`,
          slug: article.slug,
          titulo: article.titulo,
          categoria: article.categoria,
          trigger: 'high-meni-low-google',
          observation: `MENI ${article.scoreMeni} pero solo ${article.gscImpressions} impresiones Google.`,
          recommendedAction:
            'Google no está encontrando suficiente demanda. Revisar título, intención de búsqueda y enlaces internos.',
          evidence: [
            evidence('MENI', 'scoreMeni', article.scoreMeni, now),
            evidence('Google Search Console', 'gscImpressions', article.gscImpressions, now),
          ],
          priority: 'high',
          createdAt: now,
        });
      }
    }

    // 2. Muchas visitas sociales pero cero Google
    const social = sourceTraffic['facebook'] || sourceTraffic['instagram'] || sourceTraffic['twitter'] || 0;
    if (social > 100 && article.gscImpressions === 0) {
      if (addIfNotExists(recs, article.slug, 'social-zero-google')) {
        recs.push({
          id: `improve-${article.slug}-social-zero-google`,
          slug: article.slug,
          titulo: article.titulo,
          categoria: article.categoria,
          trigger: 'social-zero-google',
          observation: `Contenido dependiente de redes sociales (${social} usuarios) sin impresiones Google.`,
          recommendedAction:
            'Convertir en contenido evergreen: agregar contexto histórico, datos oficiales y utilidad a largo plazo.',
          evidence: [
            evidence('Google Analytics 4', 'usersFromSocial', social, now),
            evidence('Google Search Console', 'gscImpressions', 0, now),
          ],
          priority: 'high',
          createdAt: now,
        });
      }
    }

    // 3. Sucesos cortos
    if (article.categoria === 'Sucesos' && article.palabras < 400) {
      if (addIfNotExists(recs, article.slug, 'sucesos-corto')) {
        recs.push({
          id: `improve-${article.slug}-sucesos-corto`,
          slug: article.slug,
          titulo: article.titulo,
          categoria: article.categoria,
          trigger: 'sucesos-corto',
          observation: `Nota de Sucesos con ${article.palabras} palabras.`,
          recommendedAction:
            'Agregar contexto: antecedentes, datos oficiales, recomendaciones y impacto ciudadano.',
          evidence: [
            evidence('Firestore', 'palabras', article.palabras, now),
            evidence('Firestore', 'categoria', article.categoria, now),
          ],
          priority: 'critical',
          createdAt: now,
        });
      }
    }

    // 4. CTR bajo con impresiones
    if (article.gscImpressions > 100 && article.gscCtr < 1) {
      if (addIfNotExists(recs, article.slug, 'low-ctr')) {
        recs.push({
          id: `improve-${article.slug}-low-ctr`,
          slug: article.slug,
          titulo: article.titulo,
          categoria: article.categoria,
          trigger: 'low-ctr',
          observation: `CTR ${article.gscCtr}% con ${article.gscImpressions} impresiones.`,
          recommendedAction:
            'Revisar título y snippet: buscar claridad, intención de búsqueda y diferenciación vs resultados competidores.',
          evidence: [
            evidence('Google Search Console', 'gscImpressions', article.gscImpressions, now),
            evidence('Google Search Console', 'gscCtr', `${article.gscCtr}%`, now),
          ],
          priority: 'medium',
          createdAt: now,
        });
      }
    }

    // 5. Engagement bajo
    if (article.ga4Users > 0 && article.ga4AvgEngagementTimeSec < 60) {
      if (addIfNotExists(recs, article.slug, 'low-engagement')) {
        recs.push({
          id: `improve-${article.slug}-low-engagement`,
          slug: article.slug,
          titulo: article.titulo,
          categoria: article.categoria,
          trigger: 'low-engagement',
          observation: `Tiempo de engagement ${article.ga4AvgEngagementTimeSec}s con ${article.ga4Users} usuarios.`,
          recommendedAction:
            'Mejorar estructura: subtítulos H2, FAQ inmediata, resumen ejecutivo y enlaces internos relevantes.',
          evidence: [
            evidence('Google Analytics 4', 'ga4Users', article.ga4Users, now),
            evidence('Google Analytics 4', 'ga4AvgEngagementTimeSec', article.ga4AvgEngagementTimeSec, now),
          ],
          priority: 'medium',
          createdAt: now,
        });
      }
    }

    // 6. Sin autor
    if (!article.autor || article.autor.trim().length === 0) {
      if (addIfNotExists(recs, article.slug, 'missing-author')) {
        recs.push({
          id: `improve-${article.slug}-missing-author`,
          slug: article.slug,
          titulo: article.titulo,
          categoria: article.categoria,
          trigger: 'missing-author',
          observation: 'Artículo sin autor visible.',
          recommendedAction: 'Añadir firma de autor y fecha de actualización para EEAT.',
          evidence: [
            evidence('Firestore', 'autor', 'ausente', now),
          ],
          priority: 'high',
          createdAt: now,
        });
      }
    }
  }

  return recs;
}
