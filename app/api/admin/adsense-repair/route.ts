import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { defaultRateLimiter } from '@/lib/rate-limit';

// =============================================================================
// ENDPOINT: Reparación específica para AdSense — expandir artículos cortos
// Requiere: GEMINI_API_KEY, ADMIN_API_KEY en variables de entorno
// =============================================================================

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[adsense-repair] Ni ADMIN_API_KEY ni TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR configurados');
    return false;
  }
  return token === validToken;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto: string): number {
  return texto.split(/\s+/).filter(Boolean).length;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

async function generarExpansion(titulo: string, contenido: string, resumen: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurado');
  }

  const textoPlano = stripHtml(contenido);
  const prompt = `Eres un periodista senior de Nicaragua. Expande la siguiente noticia a 600+ palabras para cumplir estándares de AdSense.

REGLAS ESTRICTAS:
1. NO inventes datos, nombres ni fechas. Mantén los hechos reales del texto original.
2. EXPANDE agregando: contexto histórico del lugar, antecedentes similares, reacciones de la comunidad, medidas preventivas recomendadas, y perspectivas futuras.
3. Formato HTML limpio. Párrafos cortos (máximo 3 oraciones, 80 palabras).
4. Incluye al menos 4 subtítulos descriptivos con <h2>.
5. Mantén el tono periodístico objetivo e institucional (estilo BBC/Reuters).
6. NO uses emojis.
7. Al final del artículo, incluye:
   - 'Slug sugerido: [slug-seo]'
   - 'Meta descripción: [150-160 caracteres]'

TITULO: ${titulo}
RESUMEN: ${resumen}
CONTENIDO ACTUAL: ${textoPlano.substring(0, 2500)}

Devuelve SOLO el HTML del artículo expandido, sin explicaciones adicionales.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data: GeminiResponse = await res.json();

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini devolvió respuesta vacía');
  }

  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    if (!verificarAuth(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ─── Rate limit (3 req/min por IP) — protege Gemini API
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = defaultRateLimiter.check(`adsense-repair:${ip}`);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Esperá 1 minuto.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true' || body.dryRun === true;
    const maxArticles = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10', 10), 20);
    const minPalabras = body.minPalabras || 350;
    const slugTarget = body.slug || null; // Si se pasa un slug específico, solo reparar ese

    const adminDb = getAdminDb();

    // ─── Traer noticias thin (por contenidoLength o conteo real) ───
    let snapshot;
    if (slugTarget) {
      // Reparar un artículo específico por slug
      snapshot = await adminDb
        .collection('noticias')
        .where('slug', '==', slugTarget)
        .limit(1)
        .get();
    } else {
      // Traer artículos con contenidoLength bajo (estimación de palabras)
      // contenidoLength es la longitud del string HTML; dividimos ~5 para estimar palabras
      snapshot = await adminDb
        .collection('noticias')
        .orderBy('fecha', 'desc')
        .limit(200)
        .get();
    }

    if (snapshot.empty) {
      return NextResponse.json({ mensaje: 'No hay notas que requieran reparación.' });
    }

    const resultados: Array<{
      id: string;
      slug: string;
      titulo: string;
      palabrasAntes: number;
      palabrasDespues: number;
      scoreAntes: number;
      scoreDespues: number;
      aplicado: boolean;
      error?: string;
    }> = [];

    let procesadas = 0;
    let batch = adminDb.batch();
    const batchIds: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const contenidoActual = data.contenido || '';
      const palabrasAntes = contarPalabras(stripHtml(contenidoActual));

      // Saltear si ya tiene suficientes palabras
      if (palabrasAntes >= minPalabras && !slugTarget) {
        continue;
      }

      // Limitar cantidad de artículos a procesar
      if (procesadas >= maxArticles && !slugTarget) {
        break;
      }

      let nuevoContenido: string | null = null;

      if (!dryRun) {
        try {
          nuevoContenido = await generarExpansion(
            data.titulo || '',
            contenidoActual,
            data.resumen || ''
          );
        } catch (err: any) {
          console.error(`[adsense-repair] Error Gemini para ${doc.id}:`, err.message);
          resultados.push({
            id: doc.id,
            slug: data.slug || '',
            titulo: data.titulo?.substring(0, 50) || '',
            palabrasAntes,
            palabrasDespues: 0,
            scoreAntes: data.scoreCalidad || 0,
            scoreDespues: 0,
            aplicado: false,
            error: err.message,
          });
          continue;
        }
      } else {
        nuevoContenido = `<p>[DRY-RUN] Simulación de expansión para "${data.titulo}"</p><p>Palabras antes: ${palabrasAntes}</p>`;
      }

      const palabrasDespues = nuevoContenido ? contarPalabras(stripHtml(nuevoContenido)) : 0;

      // Validar que realmente expandió
      if (!dryRun && palabrasDespues < palabrasAntes + 50) {
        console.warn(`[adsense-repair] ${doc.id}: Gemini no expandió suficiente (${palabrasAntes}→${palabrasDespues})`);
        resultados.push({
          id: doc.id,
          slug: data.slug || '',
          titulo: data.titulo?.substring(0, 50) || '',
          palabrasAntes,
          palabrasDespues,
          scoreAntes: data.scoreCalidad || 0,
          scoreDespues: 0,
          aplicado: false,
          error: 'Expansión insuficiente',
        });
        continue;
      }

      const docRef = adminDb.collection('noticias').doc(doc.id);

      if (!dryRun) {
        batch.update(docRef, {
          contenido: nuevoContenido,
          palabras: palabrasDespues,
          reparadoPorAgente: true,
          reparadoParaAdSense: true,
          ultimaActualizacionAutomatica: new Date(),
        });
        batchIds.push(doc.id);
      }

      procesadas++;
      resultados.push({
        id: doc.id,
        slug: data.slug || '',
        titulo: data.titulo?.substring(0, 50) || '',
        palabrasAntes,
        palabrasDespues,
        scoreAntes: data.scoreCalidad || 0,
        scoreDespues: 0,
        aplicado: !dryRun,
      });

      // Commit parcial cada 5 para no saturar batch
      if (batchIds.length >= 5) {
        await batch.commit();
        batch = adminDb.batch();
        batchIds.length = 0;
      }
    }

    if (!dryRun && batchIds.length > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      estado: dryRun ? 'DRY-RUN' : 'Éxito',
      procesadas,
      resultados,
    });

  } catch (error: any) {
    console.error('[adsense-repair] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
