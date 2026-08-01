import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { isAdminRequest, unauthorized } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request as unknown as Request)) {
    return unauthorized();
  }

  try {
    const tags = [
      'noticias',
      'latest-news',
      'trending-news',
      'popular-news',
      'news-sitemap',
      'sitemap-news',
    ];
    const paths = [
      '/',
      '/noticias',
      '/feed.xml',
      '/sitemap.xml',
      '/news-sitemap.xml',
    ];

    for (const tag of tags) revalidateTag(tag);
    for (const path of paths) revalidatePath(path);

    return NextResponse.json({
      ok: true,
      purgado: { tags, paths },
      mensaje: 'Caché purgada. Recargá la página en unos segundos.',
    });
  } catch (error: any) {
    console.error('[cache-purge] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error purgando caché' },
      { status: 500 }
    );
  }
}
