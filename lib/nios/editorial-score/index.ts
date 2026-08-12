import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
import { hasWeakMetaDescription, hasWeakKeywords } from '@/lib/seo/effective';

export interface EditorialScore {
  total: number;
  components: { label: string; score: number; weight: number }[];
  verdict: string;
}

export function calculateEditorialScore(
  noticias: Noticia[],
  guides: EvergreenArticle[] = []
): EditorialScore {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const total = published.length || 1;

  function withMeta(n: Noticia) {
    return !hasWeakMetaDescription(n);
  }
  function hasAuthor(n: Noticia) {
    return !!n.autor?.trim();
  }
  function hasImage(n: Noticia) {
    return !!n.imagen && !n.imagen.includes('logo');
  }
  function hasKeywords(n: Noticia) {
    return !hasWeakKeywords(n);
  }

  const contentScore = Math.round((published.filter((n) => (n.palabras || 0) >= 200 && (n.palabras || 0) <= 1000).length / total) * 100);
  const seoScore = Math.round((published.filter((n) => withMeta(n) && hasKeywords(n) && n.titulo.length <= 60).length / total) * 100);
  const googleScore = Math.round((published.filter((n) => hasImage(n) && hasAuthor(n) && Array.isArray(n.puntosClave) && n.puntosClave.length > 0).length / total) * 100);
  const eeatsScore = Math.round(((published.filter(hasAuthor).length + published.filter((n) => n.scoreMeni && n.scoreMeni >= 70).length + published.filter((n) => n.autorFoto).length) / (total * 3)) * 100);
  const distributionScore = Math.min(100, Math.round(((published.length > 0 ? 60 : 0) + (guides.length * 5))));
  const trustScore = Math.round((published.filter((n) => !n.noindex && n.autor).length / total) * 100);
  const utilityScore = Math.round((published.filter((n) => (n.palabras || 0) >= 200 || n.articleType === 'guia' || n.articleType === 'explicador').length / total) * 100);
  const updateScore = Math.round((published.filter((n) => n.fechaActualizacion || toDate(n.fecha).getTime() > Date.now() - 180 * 24 * 60 * 60 * 1000).length / total) * 100);
  const diversityScore = Math.min(100, new Set(published.map((n) => n.categoria)).size * 15);
  const evergreenScore = Math.min(100, Math.round(((guides.length + published.filter((n) => n.articleType === 'guia' || n.articleType === 'explicador').length) / (total || 1)) * 100));

  const components = [
    { label: 'Contenido', score: contentScore, weight: 1 },
    { label: 'SEO', score: seoScore, weight: 1 },
    { label: 'Google', score: googleScore, weight: 1 },
    { label: 'EEAT', score: eeatsScore, weight: 1 },
    { label: 'Distribución', score: distributionScore, weight: 0.5 },
    { label: 'Confianza', score: trustScore, weight: 1 },
    { label: 'Utilidad', score: utilityScore, weight: 1 },
    { label: 'Actualización', score: updateScore, weight: 0.5 },
    { label: 'Diversidad', score: diversityScore, weight: 0.5 },
    { label: 'Evergreen', score: evergreenScore, weight: 0.5 },
  ];

  const totalScore = Math.round(components.reduce((sum, c) => sum + c.score * c.weight, 0) / components.reduce((sum, c) => sum + c.weight, 0));

  let verdict = '';
  if (totalScore >= 80) verdict = 'Excelente salud editorial.';
  else if (totalScore >= 60) verdict = 'Salud estable con oportunidades de mejora.';
  else if (totalScore >= 40) verdict = 'Requiere atención en varios ejes.';
  else verdict = 'Editorial en riesgo. Acciones urgentes.';

  return { total: totalScore, components, verdict };
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}
