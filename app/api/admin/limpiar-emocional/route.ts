import { getAdminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ADJETIVOS_PROHIBIDOS = [
  'tragico', 'terrible', 'impactante', 'conmociono', 'devastador',
  'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramatico',
  'critico', 'escalofriante', 'espeluznante', 'increible', 'inimaginable',
  'indignante', 'escandaloso', 'vergonzoso', 'aterrador', 'mortifero',
  'sangriento', 'brutal', 'salvaje', 'violento', 'agresivo',
  'tragedia', 'fatal', 'horror', 'desgarrador',
];

async function limpiarConGemini(
  titulo: string,
  contenido: string,
  resumen: string,
  apiKey: string
): Promise<{ titulo: string; contenido: string; resumen: string } | null> {
  const prompt = `ACTUÁ COMO EDITOR SENIOR DE NICARAGUA INFORMATE.

Tenés que REESCRIBIR esta noticia para eliminar TODO adjetivo emocional o sensacionalista.

NOTICIA ORIGINAL:
TÍTULO: ${titulo}
RESUMEN: ${resumen}
CONTENIDO: ${contenido}

REGLAS ESTRICTAS:
1. PROHIBIDO adjetivos emocionales: "trágico", "terrible", "horrible", "desgarrador", "impactante", "devastador", "alarmante", "lamentable", "dramático", "crítico", "escalofriante", "espeluznante", "increíble", "inimaginable", "indignante", "escandaloso", "vergonzoso", "aterrador", "mortífero", "sangriento", "brutal", "salvaje", "violento", "agresivo", "tragedia", "fatal", "horror".
2. Mantené los hechos básicos: quién, qué, cuándo, dónde.
3. Añadí contexto útil: datos oficiales, antecedentes, estadísticas comparativas.
4. Añadí recursos útiles: teléfonos de emergencia (Policía 118, Cruz Blanca 128, Bomberos 115), cómo denunciar, prevención.
5. Mínimo 400 palabras.
6. 4-6 bloques H2 con subtítulos claros.
7. Lenguaje neutro, claro, directo. Oraciones cortas. Voz activa.
8. Prohibido inventar fuentes. Citá solo "según comunicado oficial" o "de acuerdo con datos del..."
9. Cierre de 30-40 palabras con perspectiva para el lector.
10. El contenido debe estar en HTML con <h2> y <p>.

DEVOLVÉ ÚNICAMENTE un JSON con este formato exacto (sin markdown, sin backticks):
{"titulo": "...", "resumen": "...", "contenido": "..."}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      titulo: parsed.titulo || titulo,
      contenido: parsed.contenido || contenido,
      resumen: parsed.resumen || resumen,
    };
  } catch (err: any) {
    console.error('[limpiarConGemini] Error:', err.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const secretFromHeader = authHeader.replace('Bearer ', '').trim();
    const { searchParams } = new URL(request.url);
    const secretFromQuery = searchParams.get('secret') || '';
    const providedSecret = secretFromHeader || secretFromQuery;

    if (!providedSecret || providedSecret !== ADMIN_API_KEY) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const geminiApiKey = body.geminiApiKey || GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Falta Gemini API Key' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const ids: string[] = body.ids || [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Falta array ids en body' }, { status: 400 });
    }

    const resultados: Array<{
      id: string;
      tituloOriginal: string;
      tituloNuevo: string;
      estado: string;
      error?: string;
      adjetivosPrevios?: string[];
    }> = [];

    for (const id of ids) {
      const doc = await db.collection('noticias').doc(id).get();
      if (!doc.exists) {
        resultados.push({ id, tituloOriginal: '', tituloNuevo: '', estado: 'no_encontrada', error: 'Documento no existe' });
        continue;
      }

      const data = doc.data()!;
      const titulo = data.titulo || '';
      const contenido = data.contenido || '';
      const resumen = data.resumen || '';

      // Detectar adjetivos previos
      const contenidoLower = contenido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const adjetivosPrevios = ADJETIVOS_PROHIBIDOS.filter(a => contenidoLower.includes(a));

      if (adjetivosPrevios.length === 0) {
        resultados.push({ id, tituloOriginal: titulo, tituloNuevo: titulo, estado: 'sin_emocional', adjetivosPrevios: [] });
        continue;
      }

      try {
        const limpio = await limpiarConGemini(titulo, contenido, resumen, geminiApiKey);
        if (!limpio) {
          resultados.push({ id, tituloOriginal: titulo, tituloNuevo: '', estado: 'error_gemini', error: 'Gemini no respondió', adjetivosPrevios });
          continue;
        }

        await doc.ref.update({
          titulo: limpio.titulo,
          contenido: limpio.contenido,
          resumen: limpio.resumen,
          _limpiada: true,
          _fechaLimpieza: new Date().toISOString(),
        });

        resultados.push({ id, tituloOriginal: titulo, tituloNuevo: limpio.titulo, estado: 'limpiada', adjetivosPrevios });
        await new Promise(r => setTimeout(r, 1500));
      } catch (err: any) {
        resultados.push({ id, tituloOriginal: titulo, tituloNuevo: '', estado: 'error', error: err.message, adjetivosPrevios });
      }
    }

    const limpiadas = resultados.filter(r => r.estado === 'limpiada').length;
    const fallidas = resultados.filter(r => r.estado === 'error' || r.estado === 'error_gemini').length;

    return NextResponse.json({
      success: true,
      procesadas: resultados.length,
      limpiadas,
      fallidas,
      resultados,
    });
  } catch (err: any) {
    console.error('[admin/limpiar-emocional] Error:', err);
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 });
  }
}
