import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function getClientIP(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

function getClientUA(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

function getClientReferer(req: Request): string {
  return req.headers.get('referer') || '';
}

function detectSource(utm: string, referer: string, ua: string): string {
  const u = utm.toLowerCase();
  const r = referer.toLowerCase();
  const a = ua.toLowerCase();
  if (u === 'telegram' || u.includes('telegram') || a.includes('telegram') || a.includes('tgweb')) return 'telegram';
  if (u === 'whatsapp' || u.includes('whatsapp') || a.includes('whatsapp') || a.includes('wa ')) return 'whatsapp';
  if (u === 'facebook' || u.includes('facebook') || r.includes('facebook.com') || r.includes('fb.me')) return 'facebook';
  if (u === 'twitter' || u.includes('twitter') || u === 'x' || r.includes('twitter.com') || r.includes('x.com') || r.includes('t.co')) return 'twitter';
  if (r.includes('google.com') || r.includes('googleusercontent')) return 'google';
  if (r.includes('bing.com')) return 'bing';
  if (r.includes('duckduckgo.com')) return 'duckduckgo';
  if (r.includes('yahoo.com')) return 'yahoo';
  if (r.includes('reddit.com')) return 'reddit';
  if (r && !r.includes('nicaraguainformate.com')) return 'otro';
  return 'directo';
}

/**
 * Link Shortener Forense — Endpoint de redirección con tracking server-side.
 * 
 * CÓMO FUNCIONA:
 * 1. Se genera un link corto como: nicaraguainformate.com/l/abc123
 * 2. Cuando alguien hace click, este endpoint recibe el request PRIMERO
 * 3. Registra: IP, UA, Referer, timestamp, source — SIN depender del navegador
 * 4. Redirige 302 a la noticia real con UTM
 * 
 * ESTO ES LO QUE HACEN LAS EMPRESAS GRANDES (bit.ly, t.co, fb.me, etc.)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.redirect('https://nicaraguainformate.com/noticias');
    }

    const db = getAdminDb();

    // 1. Buscar el link corto en Firestore
    const linkDoc = await db.collection('links_cortos').doc(id).get();
    if (!linkDoc.exists) {
      return NextResponse.redirect('https://nicaraguainformate.com/noticias');
    }

    const linkData = linkDoc.data()!;
    const targetUrl = linkData.targetUrl as string;
    const noticiaSlug = linkData.slug as string;
    const noticiaTitulo = linkData.titulo as string || '';
    const sourceParam = linkData.source as string || 'directo';

    // 2. Extraer datos forenses del request (server-side, imposible de bloquear)
    const ip = getClientIP(request);
    const ua = getClientUA(request);
    const referer = getClientReferer(request);
    const source = detectSource(sourceParam, referer, ua);

    // 3. Registrar el click en analytics_traffic (misma colección del panel)
    try {
      await db.collection('analytics_traffic').add({
        slug: noticiaSlug,
        titulo: noticiaTitulo,
        categoria: linkData.categoria || 'Actualidad',
        source,
        referrer: referer,
        ua,
        ip,
        timestamp: FieldValue.serverTimestamp(),
        tipo: 'click_link_corto',
        linkCortoId: id,
      });
    } catch (e) {
      console.error('[l/[id]] Error registrando analytics:', e);
    }

    // 4. Incrementar contador del link
    try {
      await linkDoc.ref.update({
        clicks: FieldValue.increment(1),
        ultimoClick: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('[l/[id]] Error incrementando clicks:', e);
    }

    // 5. Redirigir a la noticia con UTM
    const separator = targetUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${targetUrl}${separator}utm_source=${encodeURIComponent(source)}&utm_medium=social`;

    return NextResponse.redirect(redirectUrl, { status: 302 });

  } catch (error) {
    console.error('[l/[id]] Error:', error);
    return NextResponse.redirect('https://nicaraguainformate.com/noticias');
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
