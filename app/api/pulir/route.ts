import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

/** Rate limiter: máximo 20 peticiones de pulido por IP por minuto */
const pulirLimiter = new RateLimiter({ intervalMs: 60_000, maxRequests: 20 });

/** Control de métodos HTTP: solo POST permitido */
export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting por IP
    const ip = getClientIp(request);
    const rateCheck = pulirLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 2. Parseo seguro del body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
    }

    // 3. Validación de inputs requeridos
    const titulo = body.titulo;
    const contenido = body.contenido;
    const meta_descripcion = body.meta_descripcion as string | undefined;

    if (!titulo || typeof titulo !== 'string' || titulo.length < 5) {
      return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
    }
    if (!contenido || typeof contenido !== 'string' || contenido.length < 50) {
      return NextResponse.json({ error: 'Contenido demasiado corto' }, { status: 400 });
    }

    // 4. Pulido: limpieza de contenido sin llamadas a APIs externas
    const plainText = contenido
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const palabras = plainText.split(/\s+/).filter(Boolean).length;

    // Detectar relleno emocional
    const rellenoEmocional = [
      'consternada', 'consternado', 'conmoción', 'dolor', 'tragedia',
      'trágico', 'último adiós', 'perdió la batalla', 'cristiana sepultura',
    ];
    const advertencias_editor: string[] = [];
    const lowerContent = contenido.toLowerCase();
    for (const term of rellenoEmocional) {
      if (lowerContent.includes(term)) {
        advertencias_editor.push(`Contenido contiene relleno emocional: "${term}"`);
      }
    }

    // Detectar transiciones IA genéricas
    const transicionesIA = [
      'además', 'por otro lado', 'en cuanto a', 'asimismo', 'del mismo modo',
      'en consecuencia', 'en conclusión', 'finalmente', 'para finalizar',
      'es importante destacar', 'cabe señalar', 'en este sentido',
    ];
    let transicionesCount = 0;
    for (const t of transicionesIA) {
      if (lowerContent.includes(t)) transicionesCount++;
    }
    if (transicionesCount > 3) {
      advertencias_editor.push(`Alto uso de transiciones genéricas (${transicionesCount}). Parece generado por IA.`);
    }

    // Calcular score estimado
    let score = 0;
    if (palabras >= 500) score += 30;
    else if (palabras >= 250) score += 15;

    const largoTitulo = titulo.length;
    if (largoTitulo >= 30 && largoTitulo <= 70) score += 20;
    else score += 5;

    const largoResumen = (meta_descripcion || '').length;
    if (largoResumen >= 120 && largoResumen <= 160) score += 20;
    else if (largoResumen > 0) score += 5;

    const tieneSubtitulos = /<h[23][^>]*>/i.test(contenido);
    if (tieneSubtitulos) score += 10;

    const tieneNegritas = /<strong[^>]*>|<b>/i.test(contenido);
    if (tieneNegritas) score += 5;

    score = Math.min(100, score);

    let nivel = '🔴 PELIGRO';
    if (score >= 90) nivel = '🟢 ORO';
    else if (score >= 80) nivel = '🟡 BRONCE';

    return NextResponse.json({
      success: true,
      version_pulida: {
        contenido,
        meta_descripcion: meta_descripcion || '',
        palabras,
      },
      score_nuevo: score,
      nivel_nuevo: nivel,
      advertencias_editor,
      transiciones_ia: transicionesCount,
    });
  } catch (error) {
    console.error('[pulir] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
