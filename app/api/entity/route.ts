import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { loadEntityPage, listAllEntities, generateEntitySchema } from '@/lib/meni/knowledge-base/entity-page';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

// Blindaje anti-abuso (2026-11-22): esta ruta era force-dynamic sin caché —
// cada request anónimo releía ~290 docs de kb_* en Firestore. Ahora comparte
// la misma ventana de caché que la página /entidad/[slug] (1h).
const cachedEntityPage = unstable_cache(
  async (slug: string) => loadEntityPage(getAdminDb(), slug),
  ['api-entity-page'],
  { revalidate: 3600, tags: ['noticias'] }
);
const cachedEntityList = unstable_cache(
  async () => listAllEntities(getAdminDb(), 200),
  ['api-entity-list'],
  { revalidate: 3600, tags: ['noticias'] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const list = searchParams.get('list');

    if (list === 'true') {
      const entities = await cachedEntityList();
      return NextResponse.json({ success: true, entities });
    }

    if (!slug) {
      return NextResponse.json({ error: 'Parámetro slug requerido o list=true' }, { status: 400 });
    }

    const data = await cachedEntityPage(slug);
    if (!data) {
      return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 });
    }

    const schema = generateEntitySchema(data.entity);

    return NextResponse.json({ success: true, ...data, schema });
  } catch (error) {
    logger.error('[entity-page API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
