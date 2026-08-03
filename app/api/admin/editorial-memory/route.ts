import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkEditorialMemory } from '@/lib/meni/knowledge-base/editorial-memory';

export const maxDuration = 15;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  const expected = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  return !!expected && key === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { title, content, category } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Faltan title y content' }, { status: 400 });
    }

    const db = getAdminDb();
    const result = await checkEditorialMemory(db, title, content, category || 'General');

    return NextResponse.json({ success: true, memory: result });
  } catch (error) {
    console.error('[editorial-memory] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
