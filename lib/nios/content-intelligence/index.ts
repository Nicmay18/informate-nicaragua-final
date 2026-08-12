import type { Noticia } from '@/lib/types';
import type { EvergreenArticle } from '@/lib/evergreen';
export interface ContentIntelligence {
  duplicateGroups: { key: string; count: number; slugs: string[]; reason: string }[];
  cannibalization: { keyword: string; count: number; slugs: string[] }[];
  abandoned: { slug: string; title: string; categoria: string; lastDate: string; views: number }[];
  evergreenCandidates: { slug: string; title: string; categoria: string; views: number; reason: string }[];
  updateCandidates: { slug: string; title: string; categoria: string; views: number; ageDays: number }[];
  withoutInternalLinks: { slug: string; title: string; reason: string }[];
  lowContext: { slug: string; title: string; wordCount: number; reason: string }[];
  tooShort: { slug: string; title: string; words: number }[];
  tooLong: { slug: string; title: string; words: number }[];
  lowViews: { slug: string; title: string; views: number }[];
  growing: { slug: string; title: string; views: number }[];
  viral: { slug: string; title: string; views: number }[];
  historical: { slug: string; title: string; date: string }[];
  featuredCandidates: { slug: string; title: string; score: number; reason: string }[];
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return isNaN(v.getTime()) ? new Date() : v;
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function daysAgo(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñ0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !['noticia', 'nicaragua', 'informate', '2024', '2025', '2026'].includes(w));
}

const EVERGREEN_TRIGGERS = ['cómo', 'requisitos', 'pasos', 'guía', 'costo', 'dólar', 'salario', 'pasaporte', 'apostilla', 'récord policial', 'migración', 'turismo', 'cuándo', 'dónde', 'qué es', 'cómo funciona'];

export function runContentIntelligence(noticias: Noticia[], guides: EvergreenArticle[] = []): ContentIntelligence {
  void guides;
  const published = noticias.filter((n) => n.estado !== 'borrador' && n.estado !== 'archivado');

  // duplicados por similaridad de palabras significativas
  const byWords: Record<string, string[]> = {};
  for (const n of published) {
    const words = normalizeWords(`${n.titulo} ${n.resumen}`).sort().slice(0, 6).join(' ');
    if (!words) continue;
    if (!byWords[words]) byWords[words] = [];
    byWords[words].push(n.slug);
  }
  const duplicateGroups = Object.entries(byWords)
    .filter(([, slugs]) => slugs.length > 1)
    .map(([key, slugs]) => ({ key, count: slugs.length, slugs, reason: 'Título/resumen con palabras clave muy similares.' }));

  // canibalización por keyword
  const kwMap: Record<string, string[]> = {};
  for (const n of published) {
    const kws = (n.keywords || '').split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    for (const k of kws) {
      if (!kwMap[k]) kwMap[k] = [];
      kwMap[k].push(n.slug);
    }
  }
  const cannibalization = Object.entries(kwMap)
    .filter(([, slugs]) => slugs.length > 2)
    .map(([keyword, slugs]) => ({ keyword, count: slugs.length, slugs }));

  const now = Date.now();
  const ms90 = now - 90 * 24 * 60 * 60 * 1000;

  const abandoned = published
    .filter((n) => (n.vistas || 0) > 0 && (n.vistas || 0) < 10 && toDate(n.fecha).getTime() < ms90)
    .map((n) => ({ slug: n.slug, title: n.titulo, categoria: n.categoria, lastDate: n.fecha, views: n.vistas || 0 }));

  const evergreenCandidates = published
    .filter((n) => {
      const text = `${n.titulo} ${n.resumen}`.toLowerCase();
      return EVERGREEN_TRIGGERS.some((t) => text.includes(t));
    })
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
    .slice(0, 10)
    .map((n) => ({ slug: n.slug, title: n.titulo, categoria: n.categoria, views: n.vistas || 0, reason: 'Tema recurrente de búsqueda.' }));

  const updateCandidates = published
    .filter((n) => (n.vistas || 0) >= 20)
    .map((n) => ({ slug: n.slug, title: n.titulo, categoria: n.categoria, views: n.vistas || 0, ageDays: daysAgo(toDate(n.fecha)) }))
    .filter((n) => n.ageDays > 30)
    .sort((a, b) => b.ageDays - a.ageDays);

  const withoutInternalLinks = published
    .filter((n) => !(n.related_links && n.related_links.length > 0))
    .slice(0, 20)
    .map((n) => ({ slug: n.slug, title: n.titulo, reason: 'Sin enlaces internos relacionados.' }));

  const lowContext = published
    .filter((n) => (n.palabras || 0) > 0 && (n.palabras || 0) < 200)
    .map((n) => ({ slug: n.slug, title: n.titulo, wordCount: n.palabras || 0, reason: 'Contenido corto, posible falta de contexto.' }));

  const tooShort = published.filter((n) => (n.palabras || 0) > 0 && (n.palabras || 0) < 150).map((n) => ({ slug: n.slug, title: n.titulo, words: n.palabras || 0 }));
  const tooLong = published.filter((n) => (n.palabras || 0) > 1200).map((n) => ({ slug: n.slug, title: n.titulo, words: n.palabras || 0 }));
  const lowViews = published.filter((n) => (n.vistas || 0) < 5).map((n) => ({ slug: n.slug, title: n.titulo, views: n.vistas || 0 }));

  const growing = published
    .filter((n) => toDate(n.fecha).getTime() >= now - 7 * 24 * 60 * 60 * 1000 && (n.vistas || 0) >= 30)
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
    .slice(0, 5)
    .map((n) => ({ slug: n.slug, title: n.titulo, views: n.vistas || 0 }));

  const viral = published
    .filter((n) => (n.vistas || 0) >= 100)
    .sort((a, b) => (b.vistas || 0) - (a.vistas || 0))
    .slice(0, 5)
    .map((n) => ({ slug: n.slug, title: n.titulo, views: n.vistas || 0 }));

  const historical = published
    .filter((n) => toDate(n.fecha).getTime() < now - 365 * 24 * 60 * 60 * 1000)
    .slice(0, 10)
    .map((n) => ({ slug: n.slug, title: n.titulo, date: n.fecha }));

  const featuredCandidates = published
    .map((n) => {
      let score = 0;
      if (n.categoria === 'Nacionales') score += 20;
      if (n.categoria === 'Sucesos') score -= 15;
      score += Math.min(30, (n.vistas || 0) / 10);
      if (n.imagen && !n.imagen.includes('logo')) score += 10;
      if (n.puntosClave && n.puntosClave.length > 0) score += 10;
      if (n.scoreMeni && n.scoreMeni >= 85) score += 20;
      return { slug: n.slug, title: n.titulo, score, reason: 'Mayor equilibrio de categoría, calidad e imagen.' };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    duplicateGroups,
    cannibalization,
    abandoned,
    evergreenCandidates,
    updateCandidates,
    withoutInternalLinks,
    lowContext,
    tooShort,
    tooLong,
    lowViews,
    growing,
    viral,
    historical,
    featuredCandidates,
  };
}
