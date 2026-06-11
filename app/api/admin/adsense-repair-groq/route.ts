import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// =============================================================================
// ENDPOINT: Reparación AdSense con GROQ — 100% GRATIS, no pide tarjeta
// Registro: https://console.groq.com/keys
// Modelo: llama-3.1-70b-versatile (excelente en español)
// Límites gratis: 20 requests/min, 200k tokens/min
// =============================================================================

function verificarAuth(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token');
  const validToken = process.env.ADMIN_API_KEY || process.env.TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR;
  if (!validToken) {
    console.warn('[adsense-repair-groq] Ni ADMIN_API_KEY ni TOKEN_DE_LIMPIEZA_DE_ADMINISTRADOR configurados');
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

async function generarExpansionGroq(titulo: string, contenido: string, resumen: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurado');
  }

  const textoPlano = stripHtml(contenido);

  const systemPrompt = `Eres un periodista senior de Nicaragua. Expande noticias a 600+ palabras cumpliendo estándares AdSense.

REGLAS ESTRICTAS:
1. NO inventes datos, nombres ni fechas. Mantén los hechos reales del texto original.
2. EXPANDE agregando: contexto histórico del lugar, antecedentes similares, reacciones de la comunidad, medidas preventivas recomendadas, y perspectivas futuras.
3. Formato HTML limpio. Párrafos cortos (máximo 3 oraciones, 80 palabras).
4. Incluye al menos 4 subtítulos descriptivos con <h2>.
5. Mantén tono periodístico objetivo e institucional (estilo BBC/Reuters).
6. NO uses emojis.
7. Al final incluye: 'Slug sugerido: [slug-seo]' y 'Meta descripción: [150-160 caracteres]'`;

  const userPrompt = `TITULO: ${titulo}\nRESUMEN: ${resumen}\nCONTENIDO ACTUAL: ${textoPlano.substring(0, 2500)}\n\nDevuelve SOLO el HTML del artículo expandido, sin explicaciones.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('Groq devolvió respuesta vacía');
  }

  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    if (!verificarAuth(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true' || body.dryRun === true;
    const maxArticles = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10', 10), 20);
    const minPalabras = body.minPalabras || 350;
    const slugTarget = body.slug || null;

    const adminDb = getAdminDb();

    let snapshot;
    if (slugTarget) {
      snapshot = await adminDb
        .collection('noticias')
        .where('slug', '==', slugTarget)
        .limit(1)
        .get();
    } else {
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

      if (palabrasAntes >= minPalabras && !slugTarget) continue;
      if (procesadas >= maxArticles && !slugTarget) break;

      let nuevoContenido: string | null = null;

      if (!dryRun) {
        try {
          nuevoContenido = await generarExpansionGroq(
            data.titulo || '',
            contenidoActual,
            data.resumen || ''
          );
        } catch (err: any) {
          console.error(`[adsense-repair-groq] Error para ${doc.id}:`, err.message);
          resultados.push({
            id: doc.id,
            slug: data.slug || '',
            titulo: data.titulo?.substring(0, 50) || '',
            palabrasAntes,
            palabrasDespues: 0,
            aplicado: false,
            error: err.message,
          });
          continue;
        }
      } else {
        nuevoContenido = `<p>[DRY-RUN] Simulación de expansión para "${data.titulo}"</p><p>Palabras antes: ${palabrasAntes}</p>`;
      }

      const palabrasDespues = nuevoContenido ? contarPalabras(stripHtml(nuevoContenido)) : 0;

      if (!dryRun && palabrasDespues < palabrasAntes + 50) {
        resultados.push({
          id: doc.id,
          slug: data.slug || '',
          titulo: data.titulo?.substring(0, 50) || '',
          palabrasAntes,
          palabrasDespues,
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
        aplicado: !dryRun,
      });

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
    console.error('[adsense-repair-groq] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
