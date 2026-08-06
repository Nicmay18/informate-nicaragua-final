import { adminDb } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';
import type { Noticia } from '@/lib/types';
import { FALLBACK_IMAGE } from '@/lib/types';
import { EVERGREEN_ARTICLES } from '@/lib/evergreen';

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

export interface Tema {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  relatedCategories: string[];
  image?: string;
}

export const TOPICS: Tema[] = [
  {
    slug: 'apostilla',
    name: 'Apostilla de documentos en Nicaragua',
    description: 'Guías, trámites y noticias sobre cómo apostillar documentos nicaragüenses para usar en el extranjero.',
    keywords: ['apostilla', 'cancillería', 'documentos', 'legalización', 'migración', 'trámites Nicaragua'],
    relatedCategories: ['Nacionales'],
  },
  {
    slug: 'policia-nacional',
    name: 'Policía Nacional de Nicaragua',
    description: 'Noticias, reportes y guías sobre la Policía Nacional, antecedentes penales y seguridad ciudadana.',
    keywords: ['policía', 'antecedentes penales', 'récord policial', 'seguridad', 'capturas'],
    relatedCategories: ['Sucesos', 'Nacionales'],
  },
  {
    slug: 'turismo-nicaragua',
    name: 'Turismo en Nicaragua',
    description: 'Destinos turísticos, guías de viaje, volcanes, playas y cultura nicaragüense.',
    keywords: ['turismo', 'viajes', 'Granada', 'León', 'Ometepe', 'volcanes', 'playas'],
    relatedCategories: ['Nacionales', 'Espectáculos'],
  },
  {
    slug: 'tecnologia-nicaragua',
    name: 'Tecnología en Nicaragua',
    description: 'Innovación, startups, internet, telecomunicaciones y transformación digital en Nicaragua.',
    keywords: ['tecnología', 'internet', 'startups', 'telecomunicaciones', 'digital'],
    relatedCategories: ['Tecnología'],
  },
  {
    slug: 'deportes-nicaragua',
    name: 'Deportes en Nicaragua',
    description: 'Resultados, fichajes y noticias del deporte nicaragüense: fútbol, béisbol y atletismo.',
    keywords: ['fútbol', 'béisbol', 'liga primera', 'selección nacional', 'deportes'],
    relatedCategories: ['Deportes'],
  },
  {
    slug: 'economia-nicaragua',
    name: 'Economía de Nicaragua',
    description: 'Noticias sobre economía, comercio, inversión y desarrollo económico en Nicaragua.',
    keywords: ['economía', 'inversión', 'comercio', 'precios', 'mercado', 'finanzas'],
    relatedCategories: ['Nacionales'],
  },
];

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
      noindex: !!data.noindex,
    } as Noticia;
  });

function matchesTema(noticia: Noticia, tema: Tema): boolean {
  const haystack = `${noticia.titulo} ${noticia.resumen} ${noticia.contenido || ''} ${(noticia.tags || []).join(' ')}`.toLowerCase();
  return (
    tema.relatedCategories.includes(noticia.categoria) ||
    tema.keywords.some((k) => haystack.includes(k.toLowerCase()))
  );
}

async function loadTemaArticlesRaw(tema: Tema): Promise<Noticia[]> {
  try {
    const snap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .orderBy('fecha', 'desc')
      .limit(50)
      .get();

    const all = normalizeTemaNews(snap.docs);
    return all.filter((n) => matchesTema(n, tema));
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
      const snap = await adminDb
        .collection('noticias')
        .where('estado', '==', 'publicado')
        .orderBy('fecha', 'desc')
        .limit(500)
        .get();

      const all = normalizeTemaNews(snap.docs).filter((n) => matchesTema(n, tema));
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
