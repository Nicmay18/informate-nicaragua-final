import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { resolvePublicCategory } from '@/lib/editorial/canonical';
import { detectContentProfile } from '@/lib/meni/profile-detector';
import { isPublicCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface TaxonomyAuditRow {
  articleId: string;
  slug: string;
  storedCategory: string;
  resolvedCategory: string;
  detectedProfile: string;
  detectedConfidence: number;
  storedProfile?: string;
  storedConfidence?: number;
  status: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
  reason: string;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(5000, parseInt(searchParams.get('limit') || '500', 10));

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('noticias')
      .where('estado', '==', 'publicado')
      .limit(limit)
      .get();

    const rows: TaxonomyAuditRow[] = [];
    let match = 0;
    let mismatch = 0;
    let unknown = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const titulo = data.titulo || '';
      const contenido = data.contenido || '';
      const resumen = data.resumen || '';
      const storedCategory = String(data.categoria || '');
      const storedProfile = data.perfil;

      // Categoría que resolvería el sistema hoy con los datos almacenados
      const resolvedCategory = resolvePublicCategory({
        titulo,
        contenido,
        resumen,
        categoria: storedCategory,
        perfil: storedProfile,
      });

      // Perfil que detectaría el texto actual (sin depender del perfil guardado)
      const detected = detectContentProfile(titulo, contenido, resumen);

      let status: TaxonomyAuditRow['status'] = 'MATCH';
      let reason = '';

      if (!storedCategory) {
        status = 'UNKNOWN';
        reason = 'Sin categoría almacenada';
      } else if (!isPublicCategory(storedCategory)) {
        status = 'MISMATCH';
        reason = `Categoría almacenada '${storedCategory}' no es pública`;
      } else if (storedCategory === resolvedCategory) {
        status = 'MATCH';
        reason = `Resuelta desde ${storedProfile ? `perfil '${storedProfile}'` : 'detección de texto'}`;
      } else {
        status = 'MISMATCH';
        reason = `Resuelta ${storedProfile ? `desde perfil '${storedProfile}'` : 'desde detección de texto'} (${resolvedCategory}); almacenada (${storedCategory})`;
      }

      if (status === 'MATCH') match++;
      else if (status === 'MISMATCH') mismatch++;
      else unknown++;

      rows.push({
        articleId: doc.id,
        slug: data.slug || doc.id,
        storedCategory,
        resolvedCategory,
        detectedProfile: detected.profile_detected,
        detectedConfidence: detected.profile_confidence,
        storedProfile,
        storedConfidence: data.profile_confidence,
        status,
        reason,
      });
    }

    const mismatches = rows.filter((r) => r.status === 'MISMATCH').slice(0, 50);
    const unknowns = rows.filter((r) => r.status === 'UNKNOWN').slice(0, 50);

    return NextResponse.json({
      total: rows.length,
      match,
      mismatch,
      unknown,
      samples: {
        mismatch: mismatches,
        unknown: unknowns,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}
