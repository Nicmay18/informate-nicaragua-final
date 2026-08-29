import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getMetricDefinition } from '@/lib/nios/intelligence/metric-truth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('noticias')
      .orderBy('vistas', 'desc')
      .limit(6)
      .get();

    const metric = getMetricDefinition('article.rank.lifetime.top');
    const noticias = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        titulo: data.titulo || 'Sin título',
        slug: data.slug || doc.id,
        categoria: data.categoria || 'General',
        // top-noticias = ranking por VISTAS CANÓNICAS ACUMULADAS (lifetime), no tráfico reciente.
        vistasCanonicas: data.vistas || 0,
        metric,
        imagen: data.imagen || null,
        fecha: data.fecha?.toDate?.().toISOString() || data.fecha || null,
      };
    });

    return NextResponse.json({
      criterio: 'TOP_BY_CANONICAL_LIFETIME_VIEWS',
      definicion: 'Rank de artículos por el contador canónico de vistas acumuladas (noticias.vistas). No mezclar con tráfico reciente ni GA4.',
      noticias,
    });
  } catch (error) {
    logger.error('Error leyendo top noticias:', error);
    return NextResponse.json({ noticias: [] }, { status: 500 });
  }
}
