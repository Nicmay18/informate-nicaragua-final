import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { ingestArticle, queryKnowledgeForArticle } from '@/lib/meni/knowledge-base';
import type { IngestArticleInput } from '@/lib/meni/knowledge-base/types';

export const maxDuration = 30;
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
    const body = await request.json();
    const { action } = body;

    const db = getAdminDb();

    if (action === 'query') {
      const { title, content, category } = body;
      if (!title || !content) {
        return NextResponse.json({ error: 'Faltan title y content' }, { status: 400 });
      }
      const result = await queryKnowledgeForArticle(db, title, content, category || 'General');
      return NextResponse.json({ success: true, knowledge: result });
    }

    const input: IngestArticleInput = {
      articleId: body.articleId,
      title: body.title,
      content: body.content,
      slug: body.slug,
      category: body.category || 'General',
      departamento: body.departamento,
      date: body.date || new Date().toISOString(),
      author: body.author,
    };

    if (!input.articleId || !input.title || !input.content) {
      return NextResponse.json({ error: 'Faltan campos: articleId, title, content' }, { status: 400 });
    }

    const result = await ingestArticle(db, input);

    return NextResponse.json({
      success: true,
      result,
      message: `Ingestado: ${result.entitiesCreated} entidades nuevas, ${result.entitiesUpdated} actualizadas, ${result.timelineEntries} entradas de timeline.`,
    });
  } catch (error) {
    console.error('[knowledge] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const content = searchParams.get('content') || '';
    const category = searchParams.get('category') || 'General';

    if (!title) {
      return NextResponse.json({ error: 'Parámetro title requerido' }, { status: 400 });
    }

    const db = getAdminDb();
    const result = await queryKnowledgeForArticle(db, title, content, category);

    return NextResponse.json({ success: true, knowledge: result });
  } catch (error) {
    console.error('[knowledge GET] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 },
    );
  }
}
