import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    // Verificar auth (mismo secret del agente o token de admin)
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace('Bearer ', '').trim();
    
    // También permitir via query param para facilitar desde panel
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret') || '';
    
    const providedSecret = secretFromHeader || secretFromQuery;
    
    const validSecrets = [CRON_SECRET, ADMIN_API_KEY].filter(Boolean);
    if (!providedSecret || (validSecrets.length > 0 && !validSecrets.includes(providedSecret))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getAdminDb();
    
    // Buscar las 50 noticias más viejas (ordenadas por fecha ascendente)
    const snap = await db
      .collection('noticias')
      .orderBy('fecha', 'asc')
      .limit(50)
      .get();

    if (snap.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No hay noticias para eliminar',
        eliminadas: 0 
      });
    }

    const eliminadas: Array<{ id: string; titulo: string; fecha: string }> = [];
    const batch = db.batch();

    snap.docs.forEach((doc) => {
      const data = doc.data();
      eliminadas.push({
        id: doc.id,
        titulo: data.titulo || '(sin título)',
        fecha: data.fecha || '(sin fecha)',
      });
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      eliminadas: eliminadas.length,
      noticias: eliminadas,
      message: `Se eliminaron ${eliminadas.length} noticias viejas`,
    });
  } catch (err: any) {
    console.error('[admin/eliminar-viejas] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno' },
      { status: 500 }
    );
  }
}
