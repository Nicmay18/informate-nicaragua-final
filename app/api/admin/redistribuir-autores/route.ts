import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace('Bearer ', '').trim();
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret') || '';
    const providedSecret = secretFromHeader || secretFromQuery;

    if (!providedSecret || (CRON_SECRET && providedSecret !== CRON_SECRET)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getAdminDb();

    // Obtener todas las noticias de Keyling
    const snap = await db.collection('noticias').where('autor', '==', 'Keyling Elieth Rivera Muñoz').get();

    if (snap.empty) {
      return NextResponse.json({ success: true, message: 'No hay noticias de Keyling para redistribuir', total: 0 });
    }

    const noticias = snap.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, titulo: d.titulo || '' };
    });
    const total = noticias.length;
    
    // Calcular cuántas mover: 50% de las de Keyling
    const aMover = Math.floor(total * 0.5);
    
    // Seleccionar aleatoriamente las noticias a mover
    const shuffled = [...noticias].sort(() => Math.random() - 0.5);
    const paraMaycol = shuffled.slice(0, Math.floor(aMover / 2));
    const paraJose = shuffled.slice(Math.floor(aMover / 2), aMover);

    const actualizadas: Array<{ id: string; titulo: string; nuevoAutor: string }> = [];

    for (const n of paraMaycol) {
      await db.collection('noticias').doc(n.id).update({ autor: 'Maycol Josué Nicaragua Rivas' });
      actualizadas.push({ id: n.id, titulo: n.titulo || '', nuevoAutor: 'Maycol Josué Nicaragua Rivas' });
    }

    for (const n of paraJose) {
      await db.collection('noticias').doc(n.id).update({ autor: 'José Luis López Ramírez' });
      actualizadas.push({ id: n.id, titulo: n.titulo || '', nuevoAutor: 'José Luis López Ramírez' });
    }

    return NextResponse.json({
      success: true,
      totalKeyling: total,
      redistribuidas: aMover,
      aMaycol: paraMaycol.length,
      aJose: paraJose.length,
      actualizadas,
      resumen: `Keyling tenía ${total} noticias. Se movieron ${aMover}: ${paraMaycol.length} a Maycol, ${paraJose.length} a José. Keyling ahora tiene ${total - aMover}.`,
    });
  } catch (err: any) {
    console.error('[admin/redistribuir-autores] Error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
