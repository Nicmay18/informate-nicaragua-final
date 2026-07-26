import { runMeni } from '@/lib/meni';
import type { NoticiaInput } from '@/lib/meni';
import { runEditorialBrain } from '@/lib/meni/editorial-brain';
import type { EditorialDecision } from '@/lib/meni/editorial-brain/types';
import type { MeniAutonomousInput, MeniAutonomousResult } from './types';

/**
 * MENI OS v5.0 — Editorial Brain + Intelligence Engine.
 * El Editorial Brain analiza el HECHO y decide.
 * El LLM solo redacta siguiendo las decisiones.
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

function buildUserPrompt(input: MeniAutonomousInput, decision: EditorialDecision): string {
  const instr = decision.llmInstructions;
  const contexto = instr.contextoNecesario.length > 0
    ? instr.contextoNecesario.map((c) => `- ${c}`).join('\n')
    : 'Sin contexto adicional requerido.';

  const explicaciones = instr.explicacionesObligatorias.length > 0
    ? instr.explicacionesObligatorias.map((e) => `- ${e}`).join('\n')
    : 'Ninguna.';

  const preguntas = instr.preguntasAResponder.length > 0
    ? instr.preguntasAResponder.map((p) => `- ${p}`).join('\n')
    : 'Sin preguntas pendientes.';

  const estructura = instr.estructura.join('\n');

  return `HECHO NOTICIOSO:
${input.fuente}
${input.url ? `URL: ${input.url}` : ''}

CATEGORÍA: ${input.categoriaSugerida || 'General'}

DECISIONES DEL EDITORIAL BRAIN (sigue exactamente):

ÁNGULO DIFERENCIAL:
${instr.angulo}

SELLO EDITORIAL:
${instr.selloEditorial}

ENFOQUE DIFERENCIAL:
${instr.enfoqueDiferencial}

POR QUÉ LEER AQUÍ Y NO EN OTRO MEDIO:
${decision.nicaraguaInformate.porQueLeerAqui}

QUÉ HARÍAN TN8 / CANAL 4 / LA PRENSA:
- TN8: ${decision.competition.enfoqueTN8}
- Canal 4: ${decision.competition.enfoqueCanal4}
- La Prensa: ${decision.competition.enfoqueLaPrensa}

NOSOTROS NO HAREMOS ESO. HAREMOS:
${decision.competition.enfoqueNicaraguaInformate}

ORDEN DE LA NOTICIA:
${estructura}

CONTEXTO REQUERIDO:
${contexto}

EXPLICACIONES OBLIGATORIAS (incluye en el texto):
${explicaciones}

PREGUNTAS OBLIGATORIAS DEL LECTOR (responde TODAS):
${preguntas}

TÍTULO SEO: ${instr.tituloSEO}
META DESCRIPCIÓN: ${instr.metaDescripcion}
SLUG: ${instr.slug}
KEYWORDS: ${instr.keywords.join(', ')}

COPY FACEBOOK: ${instr.copyFacebook}

PIE DE FOTO: ${instr.pieFoto}

Redacta el artículo completo siguiendo estas decisiones. Mínimo 400 palabras.`;
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

  const decision = runEditorialBrain({
    ...noticiaInput,
    fuente: input.fuente,
    categoriaSugerida: input.categoriaSugerida,
  });

  if (decision.bloquear) {
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
      diagnosticoEditorial: 'BLOQUEADO por Editorial Brain',
      diagnosticoTecnico: decision.motivoBloqueo || 'No aporta valor diferencial al lector.',
      riesgoEditorial: 'ROJO',
      riesgoTecnico: 'ALTO',
      scoreMeni: 0,
      aprobado: false,
      correccionesAplicadas: [],
      recomendaciones: [decision.motivoBloqueo || decision.nicaraguaInformate.motivoBloqueo || 'La nota no aporta valor diferencial.'],
      evaluacion: {} as any,
      _provider: 'groq+editorial-brain',
      _error: decision.motivoBloqueo || 'Bloqueado por Editorial Brain',
    };
  }

  const userPrompt = buildUserPrompt(input, decision);

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

  const instr = decision.llmInstructions;

  const generated: MeniAutonomousResult = {
    tituloSEO: instr.tituloSEO,
    bajada: getString('bajada'),
    articuloCompleto: getString('articuloCompleto'),
    metaDescripcion: instr.metaDescripcion,
    slug: instr.slug,
    tags: instr.keywords,
    categoria: input.categoriaSugerida || 'General',
    departamento: '',
    promptImagenIA: getString('promptImagenIA'),
    copyFacebook: instr.copyFacebook,
    copyWhatsApp: `${instr.tituloSEO} https://informate.ni/noticias/${instr.slug}`,
    copyTelegram: `${instr.tituloSEO}\n\n${getString('bajada')}\n\nhttps://informate.ni/noticias/${instr.slug}`,
    jsonLd: '',
    checklistEeatDiscover: `EEAT: autor visible, fuentes atribuidas. Discover: título sin clickbait. Editorial Brain: ${decision.score}/100. News Value: ${decision.newsValue.score}/100. Difference: ${decision.editorialDifference.porcentajeDiferencia}%`,
    diagnosticoEditorial: `${decision.nicaraguaInformate.porQueLeerAqui}`,
    diagnosticoTecnico: `News Value: ${decision.newsValue.score}/100 (${decision.newsValue.veredicto}). Competition: ${decision.competition.score}/100. NI Engine: ${decision.nicaraguaInformate.score}/100. Difference: ${decision.editorialDifference.porcentajeDiferencia}%. Public Value: ${decision.publicValue.score}/100. Completeness: ${decision.storyCompleteness.score}/100.`,
    riesgoEditorial: 'VERDE',
    riesgoTecnico: 'BAJO',
    scoreMeni: 0,
    aprobado: false,
    correccionesAplicadas: decision.storyCompleteness.respuestasFaltantes,
    recomendaciones: decision.storyCompleteness.dudasPendientes,
    evaluacion: {} as any,
    _provider: 'groq+editorial-brain',
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
    generated.aprobado = evaluacion.scoreFinal >= 90 && evaluacion.aprobado && !decision.bloquear;
    generated.riesgoEditorial = evaluacion.riesgo.nivel;
  } catch (e) {
    generated.evaluacion = {} as any;
    generated._error = `Evaluación local falló: ${e instanceof Error ? e.message : String(e)}`;
    generated.aprobado = false;
  }

  return generated;
}
