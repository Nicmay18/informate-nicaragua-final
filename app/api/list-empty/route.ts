import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Endpoint de diagnóstico: leía 200 documentos completos sin autenticación.
  if (!isAdminRequest(request)) return unauthorized();
  try {
    const db = getAdminDb();
    const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(200).get();
    const empty = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter((d: any) => !d.contenido || d.contenido.length < 100)
      .map((d: any) => ({ id: d.id, titulo: d.titulo || '(sin título)', contenidoLength: (d.contenido || '').length }));
    return NextResponse.json({ totalEmpty: empty.length, articles: empty });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
