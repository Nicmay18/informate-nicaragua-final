import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MEDIUM_INTEGRATION_TOKEN = process.env.MEDIUM_INTEGRATION_TOKEN || '';

/** Publica artículo en Medium vía API */
async function publishMedium(
  title: string,
  content: string,
  tags: string[],
  canonicalUrl?: string
): Promise<{ ok: boolean; url?: string; id?: string; error?: string }> {
  try {
    if (!MEDIUM_INTEGRATION_TOKEN) {
      return { ok: false, error: 'Falta MEDIUM_INTEGRATION_TOKEN' };
    }

    // 1. Obtener user ID
    const userRes = await fetch('https://api.medium.com/v1/me', {
      headers: { Authorization: `Bearer ${MEDIUM_INTEGRATION_TOKEN}` },
    });
    const userData = await userRes.json();
    const userId = userData.data?.id;
    if (!userId) return { ok: false, error: 'No se pudo obtener userId de Medium' };

    // 2. Crear post
    const postRes = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MEDIUM_INTEGRATION_TOKEN}`,
      },
      body: JSON.stringify({
        title,
        contentFormat: 'html',
        content: `<h1>${title}</h1>\n${content}`,
        tags: tags.slice(0, 5),
        publishStatus: 'public',
        canonicalUrl,
      }),
    });

    const postData = await postRes.json();
    if (postData.data?.url) return { ok: true, url: postData.data.url, id: postData.data.id };
    return { ok: false, error: postData.errors?.[0]?.message || JSON.stringify(postData) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noticia, title, content, tags = [], canonicalUrl } = body;

    if (noticia) {
      const titulo = noticia.titulo;
      const html = `<p>${noticia.resumen || ''}</p><p><a href="https://nicaraguainformate.com/noticias/${noticia.slug}">Leer noticia completa en Nicaragua Informate</a></p>`;
      const etiquetas = [noticia.categoria || 'Nicaragua', 'Noticias', 'NicaraguaInformate'];
      const r = await publishMedium(titulo, html, etiquetas, `https://nicaraguainformate.com/noticias/${noticia.slug}`);
      return NextResponse.json({ success: r.ok, canal: 'medium', ...r });
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'title + content, o noticia requeridos' }, { status: 400 });
    }

    const r = await publishMedium(title, content, tags, canonicalUrl);
    return NextResponse.json({ success: r.ok, canal: 'medium', ...r });
  } catch (err: any) {
    console.error('[admin/medium]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
