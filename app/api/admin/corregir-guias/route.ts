import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || '';
  return !!ADMIN_API_KEY && key === ADMIN_API_KEY;
}

const GUIAS = [
  'apostillar-documentos-nicaragua-2026',
  'anular-recurso-policial-nicaragua-2026',
  'turismo-nicaragua-2026-destinos-imperdibles',
  'beisbol-nicaragua-2026-historia-equipos-estadios',
  'tramites-migratorios-nicaraguenses-costa-rica-eeuu-espana-2026',
  'salario-minimo-nicaragua-2026',
  'costo-de-vida-nicaragua-2026',
  'mejores-playas-nicaragua-2026',
  'dolar-a-cordoba-nicaragua-hoy-2026',
  'gastronomia-nicaragua-platos-tipicos-2026',
  'economia-nicaragua-2026-guia',
];

async function reescribirConGemini(titulo: string, contenido: string): Promise<string> {
  const texto = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const prompt = `Sos un redactor experto de guías prácticas para Nicaragua. Reescribí esta guía completa en HTML con la siguiente estructura obligatoria:

REGLAS:
1. Mínimo 600 palabras.
2. Lead de 35-50 palabras con contexto claro.
3. Mínimo 5 subtítulos <h2> descriptivos.
4. Párrafos cortos de 2-3 oraciones.
5. Incluir al menos 1 tabla o lista de pasos.
6. Incluir una sección "Preguntas frecuentes" con 3 preguntas.
7. Incluir al final: fuentes consultadas, datos de contacto institucionales, y enlaces relacionados.
8. Sin opiniones subjetivas, sin emojis en el cuerpo, sin adjetivos emocionales.
9. Estilo periodístico profesional, objetivo y verificable.
10. Devolvé SOLO el HTML del cuerpo, sin markdown, sin explicaciones.

TÍTULO: ${titulo}
CONTENIDO ACTUAL: ${texto.slice(0, 3000)}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/```html|```/g, '').trim();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Falta GEMINI_API_KEY' }, { status: 500 });
  }

  try {
    const db = getAdminDb();
    const { slug } = await request.json().catch(() => ({}));
    const slugs = slug ? [slug] : GUIAS;
    const resultados: { slug: string; ok: boolean; error?: string }[] = [];

    for (const s of slugs) {
      try {
        const snap = await db.collection('guias').where('slug', '==', s).limit(1).get();
        if (snap.empty) {
          resultados.push({ slug: s, ok: false, error: 'No encontrado en coleccion guias' });
          continue;
        }
        const doc = snap.docs[0];
        const data = doc.data();
        const titulo = data.titulo || s;
        const contenido = data.contenido || '';

        const nuevoContenido = await reescribirConGemini(titulo, contenido);

        await doc.ref.update({
          contenido: nuevoContenido,
          palabras: nuevoContenido.split(/\s+/).filter(Boolean).length,
          reescrito: true,
          fechaReescritura: new Date().toISOString(),
        });

        resultados.push({ slug: s, ok: true });
      } catch (err) {
        resultados.push({ slug: s, ok: false, error: (err as Error).message });
      }
    }

    return NextResponse.json({ success: true, resultados });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
