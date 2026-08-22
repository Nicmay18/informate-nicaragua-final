import { NextResponse } from 'next/server';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { getNews, getNewsBySlug } from '@/lib/data';
import { getAdminDb } from '@/lib/firebase-admin';
import { getTrafficForDate } from '@/lib/analytics/traffic-reader';
import { analyzeForPublication, type TrafficEvidence, type IndexingEvidence } from '@/lib/ceo-agent';

function isAccessError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string }).code;
  const text = `${message} ${code || ''}`.toLowerCase();
  return (
    text.includes('unauthenticated') ||
    text.includes('permission_denied') ||
    text.includes('permission denied') ||
    text.includes('unauthorized') ||
    text.includes('401') ||
    text.includes('403') ||
    text.includes('credenciales') ||
    text.includes('credentials') ||
    text.includes('missing or insufficient permissions')
  );
}

async function probeFirestore(db: ReturnType<typeof getAdminDb>): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await db.collection('noticias').limit(1).get();
    return { ok: true };
  } catch (err) {
    if (isAccessError(err)) {
      return { ok: false, reason: 'ACCESS_BLOCKED: Firestore no autorizó la consulta.' };
    }
    return { ok: false, reason: `ACCESS_BLOCKED: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function getIndexingEvidence(slug: string): Promise<IndexingEvidence> {
  try {
    const db = getAdminDb();
    const url = `https://nicaraguainformate.com/noticias/${slug}`;
    const snap = await db
      .collection('indexing_log')
      .where('url', '==', url)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!snap.empty) {
      const data = snap.docs[0].data();
      return {
        url,
        status: data.status === 'success' ? 'REAL' : 'NO_DATA',
        source: 'indexing_log',
        lastNotified: data.timestamp ? new Date(data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp).toISOString() : undefined,
      };
    }

    return { url, status: 'NO_DATA', source: 'indexing_log' };
  } catch (err) {
    if (isAccessError(err)) {
      return { url: `https://nicaraguainformate.com/noticias/${slug}`, status: 'ACCESS_BLOCKED', source: 'indexing_log' };
    }
    return { url: `https://nicaraguainformate.com/noticias/${slug}`, status: 'NO_DATA', source: 'indexing_log' };
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function buildTrafficEvidence(
  slug: string,
  trafficResult: Awaited<ReturnType<typeof getTrafficForDate>>,
): TrafficEvidence {
  const found = trafficResult.articles.find(a => a.slug === slug);
  return {
    viewsRecent: found?.views,
    source: trafficResult.source === 'traffic_log_fallback' ? 'traffic_log' : 'traffic_daily',
    status: found ? 'REAL' : 'NO_DATA',
  };
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim();

    if (!slug) {
      return NextResponse.json({ status: 'NO_DATA', error: 'Se requiere slug' }, { status: 400 });
    }

    const db = getAdminDb();

    // 1. Verificar acceso a Firestore ANTES de consultar contenido
    const probe = await probeFirestore(db);
    if (!probe.ok) {
      return NextResponse.json({ status: 'ACCESS_BLOCKED', error: probe.reason }, { status: 503 });
    }

    // 2. Consultar artículo. Si no existe, es NOT_FOUND (la consulta fue exitosa).
    const article = await getNewsBySlug(slug);
    if (!article) {
      return NextResponse.json({ status: 'NOT_FOUND', slug, error: 'Artículo no encontrado' }, { status: 404 });
    }

    const [allArticles, trafficResult, indexing] = await Promise.all([
      getNews(200),
      (async () => {
        const today = new Date().toISOString().split('T')[0];
        return getTrafficForDate(db, today, 100);
      })(),
      getIndexingEvidence(slug),
    ]);

    const traffic = buildTrafficEvidence(slug, trafficResult);
    const result = analyzeForPublication(article, {
      articlePool: allArticles,
      traffic,
      indexing,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
