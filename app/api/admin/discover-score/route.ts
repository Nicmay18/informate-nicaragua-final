import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { evaluateDiscoverScore } from '@/lib/discover-score';
import type { Noticia } from '@/lib/types';

export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const noticia = body as Noticia;

    if (!noticia.titulo) {
      return NextResponse.json({ error: 'Se requiere al menos un título' }, { status: 400 });
    }

    const result = evaluateDiscoverScore(noticia);

    return NextResponse.json({
      success: true,
      ...result,
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[admin/discover-score POST]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
