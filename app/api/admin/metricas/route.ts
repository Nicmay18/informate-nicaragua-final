import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // 4. Vistas totales
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
