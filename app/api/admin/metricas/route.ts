import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  const validTokens = [process.env.ADMIN_API_KEY, process.env.CRON_SECRET].filter(Boolean) as string[];
  return validTokens.length > 0 && validTokens.includes(token);
}

export async function GET(request: NextRequest) {
  if (!verificarAuth(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const db = getAdminDb();

    // 1. Métricas de distribución (últimos 30 días)
    const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const distSnap = await db
      .collection('distribuciones')
      .where('fecha', '>=', new Date(hace30d).toISOString())
      .orderBy('fecha', 'desc')
      .limit(200)
      .get();

    const distribuciones = distSnap.docs.map(d => d.data());

    // 2. Contar por canal
    const porCanal: Record<string, { exitosos: number; fallidos: number; total: number }> = {};
    for (const d of distribuciones) {
      const res = d.resultados || {};
      for (const [canal, data] of Object.entries(res)) {
        if (!porCanal[canal]) porCanal[canal] = { exitosos: 0, fallidos: 0, total: 0 };
        porCanal[canal].total++;
        if ((data as any).ok) porCanal[canal].exitosos++;
        else porCanal[canal].fallidos++;
      }
    }

    // 3. Noticias totales y vistas
    const noticiasSnap = await db.collection('noticias').count().get();
    const totalNoticias = noticiasSnap.data().count;

    const noticiasSnapData = await db
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(10)
      .get();

    const topNoticias = noticiasSnapData.docs.map(d => {
      const data = d.data();
      return {
        titulo: data.titulo,
        slug: data.slug,
        vistas: data.vistas || 0,
        categoria: data.categoria,
        distribuida: data.distribuida || false,
      };
    });

    // 4. Noticias REALMENTE sin distribuir (con query a Firestore, no resta matematica)
    const pendientesSnap = await db
      .collection('noticias')
      .where('distribuida', '==', false)
      .where('estado', '==', 'publicado')
      .limit(50)
      .get();

    const noticiasSinDistribuir = pendientesSnap.size;
    const listaPendientes = pendientesSnap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          titulo: data.titulo || 'Sin título',
          slug: data.slug || '',
          fecha: data.fecha || null,
          categoria: data.categoria || '—',
        };
      })
      .sort((a: any, b: any) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
      .slice(0, 10);

    // 5. Vistas totales
    let vistasTotales = 0;
    try {
      const allSnap = await db.collection('noticias').select('vistas').get();
      allSnap.forEach(d => { vistasTotales += (d.data().vistas || 0); });
    } catch (e) {
      // select() puede no funcionar en todas las versiones de Firestore
    }

    return NextResponse.json({
      success: true,
      periodoDias: 30,
      totalNoticias,
      vistasTotales,
      distribucionesTotal: distribuciones.length,
      noticiasSinDistribuir,
      listaPendientes,
      porCanal,
      topNoticias,
      ultimasDistribuciones: distribuciones.slice(0, 10).map((d: any) => ({
        fecha: d.fecha,
        titulo: d.titulo,
        slug: d.slug,
        canales: Object.keys(d.resultados || {}),
      })),
    });
  } catch (err: any) {
    console.error('[admin/metricas]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
