import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

// =============================================================================
// ENDPOINT: Generador de copy para redes sociales con IA (Groq - GRATIS)
// Genera el texto listo para pegar en Facebook con formato profesional:
// emoji + titular en mayusculas + gancho + link + hashtags.
// Reemplaza el flujo manual de copiar a ChatGPT.
// =============================================================================

const copyLimiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 30 });

const EMOJI_CAT: Record<string, string> = {
  Sucesos: '🚨',
  Nacionales: '🇳🇮',
  Deportes: '⚽',
  Internacionales: '🌍',
  Espectáculos: '🎬',
  Tecnología: '💻',
  Salud: '🏥',
  Economía: '💰',
};

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Plantilla de respaldo si Groq no está disponible o falla */
function fallbackCopy(titulo: string, texto: string, categoria: string, url: string): string {
  const emoji = EMOJI_CAT[categoria] || '📰';
  const primera = texto.match(/^[^.!?]+[.!?]+/);
  let contexto = primera ? primera[0].trim() : texto.slice(0, 140).trim();
  if (contexto.length > 160) contexto = contexto.slice(0, 157).trim() + '...';
  const hashtag = `#${categoria.replace(/\s+/g, '')} #Nicaragua`;
  return `${emoji} ${titulo.toUpperCase()}\n\n${contexto}\n\n👉 Más información aquí:\n${url}\n\n${hashtag}`;
}

async function generarCopyGroq(
  titulo: string,
  texto: string,
  categoria: string,
  url: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const emoji = EMOJI_CAT[categoria] || '📰';

  const systemPrompt = `Eres community manager de un medio de noticias de Nicaragua. Generas publicaciones para Facebook que maximizan clics hacia el sitio web. Reglas ESTRICTAS:

=== FORMATO EXACTO (respétalo línea por línea) ===
${emoji} TITULAR EN MAYÚSCULAS (reescribe el título para que sea claro y atractivo, máximo 12 palabras)

[Párrafo de contexto: 1-2 oraciones objetivas que dan ganas de leer más, SIN revelar todo. 25-45 palabras]

⚠️ [Una línea corta de gancho sobre la relevancia o impacto del hecho. 8-15 palabras]

👉 Más información aquí:
${url}

#${categoria.replace(/\s+/g, '')} #Nicaragua

=== PROHIBIDO ===
- NO reveles el desenlace completo (deja curiosidad para que hagan clic).
- NO uses relleno emocional ("consternación", "dolor", "tragedia", "vida truncada").
- NO inventes datos que no estén en el texto original.
- NO cambies la URL ni los hashtags base.
- NO agregues comillas alrededor del copy. Devuelve SOLO el texto del post.`;

  const userPrompt = `TÍTULO: ${titulo}\nCATEGORÍA: ${categoria}\nCONTENIDO: ${stripHtml(texto).substring(0, 1200)}\nURL: ${url}\n\nGenera el copy de Facebook siguiendo el formato exacto. Devuelve SOLO el texto del post, sin explicaciones.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;

    // Asegurar que la URL correcta esté presente (la IA a veces la altera)
    let copy = text.trim().replace(/^["']|["']$/g, '');
    if (!copy.includes(url)) {
      copy = copy.replace(/https?:\/\/\S+/g, url);
      if (!copy.includes(url)) copy += `\n\n👉 ${url}`;
    }
    return copy;
  } catch {
    return null;
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = copyLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    const titulo = typeof body.titulo === 'string' ? body.titulo : '';
    const contenido = typeof body.contenido === 'string' ? body.contenido : '';
    const resumen = typeof body.resumen === 'string' ? body.resumen : '';
    const categoria = typeof body.categoria === 'string' ? body.categoria : 'Noticias';
    const url = typeof body.url === 'string' ? body.url : '';

    if (!titulo || titulo.length < 5) {
      return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
    }
    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const texto = resumen || contenido;
    const iaCopy = await generarCopyGroq(titulo, texto, categoria, url);
    const copy = iaCopy || fallbackCopy(titulo, stripHtml(texto), categoria, url);

    return NextResponse.json({
      success: true,
      copy,
      source: iaCopy ? 'ia' : 'plantilla',
    });
  } catch (error) {
    console.error('[copy-social] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
