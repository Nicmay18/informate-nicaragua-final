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
  const oraciones = extraerOraciones(html).map(o => quitarDateline(o)).filter(o => o.length > 20 && o.length < 400);

  const puntos: string[] = [];
  const usados = new Set<string>();

  const agregar = (texto: string) => {
    const clave = texto.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!usados.has(clave) && puntos.length < 3) {
      usados.add(clave);
      puntos.push(limitarPalabras(texto, 18));
    }
  };

  // Punto 1: primera oración del lead (qué/dónde), sin dateline
  if (secciones[0]) {
    const lead = primeraOracion(secciones[0].texto);
    agregar(lead);
  }

  // Punto 2: la oración que mejor describa causa o mecanismo (por qué/cómo)
  // 1. Si existe una sección H2 con título causal, usar su primera oración.
  // 2. Si no, buscar en el lead (excepto la primera oración) una oración con palabras causales.
  // 3. Si no, buscar en todo el artículo.
  const tituloCausal = /cómo ocurrió|por qué|causa|causas|mecanismo|originado/i;
  const seccionCausa = secciones.find(s => tituloCausal.test(s.titulo));
  let oracionCausa = '';
  if (seccionCausa) {
    oracionCausa = primeraOracion(seccionCausa.texto);
  } else {
    const oracionesLead = extraerOracionesDeTexto(secciones[0]?.texto || '').slice(1);
    oracionCausa = elegirMejorOracionCausal(oracionesLead, 40);
    if (!oracionCausa) {
      oracionCausa = elegirMejorOracionCausal(oraciones.slice(1), 40);
    }
  }
  if (oracionCausa) agregar(oracionCausa);

  // Punto 3: la oración con el impacto global (consecuencia/impacto)
  // Preferimos las últimas oraciones y elegimos la que tenga más palabras de impacto
  const impactoGlobal = /dejaron|dejó|fallecid|muert|lesionad|herid|hospitalizad|atención médica|evolución|grave|menores/i;
  const ultimas = oraciones.slice(-3);
  const candidatosImpacto = ultimas.filter(o => impactoGlobal.test(o));
  let oracionImpacto = elegirMejorOracion(candidatosImpacto, 40);
  if (!oracionImpacto) {
    oracionImpacto = elegirMejorOracion(oraciones.filter(o => impactoGlobal.test(o)), 40);
  }
  if (oracionImpacto) agregar(oracionImpacto);

  // Fallback: si faltan puntos, rellenar con secciones H2
  for (const sec of secciones.slice(1)) {
    if (puntos.length >= 3) break;
    agregar(primeraOracion(sec.texto));
  }

  // Rellenar si faltan puntos con el resumen/título
  while (puntos.length < 3) {
    agregar(resumen || titulo);
  }

  return puntos.slice(0, 3);
}

function primeraOracion(texto: string): string {
  return texto.split(/(?<=[\.\!\?])\s+/)
    .map((o: string) => quitarDateline(o.trim()).replace(/^\s*[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\/]{2,40}[—\-–]\s*/, ''))
    .find((o: string) => o.length > 20 && o.length < 400) || texto;
}

function extraerOraciones(html: string): string[] {
  // Separar títulos H2 del párrafo siguiente para que no se mezclen en una oración
  const texto = stripHtml(html.replace(/<\/h2>/gi, '. '));
  return texto
    .split(/(?<=[\.\!\?])\s+/)
    .map(o => quitarDateline(o.trim()).replace(/^\s*[A-Z][A-ZÁÉÍÓÚÑ\s\/]{2,40}[—\-–]\s*/, ''))
    .filter(o => o.length > 20 && o.length < 400);
}

function elegirMejorOracion(oraciones: string[], minLength: number): string {
  return oraciones
    .filter(o => o.length >= minLength)
    .sort((a, b) => (puntajeOracion(b) - puntajeOracion(a)) || (b.length - a.length))[0] || '';
}

function puntajeOracion(texto: string): number {
  const claves = /cómo ocurrió|por qué|causa|mecanismo|circunstancias|involucr|colision|impact|atropell|choc|exceso de velocidad|ebriedad|cruzó la vía|fallecid|muert|lesionad|herid|hospitalizad|atención médica|dejaron|dejó|evidencia|detenido|huyó|grave/gi;
  return (texto.match(claves) || []).length;
}

function extraerOracionesDeTexto(texto: string): string[] {
  return texto
    .split(/(?<=[\.\!\?])\s+/)
    .map(o => quitarDateline(o.trim()).replace(/^\s*[A-Z][A-ZÁÉÍÓÚÑ\s\/]{2,40}[—\-–]\s*/, ''))
    .filter(o => o.length > 20 && o.length < 400);
}

function elegirMejorOracionCausal(oraciones: string[], minLength: number): string {
  const causal = /cómo ocurrió|por qué|causa|mecanismo|circunstancias|involucr|colision|impact|atropell|choc|exceso de velocidad|ebriedad|cruzó la vía|esquiv|intentó/gi;
  const mecanismo = /motocicleta|camioneta|vehículo|peatón|conductor|poste|abismo|carretera|carril/gi;
  const general = /cada caso|los hechos|los accidentes|casos|general/i;
  return oraciones
    .filter(o => o.length >= minLength && (causal.test(o) || mecanismo.test(o)))
    .sort((a, b) => {
      const scoreA = (a.match(causal) || []).length * 2 + (a.match(mecanismo) || []).length + (general.test(a) ? 2 : 0);
      const scoreB = (b.match(causal) || []).length * 2 + (b.match(mecanismo) || []).length + (general.test(b) ? 2 : 0);
      return scoreB - scoreA || b.length - a.length;
    })[0] || '';
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
