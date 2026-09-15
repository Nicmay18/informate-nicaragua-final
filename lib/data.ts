import { type Noticia, FALLBACK_IMAGE } from './types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { capitalizeFirst, normalizeEditorialTitle } from './formateo';
import { logger } from './logger';
import { unstable_cache, revalidateTag } from 'next/cache';
import { getEditorialDecision, isPublicArticle, resolvePublicCategory, shouldIndexArticle } from './editorial/canonical';
import { cleanArticleBody } from './sanitize';
import { isToxicSlug } from './seo-toxic';

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
  'imagenRedes',
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

function normalizeImage(imagen: string, imagenRedes?: string): string {
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') {
    if (imagenRedes && (imagenRedes.startsWith('http://') || imagenRedes.startsWith('https://') || imagenRedes.startsWith('data:'))) {
      return imagenRedes;
    }
    return FALLBACK_IMAGE;
  }
  // Rutas locales, data URI o CDN ya limpios: servir directo
  if (imagen.startsWith('/images/') || imagen.startsWith('data:')) {
    // Si existe una imagen de redes absoluta, preferirla sobre /images/ local ausente
    if (imagenRedes && (imagenRedes.startsWith('http://') || imagenRedes.startsWith('https://') || imagenRedes.startsWith('data:'))) {
      return imagenRedes;
    }
    return imagen;
  }
  // URLs absolutas (Firebase Storage, GitHub raw, Unsplash, etc.): conservar tal cual,
  // el loader global de next/image (weserv) se encarga del optimizado.
  // NO reescribir a /images/ porque en este entorno public/images no siempre existe.
  if (imagen.startsWith('http://') || imagen.startsWith('https://')) return imagen;
  // Rutas sin barra inicial
  if (imagen.startsWith('images/')) return `/${imagen}`;
  if (imagen.startsWith('/')) return imagen;
  // Sólo un nombre de archivo: asumir /images/ (legacy, desaconsejado)
  const fn = imagen.split('/').pop()?.trim();
  if (!fn || fn.length < 2) {
    if (imagenRedes && (imagenRedes.startsWith('http://') || imagenRedes.startsWith('https://') || imagenRedes.startsWith('data:'))) {
      return imagenRedes;
    }
    return FALLBACK_IMAGE;
  }
  const local = `/images/${fn}`;
  if (imagenRedes && (imagenRedes.startsWith('http://') || imagenRedes.startsWith('https://') || imagenRedes.startsWith('data:'))) {
    return imagenRedes;
  }
  return local;
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
    titulo: normalizeEditorialTitle(capitalizeFirst(cleanArticleBody(data.titulo || ''))),
    resumen: cleanArticleBody(data.resumen || ''),
    contenido: cleanArticleBody(data.contenido),
    categoria: resolvePublicCategory({
    perfil: data.perfil,
    categoria: data.categoria,
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
  }),
    perfil: data.perfil || '',
    imagen: normalizeImage(data.imagen || '', data.imagenRedes),
    imagenRedes: data.imagenRedes || undefined,
    fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
    fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
    autor: data.autor ? cleanArticleBody(data.autor) : data.autor,
    autorFoto: data.autorFoto,
    destacada: data.destacada,
    vistas: data.vistas,
    palabras: data.palabras,
    tags: (() => {
      const rawTags = data.tags || data.palabrasClave;
      return Array.isArray(rawTags)
        ? rawTags.map((t: unknown) => cleanArticleBody(String(t ?? ''))).filter(Boolean)
        : [];
    })(),
    pieFoto: cleanArticleBody(data.pieFoto) || undefined,
    puntosClave: Array.isArray(data.puntosClave)
      ? data.puntosClave.map((p: unknown) => cleanArticleBody(String(p ?? ''))).filter(Boolean)
      : data.puntosClave,
    metaDescription: cleanArticleBody(data.metaDescription || data.metaDescripcion || ''),
    keywords: cleanArticleBody(data.keywords || (Array.isArray(data.palabrasClave) ? data.palabrasClave.join(', ') : '') || ''),
    estado: data.estado || (data.publicado === false ? 'borrador' : 'publicado'),
    publicado: data.publicado,
    aprobadoMeni: data.aprobadoMeni,
    archived: data.archived,
    noindex: !!data.noindex,
    fuente: cleanArticleBody(data.fuente) || undefined,
    fuentesComplementarias: Array.isArray(data.fuentesComplementarias)
      ? data.fuentesComplementarias.filter((f: unknown) => typeof f === 'string').map((f: string) => cleanArticleBody(f)).filter(Boolean)
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

/**
 * Pool de documentos publicados. Consulta por AMBOS campos de fecha
 * (`fecha` legacy de tipo mixto string/Timestamp y `publishedAt` Timestamp
 * canónico) y une los resultados. CAUSA RAÍZ del bug de portada: orderBy
 * sobre un campo de tipo mixto ordena por tipo antes que por valor, lo que
 * dejaba noticias nuevas fuera del limit y mostraba notas viejas primero.
 */
async function fetchPublishedDocs(fields: string[], fetchLimit: number, categoria?: string): Promise<QueryDocumentSnapshot[]> {
  const { adminDb } = await import('./firebase-admin');
  const buildQuery = (orderField: 'fecha' | 'publishedAt') => {
    let q: any = adminDb.collection('noticias').where('estado', '==', 'publicado');
    if (categoria) q = q.where('categoria', '==', categoria);
    return q.orderBy(orderField, 'desc').select(...fields).limit(fetchLimit);
  };

  const byFecha = await buildQuery('fecha').get();
  let publishedAtDocs: QueryDocumentSnapshot[] = [];
  try {
    const byPublishedAt = await buildQuery('publishedAt').get();
    publishedAtDocs = byPublishedAt.docs;
  } catch (err) {
    logger.warn('[data.ts] orderBy publishedAt no disponible, usando solo fecha:', err instanceof Error ? err.message : String(err));
  }

  const merged = new Map<string, QueryDocumentSnapshot>();
  for (const d of [...byFecha.docs, ...publishedAtDocs]) merged.set(d.id, d);
  return Array.from(merged.values());
}

/** Query base para listados: publicadas, ordenadas, proyectadas */
async function fetchNoticiasList(fields: string[], limit: number): Promise<Noticia[]> {
  try {
    // Traer más de lo necesario porque isPublicNews filtra post-query
    // (aprobadoMeni y archived no se filtran en Firestore por compatibilidad de índices)
    const fetchLimit = Math.min(limit * 3, 200);
    const docs = await fetchPublishedDocs(fields, fetchLimit);

    const noticias = docs.map(mapDocToNoticia).filter((n) => isPublicNews(n) && !isToxicSlug(n.slug));

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
    const fetchLimit = Math.min(validatedCount * 2, 100);
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit, categoria);

    const noticias = docs.map(mapDocToNoticia).filter((n) => isPublicNews(n) && !isToxicSlug(n.slug));
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

      const noticias = snap.docs.map(mapDocToNoticia).filter((n) => isPublicNews(n) && !isToxicSlug(n.slug));

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
        if (isToxicSlug(docSlug)) {
          logger.warn('[data.ts] Slug bloqueado por contenido tóxico o no verificado:', docSlug);
          return null;
        }
        const titulo = normalizeEditorialTitle(capitalizeFirst(cleanArticleBody(data.titulo || '')));
        const contenido = cleanArticleBody(data.contenido);
        if (!docSlug?.trim() || titulo.trim().length <= 5 || contenido.trim().length <= 20 || !data.categoria?.trim()) {
          logger.warn('[data.ts] Noticia rechazada por datos insuficientes:', { slug, titulo: titulo.slice(0, 40) });
          return null;
        }
        const noticia: Noticia = {
          id: doc.id,
          slug: docSlug,
          titulo,
          resumen: cleanArticleBody(data.resumen || ''),
          contenido,
          categoria: resolvePublicCategory({
    perfil: data.perfil,
    categoria: data.categoria,
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
  }),
          perfil: data.perfil || '',
          imagen: normalizeImage(data.imagen || '', data.imagenRedes),
          imagenRedes: data.imagenRedes || undefined,
          fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
          fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
          autor: data.autor ? cleanArticleBody(data.autor) : data.autor,
          autorFoto: data.autorFoto,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
          tags: Array.isArray(data.tags)
            ? data.tags.map((t: unknown) => cleanArticleBody(String(t ?? ''))).filter(Boolean)
            : data.tags,
          pieFoto: cleanArticleBody(data.pieFoto) || undefined,
          puntosClave: Array.isArray(data.puntosClave)
            ? data.puntosClave.map((p: unknown) => cleanArticleBody(String(p ?? ''))).filter(Boolean)
            : data.puntosClave,
          metaDescription: cleanArticleBody(data.metaDescription || data.metaDescripcion || ''),
          keywords: cleanArticleBody(data.keywords || ''),
          estado: data.estado || (data.publicado === false ? 'borrador' : 'publicado'),
          publicado: data.publicado,
          aprobadoMeni: data.aprobadoMeni,
          archived: data.archived,
          noindex: !!data.noindex,
          fuente: cleanArticleBody(data.fuente) || undefined,
          fuentesComplementarias: Array.isArray(data.fuentesComplementarias)
            ? data.fuentesComplementarias.filter((f: unknown) => typeof f === 'string').map((f: string) => cleanArticleBody(f)).filter(Boolean)
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
        return isPublicArticle(article) && !isToxicSlug(data.slug || '') ? data.slug : null;
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
    const docs = await fetchPublishedDocs([...LIST_FIELDS], validatedCount + 10, categoria);

    return docs
      .map((doc: any) => {
        const data = doc.data();
        const slug = data.slug || doc.id;
        if (slug === excludeSlug) return null;
        return {
          id: doc.id,
          slug,
          titulo: cleanArticleBody(data.titulo || ''),
          resumen: cleanArticleBody(data.resumen || ''),
          contenido: cleanArticleBody(data.contenido || ''),
          categoria: data.categoria || 'Actualidad',
          imagen: normalizeImage(data.imagen || '', data.imagenRedes),
          imagenRedes: data.imagenRedes || undefined,
          fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
          fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
          autor: data.autor ? cleanArticleBody(data.autor) : data.autor,
          autorFoto: data.autorFoto,
          destacada: data.destacada,
          vistas: data.vistas,
          palabras: data.palabras,
          tags: Array.isArray(data.tags)
            ? data.tags.map((t: unknown) => cleanArticleBody(String(t ?? ''))).filter(Boolean)
            : data.tags,
          estado: data.estado || 'publicado',
          noindex: !!data.noindex,
          aprobadoMeni: data.aprobadoMeni,
          publicado: data.publicado,
          archived: data.archived,
        } as Noticia;
      })
      .filter((n): n is Noticia => n !== null && isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
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
    const offset = (validatedPage - 1) * validatedPageSize;
    // Traer más para compensar el filtro isPublicNews
    const fetchLimit = Math.min(offset + validatedPageSize * 3, 300);
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit);

    return docs.map(mapDocToNoticia)
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(offset, offset + validatedPageSize);
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
    const offset = (validatedPage - 1) * validatedPageSize;
    const fetchLimit = Math.min(offset + validatedPageSize * 3, 300);
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit, categoria);

    return docs.map(mapDocToNoticia)
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(offset, offset + validatedPageSize);
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

const MAX_SITEMAP_LIMIT = 1000;

/**
 * Noticias aptas para sitemap: publicadas, aprobadas, no archivadas,
 * no noindex y no tóxicas. Trae los campos mínimos necesarios.
 */
const _cachedGetSitemapNews = unstable_cache(
  async () => {
    try {
      const docs = await fetchPublishedDocs(
        [
          'slug',
          'titulo',
          'categoria',
          'perfil',
          'fecha',
          'fechaActualizacion',
          'publishedAt',
          'dateModified',
          'aprobadoMeni',
          'publicado',
          'archived',
          'estado',
          'noindex',
          'imagen',
          'imagenRedes',
          'resumen',
          'contenido',
        ],
        MAX_SITEMAP_LIMIT
      );

      return docs
        .map((d: any) => {
          const data = d.data() as FirestoreNoticiaData;
          const docSlug = data.slug || d.id;
          if (isToxicSlug(docSlug)) return null;
          const noticia: Noticia = {
            id: d.id,
            slug: docSlug,
            titulo: normalizeEditorialTitle(capitalizeFirst(cleanArticleBody(data.titulo || ''))),
            resumen: cleanArticleBody(data.resumen || ''),
            contenido: cleanArticleBody(data.contenido),
            categoria: resolvePublicCategory({
              perfil: data.perfil,
              categoria: data.categoria,
              titulo: data.titulo || '',
              contenido: data.contenido || '',
              resumen: data.resumen || '',
            }),
            perfil: data.perfil || '',
            imagen: normalizeImage(data.imagen || '', data.imagenRedes),
            imagenRedes: data.imagenRedes || undefined,
            fecha: safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha),
            fechaActualizacion: safeDateString(data.dateModified) || safeDateString(data.fechaActualizacion),
            estado: data.estado || 'publicado',
            publicado: data.publicado,
            archived: data.archived,
            aprobadoMeni: data.aprobadoMeni,
            noindex: !!data.noindex,
          };
          return isPublicArticle(noticia) && shouldIndexArticle(noticia) ? noticia : null;
        })
        .filter(Boolean) as Noticia[];
    } catch (err) {
      logger.error('[data.ts] getSitemapNews error:', err instanceof Error ? err.message : String(err));
      return [];
    }
  },
  ['sitemap-news-full'],
  { revalidate: 3600, tags: ['sitemap-news-full'] }
);

export async function getSitemapNews(): Promise<Noticia[]> {
  return _cachedGetSitemapNews();
}
