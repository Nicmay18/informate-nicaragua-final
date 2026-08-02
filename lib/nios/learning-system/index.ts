import type { Noticia } from '@/lib/types';

export interface LearningInsight {
  pattern: string;
  evidence: string;
  recommendation: string;
}

export interface LearningSystem {
  insights: LearningInsight[];
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export function runLearningSystem(noticias: Noticia[]): LearningSystem {
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');
  const insights: LearningInsight[] = [];

  // titulares con números
  const withNumbers = published.filter((n) => /\d/.test(n.titulo));
  const avgNum = withNumbers.length ? withNumbers.reduce((s, n) => s + (n.vistas || 0), 0) / withNumbers.length : 0;
  const avgAll = published.length ? published.reduce((s, n) => s + (n.vistas || 0), 0) / published.length : 0;
  if (avgNum > avgAll) {
    insights.push({
      pattern: 'Titulares con números',
      evidence: `Promedio ${avgNum.toFixed(0)} vistas vs ${avgAll.toFixed(0)} general.`,
      recommendation: 'Usar cifras concretas en titulares cuando sea posible.',
    });
  }

  // categorías con mejor rendimiento
  const catViews: Record<string, { total: number; count: number }> = {};
  for (const n of published) {
    if (!catViews[n.categoria]) catViews[n.categoria] = { total: 0, count: 0 };
    catViews[n.categoria].total += n.vistas || 0;
    catViews[n.categoria].count++;
  }
  const sorted = Object.entries(catViews).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));
  if (sorted[0]) {
    insights.push({
      pattern: 'Categoría con mejor promedio',
      evidence: `${sorted[0][0]} genera ${(sorted[0][1].total / sorted[0][1].count).toFixed(0)} vistas en promedio.`,
      recommendation: `Priorizar más contenido en ${sorted[0][0]}.`,
    });
  }

  // longitud de contenido
  const long = published.filter((n) => (n.palabras || 0) >= 400);
  const short = published.filter((n) => (n.palabras || 0) < 300);
  if (long.length && short.length) {
    const avgLong = long.reduce((s, n) => s + (n.vistas || 0), 0) / long.length;
    const avgShort = short.reduce((s, n) => s + (n.vistas || 0), 0) / short.length;
    if (avgLong > avgShort) {
      insights.push({
        pattern: 'Contenido más extenso',
        evidence: `Artículos >= 400 palabras: ${avgLong.toFixed(0)} vistas. Artículos < 300: ${avgShort.toFixed(0)} vistas.`,
        recommendation: 'Producción con 400+ palabras para temas de fondo.',
      });
    }
  }

  // horarios
  const hours: Record<number, number> = {};
  for (const n of published) {
    const h = toDate(n.fecha).getHours();
    hours[h] = (hours[h] || 0) + (n.vistas || 0);
  }
  const bestHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];
  if (bestHour) {
    insights.push({
      pattern: 'Mejor hora de publicación',
      evidence: `Las noticias publicadas a las ${bestHour[0]}:00 suman ${bestHour[1]} vistas.`,
      recommendation: `Publicar contenido clave a las ${bestHour[0]}:00 cuando corresponda.`,
    });
  }

  // guías vs noticias
  const guides = published.filter((n) => n.articleType === 'guia' || n.articleType === 'explicador');
  const news = published.filter((n) => !n.articleType || n.articleType === 'noticia');
  if (guides.length && news.length) {
    const avgGuide = guides.reduce((s, n) => s + (n.vistas || 0), 0) / guides.length;
    const avgNews = news.reduce((s, n) => s + (n.vistas || 0), 0) / news.length;
    if (avgGuide > avgNews) {
      insights.push({
        pattern: 'Guías vs noticias',
        evidence: `Guías: ${avgGuide.toFixed(0)} vistas. Noticias: ${avgNews.toFixed(0)} vistas.`,
        recommendation: 'Convertir noticias recurrentes en guías evergreen.',
      });
    }
  }

  return { insights };
}
