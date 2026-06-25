import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';

/** Post a tweet via Twitter API v2 */
async function postTweet(text: string, replyTo?: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    if (!TWITTER_BEARER_TOKEN) {
      return { ok: false, error: 'Falta TWITTER_BEARER_TOKEN' };
    }

    // Twitter API v2: create tweet
    const body: any = { text };
    if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.data?.id) return { ok: true, id: data.data.id };
    return { ok: false, error: data.detail || data.title || JSON.stringify(data.errors) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweets, noticia } = body;

    // tweets = array of strings (hilo)
    // noticia = { titulo, slug, categoria, resumen } (single tweet)
    let texts: string[] = [];

    if (tweets && Array.isArray(tweets)) {
      texts = tweets;
    } else if (noticia) {
      const emoji: Record<string, string> = {
        Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
        Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍'
      };
      const catEmoji = emoji[noticia.categoria] || '📰';
      const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
      const contexto = (noticia.resumen || '').substring(0, 100);
      texts = [`${catEmoji} ${noticia.titulo}\n\n${contexto}...\n\n${url}`];
    } else {
      return NextResponse.json({ error: 'tweets[] o noticia requeridos' }, { status: 400 });
    }

    const resultados: any[] = [];
    let lastId: string | undefined;

    for (const texto of texts) {
      const r = await postTweet(texto, lastId);
      resultados.push(r);
      if (r.ok && r.id) lastId = r.id;
    }

    const okCount = resultados.filter(r => r.ok).length;
    return NextResponse.json({
      success: okCount > 0,
      tweetsEnviados: okCount,
      total: texts.length,
      resultados,
    });
  } catch (err: any) {
    console.error('[admin/twitter]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
