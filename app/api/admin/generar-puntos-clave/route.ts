import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get('x-admin-token') || request.headers.get('x-admin-key');
  return !!ADMIN_API_KEY && key === ADMIN_API_KEY;
}

interface NoticiaData {
  id: string;
  titulo: string;
  resumen?: string;
  contenido?: string;
  categoria?: string;
  slug?: string;
  puntosClave?: string[];
}

async function generarPuntosClave(titulo: string, contenido: string, resumen?: string): Promise<string[]> {
  // Primero intentar con Gemini; si no hay key o falla, usar extractor heurístico.
  if (GEMINI_API_KEY) {
    try {
      const puntos = await generarConGemini(titulo, contenido, resumen);
      if (puntos.length === 3) return puntos;
    } catch (err) {
      console.warn('[generar-puntos-clave] Gemini falló, usando fallback:', err);
    }
  }
  return generarHeuristico(titulo, contenido, resumen);
}

async function generarConGemini(titulo: string, contenido: string, resumen?: string): Promise<string[]> {
  const texto = stripHtml(contenido || resumen || titulo).slice(0, 4000);
  const prompt = `ACTUÁ COMO EDITOR DE NICARAGUA INFORMATE.

Generá exactamente 3 puntos clave de esta noticia para mostrar al inicio del artículo.

Formato obligatorio:
- Punto 1 (Qué / Dónde): qué pasó y dónde.
- Punto 2 (Por qué / Cómo): causa o mecanismo del hecho.
- Punto 3 (Consecuencia / Impacto): resultado, cifra o relevancia.

Reglas:
- Cada punto debe tener entre 12 y 18 palabras.
- Lenguaje periodístico, neutral, sin adjetivos emocionales.
- No uses viñetas, solo texto.
- Devolvé ÚNICAMENTE un JSON con este formato exacto (sin markdown, sin backticks, sin explicaciones):
["punto 1", "punto 2", "punto 3"]

TÍTULO: ${titulo}
RESUMEN: ${resumen || ''}
CONTENIDO: ${texto}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 400,
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed.map((p: string) => p.trim());
    }
  } catch (e) {
    // Intento fallback: extraer líneas numeradas
  }

  // Fallback: extraer líneas que empiecen con número o guion
  const lines = text
    .split(/\n/)
    .map((l: string) => l.replace(/^[-\d.\)]+\s*/, '').trim())
    .filter((l: string) => l.length > 20 && l.length < 200);
  return lines.slice(0, 3);
}

function generarHeuristico(titulo: string, contenido: string, resumen?: string): string[] {
  const html = contenido || resumen || titulo;
  const parrafos = extraerParrafos(html).filter((p: string) => p.length > 30);

  const primeraOracion = (p: string) =>
    p.split(/(?<=[\.\!\?])\s+/)
      .map((o: string) => o.trim())
      .find((o: string) => o.length > 30 && o.length < 220) || p;

  const puntos: string[] = [];
  const usados = new Set<string>();

  const agregar = (texto: string) => {
    const clave = texto.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!usados.has(clave) && puntos.length < 3) {
      usados.add(clave);
      puntos.push(limitarPalabras(texto, 18));
    }
  };

  // Punto 1: primera oración del primer párrafo (qué/dónde)
  if (parrafos[0]) agregar(primeraOracion(parrafos[0]));

  // Punto 2: primera oración del segundo párrafo (por qué/cómo)
  if (parrafos[1]) agregar(primeraOracion(parrafos[1]));

  // Punto 3: primera oración del último párrafo (consecuencia/impacto)
  if (parrafos[parrafos.length - 1]) agregar(primeraOracion(parrafos[parrafos.length - 1]));

  // Rellenar si faltan puntos con el resumen/título
  while (puntos.length < 3) {
    agregar(resumen || titulo);
  }

  return puntos.slice(0, 3);
}

function extraerParrafos(html: string): string[] {
  return html
    .split(/<\/p>|<h[1-6][^>]*>/i)
    .map((p: string) => stripHtml(p).trim())
    .filter((p: string) => p.length > 10);
}

function limitarPalabras(texto: string, max: number): string {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (palabras.length <= max) return texto.replace(/\.$/, '').trim() + '.';
  const truncado = palabras.slice(0, max).join(' ').replace(/[\,\;\:]\s*$/, '');
  return truncado + '...';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    const db = getAdminDb();
    const noticiasRef = db.collection('noticias');

    let docs: any[] = [];
    if (id) {
      const doc = await noticiasRef.doc(id).get();
      if (doc.exists) docs.push(doc);
    } else {
      // Procesar artículos que aún no tienen puntos clave
      const snap = await noticiasRef.where('puntosClave', '==', null).limit(10).get();
      docs = snap.docs;
      if (docs.length === 0) {
        // Si no hay null, buscar arrays vacíos o undefined
        const all = await noticiasRef.limit(10).get();
        docs = all.docs.filter(d => !d.data().puntosClave || d.data().puntosClave.length === 0);
      }
    }

    const resultados: { id: string; puntosClave: string[]; ok: boolean; error?: string }[] = [];
    for (const doc of docs) {
      const data = doc.data() as NoticiaData;
      try {
        const puntos = await generarPuntosClave(data.titulo, data.contenido || '', data.resumen || '');
        await doc.ref.update({ puntosClave: puntos });
        revalidateTag('latest-news');
        revalidateTag('trending-news');
        if (data.slug) revalidatePath(`/noticias/${data.slug}`);
        resultados.push({ id: doc.id, puntosClave: puntos, ok: true });
      } catch (err) {
        resultados.push({ id: doc.id, puntosClave: [], ok: false, error: String(err) });
      }
    }

    try {
      const { invalidateFirestoreCache } = await import('@/lib/data');
      invalidateFirestoreCache();
    } catch (e) { /* noop */ }

    return NextResponse.json({ success: true, procesados: resultados.length, resultados }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[generar-puntos-clave]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
