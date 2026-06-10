import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const FIX_SECRET = process.env.CRON_SECRET_TOKEN || 'default-fix-secret';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-fix-secret');
  if (secret !== FIX_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { Timestamp } = await import('firebase-admin/firestore');

    const snapshot = await db.collection('noticias').get();
    const fixes: { id: string; titulo: string; action: string }[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const fecha = data.fecha;
      let needsFix = false;

      // Caso 1: fecha no existe
      if (fecha === undefined || fecha === null) {
        needsFix = true;
      }
      // Caso 2: fecha es string vacío
      else if (typeof fecha === 'string' && fecha.trim() === '') {
        needsFix = true;
      }
      // Caso 3: fecha es string "Invalid Date" o similar
      else if (typeof fecha === 'string' && isNaN(new Date(fecha).getTime())) {
        needsFix = true;
      }
      // Caso 4: fecha es un objeto pero NO es Timestamp válido
      else if (typeof fecha === 'object' && fecha !== null) {
        const hasToDate = typeof (fecha as any).toDate === 'function';
        const hasSeconds = '_seconds' in fecha;
        if (!hasToDate && !hasSeconds) {
          needsFix = true;
        }
      }

      if (needsFix) {
        // Usar createTime del documento como fallback, o ahora si no hay createTime
        const docCreateTime = doc.createTime ? doc.createTime.toDate() : new Date();
        const newFecha = Timestamp.fromDate(docCreateTime);

        await doc.ref.update({ fecha: newFecha });
        fixes.push({
          id: doc.id,
          titulo: (data.titulo || '(sin título)').substring(0, 60),
          action: 'fecha_restaurada',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      total: snapshot.size,
      fixed: fixes.length,
      noticias: fixes.slice(0, 20),
    });
  } catch (error) {
    console.error('[fix-fechas] Error:', error);
    return NextResponse.json(
      { error: 'Error interno', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
