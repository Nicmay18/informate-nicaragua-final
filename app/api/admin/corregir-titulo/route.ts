import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { isAdminRequest, unauthorized, badRequest } from '@/lib/auth';
import { CorregirTituloSchema } from '@/lib/dtos';

export async function POST(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return unauthorized();
    }

    const raw = await request.json().catch(() => ({}));
    const parsed = CorregirTituloSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest('Datos inválidos', parsed.error.issues);
    }

    const { id, titulo, slug } = parsed.data;
    const tituloLimpio = titulo.trim();

    const db = getAdminDb();
    const docRef = db.collection('noticias').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const updateData: Record<string, string> = { titulo: tituloLimpio };
    if (slug) updateData.slug = slug.trim();

    await docRef.update(updateData);
    return NextResponse.json({ ok: true, id, titulo: tituloLimpio, slug });
  } catch (error) {
    console.error('[corregir-titulo] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
