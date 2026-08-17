import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleLifecycle } from '@/lib/observability/lifecycle';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get('slug');
    const publishedAt = searchParams.get('publishedAt');

    if (!slug || !publishedAt) {
      return NextResponse.json(
        { dataStatus: 'ERROR', error: 'slug y publishedAt son requeridos' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const data = await fetchArticleLifecycle(db, slug, publishedAt);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown';
    return NextResponse.json({ dataStatus: 'ERROR', error: message }, { status: 500 });
  }
}
