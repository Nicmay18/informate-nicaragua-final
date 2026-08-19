import { incrementTrafficDaily } from '@/lib/analytics/traffic-aggregator';
import { getAdminDb } from '@/lib/firebase-admin';
import { type Noticia } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { getNews, getNewsByCategory, getMasLeidas } from '@/lib/data';
import { incrementView } from '@/lib/view-counter';
import { CATEGORIES, isLutoNews } from '@/lib/types';

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
  userAgent?: string
): Promise<number | null> {
  if (!isValidSlug(slug)) {
    logger.error('[homepage.ts] Slug rechazado por validación:', slug);
    return null;
  }

  try {
    const db = getAdminDb();

    let docRef = db.collection('noticias').doc(slug);
    let docSnap = await docRef.get();

    if (!docSnap.exists) {
      const snap = await db
        .collection('noticias')
        .where('slug', '==', slug)
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
      });

      const device = detectarDispositivo(userAgent);
      await incrementTrafficDaily(db, slug, detectarFuente(referrer, utmSource, userAgent), device);
    } catch (trafficErr) {
      logger.error('[homepage.ts] No se pudo registrar traffic_log:', trafficErr);
    }

    return currentViews + 1;
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
export async function getHomePageData(): Promise<HomePageData> {
  const categoryNames = CATEGORIES.map(c => c.name);
  const [latest, masLeidas, ...categoryResults] = await Promise.all([
    getNews(15),
    getMasLeidas(5),
    ...categoryNames.map(name => getNewsByCategory(name, 8)),
  ]);

  const porCategoria: Record<string, Noticia[]> = {};
  categoryNames.forEach((name, i) => { porCategoria[name] = categoryResults[i] ?? []; });

  const used = new Set<string>();

  // HERO: noticia aprobada/publicada más reciente, no luto, con imagen preferible
  const heroCandidates = latest;
  const hero = heroCandidates.find(n => !isLutoNews(n)) ?? heroCandidates[0] ?? null;
  if (hero) used.add(hero.id);

  // ÚLTIMAS NOTICIAS: 10 más recientes excluyendo hero
  const ultimas = latest.filter(n => !used.has(n.id)).slice(0, 10);
  ultimas.forEach(n => used.add(n.id));

  // EN PORTADA: 3 más recientes, máximo 1 por categoría
  const enPortadaRaw = latest.filter(n => !used.has(n.id));
  const enPortada = enPortadaRaw.slice(0, 6).filter((n, i, arr) => arr.findIndex(x => x.categoria === n.categoria) === i).slice(0, 3);
  enPortada.forEach(n => used.add(n.id));

  // ÚLTIMA HORA: 4 más recientes, máximo 2 Sucesos
  const breakingRaw = latest.filter(n => !used.has(n.id)).slice(0, 15);
  const breaking: Noticia[] = [];
  const catCounts: Record<string, number> = {};
  for (const n of breakingRaw) {
    if (breaking.length >= 4) break;
    catCounts[n.categoria] = (catCounts[n.categoria] || 0) + 1;
    if (catCounts[n.categoria] <= 2 || n.categoria !== 'Sucesos') {
      breaking.push(n);
      used.add(n.id);
    }
  }

  // SECCIONES POR CATEGORÍA: tomar de consulta directa por categoría, excluyendo usados
  categoryNames.forEach(name => {
    const limit = SECTION_LIMITS[name] ?? 4;
    porCategoria[name] = (porCategoria[name] || []).filter(n => !used.has(n.id)).slice(0, limit);
    porCategoria[name].forEach(n => used.add(n.id));
  });

  return { hero, ultimas, enPortada, breaking, porCategoria, masLeidas };
}
