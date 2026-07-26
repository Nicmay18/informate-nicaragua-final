import { runMeni } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import type { MeniAutonomousInput, MeniAutonomousResult } from './types';

const SYSTEM_PROMPT = `Eres MENI OS v3.0, editor jefe autónomo de Nicaragua Informate.

Tu trabajo es recibir un texto, enlace, comunicado o noticia en bruto y devolver un JSON con una pieza periodística completa, optimizada y lista para publicar, SOLO si cumple el estándar de calidad del medio.

=== REGLAS EDITORIALES ===
- No copiar ni traducir literalmente: reescribe con voz propia de Nicaragua Informate.
- Explicar, contextualizar y agregar valor para el lector nicaragüense.
- Párrafos cortos (2-3 oraciones).
- Proteger menores, víctimas y datos sensibles.
- No inventar datos. Si falta información, indicar "autoridades no proporcionaron detalles adicionales".
- No usar relleno emocional ni transiciones robóticas.
- Título SEO: 50-60 caracteres, claro, sin clickbait.
- Meta descripción: 120-160 caracteres.
- Slug: en minúsculas, guiones, sin stopwords.
- Tags: máximo 8, separados por comas en el array.
- Categoría: una de: Sucesos, Nacionales, Internacionales, Deportes, Tecnología, Economía, Cultura, Espectáculos, Política, Salud, Educación, General.
- Departamento: Nicaragüense si aplica, vacío si no.

=== FORMATO DE SALIDA OBLIGATORIA (JSON) ===
{
  "diagnosticoEditorial": "string",
  "diagnosticoTecnico": "string",
  "riesgoEditorial": "VERDE|AMARILLO|ROJO",
  "riesgoTecnico": "BAJO|MEDIO|ALTO",
  "scoreMeni": number 0-100,
  "aprobado": boolean,
  "correccionesAplicadas": ["string"],
  "recomendaciones": ["string"],
  "tituloSEO": "string",
  "bajada": "string 1-2 oraciones",
  "articuloCompleto": "string HTML con <p> y <h2>",
  "metaDescripcion": "string",
  "slug": "string",
  "tags": ["string"],
  "categoria": "string",
  "departamento": "string",
  "promptImagenIA": "string descriptivo en inglés para generar imagen realista editorial",
  "copyFacebook": "string emoji + titular + gancho + url + hashtags",
  "copyWhatsApp": "string corto con titular y url",
  "copyTelegram": "string con titular, 2 oraciones y url",
  "jsonLd": "string schema NewsArticle en JSON-LD escapado",
  "checklistEeatDiscover": "string: verificación EEAT y criterios Discover cumplidos"
}

=== SCORE ===
- 90-100: aprobado para publicación.
- 80-89: requiere correcciones.
- <80: rechazado, reescribir.

Devuelve ÚNICAMENTE el JSON. Sin explicaciones, sin markdown, sin comillas alrededor del JSON.`;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanJson(text: string): string {
  return text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
}

export async function generarArticuloAutonomo(input: MeniAutonomousInput): Promise<MeniAutonomousResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurado');
  }

  const userPrompt = `FUENTE/URL/NOTICIA BRUTA:\n${input.fuente}\n${input.url ? `URL: ${input.url}` : ''}\n${input.categoriaSugerida ? `CATEGORÍA SUGERIDA: ${input.categoriaSugerida}` : ''}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 6000,
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

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(cleanJson(text));
  } catch (e) {
    throw new Error(`No se pudo parsear JSON de Groq: ${e instanceof Error ? e.message : String(e)}`);
  }

  const getString = (k: string, fallback = '') => String(payload[k] ?? fallback);
  const getArray = (k: string): string[] => {
    const v = payload[k];
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const generated: MeniAutonomousResult = {
    tituloSEO: getString('tituloSEO'),
    bajada: getString('bajada'),
    articuloCompleto: getString('articuloCompleto'),
    metaDescripcion: getString('metaDescripcion'),
    slug: getString('slug'),
    tags: getArray('tags'),
    categoria: getString('categoria', 'General'),
    departamento: getString('departamento'),
    promptImagenIA: getString('promptImagenIA'),
    copyFacebook: getString('copyFacebook'),
    copyWhatsApp: getString('copyWhatsApp'),
    copyTelegram: getString('copyTelegram'),
    jsonLd: getString('jsonLd'),
    checklistEeatDiscover: getString('checklistEeatDiscover'),
    diagnosticoEditorial: getString('diagnosticoEditorial'),
    diagnosticoTecnico: getString('diagnosticoTecnico'),
    riesgoEditorial: (['VERDE', 'AMARILLO', 'ROJO'] as const).includes(payload.riesgoEditorial as any) ? (payload.riesgoEditorial as any) : 'AMARILLO',
    riesgoTecnico: (['BAJO', 'MEDIO', 'ALTO'] as const).includes(payload.riesgoTecnico as any) ? (payload.riesgoTecnico as any) : 'MEDIO',
    scoreMeni: typeof payload.scoreMeni === 'number' ? payload.scoreMeni : 0,
    aprobado: payload.aprobado === true,
    correccionesAplicadas: getArray('correccionesAplicadas'),
    recomendaciones: getArray('recomendaciones'),
    evaluacion: {} as any,
    _provider: 'groq',
  };

  const textoPlano = stripHtml(generated.articuloCompleto);
  if (textoPlano.split(/\s+/).filter(Boolean).length < 120) {
    generated.scoreMeni = Math.min(generated.scoreMeni, 79);
    generated.aprobado = false;
    generated.recomendaciones.push('Artículo demasiado corto. Amplíe a mínimo 120 palabras con contexto y desarrollo.');
  }

  const noticiaInput: NoticiaInput = {
    titulo: generated.tituloSEO,
    contenido: generated.articuloCompleto,
    resumen: generated.bajada,
    categoria: generated.categoria,
    departamento: generated.departamento,
    autor: '',
    fecha: new Date().toISOString(),
    slug: generated.slug,
    palabrasClave: generated.tags,
    imagen: '',
    imagenDestacada: '',
  };

  try {
    const evaluacion = runMeni(noticiaInput);
    generated.evaluacion = evaluacion;
    generated.scoreMeni = evaluacion.scoreFinal;
    generated.aprobado = evaluacion.scoreFinal >= 90 && evaluacion.aprobado;
    generated.riesgoEditorial = evaluacion.riesgo.nivel;
  } catch (e) {
    generated.evaluacion = {} as any;
    generated._error = `Evaluación local falló: ${e instanceof Error ? e.message : String(e)}`;
    generated.aprobado = false;
  }

  return generated;
}
