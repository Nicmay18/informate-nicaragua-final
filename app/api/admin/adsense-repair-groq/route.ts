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

  const systemPrompt = `Eres un periodista senior de Nicaragua con 20 años de experiencia. Tu trabajo debe ser publicado directamente sin edición. Escribe noticias de calidad ORO (máximo nivel editorial).

ESTRUCTURA OBLIGATORIA:
1. LEAD (primer párrafo): 35-50 palabras en máximo 2 oraciones. Debe incluir: nombre completo + edad + qué ocurrió + cuándo + dónde. Datos concretos, sin adjetivos emocionales.
2. CUERPO: Mínimo 4 bloques con <h2> descriptivos. Cada bloque 2-3 párrafos de 2-3 oraciones.
3. CONTEXTO FINAL: 50-75 palabras de antecedentes verificables.
4. DATOS TÉCNICOS AL FINAL: 'Slug sugerido: [slug-seo]' y 'Meta descripción: [150-160 caracteres]'

REGLAS DE CALIDAD (SIN RELLENO):
- PROHIBIDO: "consternación", "dolor", "tragedia", "profunda tristeza", "vida truncada", "amado", "querido", "indignante", "incomprensible", "brindan apoyo", "familiares lamentan".
- PROHIBIDO: transiciones genéricas tipo "además", "por otro lado", "cabe señalar", "es importante destacar", "en conclusión", "para finalizar".
- PROHIBIDO: opiniones subjetivas, juicios morales, adjetivos emotivos.
- OBLIGATORIO: citar fuentes con nombre + cargo (ej: "Juan Pérez, director de bomberos", "María López, testigo del lugar"). Si no hay nombre, cita la institución: "autoridades de la estación de bomberos de X".
- OBLIGATORIO: datos concretos en cada bloque: horas exactas, km, edades, cantidades, nombres de lugares específicos en Nicaragua.
- OBLIGATORIO: párrafos cortos, 2-3 oraciones máximo, estilo BBC/Reuters.
- PROHIBIDO: inventar datos. Si no hay información, indica "autoridades no proporcionaron detalles adicionales".
- Mínimo 500 palabras. Sin emojis.`;

  const userPrompt = `TITULO: ${titulo}\nRESUMEN: ${resumen}\nCONTENIDO ACTUAL: ${textoPlano.substring(0, 2500)}\n\nINSTRUCCIONES:\n- Expande a 500-700 palabras usando SOLO los hechos del texto original.\n- Si el original dice "autoridades investigan", no inventes nombres. Cita "autoridades de [institución específica]".\n- Agrega contexto local: historia del barrio/comunidad, estadísticas similares, medidas de prevención.\n- Incluye reacciones de vecinos/testigos SOLO si existen en el original. Si no, omítelas.\n\nDevuelve SOLO el HTML del artículo expandido, sin explicaciones.`;

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
      max_tokens: 4000,
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

      if (!dryRun && palabrasDespues < 350) {
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

      // Pausa para evitar rate limit de Groq (30s entre artículos)
      if (!dryRun && !slugTarget && procesadas > 0) {
        await new Promise(r => setTimeout(r, 30000));
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
