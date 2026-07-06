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
  const secciones = extraerSeccionesH2(html).filter((s: any) => s.texto.length > 30);

  const primeraOracion = (texto: string) =>
    texto.split(/(?<=[\.\!\?])\s+/)
      .map((o: string) => quitarDateline(o.trim()).replace(/^\s*[A-Z][A-ZÁÉÍÓÚÑ\s\/]{2,40}[—\-–]\s*/, ''))
      .find((o: string) => o.length > 20 && o.length < 400) || texto;

  const puntos: string[] = [];
  const usados = new Set<string>();

  const agregar = (texto: string) => {
    const clave = texto.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!usados.has(clave) && puntos.length < 3) {
      usados.add(clave);
      puntos.push(limitarPalabras(texto, 18));
    }
  };

  // Punto 1: primera oración de la primera sección (qué/dónde)
  if (secciones[0]) agregar(primeraOracion(secciones[0].texto));

  // Punto 2: primera sección que explique causa/mecanismo (por qué/cómo)
  const causas = /cómo ocurrió|por qué|causa|mecanismo|tras|según|originado|por qué pasó/i;
  const seccionCausa = secciones.find((s: any) => causas.test(s.titulo)) || secciones[1];
  if (seccionCausa) agregar(primeraOracion(seccionCausa.texto));

  // Punto 3: primera oración de la última sección (consecuencia/impacto)
  const ultima = secciones[secciones.length - 1];
  if (ultima) agregar(primeraOracion(ultima.texto));

  // Rellenar si faltan puntos con el resumen/título
  while (puntos.length < 3) {
    agregar(resumen || titulo);
  }

  return puntos.slice(0, 3);
}

interface SeccionH2 {
  titulo: string;
  texto: string;
}

function extraerSeccionesH2(html: string): SeccionH2[] {
  // Divide el contenido en secciones por cada H2, conservando el título
  const partes = html.split(/<h2[^>]*>(.*?)<\/h2>/i);
  const secciones: SeccionH2[] = [];

  // El primer bloque es el lead (antes del primer H2)
  if (partes[0]) {
    const texto = quitarDateline(stripHtml(partes[0]).trim());
    if (texto.length > 10) secciones.push({ titulo: '', texto });
  }

  // Cada par título/texto después de un H2
  for (let i = 1; i < partes.length; i += 2) {
    const titulo = stripHtml(partes[i]).trim().toLowerCase();
    const textoHtml = partes[i + 1] || '';
    const texto = quitarDateline(stripHtml(textoHtml).trim());
    if (titulo || texto.length > 10) {
      secciones.push({ titulo, texto });
    }
  }

  return secciones;
}

function quitarDateline(texto: string): string {
  // Elimina prefijos tipo "MANAGUA / NICARAGUA —" o "ROSITA —" al inicio
  return texto.replace(/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\/]{2,40}[—\-–]\s*/, '').trim();
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
    const force = !!body.force;
    const offset = typeof body.offset === 'number' ? body.offset : 0;
    const db = getAdminDb();
    const noticiasRef = db.collection('noticias');

    let docs: any[] = [];
    if (id) {
      const doc = await noticiasRef.doc(id).get();
      if (doc.exists) docs.push(doc);
    } else if (force) {
      // Reprocesar TODOS los artículos (paginado por offset, 10 por llamada)
      const all = await noticiasRef.limit(200).get();
      docs = all.docs.slice(offset, offset + 10);
    } else {
      // Procesar artículos que aún no tienen puntos clave (máximo 10 por llamada)
      const all = await noticiasRef.limit(200).get();
      docs = all.docs
        .filter(d => !d.data().puntosClave || d.data().puntosClave.length === 0)
        .slice(0, 10);
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
