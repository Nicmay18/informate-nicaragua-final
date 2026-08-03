import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { hasWeakMetaDescription } from '@/lib/seo/effective';
import type { GoogleTrust, TrustPillar } from './types';

const DAY = 24 * 60 * 60 * 1000;

function toTime(v: unknown): number {
  if (v instanceof Date) return isNaN(v.getTime()) ? Date.now() : v.getTime();
  if (typeof v === 'string' && v.trim()) {
    const t = new Date(v).getTime();
    return isNaN(t) ? Date.now() : t;
  }
  return Date.now();
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

/**
 * Traduce el estado del archivo editorial a los ejes que Google usa para
 * decidir si un medio merece confianza (EEAT + calidad de sitio).
 */
export function buildGoogleTrust(
  noticias: Noticia[],
  guides: EvergreenArticle[],
  now = Date.now()
): GoogleTrust {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const total = published.length;

  const withAuthor = published.filter((n) => !!n.autor?.trim()).length;
  const withAuthorPhoto = published.filter((n) => !!n.autorFoto).length;
  const uniqueAuthors = new Set(published.map((n) => n.autor).filter(Boolean)).size;
  const categories = new Set(published.map((n) => n.categoria)).size;
  const deep = published.filter((n) => (n.palabras || 0) >= 400).length;
  const withKeyPoints = published.filter((n) => Array.isArray(n.puntosClave) && n.puntosClave.length > 0).length;
  const explainers = published.filter((n) => n.articleType === 'explicador' || n.articleType === 'analisis' || n.articleType === 'guia').length;
  const updated90 = published.filter((n) => toTime(n.fechaActualizacion || n.fecha) > now - 90 * DAY).length;
  const fresh7 = published.filter((n) => toTime(n.fecha) > now - 7 * DAY).length;
  const solidMeta = published.filter((n) => !hasWeakMetaDescription(n)).length;
  const withImage = published.filter((n) => !!n.imagen && !n.imagen.includes('logo')).length;
  const guidesWithFaq = guides.filter((g) => g.faqs && g.faqs.length > 0).length;

  const authorityScore = Math.round((pct(withAuthor, total) * 0.6) + (pct(withAuthorPhoto, total) * 0.4));
  const varietyScore = Math.min(100, categories * 14);
  const depthScore = Math.round((pct(deep, total) * 0.6) + (pct(withKeyPoints, total) * 0.4));
  const authorsScore = Math.min(100, uniqueAuthors * 25);
  const evergreenScore = Math.min(100, guides.length * 8 + guidesWithFaq * 4 + pct(explainers, total) * 0.3);
  const freshnessScore = Math.round((pct(updated90, total) * 0.5) + Math.min(100, fresh7 * 8) * 0.5);
  const experienceScore = Math.round((pct(solidMeta, total) * 0.5) + (pct(withImage, total) * 0.5));

  const pillars: TrustPillar[] = [
    {
      id: 'authority',
      label: 'Autoridad editorial',
      score: authorityScore,
      weight: 1.2,
      strength: `${withAuthor} de ${total} notas tienen autor identificado.`,
      weakness: withAuthorPhoto < total ? `${total - withAuthorPhoto} notas sin foto de autor.` : 'Sin brechas relevantes.',
      nextAction: 'Completar biografía y foto de cada firma en las páginas de autor.',
    },
    {
      id: 'variety',
      label: 'Variedad temática',
      score: varietyScore,
      weight: 1,
      strength: `${categories} categorías activas en el archivo.`,
      weakness: categories < 7 ? 'Cobertura concentrada en pocas secciones.' : 'Cobertura amplia.',
      nextAction: 'Abrir cobertura estable en Economía, Salud y Educación.',
    },
    {
      id: 'depth',
      label: 'Profundidad',
      score: depthScore,
      weight: 1.2,
      strength: `${deep} notas superan las 400 palabras y ${withKeyPoints} tienen puntos clave.`,
      weakness: deep < total * 0.4 ? 'La mayoría del archivo es contenido corto.' : 'Profundidad aceptable.',
      nextAction: 'Convertir 1 nota diaria en pieza de más de 600 palabras con contexto.',
    },
    {
      id: 'authors',
      label: 'Autores',
      score: authorsScore,
      weight: 0.8,
      strength: `${uniqueAuthors} firma${uniqueAuthors === 1 ? '' : 's'} en circulación.`,
      weakness: uniqueAuthors < 3 ? 'Google penaliza medios con una sola firma genérica.' : 'Plantilla de firmas suficiente.',
      nextAction: 'Sumar al menos 3 firmas con especialidad declarada.',
    },
    {
      id: 'evergreen',
      label: 'Guías evergreen',
      score: evergreenScore,
      weight: 1,
      strength: `${guides.length} guías permanentes, ${guidesWithFaq} con FAQ estructurada.`,
      weakness: guides.length < 12 ? 'Pocas piezas de referencia permanente.' : 'Biblioteca sólida.',
      nextAction: 'Publicar 1 guía evergreen nueva por semana en categorías comerciales.',
    },
    {
      id: 'freshness',
      label: 'Actualización',
      score: freshnessScore,
      weight: 1,
      strength: `${fresh7} publicaciones en los últimos 7 días.`,
      weakness: fresh7 < 10 ? 'Ritmo de publicación bajo para señales de frescura.' : 'Ritmo constante.',
      nextAction: 'Mantener un mínimo de 3 publicaciones diarias y refrescar evergreens cada trimestre.',
    },
    {
      id: 'experience',
      label: 'Experiencia',
      score: experienceScore,
      weight: 1,
      strength: `${withImage} notas con imagen propia y ${solidMeta} con meta sólida.`,
      weakness: withImage < total ? `${total - withImage} notas usan el logo como imagen.` : 'Sin brechas visuales.',
      nextAction: 'Sustituir las imágenes genéricas por material propio o licenciado.',
    },
  ];

  const weightSum = pillars.reduce((s, p) => s + p.weight, 0);
  const score = Math.round(pillars.reduce((s, p) => s + p.score * p.weight, 0) / weightSum);

  const level: GoogleTrust['level'] = score >= 75 ? 'sólido' : score >= 50 ? 'en construcción' : 'frágil';

  const sorted = [...pillars].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter((p) => p.score >= 70).slice(0, 3).map((p) => `${p.label}: ${p.strength}`);
  const weaknesses = [...pillars].sort((a, b) => a.score - b.score).filter((p) => p.score < 70).slice(0, 3).map((p) => `${p.label}: ${p.weakness}`);
  const nextActions = [...pillars].sort((a, b) => a.score * a.weight - b.score * b.weight).slice(0, 3).map((p) => p.nextAction);

  return {
    score,
    level,
    pillars,
    googleSees: {
      strengths: strengths.length ? strengths : ['Aún no hay señales de autoridad consolidadas.'],
      weaknesses: weaknesses.length ? weaknesses : ['Sin debilidades críticas detectadas.'],
      nextActions,
    },
  };
}
