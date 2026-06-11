import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const { Timestamp } = await import('firebase-admin/firestore');

    // Traer solo las 10 más recientes para diagnóstico
    const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(10).get();
    const allDocs = await db.collection('noticias').get();
    const fixes: { id: string; titulo: string }[] = [];
    const diagnostic: any[] = [];

    for (const doc of allDocs.docs) {
      const data = doc.data();
      const fecha = data.fecha;
      let needsFix = false;
      let fechaType: string = typeof fecha;
      let fechaValue: any = null;

      if (fecha === undefined || fecha === null) {
        needsFix = true;
        fechaValue = null;
      } else if (typeof fecha === 'string') {
        fechaValue = fecha;
        if (fecha.trim() === '' || isNaN(new Date(fecha).getTime())) needsFix = true;
      } else if (typeof fecha === 'object' && fecha !== null) {
        const hasToDate = typeof (fecha as any).toDate === 'function';
        const hasSeconds = '_seconds' in fecha;
        if (hasToDate) {
          fechaType = 'Timestamp';
          try { fechaValue = (fecha as any).toDate().toISOString(); } catch { fechaValue = 'error'; }
        } else if (hasSeconds) {
          fechaType = 'rawTimestamp';
          fechaValue = `sec:${(fecha as any)._seconds}`;
        } else {
          fechaType = 'unknownObject';
          fechaValue = JSON.stringify(fecha).substring(0, 100);
          needsFix = true;
        }
      }

      if (needsFix) {
        const docCreateTime = doc.createTime ? doc.createTime.toDate() : new Date();
        const newFecha = Timestamp.fromDate(docCreateTime);
        await doc.ref.update({ fecha: newFecha });
        fixes.push({ id: doc.id, titulo: (data.titulo || '(sin título)').substring(0, 60) });
      }

      // Solo diagnosticar las 10 más recientes del orderBy
      if (snapshot.docs.some(d => d.id === doc.id)) {
        diagnostic.push({ id: doc.id, titulo: data.titulo || '(sin título)', fechaType, fechaValue, publicado: data.publicado, destacada: data.destacada });
      }
    }

    return NextResponse.json({ ok: true, total: allDocs.size, fixed: fixes.length, diagnostic, orderByCount: snapshot.size });
  } catch (error) {
    console.error('[fix-fechas-public] Error:', error);
    return NextResponse.json({ error: 'Error interno', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
