import type { Noticia } from '@/lib/types';

export interface DiscoverRecommendation {
  area: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DiscoverScoreResult {
  score: number;
  breakdown: Record<string, number>;
  recommendations: DiscoverRecommendation[];
  approved: boolean;
}

const MIN_TITLE = 30;
const MAX_TITLE = 60;
const MIN_WORDS = 350;
const IDEAL_WORDS = 600;
const MAX_AGE_DAYS = 7;

function countWords(text?: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countImagesInContent(contenido?: string): number {
  if (!contenido) return 0;
  const matches = contenido.match(/<img[^>]+>/gi);
  return matches ? matches.length : 0;
}

function titleQualityScore(titulo: string): number {
  const lower = titulo.toLowerCase();
  const clickbaitPatterns = [
    'increible', 'impactante', 'no vas a creer', 'sorprendente', 'indignante',
    'shock', 'urgente', 'atencion', 'exclusivo!!', '!!', '???',
  ];
  const hasClickbait = clickbaitPatterns.some((p) => lower.includes(p));
  const hasQuestion = titulo.includes('?');
  const hasNumber = /\d/.test(titulo);

  let score = 100;
  if (hasClickbait) score -= 30;
  if (titulo.length < MIN_TITLE) score -= 30;
  if (titulo.length > MAX_TITLE + 10) score -= 20;
  if (hasQuestion) score += 5;
  if (hasNumber) score += 5;
  return Math.max(0, Math.min(100, score));
}

function titleLengthScore(titulo: string): number {
  const len = titulo.length;
  if (len >= MIN_TITLE && len <= MAX_TITLE) return 100;
  if (len < MIN_TITLE) return Math.max(0, (len / MIN_TITLE) * 100);
  if (len > MAX_TITLE) return Math.max(0, 100 - (len - MAX_TITLE) * 2);
  return 0;
}

function articleLengthScore(palabras?: number, contenido?: string): number {
  const words = palabras || countWords(contenido ? stripHtml(contenido) : '');
  if (words >= IDEAL_WORDS) return 100;
  if (words >= MIN_WORDS) return 70 + ((words - MIN_WORDS) / (IDEAL_WORDS - MIN_WORDS)) * 30;
  if (words > 0) return (words / MIN_WORDS) * 70;
  return 0;
}

function freshnessScore(fecha?: string): number {
  if (!fecha) return 0;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return 0;
  const ageDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 1) return 100;
  if (ageDays <= MAX_AGE_DAYS) return 100 - ((ageDays - 1) / (MAX_AGE_DAYS - 1)) * 40;
  return Math.max(0, 60 - (ageDays - MAX_AGE_DAYS) * 2);
}

function authorAuthorityScore(autor?: string, autorFoto?: string): number {
  let score = 50;
  if (autor && autor !== 'Nicaragua Informate') score += 25;
  if (autorFoto) score += 25;
  return Math.min(100, score);
}

function internalLinksScore(links?: unknown[]): number {
  const count = Array.isArray(links) ? links.length : 0;
  if (count >= 3) return 100;
  if (count >= 1) return 50 + count * 15;
  return 0;
}

function imageScore(imagen?: string, contenido?: string): number {
  let score = 0;
  if (imagen && imagen.length > 0) score += 50;
  const contentImages = countImagesInContent(contenido);
  score += Math.min(50, contentImages * 15);
  return Math.min(100, score);
}

function eeAtScore(noticia: Noticia): number {
  let score = 40;
  if (noticia.autor && noticia.autor !== 'Nicaragua Informate') score += 20;
  if (noticia.autorFoto) score += 15;
  if (noticia.fuente) score += 15;
  if (noticia.fuentesComplementarias && noticia.fuentesComplementarias.length > 0) score += 10;
  return Math.min(100, score);
}

export function evaluateDiscoverScore(noticia: Noticia): DiscoverScoreResult {
  const title = noticia.titulo || '';

  const breakdown = {
    titleQuality: titleQualityScore(title),
    titleLength: titleLengthScore(title),
    articleLength: articleLengthScore(noticia.palabras, noticia.contenido),
    freshness: freshnessScore(noticia.fecha),
    authorAuthority: authorAuthorityScore(noticia.autor, noticia.autorFoto),
    internalLinks: internalLinksScore(noticia.related_links),
    images: imageScore(noticia.imagen, noticia.contenido),
    eeat: eeAtScore(noticia),
    actuality: freshnessScore(noticia.fecha),
  };

  const weights: Record<string, number> = {
    titleQuality: 0.12,
    titleLength: 0.10,
    articleLength: 0.15,
    freshness: 0.10,
    authorAuthority: 0.10,
    internalLinks: 0.10,
    images: 0.15,
    eeat: 0.10,
    actuality: 0.08,
  };

  const score = Math.round(
    Object.entries(breakdown).reduce((sum, [key, value]) => sum + value * (weights[key] || 0), 0)
  );

  const recommendations: DiscoverRecommendation[] = [];

  if (breakdown.titleQuality < 80) {
    recommendations.push({
      area: 'Título',
      message: 'Evita clickbait y emojis; usa un título claro, específico y periodístico.',
      priority: 'high',
    });
  }
  if (breakdown.titleLength < 80) {
    recommendations.push({
      area: 'Longitud del título',
      message: `Mantén el título entre ${MIN_TITLE} y ${MAX_TITLE} caracteres para Google Discover.`,
      priority: 'high',
    });
  }
  if (breakdown.articleLength < 70) {
    recommendations.push({
      area: 'Longitud del artículo',
      message: `Aumenta el contenido a al menos ${MIN_WORDS} palabras para cumplir con AdSense y Discover.`,
      priority: 'high',
    });
  }
  if (breakdown.images < 70) {
    recommendations.push({
      area: 'Imágenes',
      message: 'Incluye una imagen destacada de 1200x630 px y al menos una imagen adicional en el cuerpo.',
      priority: 'high',
    });
  }
  if (breakdown.eeat < 70) {
    recommendations.push({
      area: 'EEAT',
      message: 'Añade autor real, foto de autor y fuentes verificables para reforzar credibilidad.',
      priority: 'medium',
    });
  }
  if (breakdown.internalLinks < 70) {
    recommendations.push({
      area: 'Enlaces internos',
      message: 'Agrega enlaces a noticias relacionadas y guías evergreen dentro del contenido.',
      priority: 'medium',
    });
  }
  if (breakdown.freshness < 70) {
    recommendations.push({
      area: 'Frescura',
      message: 'Actualiza la fecha o incluye datos de última hora para prioridad algorítmica.',
      priority: 'medium',
    });
  }

  return {
    score,
    breakdown,
    recommendations,
    approved: score >= 75,
  };
}
