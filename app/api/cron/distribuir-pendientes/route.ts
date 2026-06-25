import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: Request) {
  // Protección básica por query param
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();

    // Buscar noticias que NO estén distribuidas
    const snap = await db
      .collection('noticias')
      .where('distribuida', '!=', true)
      .orderBy('distribuida', 'asc')
      .orderBy('fecha', 'desc')
      .limit(10)
      .get();

    const pendientes = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    const resultados: any[] = [];

    for (const noticia of pendientes) {
      const slug = noticia.slug;
      if (!slug) continue;

      try {
        // Llamar al endpoint de distribución internamente
        const res = await fetch(
          `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/admin/distribuir`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, canales: ['telegram', 'indexnow', 'push'] }),
          }
        );
        const data = await res.json().catch(() => ({ success: false }));
        resultados.push({ slug, titulo: noticia.titulo, success: data.success, resultados: data.resultados });
      } catch (e: any) {
        resultados.push({ slug, titulo: noticia.titulo, success: false, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      procesadas: resultados.length,
      resultados,
    });
  } catch (err) {
    console.error('[cron/distribuir-pendientes]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
