/**
 * Diagnóstico de confianza por nota — trust layer bajo demanda.
 *
 * GET ?slug=<slug> | ?id=<docId>
 * Devuelve el análisis completo: factores, diagnóstico pregunta→respuesta
 * (afirmaciones, atribuciones, provisionales con/sin fuente, entidades,
 * fuentes, qué falta) + el campo `confianza` persistido en la nota.
 *
 * Read-only: no escribe nada.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { analyzeTrust } from '@/lib/editorial/trust';

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  if (!verifyAdminOrCleanupToken(request.headers.get('x-admin-token'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get('slug');
  const id = request.nextUrl.searchParams.get('id');
  if (!slug && !id) {
    return NextResponse.json({ error: 'slug o id requerido' }, { status: 400 });
  }

  const db = getAdminDb();
  let doc;
  if (id) {
    doc = await db.collection('noticias').doc(id).get();
  } else {
    const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
    doc = snap.docs[0];
  }
  if (!doc?.exists) {
    return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 });
  }

  const d = doc.data()!;
  const trust = analyzeTrust({
    titulo: String(d.titulo ?? ''),
    cuerpo: `${String(d.contenido ?? d.cuerpo ?? '')} ${String(d.resumen ?? d.entrada ?? '')}`,
    categoria: String(d.categoria ?? 'General'),
  });

  return NextResponse.json({
    slug: d.slug ?? doc.id,
    titulo: d.titulo,
    categoria: d.categoria,
    publicado: d.publicado === true && d.estado !== 'archivado',
    confianzaPersistida: d.confianza ?? null,
    trust,
  });
}
