import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { calcularScoreEditorial } from '@/utils/scoring';

// =============================================================================
// ENDPOINT: Expansión de Thin Content con Gemini
// Requiere: GEMINI_API_KEY en variables de entorno
// =============================================================================

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY;
  if (!validToken) {
    console.warn('[expandir] ADMIN_API_KEY no configurado');
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

async function generarExpansion(titulo: string, contenido: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no configurado');
  }

  const textoPlano = stripHtml(contenido);
  const prompt = `Eres un periodista senior. Expande la siguiente noticia a 500+ palabras.

REGLAS ESTRICTAS:
1. NO inventes datos, nombres ni fechas. Mantén los hechos reales del texto original.
2. EXPANDE agregando contexto analítico, antecedentes, implicaciones o recomendaciones relacionadas.
3. Formato HTML limpio. Párrafos cortos (máximo 80 palabras).
4. Incluye al menos 2 subtítulos con <h2>.
5. Mantén el tono periodístico objetivo e institucional.

TITULO: ${titulo}
CONTENIDO ACTUAL: ${textoPlano.substring(0, 2000)}

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
    // ─── Auth ───
    if (!verificarAuth(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true';
    const adminDb = getAdminDb();

    // ─── Traer noticias thin ───
    const snapshot = await adminDb
      .collection('noticias')
      .where('scoreCalidad', '<', 85)
      .where('scoreCalidad', '>=', 50)
      .limit(5)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ mensaje: 'No hay notas que requieran expansión.' });
    }

    const resultados: Array<{
      id: string;
      titulo: string;
      palabrasAntes: number;
      palabrasDespues: number;
      scoreAntes: number;
      scoreDespues: number;
      aplicado: boolean;
    }> = [];

    let procesadas = 0;
    let batch = adminDb.batch();
    const batchIds: string[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const contenidoActual = data.contenido || '';
      const palabrasAntes = contarPalabras(stripHtml(contenidoActual));

      // Saltear si ya tiene 450+ palabras
      if (palabrasAntes > 450) continue;

      let nuevoContenido: string | null = null;

      if (!dryRun) {
        try {
          nuevoContenido = await generarExpansion(data.titulo || '', contenidoActual);
        } catch (err: any) {
          console.error(`[expandir] Error Gemini para ${doc.id}:`, err.message);
          resultados.push({
            id: doc.id,
            titulo: data.titulo?.substring(0, 50) || '',
            palabrasAntes,
            palabrasDespues: 0,
            scoreAntes: data.scoreCalidad || 0,
            scoreDespues: 0,
            aplicado: false,
          });
          continue;
        }
      } else {
        nuevoContenido = '<p>[DRY-RUN] Simulación de contenido expandido</p>';
      }

      const palabrasDespues = nuevoContenido ? contarPalabras(stripHtml(nuevoContenido)) : 0;

      // Validar que realmente expandió
      if (!dryRun && palabrasDespues < palabrasAntes + 50) {
        console.warn(`[expandir] ${doc.id}: Gemini no expandió suficiente (${palabrasAntes}→${palabrasDespues})`);
        resultados.push({
          id: doc.id,
          titulo: data.titulo?.substring(0, 50) || '',
          palabrasAntes,
          palabrasDespues,
          scoreAntes: data.scoreCalidad || 0,
          scoreDespues: 0,
          aplicado: false,
        });
        continue;
      }

      const scoreDespues = calcularScoreEditorial({
        titulo: data.titulo || '',
        resumen: data.resumen || '',
        contenido: nuevoContenido || '',
        imagen: data.imagen,
      });

      const docRef = adminDb.collection('noticias').doc(doc.id);

      if (!dryRun) {
        batch.update(docRef, {
          contenido: nuevoContenido,
          scoreCalidad: scoreDespues,
          reparadoPorAgente: true,
          ultimaActualizacionAutomatica: new Date(),
        });
        batchIds.push(doc.id);
      }

      procesadas++;
      resultados.push({
        id: doc.id,
        titulo: data.titulo?.substring(0, 50) || '',
        palabrasAntes,
        palabrasDespues,
        scoreAntes: data.scoreCalidad || 0,
        scoreDespues,
        aplicado: !dryRun,
      });

      // Commit parcial cada 10 para no saturar batch
      if (batchIds.length >= 10) {
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
    console.error('[expandir] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
