import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key') || '';
  const validTokens = [process.env.ADMIN_API_KEY, process.env.CRON_SECRET].filter(Boolean) as string[];
  return validTokens.length > 0 && validTokens.includes(key);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('noticias').get();
    let limpiadas = 0;
    const afectadas: { id: string; titulo: string }[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.noindex === true) {
        await doc.ref.update({ noindex: false });
        limpiadas++;
        afectadas.push({ id: doc.id, titulo: data.titulo || '(sin título)' });
      }
    }

    return NextResponse.json({
      success: true,
      limpiadas,
      afectadas,
      message: limpiadas > 0
        ? `Se limpiaron ${limpiadas} noticias que tenían noindex=true. Ahora Google puede indexarlas.`
        : 'Ninguna noticia tenía noindex=true. Todo limpio.',
    });
  } catch (error: any) {
    console.error('[limpiar-noindex]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
