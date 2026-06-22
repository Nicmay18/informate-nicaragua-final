import { getAdminDb } from '@/lib/firebase-admin';
import { type Noticia, FALLBACK_IMAGE } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { capitalizeFirst } from '@/lib/formateo';
import { logger } from '@/lib/logger';

// ============================================================================
// NORMALIZAR IMÁGENES (autocontenido para evitar dependencias circulares)
// ============================================================================
function normalizeImage(imagen: string): string {
  if (!imagen || imagen === 'null' || imagen === 'undefined' || imagen === 'NaN') return FALLBACK_IMAGE;
  if (imagen.startsWith('/images/')) return imagen;
  if (imagen.startsWith('data:')) return imagen;
  if (imagen.includes('firebasestorage.googleapis.com') || imagen.includes('storage.googleapis.com')) {
    try {
      const url = new URL(imagen);
      const pathMatch = url.pathname.match(/\/(?:v0\/b\/[^/]+\/o\/)?(?:images%2F)?(.+)$/);
      if (pathMatch) {
        const decoded = decodeURIComponent(pathMatch[1]);
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

/**
 * Sanitiza cualquier representación de fecha de Firestore a ISO string
 */
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

/**
 * Mapea un documento Firestore a la interfaz Noticia
 */
function mapNoticia(d: any): Noticia {
  const data = d.data();
  return {
    id: d.id,
    slug: data.slug || d.id,
    titulo: capitalizeFirst(data.titulo || ''),
    resumen: data.resumen || '',
    contenido: data.contenido || '',
    categoria: data.categoria || 'Actualidad',
    imagen: normalizeImage(data.imagen || ''),
    fecha: safeDateString(data.fecha),
    fechaActualizacion: safeDateString(data.fechaActualizacion),
    autor: data.autor || 'Keyling Elieth Rivera Muñoz',
    autorFoto: data.autorFoto,
    destacada: data.destacada || false,
    vistas: data.vistas || 0,
    palabras: data.palabras || 0,
    tags: data.tags || [],
    pieFoto: data.pieFoto || '',
    metaDescription: data.metaDescription || data.metaDescripcion || '',
    keywords: data.keywords || '',
  };
}

// ============================================================================
// FETCH DE FIRESTORE — lectura cruda de la colección 'noticias'
// Race-condition fix: si ya hay un fetch en curso, esperar ese en lugar de
// disparar otro. Esto previene lecturas duplicadas cuando ISR regenera la
// página y múltiples componentes solicitan datos simultáneamente.
//
// NOTA: No usamos unstable_cache aquí porque revalidateTag no invalida
// correctamente múltiples capas de cache anidadas. El ISR de la página
// (revalidate: 60 en page.tsx) ya cachea el HTML completo, así que cada
// 60s se hace UNA lectura de Firestore que todas las funciones reusan.
// ============================================================================
let _fetchPromise: Promise<Noticia[]> | null = null;

async function fetchAllNoticias(): Promise<Noticia[]> {
  if (_fetchPromise) {
    return _fetchPromise;
  }
  _fetchPromise = (async () => {
    try {
      const db = getAdminDb();
      const snap = await db.collection('noticias').limit(500).get();
      let noticias = snap.docs.map(mapNoticia);

      // 1. Filtrar SOLO publicadas: estado 'publicado' o sin campo estado (backward compat)
      noticias = noticias.filter(n => (n as any).estado === 'publicado' || !(n as any).estado);

      // 2. Deduplicar por slug: quedarse con la más reciente
      const unique = new Map<string, Noticia>();
      for (const n of noticias) {
        const existing = unique.get(n.slug);
        if (!existing || new Date(n.fecha).getTime() > new Date(existing.fecha).getTime()) {
          unique.set(n.slug, n);
        }
      }
      noticias = Array.from(unique.values());
      return noticias;
    } finally {
      _fetchPromise = null;
    }
  })();
  return _fetchPromise;
}

// ============================================================================
// HOME: NOTICIAS RECIENTES (todas las categorías visibles)
// ============================================================================

/**
 * Obtiene las noticias más recientes para la portada (Carrusel y listados).
 * Incluye TODAS las categorías: Nacionales, Sucesos, Internacionales,
 * Tecnología, Deportes, Espectáculos, etc.
 *
 * NOTA: Usa cache compartido de 15s para evitar lecturas duplicadas
 * cuando ISR + cliente solicitan datos simultáneamente.
 */
async function _getLatestNewsRaw(limitCount: number = 30): Promise<Noticia[]> {
  try {
    const noticias = await fetchAllNoticias();
    const sorted = noticias
      .sort((a: Noticia, b: Noticia) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, limitCount);
    logger.info(`[homepage.ts] getLatestNews: ${noticias.length} cached docs, ${sorted.length} returned`);
    return sorted;
  } catch (err) {
    logger.error('[homepage.ts] ERROR: Fallo al obtener noticias recientes:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Obtiene las noticias MÁS LEÍDAS de todos los tiempos (all-time).
 * Ordena por vistas descendente. Igual que el panel de Analytics.
 *
 * NOTA: Reutiliza el cache compartido de fetchAllNoticias.
 */
async function _getTrendingNewsRaw(limitCount: number = 5): Promise<Noticia[]> {
  try {
    const noticias = await fetchAllNoticias();
    // All-time most viewed, igual que el panel Analytics
    const top = noticias
      .filter((n: Noticia) => (n.vistas ?? 0) >= 1)
      .sort((a: Noticia, b: Noticia) => (b.vistas ?? 0) - (a.vistas ?? 0))
      .slice(0, limitCount);
    return top;
  } catch (err) {
    logger.error('[homepage.ts] ERROR: Fallo al obtener trending:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Obtiene las noticias POPULARES de los últimos 7 días.
 * Ordena por vistas descendente dentro del último week.
 */
async function _getPopularNewsRaw(limitCount: number = 5): Promise<Noticia[]> {
  try {
    const { Timestamp } = await import('firebase-admin/firestore');
    const cutoff7 = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const cutoffMs = cutoff7.toDate().getTime();

    const noticias = await fetchAllNoticias();

    const recentWithViews = noticias
      .filter((n: Noticia) => {
        const fechaMs = new Date(n.fecha).getTime();
        return fechaMs >= cutoffMs && (n.vistas ?? 0) >= 1;
      })
      .sort((a: Noticia, b: Noticia) => (b.vistas ?? 0) - (a.vistas ?? 0))
      .slice(0, limitCount);

    return recentWithViews;
  } catch (err) {
    logger.error('[homepage.ts] ERROR: Fallo al obtener populares:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Validación de slug compartida entre API y DB layer
const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function isValidSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length <= SLUG_MAX_LEN && SLUG_RE.test(slug);
}

/**
 * Incrementa vistas de una noticia de forma atómica por slug.
 * Usado por el route handler /api/views/[slug]
 *
 * Protección: rechaza slugs malformados antes de tocar Firestore.
 */
export async function incrementViewsBySlug(slug: string): Promise<number | null> {
  if (!isValidSlug(slug)) {
    logger.warn('[homepage.ts] Slug rechazado por validación:', slug);
    return null;
  }

  try {
    const db = getAdminDb();

    const snap = await db
      .collection('noticias')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const docRef = snap.docs[0].ref;
    const currentViews = snap.docs[0].data().vistas || 0;

    await docRef.update({
      vistas: FieldValue.increment(1),
    });

    return currentViews + 1;
  } catch (err) {
    logger.error('[homepage.ts] ERROR: Fallo al incrementar vistas:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ============================================================================
// EXPORTADOS: funciones que usa page.tsx (sin unstable_cache)
// El ISR de la página (revalidate: 60) ya cachea el HTML completo.
// Cuando revalidatePath('/') se dispara desde /api/revalidate, la página
// se regenera y estas funciones leen Firestore fresco directamente.
// ============================================================================

export async function getLatestNews(limitCount: number = 30): Promise<Noticia[]> {
  return _getLatestNewsRaw(limitCount);
}

export async function getTrendingNews(limitCount: number = 5): Promise<Noticia[]> {
  return _getTrendingNewsRaw(limitCount);
}

export async function getPopularNews(limitCount: number = 5): Promise<Noticia[]> {
  return _getPopularNewsRaw(limitCount);
}
