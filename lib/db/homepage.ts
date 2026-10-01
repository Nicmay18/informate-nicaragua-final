import { unstable_cache } from 'next/cache';
import { incrementTrafficDaily } from '@/lib/analytics/traffic-aggregator';
import { getAdminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { trafficLogExpiresAt } from '@/lib/analytics/traffic-ttl';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { getNews, getNewsByCategory, getMasLeidas } from '@/lib/data';
import { incrementView, flush } from '@/lib/view-counter';
import { CATEGORIES, isLutoNews, type Noticia } from '@/lib/types';
import { rankNoticias, selectDestacada } from '@/lib/home-ranking';

const SLUG_RE = /^[a-zA-Z0-9_-]+$/;
const SLUG_MAX_LEN = 200;

function isValidSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length <= SLUG_MAX_LEN && SLUG_RE.test(slug);
}

function detectarDispositivo(userAgent?: string): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) return 'desktop';
  return 'unknown';
}

export function detectarFuente(referrer?: string, utmSource?: string, userAgent?: string): string {
  const ref = (referrer || '').toLowerCase();
  const utm = (utmSource || '').toLowerCase();
  const ua = (userAgent || '').toLowerCase();

  if (utm.includes('facebook') || utm.includes('fb')) return 'facebook';
  if (utm.includes('telegram') || utm.includes('tg')) return 'telegram';
  if (utm.includes('whatsapp') || utm.includes('wa')) return 'whatsapp';
  if (utm.includes('twitter') || utm.includes('x.com')) return 'twitter';
  if (utm.includes('google')) return 'google';

  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('facebookexternalhit') || ua.includes('fb_iab')) return 'facebook';

  if (ref.includes('facebook.com') || ref.includes('fb.me') || ref.includes('fb.com')) return 'facebook';
  if (ref.includes('t.me') || ref.includes('telegram.org')) return 'telegram';
  if (ref.includes('whatsapp.com') || ref.includes('wa.me')) return 'whatsapp';
  if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return 'twitter';
  if (ref.includes('google.com') || ref.includes('google')) return 'google';
  if (ref.includes('bing.com')) return 'google';
  if (ref.includes('yahoo.com')) return 'google';

  if (ref && ref.startsWith('http')) return 'otro';
  return 'directo';
}

export async function incrementViewsBySlug(
  slug: string,
  referrer?: string,
  utmSource?: string,
  userAgent?: string,
  sessionId?: string
): Promise<number | null> {
  if (!isValidSlug(slug)) {
    logger.error('[homepage.ts] Slug rechazado por validación:', slug);
    return null;
  }

  try {
    const db = getAdminDb();

    // Solo se necesitan titulo + vistas para el tracking: leer el documento
    // completo transfería el cuerpo HTML entero por cada vista registrada.
    let snap = await db
      .collection('noticias')
      .where(FieldPath.documentId(), '==', slug)
      .select('titulo', 'vistas', 'slug')
      .limit(1)
      .get();
    let docRef = snap.empty ? db.collection('noticias').doc(slug) : snap.docs[0].ref;
    let docSnap = snap.empty ? null : snap.docs[0];

    if (!docSnap) {
      snap = await db
        .collection('noticias')
        .where('slug', '==', slug)
        .select('titulo', 'vistas', 'slug')
        .limit(1)
        .get();
      if (snap.empty) {
        logger.error('[homepage.ts] Noticia no encontrada por slug:', slug);
        return null;
      }
      docRef = snap.docs[0].ref;
      docSnap = snap.docs[0];
    }

    const data = docSnap.data() || {};
    const currentViews = data.vistas || 0;

    incrementView(docRef.id, docRef);

    try {
      await db.collection('traffic_log').add({
        slug,
        titulo: data.titulo || '',
        referrer: referrer || '',
        utmSource: utmSource || '',
        userAgent: userAgent || '',
        source: detectarFuente(referrer, utmSource, userAgent),
        timestamp: FieldValue.serverTimestamp(),
        expiresAt: trafficLogExpiresAt(),
        ...(sessionId ? { sessionId } : {}),
      });

      const device = detectarDispositivo(userAgent);
      await incrementTrafficDaily(db, slug, detectarFuente(referrer, utmSource, userAgent), device);
    } catch (trafficErr) {
      logger.error('[homepage.ts] No se pudo registrar traffic_log:', trafficErr);
    }

    // Forzar flush y devolver el contador canónico real (noticias.vistas).
    // Query con select para no descargar el documento completo.
    try {
      await flush();
      const updatedSnap = await db
        .collection('noticias')
        .where(FieldPath.documentId(), '==', docRef.id)
        .select('vistas')
        .limit(1)
        .get();
      const updatedData = updatedSnap.empty ? {} : updatedSnap.docs[0].data();
      return typeof updatedData.vistas === 'number' ? updatedData.vistas : currentViews + 1;
    } catch (flushErr) {
      logger.warn('[homepage.ts] No se pudo leer el contador actualizado:', flushErr);
      return currentViews + 1;
    }
  } catch (err) {
    logger.error('[homepage.ts] ERROR: Fallo al incrementar vistas:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function getLatestNews(limitCount: number = 30): Promise<Noticia[]> {
  return getNews(limitCount);
}

export async function getTrendingNews(limitCount: number = 5): Promise<Noticia[]> {
  const all = await getNews(100);
  // Combinar frescura + vistas: una nota nueva con 0 vistas puede aparecer
  // si es reciente. Una nota vieja con muchas vistas también, pero no domina.
  const now = Date.now();
  const scored = all
    .map((n) => {
      const fechaMs = new Date(n.fecha).getTime();
      if (Number.isNaN(fechaMs)) {
        return { n, score: Number.NEGATIVE_INFINITY };
      }
      const h = (now - fechaMs) / 36e5;
      const frescura = Math.max(0, 1 - h / 48); // decae a 0 en 48h
      const vistasNorm = Math.min(1, Math.log((n.vistas ?? 0) + 1) / Math.log(500));
      const score = frescura * 0.6 + vistasNorm * 0.4;
      return { n, score };
    })
    .filter((s) => s.score !== Number.NEGATIVE_INFINITY)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limitCount).map((s) => s.n);
}

export async function getPopularNews(limitCount: number = 5): Promise<Noticia[]> {
  return getMasLeidas(limitCount);
}

export interface HomePageData {
  hero: Noticia | null;
  ultimas: Noticia[];
  enPortada: Noticia[];
  breaking: Noticia[];
  porCategoria: Record<string, Noticia[]>;
  masLeidas: Noticia[];
}

const SECTION_LIMITS: Record<string, number> = {
  Nacionales: 4,
  Sucesos: 3,
  Internacionales: 3,
  Deportes: 3,
  Tecnología: 2,
  Espectáculos: 2,
};

/**
 * Construye el homepage consultando cada sección por categoría directamente.
 * Evita que noticias viejas aparezcan cuando existen más recientes en esa categoría.
 */
// Data Cache global: una sola recomputación por ventana en todas las regiones
// de Vercel en lugar de repetir ~20 queries por regeneración ISR. El tag
// 'noticias' se invalida en cada publicación/edición, así que la portada sigue
// reflejando noticias nuevas de inmediato.
const _cachedGetHomePageData = unstable_cache(
  async () => buildHomePageData(),
  ['homepage-data'],
  { revalidate: 60, tags: ['noticias'] }
);

export async function getHomePageData(): Promise<HomePageData> {
  return _cachedGetHomePageData();
}

async function buildHomePageData(): Promise<HomePageData> {
  const categoryNames = CATEGORIES.map(c => c.name);
  // La portada necesita un universo mayor que "las últimas 15": el ranking editorial
  // debe poder rescatar una noticia importante aunque no sea la más reciente.
  // Consultamos más por categoría para que las secciones propias muestren lo
  // reciente aunque el carril "Últimas" haya consumido algunas notas.
  const [latest, masLeidas, ...categoryResults] = await Promise.all([
    getNews(80),
    getMasLeidas(5),
    ...categoryNames.map(name => getNewsByCategory(name, 12)),
  ]);

  const porCategoria: Record<string, Noticia[]> = {};
  categoryNames.forEach((name, i) => { porCategoria[name] = categoryResults[i] ?? []; });

  const used = new Set<string>();

  // HERO: la noticia más destacada del ranking editorial (no de luto).
  const ranked = rankNoticias(latest);
  const hero = selectDestacada(ranked.filter(n => !isLutoNews(n))) ?? ranked[0] ?? null;
  if (hero) used.add(hero.id);

  // SECCIONES POR CATEGORÍA: prioridad de frescura. Cada categoría muestra
  // sus propias noticias más recientes, sin depender de que el carril
  // general las haya reservado. Solo evitamos repetir el hero.
  categoryNames.forEach(name => {
    const limit = SECTION_LIMITS[name] ?? 4;
    porCategoria[name] = (porCategoria[name] || [])
      .filter(n => !used.has(n.id))
      .slice(0, limit);
    porCategoria[name].forEach(n => used.add(n.id));
  });

  // PRINCIPALES: diversidad deliberada desde lo que no ya fue reservado.
  const principales: Noticia[] = [];
  const principalCounts: Record<string, number> = {};
  for (const n of ranked) {
    if (principales.length >= 5) break;
    if (used.has(n.id)) continue;
    const cap = n.categoria === 'Sucesos' ? 2 : 2;
    const count = principalCounts[n.categoria] || 0;
    if (count >= cap) continue;
    principales.push(n);
    principalCounts[n.categoria] = count + 1;
    used.add(n.id);
  }
  const enPortada = principales;

  // ÚLTIMAS NOTICIAS: carril cronológico, con tope por categoría para no
  // vaciar las secciones propias de contenido reciente.
  const ultimas: Noticia[] = [];
  const ultimasCatCounts: Record<string, number> = {};
  for (const n of latest) {
    if (ultimas.length >= 8) break;
    if (used.has(n.id)) continue;
    const count = ultimasCatCounts[n.categoria] || 0;
    if (count >= 2) continue;
    ultimas.push(n);
    ultimasCatCounts[n.categoria] = count + 1;
    used.add(n.id);
  }

  // ÚLTIMA HORA: solo artículos publicados en las últimas 24h.
  const breaking: Noticia[] = [];
  const breakingCatCounts: Record<string, number> = {};
  const now = Date.now();
  for (const n of latest) {
    if (breaking.length >= 4) break;
    if (used.has(n.id)) continue;
    const t = new Date(n.fecha).getTime();
    if (Number.isNaN(t) || now - t > 24 * 60 * 60 * 1000) continue;
    const count = breakingCatCounts[n.categoria] || 0;
    if (n.categoria === 'Sucesos' && count >= 2) continue;
    breaking.push(n);
    breakingCatCounts[n.categoria] = count + 1;
    used.add(n.id);
  }

  return { hero, ultimas, enPortada, breaking, porCategoria, masLeidas };
}
