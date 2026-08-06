/**
 * Motor de enlaces internos — genera relacionados automáticos por scoring multi-factor.
 * Factores: categoría, tags, entidades, similitud de título, evergreen, recencia, autoridad.
 */

import type { Noticia } from '@/lib/types';
import type { RelatedLink } from '@/lib/article-links';
import { EVERGREEN_ARTICLES } from '@/lib/evergreen';

interface ScoredCandidate {
  noticia: Noticia;
  score: number;
  reasons: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

const EVERGREEN_TRIGGERS: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: 'apostillar-documentos-nicaragua-2026',
    keywords: ['apostilla', 'apostillar', 'legalización documentos', 'cancillería', 'minrex', 'convención de la haya'],
  },
  {
    slug: 'anular-recurso-policial-nicaragua-2026',
    keywords: ['récord policial', 'antecedentes penales', 'certificado de conducta', 'policía nacional', 'carta judicial'],
  },
  {
    slug: 'guia-turismo-nicaragua-2026',
    keywords: ['turismo', 'turista', 'destino turístico', 'volcán', 'lago', 'colonial', 'granada', 'león', 'ometepe'],
  },
];

function findEvergreenLinks(noticia: Noticia): RelatedLink[] {
  const text = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''}`.toLowerCase();
  const links: RelatedLink[] = [];

  for (const { slug, keywords } of EVERGREEN_TRIGGERS) {
    if (keywords.some((k) => text.includes(k))) {
      const guide = EVERGREEN_ARTICLES.find((g) => g.slug === slug);
      if (guide) {
        links.push({
          url: `/guia/${slug}`,
          anchor: guide.title.length > 60 ? guide.title.slice(0, 57) + '…' : guide.title,
          type: 'guia',
        });
      }
    }
  }

  return links;
}

function diversifyByCategory(
  candidates: ScoredCandidate[],
  max: number,
  maxPerCategory: number,
): ScoredCandidate[] {
  const result: ScoredCandidate[] = [];
  const categoryCount: Record<string, number> = {};

  for (const candidate of candidates) {
    const cat = candidate.noticia.categoria;
    if ((categoryCount[cat] || 0) >= maxPerCategory) continue;
    result.push(candidate);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    if (result.length >= max) break;
  }

  return result;
}

export async function generateInternalLinks(
  noticia: Noticia,
  allNews: Noticia[],
): Promise<RelatedLink[]> {
  if (!noticia || !noticia.slug) return [];

  const sourceTitleTokens = tokenize(noticia.titulo);
  const sourceTags = new Set((noticia.tags || []).map((t) => t.toLowerCase()));
  const now = Date.now();

  const candidates: ScoredCandidate[] = [];

  for (const candidate of allNews) {
    if (candidate.slug === noticia.slug) continue;
    if (candidate.estado === 'borrador' || candidate.estado === 'archivado') continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. Misma categoría: +1
    if (candidate.categoria === noticia.categoria) {
      score += 1;
      reasons.push('misma categoría');
    }

    // 2. Tags compartidos: +2 por cada tag
    const candidateTags = new Set((candidate.tags || []).map((t) => t.toLowerCase()));
    let sharedTags = 0;
    for (const tag of sourceTags) {
      if (candidateTags.has(tag)) sharedTags++;
    }
    if (sharedTags > 0) {
      score += sharedTags * 2;
      reasons.push(`${sharedTags} tags compartidos`);
    }

    // 3. Similitud de título (Jaccard tokens): +1-3
    const candidateTitleTokens = tokenize(candidate.titulo);
    const titleSim = jaccardSimilarity(sourceTitleTokens, candidateTitleTokens);
    if (titleSim > 0.25) {
      const titleScore = Math.round(titleSim * 3);
      score += titleScore;
      reasons.push(`títulos similares (${Math.round(titleSim * 100)}%)`);
    }

    // 4. Similitud de contenido (resumen): +1-2
    if (noticia.resumen && candidate.resumen) {
      const sourceResumenTokens = tokenize(noticia.resumen);
      const candidateResumenTokens = tokenize(candidate.resumen);
      const resumenSim = jaccardSimilarity(sourceResumenTokens, candidateResumenTokens);
      if (resumenSim > 0.3) {
        score += Math.round(resumenSim * 2);
        reasons.push('contenido relacionado');
      }
    }

    // 5. Autoridad interna (vistas): +1 si >100, +2 si >300
    const views = candidate.vistas ?? 0;
    if (views > 300) {
      score += 2;
      reasons.push('alto tráfico');
    } else if (views > 100) {
      score += 1;
      reasons.push('tráfico moderado');
    }

    // 6. Recencia: preferir noticias recientes
    const candidateDate = new Date(candidate.fecha);
    if (!isNaN(candidateDate.getTime())) {
      const ageDays = (now - candidateDate.getTime()) / DAY_MS;
      if (ageDays < 3) {
        score += 1;
        reasons.push('muy reciente');
      } else if (ageDays > 180) {
        score -= 1;
      }
    }

    // 7. Score de calidad: +1 si >= 90
    if (candidate.scoreCalidad && candidate.scoreCalidad >= 90) {
      score += 1;
      reasons.push('alta calidad editorial');
    }

    if (score >= 3) {
      candidates.push({ noticia: candidate, score, reasons });
    }
  }

  // Ordenar por score descendente
  candidates.sort((a, b) => b.score - a.score);

  // Diversificar: máximo 2 por categoría, top 5
  const diversified = diversifyByCategory(candidates, 5, 2);

  // Convertir a RelatedLink[]
  const newsLinks: RelatedLink[] = diversified.map(({ noticia: n }) => ({
    url: `/noticias/${n.slug}`,
    anchor: n.titulo.length > 60 ? n.titulo.slice(0, 57) + '…' : n.titulo,
    type: 'noticia',
  }));

  // Añadir enlaces a guías evergreen (máximo 2)
  const evergreenLinks = findEvergreenLinks(noticia).slice(0, 2);

  // Combinar: primero evergreen (si hay), luego noticias
  return [...evergreenLinks, ...newsLinks].slice(0, 6);
}
