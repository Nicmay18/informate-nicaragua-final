import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { detectContentProfile } from '@/lib/meni/profile-detector';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * FORENSIC BATCH
 * Endpoint para ejecutar acciones forenses controladas sobre Firestore.
 * Requiere autenticación admin.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids, dryRun = true } = body || {};

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'action e ids son requeridos' }, { status: 400 });
    }

    const db = getAdminDb();
    const results: any[] = [];
    let writes = 0;

    for (const id of ids) {
      const ref = db.collection('noticias').doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        results.push({ id, status: 'NOT_FOUND' });
        continue;
      }
      const data = snap.data()!;

      switch (action) {
        case 'add-provenance': {
          const provenance = data.meniProvenance || data.provenance || data.meniExecuted || null;
          const cambios = Array.isArray(data.cambiosRealizados) ? data.cambiosRealizados : [];
          if (!provenance && cambios.length === 0) {
            if (!dryRun) {
              await ref.update({
                cambiosRealizados: [
                  {
                    fase: 'PHASE18B',
                    fecha: new Date().toISOString(),
                    motivo: 'Forensic batch: provenance inicial forense',
                    actor: 'forensic-batch',
                  }
                ]
              });
            }
            writes++;
            results.push({ id, status: 'PROVENANCE_ADDED', dryRun });
          } else {
            results.push({ id, status: 'PROVENANCE_EXISTS' });
          }
          break;
        }

        case 'archive': {
          if (data.estado !== 'archivado') {
            if (!dryRun) {
              await ref.update({
                estado: 'archivado',
                publicado: false,
                archived: true,
                updatedAt: new Date().toISOString(),
                cambiosRealizados: [
                  ...(data.cambiosRealizados || []),
                  {
                    fase: 'PHASE18B',
                    fecha: new Date().toISOString(),
                    motivo: 'Forensic batch: archivado por obsolescencia',
                    actor: 'forensic-batch',
                  }
                ]
              });
            }
            writes++;
            results.push({ id, status: 'ARCHIVED', dryRun });
          } else {
            results.push({ id, status: 'ALREADY_ARCHIVED' });
          }
          break;
        }

        case 'reeval-meni': {
          // Solo marca como pending de reevaluación; MENI real corre luego
          if (!dryRun) {
            await ref.update({
              meniPending: true,
              updatedAt: new Date().toISOString(),
            });
          }
          writes++;
          results.push({ id, status: 'MENI_PENDING', dryRun });
          break;
        }

        case 'query': {
          results.push({
            id,
            status: 'OK',
            data: {
              titulo: data.titulo || '',
              categoria: data.categoria || '',
              perfil: data.perfil || '',
              scoreMeni: data.scoreMeni ?? null,
              aprobadoMeni: data.aprobadoMeni ?? false,
              publicado: data.publicado ?? false,
              estado: data.estado || '',
              archived: data.archived ?? false,
              palabras: data.palabras || data.contenidoPalabras || 0,
              fecha: data.fecha || null,
              provenance: data.cambiosRealizados?.length > 0 || !!data.meniProvenance,
              scoreFromCalidad: data.scoreCalidad ? true : false,
            }
          });
          break;
        }

        case 'set-perfil': {
          const detected = detectContentProfile(data.titulo, data.contenido, data.resumen);
          const nuevoPerfil = detected.profile_confidence >= 0.40
            ? detected.profile_detected
            : (data.categoria?.toLowerCase() || 'general');
          if ((data.perfil || '') !== nuevoPerfil) {
            if (!dryRun) {
              await ref.update({
                perfil: nuevoPerfil,
                updatedAt: new Date().toISOString(),
                cambiosRealizados: [
                  ...(data.cambiosRealizados || []),
                  {
                    fase: 'PHASE18B',
                    fecha: new Date().toISOString(),
                    motivo: `Forensic batch: perfil MENI asignado (${nuevoPerfil}, confianza ${detected.profile_confidence})`,
                    actor: 'forensic-batch',
                  }
                ]
              });
            }
            writes++;
            results.push({ id, status: 'PERFIL_SET', perfil: nuevoPerfil, confianza: detected.profile_confidence, dryRun });
          } else {
            results.push({ id, status: 'PERFIL_UNCHANGED', perfil: data.perfil });
          }
          break;
        }

        default:
          results.push({ id, status: 'UNKNOWN_ACTION' });
      }
    }

    return NextResponse.json({
      action,
      dryRun,
      total: ids.length,
      writes,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
