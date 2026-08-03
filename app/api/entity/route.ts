import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { loadEntityPage, listAllEntities, generateEntitySchema } from '@/lib/meni/knowledge-base/entity-page';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const list = searchParams.get('list');

    const db = getAdminDb();

    if (list === 'true') {
      const entities = await listAllEntities(db, 200);
      return NextResponse.json({ success: true, entities });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Parámetro slug requerido o list=true' }, { status: 400 });
    }

    const data = await loadEntityPage(db, slug);
    if (!data) {
      return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 });
    }

    const schema = generateEntitySchema(data.entity);

    return NextResponse.json({ success: true, ...data, schema });
  } catch (error) {
    console.error('[entity-page API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
