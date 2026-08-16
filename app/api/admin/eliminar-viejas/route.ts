import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCronToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace(/^Bearer\s+/i, '');

    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret');

    const providedSecret = secretFromHeader || secretFromQuery;

    if (!verifyAdminOrCronToken(providedSecret)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getAdminDb();

    // REGLA 17: No eliminar noticias publicadas sin control.
    // Solo archivar (soft-delete). Hard-delete solo para borradores.
    const snap = await db
      .collection('noticias')
      .orderBy('fecha', 'asc')
      .limit(50)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No hay noticias para procesar',
        archivadas: 0,
        eliminadas: 0,
      });
    }

    const archivadas: Array<{ id: string; titulo: string; fecha: string }> = [];
    const eliminadas: Array<{ id: string; titulo: string; fecha: string }> = [];
    const batch = db.batch();
    const auditEntries: Array<Record<string, unknown>> = [];

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const estado = data.estado || (data.publicado ? 'publicado' : 'borrador');
      const wasPublished = data.publicado === true || estado === 'publicado';
      const entry = {
        id: doc.id,
        titulo: data.titulo || '(sin titulo)',
        fecha: data.fecha || '(sin fecha)',
      };

      if (wasPublished) {
        // Soft-delete: archivar, no eliminar
        batch.update(doc.ref, {
          estado: 'archivado',
          archived: true,
          publicado: false,
          noindex: true,
          deletedAt: new Date(),
          deletedBy: 'eliminar-viejas-cron',
          deleteReason: 'Archivado automatico por antiguedad (soft-delete)',
          dateModified: new Date(),
        });
        archivadas.push(entry);
        auditEntries.push({
          articleId: doc.id,
          action: 'SOFT_DELETE',
          titulo: entry.titulo,
          slug: data.slug || null,
          estadoBefore: estado,
          deletedAt: new Date().toISOString(),
          deletedBy: 'eliminar-viejas-cron',
          reason: 'Archivado automatico por antiguedad',
          snapshot: {
            titulo: data.titulo || '',
            slug: data.slug || '',
            contenido: data.contenido || '',
            categoria: data.categoria || '',
          },
        });
      } else {
        // Borrador: hard-delete permitido
        batch.delete(doc.ref);
        eliminadas.push(entry);
        auditEntries.push({
          articleId: doc.id,
          action: 'HARD_DELETE',
          titulo: entry.titulo,
          slug: data.slug || null,
          estadoBefore: estado,
          deletedAt: new Date().toISOString(),
          deletedBy: 'eliminar-viejas-cron',
          reason: `Estado ${estado} — eliminacion fisica permitida`,
          snapshot: {
            titulo: data.titulo || '',
            slug: data.slug || '',
            contenido: data.contenido || '',
            categoria: data.categoria || '',
          },
        });
      }
    });

    await batch.commit();

    // Registrar auditoria
    try {
      const auditBatch = db.batch();
      for (const entry of auditEntries) {
        auditBatch.create(db.collection('deletion_audit').doc(), entry);
      }
      await auditBatch.commit();
    } catch (e) {
      console.warn('[eliminar-viejas] No se pudo escribir auditoria:', e);
    }

    return NextResponse.json({
      success: true,
      archivadas: archivadas.length,
      eliminadas: eliminadas.length,
      archivadasList: archivadas,
      eliminadasList: eliminadas,
      message: `Archivadas: ${archivadas.length}. Eliminadas (borradores): ${eliminadas.length}. Auditoria registrada en deletion_audit.`,
    });
  } catch (err: any) {
    console.error('[admin/eliminar-viejas] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno' },
      { status: 500 }
    );
  }
}
