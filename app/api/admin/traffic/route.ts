import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  const validTokens = [process.env.ADMIN_API_KEY, process.env.CRON_SECRET].filter(Boolean) as string[];
  return validTokens.length > 0 && validTokens.includes(token);
}

/** Detecta la fuente de tráfico a partir del referrer o utm_source */
function detectarFuente(referrer?: string, utmSource?: string): string {
  const ref = (referrer || '').toLowerCase();
  const utm = (utmSource || '').toLowerCase();

  // Prioridad: utm_source sobre referrer
  if (utm.includes('facebook') || utm.includes('fb')) return 'facebook';
  if (utm.includes('telegram') || utm.includes('tg')) return 'telegram';
  if (utm.includes('whatsapp') || utm.includes('wa')) return 'whatsapp';
  if (utm.includes('twitter') || utm.includes('x.com')) return 'twitter';
  if (utm.includes('google')) return 'google';

  // Analizar referrer
  if (ref.includes('facebook.com') || ref.includes('fb.me') || ref.includes('fb.com')) return 'facebook';
  if (ref.includes('t.me') || ref.includes('telegram.org')) return 'telegram';
  if (ref.includes('whatsapp.com') || ref.includes('wa.me')) return 'whatsapp';
  if (ref.includes('twitter.com') || ref.includes('x.com') || ref.includes('t.co')) return 'twitter';
  if (ref.includes('google.com') || ref.includes('google')) return 'google';
  if (ref.includes('bing.com')) return 'google'; // agrupar buscadores
  if (ref.includes('yahoo.com')) return 'google';

  // Si hay referrer pero no coincide con ninguno conocido
  if (ref && ref.startsWith('http')) return 'otro';

  return 'directo';
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();
    
    // 1. Obtener eventos de tráfico de las últimas 24 horas desde traffic_log
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    const trafficSnap = await db
      .collection('traffic_log')
      .where('timestamp', '>=', hace24h)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const events = trafficSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Normalizar referrer/utmSource a source
        source: data.source || detectarFuente(data.referrer, data.utmSource),
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
      };
    });

    // 2. Procesar estadísticas
    const stats = {
      vistas24h: events.length,
      fuentes: {
        facebook: 0,
        telegram: 0,
        google: 0,
        whatsapp: 0,
        twitter: 0,
        directo: 0,
        otro: 0
      } as Record<string, number>,
      topPaginas: {} as Record<string, { titulo: string, vistas: number }>,
      ultimosEventos: events.slice(0, 10)
    };

    events.forEach((ev: any) => {
      // Fuentes - usar source normalizado
      const src = ev.source || 'directo';
      stats.fuentes[src] = (stats.fuentes[src] || 0) + 1;

      // Top Páginas
      if (!stats.topPaginas[ev.slug]) {
        stats.topPaginas[ev.slug] = { titulo: ev.titulo || ev.slug, vistas: 0 };
      }
      stats.topPaginas[ev.slug].vistas++;
    });

    // Convertir topPaginas a array ordenado
    const topPaginasArray = Object.entries(stats.topPaginas)
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => b.vistas - a.vistas)
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      stats: {
        ...stats,
        topPaginas: topPaginasArray
      }
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' }
    });
  } catch (error) {
    console.error('[API Traffic] Error:', error);
    return NextResponse.json({ error: 'Error al obtener tráfico' }, { status: 500 });
  }
}
