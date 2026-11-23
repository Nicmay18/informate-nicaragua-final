import { adminDb } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';
import type { Noticia } from '@/lib/types';
import { FALLBACK_IMAGE } from '@/lib/types';
import { EVERGREEN_ARTICLES } from '@/lib/evergreen';
import { trackRegen } from '@/lib/metrics/daily-counters';
import { TOPICS } from '@/lib/temas';
import type { Tema } from '@/lib/temas';

// Re-export para compatibilidad con imports existentes.
export { TOPICS, computeTemaSlugs } from '@/lib/temas';
export type { Tema } from '@/lib/temas';

function normalizeImage(imagen: string): string {
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return FALLBACK_IMAGE;
  if (imagen.startsWith('/images/')) return imagen;
  if (imagen.startsWith('data:')) return imagen;
  if (imagen.includes('firebasestorage.googleapis.com') || imagen.includes('storage.googleapis.com')) {
    try {
      const url = new URL(imagen);
      const pathMatch = url.pathname.match(/\/(?:v0\/b\/[^/]+\/o\/)?(?:images%2F)?(.+)$/);
      if (pathMatch) {
        const encoded = pathMatch[1];
        const decoded = decodeURIComponent(encoded);
        const filename = decoded.split('/').pop()?.trim();
        if (filename && filename.length > 1) return `/images/${filename}`;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments.pop();
      if (last && last.length > 1) return `/images/${last}`;
    } catch { /* fallback */ }
    const raw = imagen.split('/').pop()?.split('?')[0]?.trim();
    if (raw && raw.length > 1) return `/images/${raw}`;
    return FALLBACK_IMAGE;
  }
  if (imagen.includes('cdn.jsdelivr.net')) return imagen.split('?')[0];
  if (imagen.includes('githubusercontent.com')) {
    const clean = imagen.split('?')[0];
    const match = clean.match(/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)/);
    if (match) {
      const [, user, repo, branch, path] = match;
      return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
    }
    return clean;
  }
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen.split('?')[0];
  if (imagen.startsWith('images/')) return `/${imagen}`;
  if (imagen.startsWith('/')) return imagen;
  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) return FALLBACK_IMAGE;
  return `/images/${fn}`;
}

function safeDateString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch { return ''; }
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    try {
      const d = new Date(((value as any)._seconds as number) * 1000);
      return !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch { return ''; }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return !isNaN(d.getTime()) ? d.toISOString() : '';
  }
  return '';
}

const normalizeTemaNews = (docs: FirebaseFirestore.QueryDocumentSnapshot[]): Noticia[] =>
  docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      slug: data.slug || doc.id,
      titulo: data.titulo || '',
      resumen: data.resumen || '',
      contenido: data.contenido || '',
      categoria: data.categoria || 'General',
      imagen: normalizeImage(data.imagen || ''),
      fecha: safeDateString(data.fecha),
      fechaActualizacion: safeDateString(data.fechaActualizacion),
      autor: data.autor,
      autorFoto: data.autorFoto,
      destacada: data.destacada,
      vistas: data.vistas,
      palabras: data.palabras,
      tags: data.tags,
      estado: data.estado || 'publicado',
      publicado: data.publicado,
      archived: data.archived,
      noindex: !!data.noindex,
    } as Noticia;
  });

// Campos que la tarjeta de /tema/[slug] realmente usa — SIN `contenido`
// (~10KB/doc). Antes la página leía hasta 500 docs completos por
// regeneración para filtrar por keywords en memoria; ahora el campo
// `temas` (precalculado al escribir la noticia) hace el filtrado en
// Firestore y solo viajan los artículos que sí corresponden al tema.
const TEMA_CARD_FIELDS = [
  'slug', 'titulo', 'resumen', 'categoria', 'imagen', 'fecha',
  'fechaActualizacion', 'autor', 'autorFoto', 'destacada', 'vistas',
  'palabras', 'tags', 'estado', 'publicado', 'archived', 'noindex', 'temas',
];

async function loadTemaArticlesRaw(tema: Tema): Promise<Noticia[]> {
  try {
    // Solo array-contains (índice de un solo campo — sin índice compuesto
    // nuevo). estado/publicado/archived se filtran en memoria: los matches
    // por tema son decenas, no cientos.
    const snap = await adminDb
      .collection('noticias')
      .where('temas', 'array-contains', tema.slug)
      .limit(200)
      .select(...TEMA_CARD_FIELDS)
      .get();

    await trackRegen('tema_articles', { key: tema.slug, docs: snap.size });
    return normalizeTemaNews(snap.docs)
      .filter((n) => n.estado === 'publicado')
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 50);
  } catch (err) {
    logger.error(`[topics] Error cargando artículos del tema ${tema.slug}:`, err);
    return [];
  }
}

export const getCachedTemaArticles = unstable_cache(
  async (slug: string) => {
    const tema = TOPICS.find((t) => t.slug === slug);
    if (!tema) return null;
    return loadTemaArticlesRaw(tema);
  },
  ['tema-articles'],
  { revalidate: 3600, tags: ['noticias', 'temas'] }
);

export const getCachedTemaArticlesPaginated = unstable_cache(
  async (slug: string, page: number, pageSize: number) => {
    const tema = TOPICS.find((t) => t.slug === slug);
    if (!tema) return { articles: [] as Noticia[], total: 0 };
    try {
      // Filtrado por el campo `temas` precomputado (ver computeTemaSlugs) —
      // antes leía hasta 500 documentos completos (~5MB) por regeneración.
      // Sin orderBy (evita índice compuesto nuevo): se leen TODOS los
      // matches (acotados por el tamaño de la colección) y se ordenan en
      // memoria — necesario para `total` y paginación profunda correctas.
      const snap = await adminDb
        .collection('noticias')
        .where('temas', 'array-contains', tema.slug)
        .limit(1000)
        .select(...TEMA_CARD_FIELDS)
        .get();

      await trackRegen('tema_paginated', { key: tema.slug, docs: snap.size });
      const all = normalizeTemaNews(snap.docs)
        .filter((n) => n.estado === 'publicado')
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      const total = all.length;
      const offset = (page - 1) * pageSize;
      const articles = all.slice(offset, offset + pageSize);
      return { articles, total };
    } catch (err) {
      logger.error(`[topics] Error cargando artículos paginados del tema ${tema.slug}:`, err);
      return { articles: [] as Noticia[], total: 0 };
    }
  },
  ['tema-articles-paginated'],
  { revalidate: 3600, tags: ['noticias', 'temas'] }
);

export const getCachedTemaBySlug = unstable_cache(
  async (slug: string): Promise<Tema | null> => {
    const tema = TOPICS.find((t) => t.slug === slug);
    return tema || null;
  },
  ['tema-by-slug'],
  { revalidate: 86400 }
);

export function getAllTemaSlugs(): string[] {
  return TOPICS.map((t) => t.slug);
}

export function getTemaEvergreen(tema: Tema): Array<typeof EVERGREEN_ARTICLES[number]> {
  const keywords = new Set(tema.keywords.map((k) => k.toLowerCase()));
  return EVERGREEN_ARTICLES.filter((g) => {
    const text = `${g.title} ${g.description} ${g.category} ${g.content}`.toLowerCase();
    return Array.from(keywords).some((k) => text.includes(k));
  });
}

export function getTemaFeatured(noticias: Noticia[]): Noticia[] {
  return noticias
    .filter((n) => n.destacada || (n.vistas && n.vistas > 100))
    .slice(0, 4);
}
