import { type Noticia, FALLBACK_IMAGE } from './types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { capitalizeFirst, normalizeEditorialTitle } from './formateo';
import { logger } from './logger';
import { unstable_cache, revalidateTag } from 'next/cache';

const DEFAULT_NEWS_COUNT = 30;
const DEFAULT_MAS_LEIDAS_COUNT = 5;
const MAX_COUNT = 500;

type FirestoreNoticiaData = Partial<Noticia> & {
  publicado?: boolean;
  palabrasClave?: string[];
  metaDescripcion?: string;
};

export const LIST_FIELDS = [
  'slug',
  'titulo',
  'resumen',
  'imagen',
  'categoria',
  'fecha',
  'fechaActualizacion',
  'vistas',
  'estado',
  'publicado',
  'noindex',
  'autor',
  'autorFoto',
  'destacada',
  'pieFoto',
  'keywords',
  'metaDescription',
  'metaDescripcion',
  'tags',
  'palabras',
] as const;

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
      const sec = Number((value as any)._seconds);
      const ns = Number((value as any)._nanoseconds || 0);
      const d = new Date(sec * 1000 + ns / 1_000_000);
      return !isNaN(d.getTime()) ? d.toISOString() : '';
    } catch { return ''; }
  }
  if (typeof value === 'string') return value;
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : value.toISOString();
  return '';
}

function validateCount(count: number, defaultCount: number): number {
  if (typeof count !== 'number' || isNaN(count)) return defaultCount;
  if (count < 0) return defaultCount;
  if (count > MAX_COUNT) return MAX_COUNT;
  return count || defaultCount;
}

function mapDocToNoticia(d: QueryDocumentSnapshot): Noticia {
  const data = d.data() as FirestoreNoticiaData;
  return {
    id: d.id,
    slug: data.slug || d.id,
    titulo: normalizeEditorialTitle(capitalizeFirst(data.titulo || '')),
    resumen: data.resumen || '',
    contenido: data.contenido,
    categoria: data.categoria || 'Actualidad',
    imagen: normalizeImage(data.imagen || ''),
    fecha: safeDateString(data.fecha),
    fechaActualizacion: safeDateString(data.fechaActualizacion),
    autor: data.autor,
    autorFoto: data.autorFoto,
    destacada: data.destacada,
    vistas: data.vistas,
    palabras: data.palabras,
    tags: data.tags || data.palabrasClave || [],
    pieFoto: data.pieFoto,
    puntosClave: data.puntosClave,
    metaDescription: data.metaDescription || data.metaDescripcion || '',
    keywords: data.keywords || (Array.isArray(data.palabrasClave) ? data.palabrasClave.join(', ') : '') || '',
    estado: data.estado || (data.publicado === false ? 'borrador' : 'publicado'),
    noindex: !!data.noindex,
  };
}

export function invalidateFirestoreCache() {
  try {
    revalidateTag('noticias');
  } catch { /* runtime only */ }
}

/** Query base para listados: publicadas, ordenadas, proyectadas */
async function fetchNoticiasList(fields: string[], limit: number): Promise<Noticia[]> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .orderBy('fecha', 'desc')
      .select(...fields)
      .limit(limit)
      .get();

    const noticias = snap.docs.map(mapDocToNoticia).filter(n => n.estado !== 'borrador' && n.estado !== 'archivado');

    const unique = new Map<string, Noticia>();
    for (const n of noticias) {
      const existing = unique.get(n.slug);
      if (!existing || new Date(n.fecha).getTime() > new Date(existing.fecha).getTime()) {
        unique.set(n.slug, n);
      }
    }
    // Ordenar por fecha descendente después de deduplicar (Map puede alterar el orden de Firestore)
    return Array.from(unique.values()).sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  } catch (err) {
    logger.error('[data.ts] fetchNoticiasList error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

const _cachedGetNews = unstable_cache(
  async (count: number) => fetchNoticiasList([...LIST_FIELDS], count),
  ['noticias-list'],
  { revalidate: 300, tags: ['noticias'] } // 5 minutos para noticias nuevas sin saturar Firebase
);

export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  return _cachedGetNews(validatedCount);
}

const _cachedGetByCategory = unstable_cache(
  async (categoria: string, count: number) => {
    try {
      // Leemos noticias ya publicadas y filtramos por categoría en memoria
      // para evitar depender de índices compuestos en Firestore.
      const noticias = await fetchNoticiasList([...LIST_FIELDS], MAX_COUNT);
      return noticias.filter(n => n.categoria === categoria).slice(0, count);
    } catch (err) {
      logger.error(`[data.ts] getNewsByCategory error ${categoria}:`, err instanceof Error ? err.message : String(err));
      return [];
    }
  },
  ['noticias-cat'],
  { revalidate: 3600, tags: ['noticias'] } // 1 hora, las categorías cambian poco
);

export async function getNewsByCategory(categoria: string, count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  return _cachedGetByCategory(categoria, validatedCount);
}

const _cachedGetMasLeidas = unstable_cache(
  async (count: number) => {
    try {
      const { Timestamp } = await import('firebase-admin/firestore');
      const noticias = await getNews(100);
      if (noticias.length === 0) return [];

      const cutoff7 = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const cutoffMs7 = cutoff7.toDate().getTime();

      const withViews = noticias
        .filter((n) => new Date(n.fecha).getTime() >= cutoffMs7 && (n.vistas ?? 0) >= 1)
        .sort((a, b) => (b.vistas ?? 0) - (a.vistas ?? 0));

      if (withViews.length >= count) return withViews.slice(0, count);

      const cutoff3 = Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
      const cutoffMs3 = cutoff3.toDate().getTime();
      const recent3 = noticias.filter((n) => new Date(n.fecha).getTime() >= cutoffMs3);
      if (recent3.length >= count) return recent3.slice(0, count);

      return noticias.slice(0, count);
    } catch (err) {
      logger.error('[data.ts] getMasLeidas error:', err instanceof Error ? err.message : String(err));
    }
    return [];
  },
  ['mas-leidas'],
  { revalidate: 300, tags: ['noticias'] }
);

export async function getMasLeidas(count: number = DEFAULT_MAS_LEIDAS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_MAS_LEIDAS_COUNT);
  return _cachedGetMasLeidas(validatedCount);
}

const SLUG_RE = /^[a-zA-Z0-9_\-\u00C0-\u017F]+$/;
const SLUG_MAX_LEN = 200;

function isValidSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length <= SLUG_MAX_LEN && SLUG_RE.test(slug);
}

const _cachedGetBySlug = unstable_cache(
  async (slug: string) => {
    try {
      const { adminDb } = await import('./firebase-admin');

      let snap = await adminDb
        .collection('noticias')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (snap.empty) {
        const slugSinSufijo = slug.replace(/-[a-z0-9]{6,}$/i, '');
        if (slugSinSufijo !== slug && slugSinSufijo.length >= 3) {
          logger.info('[data.ts] Fallback slug sin sufijo:', slug, '→', slugSinSufijo);
          snap = await adminDb
            .collection('noticias')
            .where('slug', '==', slugSinSufijo)
            .limit(1)
            .get();
        }
      }

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data() as FirestoreNoticiaData;
        const docSlug = data.slug || doc.id;
        const titulo = normalizeEditorialTitle(capitalizeFirst(data.titulo || ''));
        const contenido = data.contenido || '';
        if (!docSlug?.trim() || titulo.trim().length <= 5 || contenido.trim().length <= 20 || !data.categoria?.trim()) {
          logger.warn('[data.ts] Noticia rechazada por datos insuficientes:', { slug, titulo: titulo.slice(0, 40) });
          return null;
        }
        return {
          id: doc.id,
          slug: docSlug,
          titulo,
          resumen: data.resumen || '',
          contenido,
          categoria: data.categoria || 'Actualidad',
          imagen: normalizeImage(data.imagen || ''),
          fecha: safeDateString(data.fecha),
          fechaActualizacion: safeDateString(data.fechaActualizacion),
          autor: data.autor,
          autorFoto: data.autorFoto,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
          tags: data.tags,
          pieFoto: data.pieFoto,
          puntosClave: data.puntosClave,
          metaDescription: data.metaDescription || data.metaDescripcion || '',
          keywords: data.keywords || '',
          estado: data.estado || (data.publicado === false ? 'borrador' : 'publicado'),
          noindex: !!data.noindex,
        };
      }
    } catch (err) {
      logger.error('[data.ts] getNewsBySlug error:', err instanceof Error ? err.message : String(err));
    }
    return null;
  },
  ['noticia-slug'],
  { revalidate: 300, tags: ['noticias'] }
);

export async function getNewsBySlug(slug: string): Promise<Noticia | null> {
  if (!isValidSlug(slug)) {
    logger.warn('[data.ts] Slug rechazado por validación:', slug);
    return null;
  }
  return _cachedGetBySlug(slug);
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .select('slug')
      .limit(2000)
      .get();

    return snap.docs
      .map((d: any) => d.data().slug)
      .filter(Boolean);
  } catch (err) {
    logger.error('[data.ts] getAllSlugs error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getRelatedNews(categoria: string, excludeSlug: string, count: number = 3): Promise<Noticia[]> {
  const validatedCount = validateCount(count, 3);
  try {
    const all = await getNews(30);
    return all
      .filter((n) => n.categoria === categoria && n.slug !== excludeSlug)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, validatedCount);
  } catch (err) {
    logger.error('[data.ts] getRelatedNews error:', err instanceof Error ? err.message : String(err));
  }
  return [];
}
