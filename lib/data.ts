import { type Noticia, FALLBACK_IMAGE } from './types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { capitalizeFirst, normalizeEditorialTitle } from './formateo';
import { logger } from './logger';
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';
import { getEditorialDecision, isRenderableArticle, resolvePublicCategory, shouldIndexArticle } from './editorial/canonical';
import { cleanArticleBody } from './sanitize';
import { isToxicSlug } from './seo-toxic';

/** Todas las sub-queries de Firestore fallaron: es un apagón, no un corpus vacío. */
export class FirestoreOutageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirestoreOutageError';
  }
}

/**
 * Durante `next build` (generación estática/ISR en Vercel) un apagón de
 * Firestore NO debe matar el deploy: las páginas se prerenderizan vacías y
 * el ISR las regenera en cuanto Firestore responda (revalidate + tags).
 * En runtime el comportamiento no cambia: el error se propaga para que el
 * caller distinga "corpus vacío" de "Firestore caído".
 */
function isProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

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

// NOTA DE COSTOS: 'contenido' NO va en LIST_FIELDS. Cada doc pesa ~10KB
// casi todo por el HTML del cuerpo; los listados (portada, /noticias,
// categorías, relacionadas, más leídas) solo renderizan tarjetas con
// título/resumen/imagen. El guard de renderabilidad usa `palabras`
// (ver hasRenderableContent). El detalle (_cachedGetBySlug) y el sitemap
// sí proyectan 'contenido' porque lo necesitan.
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

/** Exportada para tests de normalización de fechas (Timestamp→ISO). */
export function mapDocToNoticia(d: QueryDocumentSnapshot): Noticia {
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
  return isRenderableArticle(data);
}

export function invalidateFirestoreCache() {
  try {
    revalidateTag('noticias');
  } catch { /* runtime only */ }
}

/**
 * Invalida todas las superficies públicas alimentadas por `noticias`:
 * Data Cache (tags) + rutas ISR (portada, listado, feeds y sitemaps).
 * Usar tras cualquier mutación que cambie visibilidad, fecha de
 * publicación u orden de las noticias. Las rutas por artículo/categoría
 * concretas las revalidan los endpoints que conocen el slug.
 * El error se registra — nunca se oculta en un catch silencioso.
 */
export function revalidateNoticiasSurfaces() {
  try {
    revalidateTag('noticias');
    revalidateTag('popular-news');
    revalidateTag('latest-news');
    revalidateTag('trending-news');
    revalidatePath('/');
    revalidatePath('/noticias');
    revalidatePath('/feed.xml');
    revalidatePath('/news-sitemap.xml');
    revalidatePath('/sitemap.xml');
  } catch (err) {
    logger.error('[data.ts] revalidateNoticiasSurfaces falló:', err instanceof Error ? err.message : String(err));
  }
}

/** Timestamp límite para partir el campo `fecha` por tipo (ver fetchPublishedDocs). */
const FECHA_TYPE_BOUNDARY = new Date('2100-01-01T00:00:00Z');
/**
 * Bound de tipo string para la rama `fecha` con valores string. CRÍTICO:
 * `fecha > Timestamp` NO matchea strings en desigualdades de Firestore
 * (verificado contra producción: devolvía 0 docs y dejaba invisibles 68 notas
 * con fecha string + sin publishedAt). Un bound string sí cruza por orden de
 * tipos (timestamp < string) y matchea todos los strings no vacíos.
 */
const FECHA_STRING_BOUNDARY = ' ';

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
export async function fetchPublishedDocs(fields: string[], fetchLimit: number, categoria?: string): Promise<QueryDocumentSnapshot[]> {
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

  // ERROR ≠ EMPTY: un query que falla NO significa "no hay documentos".
  // Se registra cada error y, si TODAS las sub-queries fallan, se lanza —
  // el caller puede distinguir "corpus vacío" de "Firestore caído".
  let queryErrors = 0;
  let queriesRun = 0;
  const safeGet = async (label: string, q: any): Promise<QueryDocumentSnapshot[]> => {
    queriesRun++;
    try {
      return (await q.get()).docs;
    } catch (err) {
    if (err instanceof FirestoreOutageError) throw err;
      queryErrors++;
      logger.warn(`[data.ts] query ${label} falló:`, err instanceof Error ? err.message : String(err));
      return [];
    }
  };

  const [tsDocs, stringDocs] = await Promise.all([
    // Solo fecha tipo Timestamp (tipos < string en el orden de Firestore)
    safeGet('fecha-timestamp', base().where('fecha', '<', boundary).orderBy('fecha', 'desc').select(...selectFields).limit(fetchLimit)),
    // Solo fecha tipo string (tipos > timestamp)
    safeGet('fecha-string', base().where('fecha', '>=', FECHA_STRING_BOUNDARY).orderBy('fecha', 'desc').select(...selectFields).limit(fetchLimit)),
  ]);

  // publishedAt cubre docs sin `fecha` o con fecha inválida. En el corpus
  // actual el 100% de los publicados tiene `fecha` (verificado 2026-11: 0/736
  // carecen de fecha; los 238 sin `publishedAt` sí tienen `fecha` y llegan por
  // la rama timestamp). El índice compuesto estado+publishedAt NO existe, así
  // que la query indexada falla siempre y el fallback leía 250 docs por llamada
  // — el 100% duplicados que el Map deduplica (~500K lecturas/día de
  // desperdicio medido). Ahora el fallback SOLO corre cuando las ramas de
  // fecha no llenaron el cupo: señal de posibles huecos (docs sin fecha).
  // Si el corpus está completo, publishedAt no puede aportar nada nuevo.
  let publishedAtDocs: QueryDocumentSnapshot[] = [];
  {
    // Las ramas publishedAt (indexada + fallback) solo se ejecutan cuando el
    // cupo de fecha quedó incompleto — única situación en que pueden aportar
    // docs sin `fecha`. Con corpus completo son 100% duplicados.
    const fechaDocs = tsDocs.length + stringDocs.length;
    if (fechaDocs < fetchLimit) {
      const publishedAtLimit = Math.min(fetchLimit, 100);
      const q: any = base().orderBy('publishedAt', 'desc').select(...selectFields).limit(publishedAtLimit);
      publishedAtDocs = await safeGet('publishedAt-indexed', q);
      if (publishedAtDocs.length === 0) {
        const fbLimit = Math.min(Math.max(fetchLimit - fechaDocs, 50), 250);
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
  }

  const merged = new Map<string, QueryDocumentSnapshot>();
  for (const d of [...tsDocs, ...stringDocs, ...publishedAtDocs]) merged.set(d.id, d);

  // Si todas las queries fallaron, un resultado vacío es ERROR — no EMPTY.
  // Excepción: en build-phase devolvemos [] para no abortar el deploy; el
  // ISR regenerará con datos reales en runtime (ver isProductionBuildPhase).
  if (merged.size === 0 && queryErrors > 0 && queryErrors >= queriesRun) {
    if (isProductionBuildPhase()) {
      logger.warn('[data.ts] fetchPublishedDocs: Firestore no disponible durante build — se genera contenido vacío; ISR recuperará en runtime');
      return [];
    }
    throw new FirestoreOutageError(`[data.ts] fetchPublishedDocs: ${queryErrors}/${queriesRun} queries fallaron — Firestore no disponible, no corpus vacío`);
  }
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
    if (err instanceof FirestoreOutageError) throw err;
    logger.error('[data.ts] fetchNoticiasList error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Data Cache compartido entre regiones/instancias: sin esta capa, cada
// regeneración ISR (y cada PoP de Vercel) volvía a ejecutar las 3 sub-queries
// de fetchPublishedDocs contra Firestore. El tag 'noticias' lo invalidan todas
// las rutas de publicación, así que una nota nueva/edición sigue apareciendo
// de inmediato.
//
// POOL ÚNICO: antes cada valor de `count` (30, 80, 100, 120, 500…) generaba
// su propia entrada de caché y su propia tanda de ~600 lecturas cada 5 min.
// Como fetchLimit ya está topado en 200 por rama, un único pool de 200 cubre
// todos los consumidores; getNews(count) solo rebanada en memoria. El top-N
// resultante es idéntico (o más completo) que con fetches por count.
const _cachedGetNewsPool = unstable_cache(
  async () => fetchNoticiasList([...LIST_FIELDS], 200),
  ['news-pool'],
  // 600s (antes 300s): cada regeneración lee ~450 docs. La fresquedad real la
  // da revalidateTag('noticias') en cada publicación — el TTL solo acota la
  // deriva de contadores (vistas/trending), que no justifica 288 regens/día.
  { revalidate: 600, tags: ['noticias'] }
);

export async function getNews(count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  const pool = await _cachedGetNewsPool();
  return pool.slice(0, validatedCount);
}

const _cachedGetNewsByCategory = unstable_cache(
  async (categoria: string, count: number): Promise<Noticia[]> => {
    try {
      const fetchLimit = Math.min(count * 2, 100);
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
      ).slice(0, count);
    } catch (err) {
      if (err instanceof FirestoreOutageError) throw err;
      logger.error(`[data.ts] getNewsByCategory error ${categoria}:`, err instanceof Error ? err.message : String(err));
      return [];
    }
  },
  ['news-by-category'],
  { revalidate: 900, tags: ['noticias'] }
);

export async function getNewsByCategory(categoria: string, count: number = DEFAULT_NEWS_COUNT): Promise<Noticia[]> {
  const validatedCount = validateCount(count, DEFAULT_NEWS_COUNT);
  return _cachedGetNewsByCategory(categoria, validatedCount);
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
    if (err instanceof FirestoreOutageError) throw err;
      logger.error('[data.ts] getMasLeidas error:', err instanceof Error ? err.message : String(err));
      return [];
    }
  },
  ['mas-leidas'],
  { revalidate: 900, tags: ['noticias', 'popular-news'] }
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
        if (!docSlug?.trim() || titulo.trim().length <= 5 || contenido.trim().length <= 20) {
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
        if (!isRenderableArticle(noticia)) {
          logger.warn('[data.ts] Noticia no renderizable:', { slug: docSlug, razon: getEditorialDecision(noticia).razon });
          return null;
        }
        return noticia;
      }
    } catch (err) {
    if (err instanceof FirestoreOutageError) throw err;
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
      .select('slug', 'titulo', 'palabras', 'aprobadoMeni', 'publicado', 'archived', 'estado', 'noindex', 'perfil', 'categoria')
      .limit(2000)
      .get();

    return snap.docs
      .map((d: any) => {
        const data = d.data() as FirestoreNoticiaData;
        const article: Partial<Noticia> = {
          slug: data.slug,
          titulo: data.titulo,
          palabras: data.palabras,
          aprobadoMeni: data.aprobadoMeni,
          publicado: data.publicado,
          archived: data.archived,
          estado: data.estado,
          noindex: data.noindex,
        };
        return isRenderableArticle(article) && !isToxicSlug(data.slug || '') ? data.slug : null;
      })
      .filter(Boolean) as string[];
  } catch (err) {
    if (err instanceof FirestoreOutageError) throw err;
    logger.error('[data.ts] getAllSlugs error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Pool por categoría cacheado (tag 'noticias'): la exclusión del slug propio
// se aplica DESPUÉS del cache para que todos los artículos de una categoría
// compartan la misma entrada en Data Cache. El cache debe devolver objetos
// planos — los DocumentSnapshot de Firestore no son serializables.
const _cachedRelatedPool = unstable_cache(
  async (categoria: string, fetchLimit: number): Promise<Noticia[]> => {
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit, categoria);
    return docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          slug: data.slug || doc.id,
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
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },
  ['related-pool'],
  { revalidate: 900, tags: ['noticias'] }
);

export async function getRelatedNews(categoria: string, excludeSlug: string, count: number = 3): Promise<Noticia[]> {
  const validatedCount = validateCount(count, 3);
  try {
    const pool = await _cachedRelatedPool(categoria, validatedCount + 10);
    return pool.filter((n) => n.slug !== excludeSlug).slice(0, validatedCount);
  } catch (err) {
    if (err instanceof FirestoreOutageError) throw err;
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
    const fetchLimit = offset + pageSize * 4;
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit);

    return docs.map(mapDocToNoticia)
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(offset, offset + pageSize);
  },
  ['noticias-paginadas'],
  // 900s: páginas profundas las rastrean crawlers; la publicación invalida
  // el tag 'noticias' al instante, el TTL solo cubre deriva de contadores.
  { revalidate: 900, tags: ['noticias'] }
);

export async function getNewsPaginated(page: number = 1, pageSize: number = PAGE_SIZE): Promise<Noticia[]> {
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.max(1, pageSize);
  try {
    return await _cachedGetNewsPaginated(validatedPage, validatedPageSize);
  } catch (err) {
    if (err instanceof FirestoreOutageError) throw err;
    logger.error('[data.ts] getNewsPaginated error:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Sin esta capa cada request a /noticias (searchParams → render dinámico,
// ISR no aplica) ejecutaba un count() de agregación contra Firestore en
// generateMetadata + componente. Mismo tag 'noticias' → invalidado en cada
// publicación/edición junto al listado.
const _cachedGetNewsCount = unstable_cache(
  async (): Promise<number> => {
    try {
      const { adminDb } = await import('./firebase-admin');
      const countSnap = await adminDb
        .collection('noticias')
        .where('estado', '==', 'publicado')
        .count()
        .get();
      return countSnap.data().count;
    } catch (err) {
      if (err instanceof FirestoreOutageError) throw err;
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
        if (err2 instanceof FirestoreOutageError) throw err2;
        logger.error('[data.ts] getNewsCount error:', err2 instanceof Error ? err2.message : String(err2));
        return 0;
      }
    }
  },
  ['noticias-count'],
  { revalidate: 300, tags: ['noticias'] }
);

export async function getNewsCount(): Promise<number> {
  return _cachedGetNewsCount();
}

const _cachedGetCategoryPaginated = unstable_cache(
  async (categoria: string, page: number, pageSize: number): Promise<Noticia[]> => {
    const offset = (page - 1) * pageSize;
    const fetchLimit = offset + pageSize * 4;
    const docs = await fetchPublishedDocs([...LIST_FIELDS], fetchLimit, categoria);

    return docs.map(mapDocToNoticia)
      .filter((n) => isPublicNews(n) && !isToxicSlug(n.slug))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(offset, offset + pageSize);
  },
  ['categoria-paginada'],
  // 900s: mismo criterio que noticias-paginadas — crawlers + invalidación por tag.
  { revalidate: 900, tags: ['noticias'] }
);

export async function getCategoryPaginated(categoria: string, page: number = 1, pageSize: number = PAGE_SIZE): Promise<Noticia[]> {
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.max(1, pageSize);
  try {
    return await _cachedGetCategoryPaginated(categoria, validatedPage, validatedPageSize);
  } catch (err) {
    if (err instanceof FirestoreOutageError) throw err;
    logger.error(`[data.ts] getCategoryPaginated error ${categoria}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Misma motivación que _cachedGetNewsCount: las páginas de categoría también
// son dinámicas (searchParams) y sin caché ejecutaban count() por request.
// La categoría es parte de la cache-key (args de unstable_cache).
const _cachedGetCategoryCount = unstable_cache(
  async (categoria: string): Promise<number> => {
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
      if (err instanceof FirestoreOutageError) throw err;
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
        if (err2 instanceof FirestoreOutageError) throw err2;
        logger.error(`[data.ts] getCategoryCount error ${categoria}:`, err2 instanceof Error ? err2.message : String(err2));
        return 0;
      }
    }
  },
  ['categoria-count'],
  { revalidate: 300, tags: ['noticias'] }
);

export async function getCategoryCount(categoria: string): Promise<number> {
  return _cachedGetCategoryCount(categoria);
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
          // 'contenido' se reemplazó por 'palabras': el guard de renderabilidad
          // acepta el conteo de palabras (hasRenderableContent) y proyectar el
          // HTML completo de ~1000 docs multiplicaba la transferencia del
          // sitemap por ~10x sin aportar nada al XML final.
          'palabras',
        ],
        MAX_SITEMAP_LIMIT
      );

      return docs
        .map((d: any) => {
          const data = d.data() as FirestoreNoticiaData;
          const docSlug = data.slug || d.id;
          if (isToxicSlug(docSlug)) return null;
          // Guard idéntico a _cachedGetBySlug: cualquier doc que la página
          // 404ea (titulo<=5, contenido<=20, categoria vacía) tampoco va al
          // sitemap — un sitemap con 404s degrada crawl/indexación.
          const tituloOk = normalizeEditorialTitle(capitalizeFirst(cleanArticleBody(data.titulo || '')));
          const contenidoOk = cleanArticleBody(data.contenido);
          const noticia: Noticia = {
            id: d.id,
            slug: docSlug,
            titulo: tituloOk,
            resumen: cleanArticleBody(data.resumen || ''),
            contenido: contenidoOk,
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
            palabras: typeof data.palabras === 'number' ? data.palabras : undefined,
          };
          return isRenderableArticle(noticia) && shouldIndexArticle(noticia) ? noticia : null;
        })
        .filter(Boolean) as Noticia[];
    } catch (err) {
      logger.error('[data.ts] getSitemapNews failed');
      throw err;
    }
  },
  ['sitemap-news-full'],
  { revalidate: 3600, tags: ['sitemap-news-full'] }
);

export async function getSitemapNews(): Promise<Noticia[]> {
  return _cachedGetSitemapNews();
}
