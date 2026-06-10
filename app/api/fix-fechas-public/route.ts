import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const { Timestamp } = await import('firebase-admin/firestore');

    const snapshot = await db.collection('noticias').get();
    const fixes: { id: string; titulo: string }[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const fecha = data.fecha;
      let needsFix = false;

      if (fecha === undefined || fecha === null) {
        needsFix = true;
      } else if (typeof fecha === 'string' && (fecha.trim() === '' || isNaN(new Date(fecha).getTime()))) {
        needsFix = true;
      } else if (typeof fecha === 'object' && fecha !== null) {
        const hasToDate = typeof (fecha as any).toDate === 'function';
        const hasSeconds = '_seconds' in fecha;
        if (!hasToDate && !hasSeconds) {
          needsFix = true;
        }
      }

      if (needsFix) {
        const docCreateTime = doc.createTime ? doc.createTime.toDate() : new Date();
        const newFecha = Timestamp.fromDate(docCreateTime);
        await doc.ref.update({ fecha: newFecha });
        fixes.push({ id: doc.id, titulo: (data.titulo || '(sin título)').substring(0, 60) });
      }
    }

    return NextResponse.json({ ok: true, total: snapshot.size, fixed: fixes.length, noticias: fixes.slice(0, 30) });
  } catch (error) {
    console.error('[fix-fechas-public] Error:', error);
    return NextResponse.json({ error: 'Error interno', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
