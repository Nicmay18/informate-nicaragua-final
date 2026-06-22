import { NextRequest, NextResponse } from 'next/server';

const SITE_URL = 'https://nicaraguainformate.com';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'ni-indexnow-key-2026-x7k9m3p2q8r5t1u4';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }

    const url = `${SITE_URL}/noticias/${slug}`;

    const payload = {
      host: 'nicaraguainformate.com',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: [url],
    };

    const [bingRes, yandexRes] = await Promise.allSettled([
      fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
    ]);

    return NextResponse.json({
      ok: true,
      url,
      bing: bingRes.status === 'fulfilled' ? bingRes.value.status : 'error',
      yandex: yandexRes.status === 'fulfilled' ? yandexRes.value.status : 'error',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
