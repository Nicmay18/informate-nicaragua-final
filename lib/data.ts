import { type Noticia, FALLBACK_IMAGE } from './types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { capitalizeFirst, normalizeEditorialTitle } from './formateo';
import { logger } from './logger';
import { unstable_cache, revalidateTag } from 'next/cache';
import { getEditorialDecision, isPublicArticle, resolvePublicCategory } from './editorial/canonical';

const DEFAULT_NEWS_COUNT = 30;
const DEFAULT_MAS_LEIDAS_COUNT = 5;
const MAX_COUNT = 500;

type FirestoreNoticiaData = Partial<Noticia> & {
  archived?: boolean;
  palabrasClave?: string[];
  metaDescripcion?: string;
  publishedAt?: any;
  dateModified?: any;
  fechaPublicacion?: any;
};

export const LIST_FIELDS = [
  'slug',
  'titulo',
  'resumen',
  'imagen',
  'categoria',
  'perfil',
  'fecha',
  'fechaActualizacion',
  'vistas',
  'estado',
  'publicado',
  'aprobadoMeni',
  'archived',
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
  'fuente',
  'fuentesComplementarias',
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
    categoria: resolvePublicCategory({
    perfil: data.perfil,
    categoria: data.categoria,
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
  }),
    perfil: data.perfil || '',
    imagen: normalizeImage(data.imagen || ''),
    fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
    fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
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
    publicado: data.publicado,
    aprobadoMeni: data.aprobadoMeni,
    archived: data.archived,
    noindex: !!data.noindex,
    fuente: data.fuente,
    fuentesComplementarias: Array.isArray(data.fuentesComplementarias)
      ? data.fuentesComplementarias.filter((f: unknown) => typeof f === 'string')
      : undefined,
  };
}

/**
 * @deprecated Use isPublicArticle from lib/editorial/canonical.
 * Filtro canónico de artículos aptos para portada/listados.
 */
export function isPublicNews(data: Partial<Noticia>): boolean {
  return isPublicArticle(data);
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
    // Traer más de lo necesario porque isPublicNews filtra post-query
    // (aprobadoMeni y archived no se filtran en Firestore por compatibilidad de índices)
    const fetchLimit = Math.min(limit * 3, 200);
    const snap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .orderBy('fecha', 'desc')
      .select(...fields)
      .limit(fetchLimit)
      .get();

    const noticias = snap.docs.map(mapDocToNoticia).filter(isPublicNews);

    const unique = new Map<string, Noticia>();
    for (const n of noticias) {
      const existing = unique.get(n.slug);
      if (!existing || new Date(n.fecha).getTime() > new Date(existing.fecha).getTime()) {
        unique.set(n.slug, n);
      }
    }
    // Ordenar por fecha descendente después de deduplicar (Map puede alterar el orden de Firestore)
    const sorted = Array.from(unique.values()).sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    return sorted.slice(0, limit);
  } catch (err) {
    logger.error('[data.ts] fetchNoticiasList error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  return fetchNoticiasList([...LIST_FIELDS], validatedCount);
}

export async function getNewsByCategory(categoria: string, count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  try {
    const { adminDb } = await import('./firebase-admin');
    const fetchLimit = Math.min(validatedCount * 2, 100);
    const snap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .limit(fetchLimit)
      .select(...LIST_FIELDS)
      .get();

    const noticias = snap.docs.map(mapDocToNoticia).filter(isPublicNews);
    // Deduplicar por slug
    const unique = new Map<string, Noticia>();
    for (const n of noticias) {
      const existing = unique.get(n.slug);
      if (!existing || new Date(n.fecha).getTime() > new Date(existing.fecha).getTime()) {
        unique.set(n.slug, n);
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ).slice(0, validatedCount);
  } catch (err) {
    logger.error(`[data.ts] getNewsByCategory error ${categoria}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

const _cachedGetMasLeidas = unstable_cache(
  async (count: number) => {
    try {
      const { adminDb } = await import('./firebase-admin');
      // Traer pool para filtrar por ventana temporal en memoria
      const snap = await adminDb
        .collection('noticias')
        .where('vistas', '>', 0)
        .orderBy('vistas', 'desc')
        .limit(120)
        .select(...LIST_FIELDS)
        .get();

      const noticias = snap.docs.map(mapDocToNoticia).filter(isPublicNews);

      const now = Date.now();
      const withinDays = (n: Noticia, days: number) => {
        const t = new Date(n.fecha).getTime();
        return !isNaN(t) && (now - t) <= days * 24 * 60 * 60 * 1000;
      };

      // REGLA 7: Most Read con ventana temporal.
      // Preferencia: 7 días > 30 días > 90 días > histórico.
      for (const days of [7, 30, 90, 3650]) {
        const recientes = noticias.filter(n => withinDays(n, days));
        if (recientes.length >= count) {
          return recientes.slice(0, count);
        }
      }
      return noticias.slice(0, count);
    } catch (err) {
      logger.error('[data.ts] getMasLeidas error:', err instanceof Error ? err.message : String(err));
      return [];
    }
  },
  ['mas-leidas'],
  { revalidate: 60, tags: ['noticias', 'popular-news'] }
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
        const noticia: Noticia = {
          id: doc.id,
          slug: docSlug,
          titulo,
          resumen: data.resumen || '',
          contenido,
          categoria: resolvePublicCategory({
    perfil: data.perfil,
    categoria: data.categoria,
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
  }),
          perfil: data.perfil || '',
          imagen: normalizeImage(data.imagen || ''),
          fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
          fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
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
          publicado: data.publicado,
          aprobadoMeni: data.aprobadoMeni,
          archived: data.archived,
          noindex: !!data.noindex,
          fuente: data.fuente,
          fuentesComplementarias: Array.isArray(data.fuentesComplementarias)
            ? data.fuentesComplementarias.filter((f: unknown) => typeof f === 'string')
            : undefined,
        };
        if (!isPublicArticle(noticia)) {
          logger.warn('[data.ts] Noticia no apta para publicación según MENI:', { slug: docSlug, razon: getEditorialDecision(noticia).razon });
          return null;
        }
        return noticia;
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
      .select('slug', 'aprobadoMeni', 'publicado', 'archived', 'estado', 'noindex', 'perfil', 'categoria')
      .limit(2000)
      .get();

    return snap.docs
      .map((d: any) => {
        const data = d.data() as FirestoreNoticiaData;
        const article: Partial<Noticia> = {
          slug: data.slug,
          aprobadoMeni: data.aprobadoMeni,
          publicado: data.publicado,
          archived: data.archived,
          estado: data.estado,
          noindex: data.noindex,
        };
        return isPublicArticle(article) ? data.slug : null;
      })
      .filter(Boolean) as string[];
  } catch (err) {
    logger.error('[data.ts] getAllSlugs error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getRelatedNews(categoria: string, excludeSlug: string, count: number = 3): Promise<Noticia[]> {
  const validatedCount = validateCount(count, 3);
  try {
    const { adminDb } = await import('./firebase-admin');
    const snap = await adminDb
      .collection('noticias')
      .where('categoria', '==', categoria)
      .where('estado', '==', 'publicado')
      .orderBy('fecha', 'desc')
      .limit(validatedCount + 10)
      .get();

    return snap.docs
      .map((doc: any) => {
        const data = doc.data();
        const slug = data.slug || doc.id;
        if (slug === excludeSlug) return null;
        return {
          id: doc.id,
          slug,
          titulo: data.titulo || '',
          resumen: data.resumen || '',
          contenido: data.contenido || '',
          categoria: data.categoria || 'Actualidad',
          imagen: normalizeImage(data.imagen || ''),
          fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
          fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
          autor: data.autor,
          autorFoto: data.autorFoto,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
          tags: data.tags,
          estado: data.estado || 'publicado',
          noindex: !!data.noindex,
          aprobadoMeni: data.aprobadoMeni,
          publicado: data.publicado,
          archived: data.archived,
        } as Noticia;
      })
      .filter((n): n is Noticia => n !== null && isPublicNews(n))
      .slice(0, validatedCount);
  } catch (err) {
    logger.error('[data.ts] getRelatedNews error:', err instanceof Error ? err.message : String(err));
    // Fallback al método anterior si el índice no existe
    try {
      const all = await getNews(30);
      return all
        .filter((n) => n.categoria === categoria && n.slug !== excludeSlug)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, validatedCount);
    } catch {
      return [];
    }
  }
}

export const PAGE_SIZE = 12;

export async function getNewsPaginated(page: number = 1, pageSize: number = PAGE_SIZE): Promise<Noticia[]> {
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.max(1, pageSize);
  try {
    const { adminDb } = await import('./firebase-admin');
    const offset = (validatedPage - 1) * validatedPageSize;
    // Traer más para compensar el filtro isPublicNews
    const fetchLimit = Math.min(validatedPageSize * 3, 100);
    const snap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .orderBy('fecha', 'desc')
      .select(...LIST_FIELDS)
      .offset(offset)
      .limit(fetchLimit)
      .get();

    return snap.docs.map(mapDocToNoticia).filter(isPublicNews).slice(0, validatedPageSize);
  } catch (err) {
    logger.error('[data.ts] getNewsPaginated error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getNewsCount(): Promise<number> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const countSnap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .count()
      .get();
    return countSnap.data().count;
  } catch (err) {
    logger.warn('[data.ts] getNewsCount count() falló, usando get():', err instanceof Error ? err.message : String(err));
    try {
      const { adminDb } = await import('./firebase-admin');
      const snap = await adminDb
        .collection('noticias')
        .where('estado', '==', 'publicado')
        .select()
        .limit(5000)
        .get();
      return snap.size;
    } catch (err2) {
      logger.error('[data.ts] getNewsCount error:', err2 instanceof Error ? err2.message : String(err2));
      return 0;
    }
  }
}

export async function getCategoryPaginated(categoria: string, page: number = 1, pageSize: number = PAGE_SIZE): Promise<Noticia[]> {
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.max(1, pageSize);
  try {
    const { adminDb } = await import('./firebase-admin');
    const offset = (validatedPage - 1) * validatedPageSize;
    const fetchLimit = Math.min(validatedPageSize * 3, 100);
    const snap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .select(...LIST_FIELDS)
      .offset(offset)
      .limit(fetchLimit)
      .get();

    return snap.docs.map(mapDocToNoticia).filter(isPublicNews).slice(0, validatedPageSize);
  } catch (err) {
    logger.error(`[data.ts] getCategoryPaginated error ${categoria}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

export async function getCategoryCount(categoria: string): Promise<number> {
  try {
    const { adminDb } = await import('./firebase-admin');
    const countSnap = await adminDb
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .where('categoria', '==', categoria)
      .count()
      .get();
    return countSnap.data().count;
  } catch (err) {
    logger.warn(`[data.ts] getCategoryCount count() falló para ${categoria}, usando get():`, err instanceof Error ? err.message : String(err));
    try {
      const { adminDb } = await import('./firebase-admin');
      const snap = await adminDb
        .collection('noticias')
        .where('estado', '==', 'publicado')
        .where('categoria', '==', categoria)
        .select()
        .limit(5000)
        .get();
      return snap.size;
    } catch (err2) {
      logger.error(`[data.ts] getCategoryCount error ${categoria}:`, err2 instanceof Error ? err2.message : String(err2));
      return 0;
    }
  }
}
