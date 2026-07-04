import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { defaultRateLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

interface NoticiaData {
  titulo?: string;
  contenido?: string;
  resumen?: string;
  categoria?: string;
  fecha?: string;
  slug?: string;
  [key: string]: any;
}

/**
 * Llama a Gemini API para reescribir una noticia de sucesos
 */
async function reescribirConGemini(
  titulo: string,
  contenido: string,
  resumen: string,
  apiKey: string
): Promise<{ titulo: string; contenido: string; resumen: string } | null> {
  const prompt = `ACTUÁ COMO EDITOR SENIOR DE NICARAGUA INFORMATE.

Tenés que REESCRIBIR esta noticia de SUCESOS para hacerla APROBABLE por AdSense y ÚTIL para el lector.

NOTICIA ORIGINAL:
TÍTULO: ${titulo}
RESUMEN: ${resumen}
CONTENIDO: ${contenido}

REGLAS ESTRICTAS:
1. PROHIBIDO mencionar nombres de víctimas MENORES DE EDAD. Usá "un menor de edad", "un adolescente", "un niño de X años".
2. PROHIBIDO describir lesiones, sangre, escenas gráficas o detalles morbosos.
3. PROHIBIDO adjetivos emocionales: "trágico", "terrible", "horrible", "desgarrador", "impactante".
4. MANTENÉ los hechos básicos: quién, qué, cuándo, dónde.
5. AÑADÍ ANÁLISIS: ¿por qué pasó esto? ¿hay un patrón? ¿qué dice la autoridad?
6. AÑADÍ CONTEXTO: estadísticas comparativas, datos históricos de la zona.
7. AÑADÍ RECURSOS ÚTILES: teléfonos de emergencia (Policía 118, Cruz Blanca 128, Bomberos 115, INSS 133), cómo denunciar, consejos de prevención.
8. AÑADÍ PERSPECTIVA: ¿qué significa esto para el lector común?
9. Mínimo 600 palabras.
10. 7 bloques H2 obligatorios:
    - ¿Qué se sabe hasta ahora?
    - Contexto y antecedentes
    - Testimonios y versiones
    - Respuesta de las autoridades
    - Análisis: ¿por qué pasó esto?
    - Recursos útiles
    - Preguntas frecuentes
11. Cierre de 30-40 palabras con perspectiva para el ciudadano común.
12. Lenguaje neutro, claro, directo. Oraciones cortas. Voz activa.
13. Prohibido frases tipo: "según informes preliminares", "fuentes policiales indicaron", "las autoridades confirmaron", "la víctima fue identificada como".

DEVOLVÉ ÚNICAMENTE un JSON con este formato exacto (sin markdown, sin backticks, sin explicaciones):
{"titulo": "...", "resumen": "...", "contenido": "..."}

El contenido debe estar en HTML con etiquetas <h2> para los subtítulos y <p> para los párrafos. Las entidades importantes deben estar en <strong> en su primera mención.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpiar posible markdown
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      titulo: parsed.titulo || titulo,
      contenido: parsed.contenido || contenido,
      resumen: parsed.resumen || resumen,
    };
  } catch (err: any) {
    console.error('[rescribirConGemini] Error:', err.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace('Bearer ', '').trim();
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret') || '';
    const providedSecret = secretFromHeader || secretFromQuery;

    const validSecrets = [CRON_SECRET, ADMIN_API_KEY].filter(Boolean);
    if (!providedSecret || (validSecrets.length > 0 && !validSecrets.includes(providedSecret))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ─── Rate limit (3 req/min por IP) — protege Gemini API
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = defaultRateLimiter.check(`rescribir:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Esperá 1 minuto.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    // Obtener API key de Gemini
    const body = await request.json().catch(() => ({}));
    const geminiApiKey = body.geminiApiKey || process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Falta Gemini API Key. Pasala en el body {geminiApiKey: "..."} o configurá GEMINI_API_KEY en Vercel' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const batchSize = body.batchSize || 5; // Por defecto 5 por vez para no saturar

    // Buscar noticias de sucesos
    const snap = await db
      .collection('noticias')
      .where('categoria', '==', 'Sucesos')
      .limit(batchSize)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No hay noticias de Sucesos para reescribir',
        procesadas: 0,
      });
    }

    const resultados: Array<{
      id: string;
      tituloOriginal: string;
      tituloNuevo: string;
      estado: string;
      error?: string;
    }> = [];

    for (const doc of snap.docs) {
      const data = doc.data() as NoticiaData;
      const id = doc.id;

      if (!data.contenido || data.contenido.length < 100) {
        resultados.push({
          id,
          tituloOriginal: data.titulo || '(sin título)',
          tituloNuevo: '',
          estado: 'saltada',
          error: 'Contenido muy corto o vacío',
        });
        continue;
      }

      try {
        const reescrita = await reescribirConGemini(
          data.titulo || '',
          data.contenido || '',
          data.resumen || '',
          geminiApiKey
        );

        if (!reescrita) {
          resultados.push({
            id,
            tituloOriginal: data.titulo || '',
            tituloNuevo: '',
            estado: 'error',
            error: 'Gemini no devolvió respuesta válida',
          });
          continue;
        }

        // Actualizar en Firestore
        await doc.ref.update({
          titulo: reescrita.titulo,
          contenido: reescrita.contenido,
          resumen: reescrita.resumen,
          _rescrita: true,
          _fechaRescritura: new Date().toISOString(),
        });

        resultados.push({
          id,
          tituloOriginal: data.titulo || '',
          tituloNuevo: reescrita.titulo,
          estado: 'rescrita',
        });

        // Pequeña pausa para no saturar la API
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err: any) {
        resultados.push({
          id,
          tituloOriginal: data.titulo || '',
          tituloNuevo: '',
          estado: 'error',
          error: err.message,
        });
      }
    }

    const exitosas = resultados.filter((r) => r.estado === 'rescrita').length;
    const fallidas = resultados.filter((r) => r.estado === 'error').length;

    return NextResponse.json({
      success: true,
      procesadas: resultados.length,
      rescritas: exitosas,
      fallidas,
      resultados,
      siguiente: exitosas > 0
        ? 'Podés ejecutar de nuevo para procesar el siguiente lote'
        : undefined,
    });
  } catch (err: any) {
    console.error('[admin/rescribir-sucesos] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno' },
      { status: 500 }
    );
  }
}
