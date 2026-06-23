import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const revalidate = 0;

export async function GET() {
  try {
    const db = getAdminDb();
    
    // 1. Obtener eventos de tráfico de las últimas 24 horas para "Real-Time"
    const ahora = new Date();
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    
    const trafficSnap = await db
      .collection('analytics_traffic')
      .where('timestamp', '>=', hace24h)
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const events = trafficSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate().toISOString() || new Date().toISOString()
    }));

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
      // Fuentes
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
