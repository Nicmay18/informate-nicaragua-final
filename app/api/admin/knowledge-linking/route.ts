import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrCleanupToken } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateRelatedLinks } from '@/lib/meni/knowledge-base/related-knowledge';
import { generateInternalLinks, applyInternalLinks, type InternalLink } from '@/lib/meni/knowledge-base/internal-linking';

export const maxDuration = 15;
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
  return verifyAdminOrCleanupToken(request.headers.get('x-admin-token') || request.headers.get('x-admin-key'));
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { action, articleId, title, content, category } = await request.json();

    if (action === 'internal-links') {
      if (!title || !content) {
        return NextResponse.json({ error: 'Faltan title y content' }, { status: 400 });
      }
      const links: InternalLink[] = generateInternalLinks(title, content, category || 'General');
      const enrichedContent = applyInternalLinks(content, links);
      return NextResponse.json({ success: true, links, enrichedContent });
    }

    if (action === 'related-links') {
      if (!articleId || !title || !content) {
        return NextResponse.json({ error: 'Faltan articleId, title y content' }, { status: 400 });
      }
      const db = getAdminDb();
      const relatedLinks = await generateRelatedLinks(db, articleId, title, content, category || 'General');
      return NextResponse.json({ success: true, relatedLinks });
    }

    return NextResponse.json({ error: 'Acción no válida. Use: internal-links, related-links' }, { status: 400 });
  } catch (error) {
    console.error('[knowledge-linking] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
