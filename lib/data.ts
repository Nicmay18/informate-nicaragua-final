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
  'fechaPublicacion',
  'publishedAt',
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

/** Timestamp límite para partir el campo `fecha` por tipo (ver fetchPublishedDocs). */
const FECHA_TYPE_BOUNDARY = new Date('2100-01-01T00:00:00Z');

/** Fecha canónica de un doc crudo: publishedAt → fechaPublicacion → fecha. */
function canonicalDocTs(data: FirestoreNoticiaData): number {
  const s = safeDateString(data.publishedAt) || safeDateString(data.fechaPublicacion) || safeDateString(data.fecha);
  const t = s ? new Date(s).getTime() : 0;
  return isNaN(t) ? 0 : t;
}

/**
 * Pool de documentos publicados. CAUSA RAÍZ del bug de portada: `fecha` es
 * un campo de TIPO MIXTO (strings ISO legacy + Timestamps nuevos) y Firestore
 * orderBy ordena por tipo antes que por valor — en DESC todos los strings van
 * primero, así que las notas nuevas (Timestamp) quedaban fuera del limit.
 *
 * Solución sin migrar datos: partir el query por tipo usando el orden de
 * tipos de Firestore (timestamp < string):
 *  - `fecha < ts(2100)` matchea SOLO Timestamps (y tipos menores) → orderBy
 *    fecha desc ordena correctamente las notas nuevas.
 *  - `fecha > ts(2100)` matchea SOLO strings → orderBy desc = ISO lexicográfico
 *    = cronológico para las notas legacy.
 *  - `publishedAt` desc cubre docs sin `fecha`. El query indexado
 *    estado+publishedAt puede no existir aún → fallback a orderBy single-field
 *    con filtro estado/categoria en memoria.
 * Ambos queries de fecha usan el índice compuesto estado+fecha ya existente.
 * El merge final se reordena por fecha canónica en memoria.
 */
async function fetchPublishedDocs(fields: string[], fetchLimit: number, categoria?: string): Promise<QueryDocumentSnapshot[]> {
  const { adminDb } = await import('./firebase-admin');
  const { Timestamp } = await import('firebase-admin/firestore');
  // El select debe incluir los campos usados para filtrar/ordenar en memoria
  // y para resolver la fecha canónica en mapDocToNoticia.
  const selectFields = Array.from(new Set([...fields, 'estado', 'categoria', 'publishedAt', 'fechaPublicacion', 'fecha']));
  const boundary = Timestamp.fromDate(FECHA_TYPE_BOUNDARY);

  const base = () => {
    let q: any = adminDb.collection('noticias').where('estado', '==', 'publicado');
    if (categoria) q = q.where('categoria', '==', categoria);
    return q;
  };

  const safeGet = async (label: string, q: any): Promise<QueryDocumentSnapshot[]> => {
    try {
      return (await q.get()).docs;
    } catch (err) {
      logger.warn(`[data.ts] query ${label} falló:`, err instanceof Error ? err.message : String(err));
      return [];
    }
  };

  const [tsDocs, stringDocs] = await Promise.all([
    // Solo fecha tipo Timestamp (tipos < string en el orden de Firestore)
    safeGet('fecha-timestamp', base().where('fecha', '<', boundary).orderBy('fecha', 'desc').select(...selectFields).limit(fetchLimit)),
    // Solo fecha tipo string (tipos > timestamp)
    safeGet('fecha-string', base().where('fecha', '>', boundary).orderBy('fecha', 'desc').select(...selectFields).limit(fetchLimit)),
  ]);

  // publishedAt cubre docs sin `fecha` o con fecha inválida. Intenta el query
  // indexado (estado[+categoria]+publishedAt); si el índice compuesto no
  // existe, cae al orderBy single-field con filtro en memoria.
  let publishedAtDocs: QueryDocumentSnapshot[] = [];
  {
    const q: any = base().orderBy('publishedAt', 'desc').select(...selectFields).limit(fetchLimit);
    publishedAtDocs = await safeGet('publishedAt-indexed', q);
    if (publishedAtDocs.length === 0) {
      const fbLimit = Math.min(Math.max(fetchLimit * 2, 250), 500);
      const snap = await safeGet('publishedAt-single-field',
        adminDb.collection('noticias').orderBy('publishedAt', 'desc').select(...selectFields).limit(fbLimit));
      publishedAtDocs = snap.filter((d) => {
        const data = d.data() as FirestoreNoticiaData;
        if (data.estado !== 'publicado') return false;
        if (categoria && data.categoria !== categoria) return false;
        return true;
      });
    }
  }

  const merged = new Map<string, QueryDocumentSnapshot>();
  for (const d of [...tsDocs, ...stringDocs, ...publishedAtDocs]) merged.set(d.id, d);
  // Reordenar por fecha canónica: el orden de Firestore por tipo mixto no es
  // cronológico, y los callers asumen el pool ordenado antes de hacer slice.
  return Array.from(merged.values()).sort(
    (a, b) => canonicalDocTs(b.data() as FirestoreNoticiaData) - canonicalDocTs(a.data() as FirestoreNoticiaData)
  );
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

// Tag 'noticias': asocia el listado al tag que invalidan todas las rutas de
// publicación (invalidateFirestoreCache / /api/revalidate). Sin esta capa,
// revalidateTag no tocaba /noticias porque sus datos no estaban etiquetados.
const _cachedGetNewsPaginated = unstable_cache(
  async (page: number, pageSize: number): Promise<Noticia[]> => {
    const offset = (page - 1) * pageSize;
    // Traer más para compensar el filtro isPublicNews
    const fetchLimit = Math.min(offset + pageSize * 3, 300);
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit);

    return docs.map(mapDocToNoticia)
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(offset, offset + pageSize);
  },
  ['noticias-paginadas'],
  { revalidate: 300, tags: ['noticias'] }
);

export async function getNewsPaginated(page: number = 1, pageSize: number = PAGE_SIZE): Promise<Noticia[]> {
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.max(1, pageSize);
  try {
    return await _cachedGetNewsPaginated(validatedPage, validatedPageSize);
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

const _cachedGetCategoryPaginated = unstable_cache(
  async (categoria: string, page: number, pageSize: number): Promise<Noticia[]> => {
    const offset = (page - 1) * pageSize;
    const fetchLimit = Math.min(offset + pageSize * 3, 300);
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit, categoria);

    return docs.map(mapDocToNoticia)
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(offset, offset + pageSize);
  },
  ['categoria-paginada'],
  { revalidate: 300, tags: ['noticias'] }
);

export async function getCategoryPaginated(categoria: string, page: number = 1, pageSize: number = PAGE_SIZE): Promise<Noticia[]> {
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.max(1, pageSize);
  try {
    return await _cachedGetCategoryPaginated(categoria, validatedPage, validatedPageSize);
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
