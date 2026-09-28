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
import { canCallLLM, recordCall } from '@/lib/supervisor/cost-guard';
import { logger } from '@/lib/logger';

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
  story?: any;
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

function buildUrl(slug: string, utm = ''): string {
  const base = `https://nicaraguainformate.com/noticias/${slug}`;
  return utm ? `${base}?utm_source=${utm}` : base;
}

// ── Telegram ────────────────────────────────────────────────
// Sender único compartido (lib/distribution/telegram): escape HTML,
// resumen con fallback, truncado seguro, timeout, idempotencia y 1 retry.
async function sendTelegram(db: Firestore, input: PipelineInput): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const { sendTelegramArticle } = await import('@/lib/distribution/telegram');
    const r = await sendTelegramArticle(
      {
        slug: input.slug,
        titulo: input.titulo,
        resumen: input.resumen,
        contenido: input.contenido,
        categoria: input.categoria,
        imagen: input.imagen,
        imagenRedes: input.imagenRedes,
        articleId: input.articleId,
      },
      { db },
    );
    return { ok: r.ok, error: r.error, skipped: r.skipped };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error' };
  }
}

// ── Facebook ────────────────────────────────────────────────
async function sendFacebook(input: PipelineInput): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  try {
    const token = process.env.FB_PAGE_ACCESS_TOKEN || '';
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

    const socialFromStory = input.story?.distribution?.social;
  const mensaje = socialFromStory
    ? `${emoji} ${socialFromStory}\n\n👉 ${url}\n\n#NicaraguaInformate`
    : `${emoji} ${input.titulo}\n\n${contexto}...\n\n👉 ${url}\n\n#NicaraguaInformate`;

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
    const key = process.env.INDEXNOW_KEY;
    if (!key) { return { ok: false, error: 'INDEXNOW_KEY no configurada' }; }
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
    const appId = process.env.ONESIGNAL_APP_ID || '';
    const restKey = process.env.ONESIGNAL_REST_API_KEY || '';
    if (!appId || !restKey) return { ok: true, skipped: true, error: 'Push no configurado' };

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
// Determinista por defecto: la distribución normal NO depende de Groq/IA.
// La IA es mejora opcional (GROQ_API_KEY + presupuesto); el fallback
// determinista siempre produce copy completo sin ella.
async function generateSocialCopy(input: PipelineInput): Promise<{ facebook: string | null; whatsapp: string | null; source: 'ia' | 'plantilla' | 'none' }> {
  const url = buildUrl(input.slug);
  const emoji = EMOJI_CAT[input.categoria] || '📰';
  const texto = stripHtml(input.resumen || input.contenido);

  // Intentar IA (Groq) si hay API key y el presupuesto lo permite
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey) {
    try {
      const { allowed, reason } = await canCallLLM(input.db);
      if (!allowed) {
        logger.warn('[publication-pipeline] Cost guard bloqueó social copy:', reason);
      } else {
        await recordCall(input.db);
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
      }
    } catch { /* fallback */ }
  }

  // Plantilla determinista (lib/distribution/social-copy): nunca depende de IA.
  const { generateSocialCopy: genDeterminista } = await import('@/lib/distribution/social-copy');
  const det = genDeterminista({
    slug: input.slug,
    titulo: input.titulo,
    resumen: input.resumen,
    contenido: input.contenido,
    categoria: input.categoria,
    departamento: input.departamento,
  });
  return { facebook: det.facebook.text, whatsapp: det.whatsapp.text, source: 'plantilla' };
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

  // 4. Marcar noticia como distribuida (mutación técnica con provenance)
  try {
    const { applyTechnicalMutation } = await import('@/lib/editorial/mutation-policy');
    await applyTechnicalMutation(
      db,
      input.articleId,
      { distribuida: true, fechaDistribucion: new Date().toISOString() },
      { actor: 'publication-pipeline', reason: 'Distribución completada' },
    );
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
