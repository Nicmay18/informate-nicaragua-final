import { runMeni } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { runIntelligenceEngine } from '@/lib/meni/intelligence';
import type { IntelligenceResult } from '@/lib/meni/intelligence/types';
import type { MeniAutonomousInput, MeniAutonomousResult } from './types';

/**
 * MENI OS v4.0 — Prompt mínimo.
 * Todas las decisiones editoriales ya fueron calculadas por el Intelligence Engine.
 * El LLM solo redacta el artículo siguiendo las decisiones.
 */
const SYSTEM_PROMPT = `Eres el redactor de Nicaragua Informate.

Genera el artículo usando el resultado producido por MENI.
No tomes decisiones editoriales. Todas ya fueron calculadas por el sistema.

Sigue exactamente:
- El orden de bloques indicado.
- El ángulo diferencial indicado.
- El contexto requerido indicado.
- Las explicaciones de siglas e instituciones indicadas.
- El título SEO, meta descripción y slug indicados.

Reglas de redacción:
- Párrafos cortos (2-3 oraciones).
- HTML con <p>, <h2>, <strong>, <blockquote>.
- Mínimo 400 palabras.
- No inventar datos. Si falta información, escribir "autoridades no proporcionaron detalles adicionales".
- No usar adjetivos emocionales ni transiciones robóticas.
- Pie de foto: "Foto cortesía de RR.SS / Redacción Keyling Rivera M. / INFORMATE NICARAGUA"

Devuelve ÚNICAMENTE un JSON con este formato:
{
  "articuloCompleto": "string HTML",
  "bajada": "string 1-2 oraciones",
  "promptImagenIA": "string en inglés para imagen editorial realista"
}`;

function buildUserPrompt(input: MeniAutonomousInput, intel: IntelligenceResult): string {
  const bloques = intel.structure.bloques
    .sort((a, b) => a.prioridad - b.prioridad)
    .map((b) => `${b.prioridad}. ${b.tipo}: ${b.contenido}`)
    .join('\n');

  const contexto = intel.context.contextoRequerido.length > 0
    ? intel.context.contextoRequerido.map((c) => `- ${c}`).join('\n')
    : 'Sin contexto adicional requerido.';

  const antecedentes = intel.background.antecedentes.length > 0
    ? intel.background.antecedentes.map((a) => `- ${a.hecho} (${a.relevancia})`).join('\n')
    : 'Sin antecedentes adicionales.';

  const explicaciones: string[] = [];
  for (const s of intel.clarity.siglasDetectadas) {
    explicaciones.push(`- ${s.sigla}: ${s.significado}`);
  }
  for (const i of intel.clarity.institucionesMencionadas) {
    explicaciones.push(`- ${i.nombre}: ${i.descripcion}`);
  }
  for (const c of intel.clarity.conceptosDificiles) {
    explicaciones.push(`- ${c.termino}: ${c.explicacion}`);
  }

  const preguntas = intel.readerValue.preguntasSinResponder.length > 0
    ? intel.readerValue.preguntasSinResponder.map((p) => `- ${p}`).join('\n')
    : 'Sin preguntas pendientes.';

  return `HECHO NOTICIOSO:
${input.fuente}
${input.url ? `URL: ${input.url}` : ''}

CATEGORÍA: ${input.categoriaSugerida || 'General'}

DECISIONES DEL SISTEMA (sigue exactamente):

ÁNGULO DIFERENCIAL:
${intel.angle.anguloDiferencial}

POR QUÉ MERECE EXISTIR:
${intel.angle.porQueMereceExistir}

CONEXIÓN CON NICARAGUA:
${intel.angle.conexionNicaragua}

ORDEN DE LA NOTICIA:
${bloques}

CONTEXTO REQUERIDO:
${contexto}

ANTECEDENTES:
${antecedentes}

EXPLICACIONES OBLIGATORIAS (incluye en el texto):
${explicaciones.length > 0 ? explicaciones.join('\n') : 'Ninguna.'}

PREGUNTAS QUE EL LECTOR TENDRÁ (responde en el texto):
${preguntas}

TÍTULO SEO: ${intel.google.tituloSEO}
META DESCRIPCIÓN: ${intel.google.metaDescripcion}
SLUG: ${intel.google.slug}
KEYWORDS: ${intel.google.keywords.join(', ')}

COPY FACEBOOK: ${intel.facebook.copy}

Redacta el artículo completo siguiendo estas decisiones.`;
}

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

  const noticiaInput: NoticiaInput = {
    titulo: input.fuente.split('\n')[0].slice(0, 100),
    contenido: input.fuente,
    resumen: '',
    categoria: input.categoriaSugerida || 'General',
    autor: 'Redacción Nicaragua Informate',
    fecha: new Date().toISOString(),
    slug: '',
    palabrasClave: [],
    imagen: '',
    imagenDestacada: '',
  };

  const intel = runIntelligenceEngine({
    ...noticiaInput,
    fuente: input.fuente,
    categoriaSugerida: input.categoriaSugerida,
  });

  if (intel.bloquear) {
    return {
      tituloSEO: '',
      bajada: '',
      articuloCompleto: '',
      metaDescripcion: '',
      slug: '',
      tags: [],
      categoria: input.categoriaSugerida || 'General',
      departamento: '',
      promptImagenIA: '',
      copyFacebook: '',
      copyWhatsApp: '',
      copyTelegram: '',
      jsonLd: '',
      checklistEeatDiscover: '',
      diagnosticoEditorial: 'BLOQUEADO por Intelligence Engine',
      diagnosticoTecnico: intel.motivoBloqueo || 'No aporta valor diferencial al lector.',
      riesgoEditorial: 'ROJO',
      riesgoTecnico: 'ALTO',
      scoreMeni: 0,
      aprobado: false,
      correccionesAplicadas: [],
      recomendaciones: [intel.motivoBloqueo || intel.readerValue.motivoBloqueo || 'La nota no aporta valor diferencial.'],
      evaluacion: {} as any,
      _provider: 'groq+intelligence',
      _error: intel.motivoBloqueo || 'Bloqueado por Intelligence Engine',
    };
  }

  const userPrompt = buildUserPrompt(input, intel);

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

  const generated: MeniAutonomousResult = {
    tituloSEO: intel.google.tituloSEO,
    bajada: getString('bajada'),
    articuloCompleto: getString('articuloCompleto'),
    metaDescripcion: intel.google.metaDescripcion,
    slug: intel.google.slug,
    tags: intel.google.keywords,
    categoria: input.categoriaSugerida || 'General',
    departamento: '',
    promptImagenIA: getString('promptImagenIA'),
    copyFacebook: intel.facebook.copy,
    copyWhatsApp: `${intel.google.tituloSEO} https://informate.ni/noticias/${intel.google.slug}`,
    copyTelegram: `${intel.google.tituloSEO}\n\n${getString('bajada')}\n\nhttps://informate.ni/noticias/${intel.google.slug}`,
    jsonLd: '',
    checklistEeatDiscover: `EEAT: autor visible, fuentes atribuidas. Discover: título sin clickbait. Intelligence Score: ${intel.scoreIntelligence}/100`,
    diagnosticoEditorial: intel.angle.anguloDiferencial,
    diagnosticoTecnico: `Originalidad: ${intel.originality.veredicto} (${intel.originality.score}/100). Reader Value: ${intel.readerValue.score}/100. Context: ${intel.context.score}/100. Clarity: ${intel.clarity.score}/100.`,
    riesgoEditorial: 'VERDE',
    riesgoTecnico: 'BAJO',
    scoreMeni: 0,
    aprobado: false,
    correccionesAplicadas: intel.readerValue.queFaltaExplicar,
    recomendaciones: intel.readerValue.preguntasSinResponder,
    evaluacion: {} as any,
    _provider: 'groq+intelligence',
  };

  const textoPlano = stripHtml(generated.articuloCompleto);
  if (textoPlano.split(/\s+/).filter(Boolean).length < 120) {
    generated.recomendaciones.push('Artículo demasiado corto. Amplíe a mínimo 400 palabras con contexto y desarrollo.');
  }

  const evalInput: NoticiaInput = {
    titulo: generated.tituloSEO,
    contenido: generated.articuloCompleto,
    resumen: generated.bajada,
    categoria: generated.categoria,
    departamento: generated.departamento,
    autor: 'Redacción Nicaragua Informate',
    fecha: new Date().toISOString(),
    slug: generated.slug,
    palabrasClave: generated.tags,
    imagen: '',
    imagenDestacada: '',
  };

  try {
    const evaluacion = runMeni(evalInput);
    generated.evaluacion = evaluacion;
    generated.scoreMeni = evaluacion.scoreFinal;
    generated.aprobado = evaluacion.scoreFinal >= 90 && evaluacion.aprobado && !intel.bloquear;
    generated.riesgoEditorial = evaluacion.riesgo.nivel;
  } catch (e) {
    generated.evaluacion = {} as any;
    generated._error = `Evaluación local falló: ${e instanceof Error ? e.message : String(e)}`;
    generated.aprobado = false;
  }

  return generated;
}
