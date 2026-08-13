import { incrementTrafficDaily } from '@/lib/analytics/traffic-aggregator';
import { getAdminDb } from '@/lib/firebase-admin';
import { type Noticia } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { getNews, getMasLeidas } from '@/lib/data';
import { incrementView } from '@/lib/view-counter';

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

function detectarFuente(referrer?: string, utmSource?: string, userAgent?: string): string {
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
      const h = (now - new Date(n.fecha).getTime()) / 36e5;
      const frescura = Math.max(0, 1 - h / 48); // decae a 0 en 48h
      const vistasNorm = Math.min(1, Math.log((n.vistas ?? 0) + 1) / Math.log(500));
      const score = frescura * 0.6 + vistasNorm * 0.4;
      return { n, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limitCount).map((s) => s.n);
}

export async function getPopularNews(limitCount: number = 5): Promise<Noticia[]> {
  return getMasLeidas(limitCount);
}
