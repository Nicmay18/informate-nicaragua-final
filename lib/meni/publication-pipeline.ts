/**
 * Publication Pipeline — Nicaragua Informate OS
 * =============================================
 * Cuando una nota es aprobada, este módulo ejecuta automáticamente
 * toda la cadena de distribución sin intervención del periodista.
 *
 * Aprobado → Distribuir → Social → Push → IndexNow → Analytics → Learning
 *
 * Todo es no-bloqueante: si un canal falla, la nota ya está publicada.
 */

import type { Firestore } from 'firebase-admin/firestore';

export interface PipelineInput {
  db: Firestore;
  articleId: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  imagen?: string;
  imagenRedes?: string;
  autor?: string;
  departamento?: string;
  veredictoEjecutivo?: {
    publicar: string;
    confianza: number;
    recomendacionPortada: string;
    probabilidadFacebook: string;
    probabilidadDiscover: string;
  };
}

export interface PipelineResult {
  distribucion: {
    telegram: { ok: boolean; skipped?: boolean; error?: string };
    facebook: { ok: boolean; skipped?: boolean; error?: string };
    indexNow: { ok: boolean; error?: string };
    push: { ok: boolean; skipped?: boolean; error?: string };
  };
  socialCopy: {
    facebook: string | null;
    whatsapp: string | null;
    source: 'ia' | 'plantilla' | 'none';
  };
  analytics: { ok: boolean };
  learning: { ok: boolean };
  duracionMs: number;
}

const EMOJI_CAT: Record<string, string> = {
  Sucesos: '🚨',
  Nacionales: '🇳🇮',
  Deportes: '⚽',
  Internacionales: '🌍',
  Espectáculos: '🎬',
  Tecnología: '💻',
  Salud: '🏥',
  Economía: '💰',
  Cultura: '🎭',
  Política: '🏛️',
  Educación: '📚',
  General: '📰',
};

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extraerOraciones(texto: string, max: number = 4): string[] {
  const limpio = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return limpio
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 15 && s.length <= 140)
    .slice(0, max);
}

function buildUrl(slug: string, utm = ''): string {
  const base = `https://nicaraguainformate.com/noticias/${slug}`;
  return utm ? `${base}?utm_source=${utm}` : base;
}

// ── Telegram ────────────────────────────────────────────────
async function sendTelegram(db: Firestore, input: PipelineInput): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const snap = await db.collection('config').doc('admin').get();
    const data = snap.data() || {};
    const token = data.telegram?.token || process.env.TG_TOKEN || '';
    const chatId = data.telegram?.chatId || process.env.TG_CHAT_ID || process.env.TG_CHAT || '';
    if (!token || !chatId) return { ok: false, error: 'Faltan credenciales Telegram' };

    const url = buildUrl(input.slug, 'telegram');
    const emoji = EMOJI_CAT[input.categoria] || '📰';

    let contexto = '';
    const texto = (input.resumen || stripHtml(input.contenido)).replace(/\n+/g, ' ').trim();
    const oraciones = texto.match(/[^.!?]+[.!?]+/g) || [];
    for (const o of oraciones) {
      const limpia = o.trim();
      if (contexto.length + limpia.length + 1 > 180 && contexto.length > 0) break;
      contexto += (contexto ? ' ' : '') + limpia;
    }
    if (!contexto) contexto = texto.substring(0, 120);

    const caption = `<b>${emoji} ${input.titulo}</b>\n\n${contexto}...\n\n🔗 <a href="${url}">Leer noticia completa</a>\n\n#NicaraguaInformate`;
    const imagen = input.imagenRedes || input.imagen;
    const imagenValida = imagen && !imagen.startsWith('data:') && imagen.startsWith('http');

    if (imagenValida) {
      const photoRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: imagen,
          caption: caption.slice(0, 1024),
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] },
        }),
      });
      const photoData = await photoRes.json();
      if (photoData.ok) return { ok: true };
    }

    const msgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption.slice(0, 4096),
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '📰 Leer noticia completa →', url }]] },
      }),
    });
    const msgData = await msgRes.json();
    return { ok: msgData.ok, error: msgData.ok ? undefined : msgData.description };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// ── Facebook ────────────────────────────────────────────────
async function sendFacebook(input: PipelineInput): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const token = process.env.FB_PAGE_TOKEN || '';
    const pageId = process.env.FB_PAGE_ID || '';
    if (!token || !pageId) return { ok: false, skipped: true, error: 'Credenciales Facebook no configuradas' };

    const url = buildUrl(input.slug, 'facebook');
    const emoji = EMOJI_CAT[input.categoria] || '📰';

    let contexto = '';
    const texto = (input.resumen || stripHtml(input.contenido)).replace(/\n+/g, ' ').trim();
    const oraciones = texto.match(/[^.!?]+[.!?]+/g) || [];
    for (const o of oraciones) {
      const limpia = o.trim();
      if (contexto.length + limpia.length + 1 > 200 && contexto.length > 0) break;
      contexto += (contexto ? ' ' : '') + limpia;
    }
    if (!contexto) contexto = texto.substring(0, 140);

    const mensaje = `${emoji} ${input.titulo}\n\n${contexto}...\n\n👉 ${url}\n\n#NicaraguaInformate`;

    const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: mensaje, link: url, access_token: token }),
    });
    const data = await res.json();
    return { ok: !data.error, error: data.error?.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// ── IndexNow (Bing + Yandex) ────────────────────────────────
async function sendIndexNow(input: PipelineInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const key = process.env.INDEXNOW_KEY || 'ni-indexnow-key-2026-x7k9m3p2q8r5t1u4';
    const url = buildUrl(input.slug);
    const payload = {
      host: 'nicaraguainformate.com',
      key,
      keyLocation: `https://nicaraguainformate.com/${key}.txt`,
      urlList: [url],
    };
    await Promise.allSettled([
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
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// ── Push (OneSignal) ────────────────────────────────────────
async function sendPush(input: PipelineInput): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const appId = process.env.ONESIGNAL_APP_ID || '608354d3-fd2a-4c97-b055-5c14b57bbe9b';
    const restKey = process.env.ONESIGNAL_REST_API_KEY || '';
    if (!restKey) return { ok: true, skipped: true, error: 'Push no configurado (opcional)' };

    const url = buildUrl(input.slug, 'push');
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${restKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Subscribed Users'],
        headings: { en: input.titulo, es: input.titulo },
        contents: { en: input.resumen || 'Nueva noticia de Nicaragua Informate', es: input.resumen || 'Nueva noticia de Nicaragua Informate' },
        url,
        chrome_web_image: input.imagen || undefined,
      }),
    });
    const data = await res.json();
    return { ok: !!data.id, error: data.errors?.[0] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// ── Social Copy (Facebook + WhatsApp) ───────────────────────
async function generateSocialCopy(input: PipelineInput): Promise<{ facebook: string | null; whatsapp: string | null; source: 'ia' | 'plantilla' | 'none' }> {
  const url = buildUrl(input.slug);
  const emoji = EMOJI_CAT[input.categoria] || '📰';
  const texto = stripHtml(input.resumen || input.contenido);

  // Intentar IA (Groq) si hay API key
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Eres community manager de un medio de noticias de Nicaragua. Generas publicaciones para Facebook. Reglas: oraciones cortas (5-12 palabras), no reveles el desenlace, no uses relleno emocional, no inventes datos. Devuelve SOLO el texto del post.`,
            },
            {
              role: 'user',
              content: `TÍTULO: ${input.titulo}\nCATEGORÍA: ${input.categoria}\nCONTENIDO: ${texto.substring(0, 1200)}\nURL: ${url}\n\nGenera el copy de Facebook. Devuelve SOLO el texto.`,
            },
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const copy = data.choices?.[0]?.message?.content?.trim();
        if (copy) {
          const fbCopy = copy.includes(url) ? copy : `${copy}\n\n👉 ${url}`;
          const waCopy = `${emoji} *${input.titulo}*\n\n${texto.substring(0, 120)}...\n\n🔗 ${url}\n\n#NicaraguaInformate`;
          return { facebook: fbCopy, whatsapp: waCopy, source: 'ia' };
        }
      }
    } catch { /* fallback */ }
  }

  // Plantilla de respaldo
  const oraciones = extraerOraciones(texto, 4);
  let cuerpo: string;
  if (oraciones.length >= 2) {
    cuerpo = [oraciones[0] + '.', oraciones.slice(1, 3).join('. ') + '.'].filter(Boolean).join('\n\n');
  } else {
    cuerpo = oraciones[0] ? oraciones[0] + '.' : texto.substring(0, 140) + '...';
  }
  const hashtag = `#${input.categoria.replace(/\s+/g, '')} #Nicaragua`;
  const fbCopy = `${emoji} ${input.titulo}\n\n${cuerpo}\n\n👉 Nota completa:\n${url}\n\n${hashtag}`;
  const waCopy = `${emoji} *${input.titulo}*\n\n${texto.substring(0, 120)}...\n\n🔗 ${url}\n\n#NicaraguaInformate`;
  return { facebook: fbCopy, whatsapp: waCopy, source: 'plantilla' };
}

// ── Pipeline principal ──────────────────────────────────────
export async function runPublicationPipeline(input: PipelineInput): Promise<PipelineResult> {
  const start = Date.now();
  const { db } = input;

  // 1. Distribución paralela (Telegram, Facebook, IndexNow, Push)
  const [telegram, facebook, indexNow, push] = await Promise.all([
    sendTelegram(db, input),
    sendFacebook(input),
    sendIndexNow(input),
    sendPush(input),
  ]);

  // 2. Generar copy para redes sociales
  const socialCopy = await generateSocialCopy(input);

  // Guardar copy en Firestore para que el periodista lo pueda copiar
  try {
    await db.collection('social_copies').doc(input.articleId).set({
      articleId: input.articleId,
      slug: input.slug,
      facebook: socialCopy.facebook,
      whatsapp: socialCopy.whatsapp,
      source: socialCopy.source,
      fecha: new Date().toISOString(),
    });
  } catch { /* non-blocking */ }

  // 3. Registrar distribución en Firestore
  try {
    await db.collection('distribuciones').add({
      slug: input.slug,
      titulo: input.titulo,
      canales: ['telegram', 'facebook', 'indexnow', 'push'],
      resultados: { telegram, facebook, indexnow: indexNow, push },
      socialCopy: socialCopy.source !== 'none',
      fecha: new Date().toISOString(),
    });
  } catch { /* non-blocking */ }

  // 4. Marcar noticia como distribuida
  try {
    await db.collection('noticias').doc(input.articleId).update({
      distribuida: true,
      fechaDistribucion: new Date().toISOString(),
    });
  } catch { /* non-blocking */ }

  // 5. Analytics + Learning ya se registran en guardar-directo
  // (meni_predictions, meni_daily_score, editor_corrections)

  return {
    distribucion: { telegram, facebook, indexNow, push },
    socialCopy,
    analytics: { ok: true },
    learning: { ok: true },
    duracionMs: Date.now() - start,
  };
}
