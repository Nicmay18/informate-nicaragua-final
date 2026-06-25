import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || '';
const LINKEDIN_AUTHOR_URN = process.env.LINKEDIN_AUTHOR_URN || '';

/** Publica artículo en LinkedIn como UGC Post */
async function publishLinkedIn(
  text: string,
  shareUrl?: string,
  shareThumbnail?: string,
  shareTitle?: string,
  shareDesc?: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    if (!LINKEDIN_ACCESS_TOKEN) return { ok: false, error: 'Falta LINKEDIN_ACCESS_TOKEN' };
    if (!LINKEDIN_AUTHOR_URN) return { ok: false, error: 'Falta LINKEDIN_AUTHOR_URN (person:XXXX o organization:XXXX)' };

    const body: any = {
      author: LINKEDIN_AUTHOR_URN,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    if (shareUrl) {
      body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      body.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: shareUrl,
        title: { text: shareTitle || 'Nicaragua Informate' },
        description: { text: shareDesc || 'Noticias de Nicaragua' },
        ...(shareThumbnail ? { thumbnail: shareThumbnail } : {}),
      }];
    }

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const id = res.headers.get('x-restli-id') || '';
      return { ok: true, id };
    }

    const data = await res.json();
    return { ok: false, error: data.message || JSON.stringify(data) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, noticia, shareUrl, shareThumbnail, shareTitle, shareDesc } = body;

    if (noticia) {
      const emoji: Record<string, string> = {
        Sucesos: '🚨', Nacionales: '📌', Economía: '💰', Cultura: '🎭',
        Espectáculos: '🎬', Deportes: '⚽', Tecnología: '💻', Internacionales: '🌍'
      };
      const catEmoji = emoji[noticia.categoria] || '📰';
      const url = `https://nicaraguainformate.com/noticias/${noticia.slug}`;
      const mensaje = `${catEmoji} ${noticia.titulo}\n\n${(noticia.resumen || '').substring(0, 150)}...\n\n#NicaraguaInformate`;
      const r = await publishLinkedIn(mensaje, url, noticia.imagen, noticia.titulo, noticia.resumen);
      return NextResponse.json({ success: r.ok, canal: 'linkedin', ...r });
    }

    if (!text) {
      return NextResponse.json({ error: 'text o noticia requeridos' }, { status: 400 });
    }

    const r = await publishLinkedIn(text, shareUrl, shareThumbnail, shareTitle, shareDesc);
    return NextResponse.json({ success: r.ok, canal: 'linkedin', ...r });
  } catch (err: any) {
    console.error('[admin/linkedin]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
