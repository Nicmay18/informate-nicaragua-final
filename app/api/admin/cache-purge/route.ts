import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { isAdminRequest, unauthorized } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getAdminDb } from '@/lib/firebase-admin';

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
      'nios-telemetry',
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

    const invalidatedAt = new Date().toISOString();
    const db = getAdminDb();
    await db.collection('nios_cache_invalidations').doc('latest').set({
      invalidatedAt,
      tags,
      paths,
      source: 'cache-purge',
      createdAt: invalidatedAt,
    });

    return NextResponse.json({
      ok: true,
      purgado: { tags, paths },
      invalidatedAt,
      mensaje: 'Caché purgada. Recargá la página en unos segundos.',
    });
  } catch (error: any) {
    logger.error('[cache-purge] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error purgando caché' },
      { status: 500 }
    );
  }
}
