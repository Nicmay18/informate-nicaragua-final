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
  Cultura: '🎭',
};

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Extraer oraciones cortas del texto para formato punchy */
function extraerOraciones(texto: string, max: number = 4): string[] {
  const limpio = texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const oraciones = limpio
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 15 && s.length <= 140)
    .slice(0, max);
  return oraciones;
}

/** Plantilla de respaldo si Groq no está disponible o falla */
function fallbackCopy(titulo: string, texto: string, categoria: string, url: string): string {
  const emoji = EMOJI_CAT[categoria] || '📰';
  const oraciones = extraerOraciones(texto, 4);

  let cuerpo: string;
  if (oraciones.length >= 2) {
    const parrafo1 = oraciones[0] + '.';
    const parrafo2 = oraciones.slice(1, 3).join('. ') + '.';
    const parrafo3 = oraciones[3] ? oraciones[3] + '.' : '';
    cuerpo = [parrafo1, parrafo2, parrafo3].filter(Boolean).join('\n\n');
  } else {
    cuerpo = oraciones[0] ? oraciones[0] + '.' : texto.slice(0, 140).trim() + '...';
  }

  const hashtag = `#${categoria.replace(/\s+/g, '')} #Nicaragua`;
  return `${emoji} ${titulo}\n\n${cuerpo}\n\n👉 Nota completa:\n${url}\n\n${hashtag}`;
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
${emoji} [Título reescrito en 8-12 palabras, claro y atractivo, SIN comillas]

[Oración corta 1, máximo 10 palabras]

[Oración corta 2, máximo 10 palabras]
[Oración corta 3, máximo 10 palabras]

[Oración corta 4 con gancho, máximo 12 palabras] 👉 Nota completa:
${url}

#[CategoríaSinEspacios] #[PaísORegiónDelHecho] #[TemaPrincipal]

=== REGLAS ===
- Escribe oraciones CORTAS (5-12 palabras cada una).
- Separa cada bloque de oraciones con saltos de línea (una línea en blanco entre párrafos).
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
