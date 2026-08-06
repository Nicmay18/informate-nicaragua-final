import { runMeni } from '@/lib/meni';
import type { NoticiaInput, EditorialDecisionFlat } from '@/lib/meni';
import { runEditorialBrain, verifyEditorialDecisions } from '@/lib/meni/editorial-brain';
import type { EditorialDecision } from '@/lib/meni/editorial-brain/types';
import { runQualityGate, appendQualityGateHistory } from '@/lib/meni/quality-gate';
import { getAdminDb } from '@/lib/firebase-admin';
import { runEditorBrain, type EditorBrainResult } from '@/lib/meni/editor-brain';
import { limpiarSufijoLugar } from '@/lib/meni/intelligence/google-engine';
import type { MeniAutonomousInput, MeniAutonomousResult } from './types';

/**
 * MENI v7 — Story Planner + Anti Clickbait + Reader Journey + Editorial Brain.
 * El LLM no decide nada. Solo redacta siguiendo el plan editorial completo.
 */
const SYSTEM_PROMPT = `Eres el redactor de Nicaragua Informate. MENI v7.

Tu único trabajo es REDACTAR. No decides nada.
Todas las decisiones editoriales ya fueron tomadas por el Story Planner, el Editorial Brain y el Reader Journey.

Recibes un plan editorial completo. Solo escribes siguiéndolo.

REGLAS ABSOLUTAS:
- Sigue EXACTAMENTE el orden narrativo indicado por el Story Planner.
- Incluye TODAS las explicaciones de servicio indicadas.
- NO uses ninguna de las frases prohibidas.
- NO hagas nada de lo que está en la lista "qué NO hacer".
- Cumple el objetivo pedagógico del Reader Journey.
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
  const plan = decision.storyPlan;
  const journey = decision.readerJourney;
  const antiClickbait = decision.antiClickbait;

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

  const frasesProhibidas = plan.frasesProhibidas.length > 0
    ? plan.frasesProhibidas.map((f) => `- "${f}"`).join('\n')
    : 'Ninguna.';

  const queNoHacer = plan.queNoHacer.length > 0
    ? plan.queNoHacer.map((q) => `- ${q}`).join('\n')
    : 'Ninguna.';

  const queSabe = journey.queSabe.length > 0
    ? journey.queSabe.map((s) => `- ${s}`).join('\n')
    : 'N/A';

  const queNecesitaSaber = journey.queNecesitaSaber.length > 0
    ? journey.queNecesitaSaber.map((s) => `- ${s}`).join('\n')
    : 'N/A';

  const queEntendera = journey.queEntendera.length > 0
    ? journey.queEntendera.map((s) => `- ${s}`).join('\n')
    : 'N/A';

  const queRecordara = journey.queRecordara.length > 0
    ? journey.queRecordara.map((s) => `- ${s}`).join('\n')
    : 'N/A';

  return `HECHO NOTICIOSO:
${input.fuente}
${input.url ? `URL: ${input.url}` : ''}

CATEGORÍA: ${input.categoriaSugerida || 'General'}

═══════════════════════════════════════
MENI v7 — STORY PLANNER
═══════════════════════════════════════
TIPO DE HISTORIA: ${plan.tipoLabel}
ENFOQUE: ${plan.enfoque}
PROPÓSITO: ${plan.proposito}
ÁNGULO NICARAGUA INFORMATE: ${plan.anguloNI}

ORDEN NARRATIVO EXACTO (sigue este orden, no cambies):
${estructura}

EXPLICACIONES DE SERVICIO (incluye en el texto):
${explicaciones}

═══════════════════════════════════════
MENI v7 — READER JOURNEY
═══════════════════════════════════════
OBJETIVO PEDAGÓGICO: ${journey.objetivoPedagogico}

EL LECTOR YA SABE:
${queSabe}

EL LECTOR NECESITA SABER:
${queNecesitaSaber}

DESPUÉS DE LEER, EL LECTOR ENTENDERÁ:
${queEntendera}

DESPUÉS DE LEER, EL LECTOR RECORDARÁ:
${queRecordara}

═══════════════════════════════════════
MENI v7 — ANTI CLICKBAIT
═══════════════════════════════════════
VEREDICTO DEL TÍTULO: ${antiClickbait.veredicto.toUpperCase()} (${antiClickbait.score}/100)
${antiClickbait.razon}
${antiClickbait.tituloSugerido ? `TÍTULO SUGERIDO: ${antiClickbait.tituloSugerido}` : ''}

═══════════════════════════════════════
FRASES PROHIBIDAS (NO uses ninguna):
${frasesProhibidas}

QUÉ NO HACER:
${queNoHacer}

═══════════════════════════════════════
DECISIONES DEL EDITORIAL BRAIN
═══════════════════════════════════════
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

CONTEXTO REQUERIDO:
${contexto}

PREGUNTAS OBLIGATORIAS DEL LECTOR (responde TODAS):
${preguntas}

TÍTULO SEO: ${instr.tituloSEO}
META DESCRIPCIÓN: ${instr.metaDescripcion}
SLUG: ${instr.slug}
KEYWORDS: ${instr.keywords.join(', ')}

COPY FACEBOOK: ${instr.copyFacebook}

PIE DE FOTO: ${instr.pieFoto}

Redacta el artículo completo siguiendo el Story Planner. Mínimo 400 palabras.`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decisionRiesgoToRiesgo(riesgo: 'BAJO' | 'MEDIO' | 'ALTO'): 'VERDE' | 'AMARILLO' | 'ROJO' {
  return riesgo === 'BAJO' ? 'VERDE' : riesgo === 'MEDIO' ? 'AMARILLO' : 'ROJO';
}

function buildDecisionFlat(decision: EditorialDecision): EditorialDecisionFlat {
  return {
    valeLaPenaPublicar: decision.valeLaPenaPublicar,
    motivoPrincipal: decision.motivoPrincipal,
    aportaAlLector: decision.aportaAlLector,
    diferenciaCompetencia: decision.diferenciaCompetencia,
    utilidadReal: decision.utilidadReal,
    explicacion: decision.explicacion,
    contexto: decision.contexto,
    servicio: decision.servicio,
    riesgoEditorial: decision.riesgoEditorial,
    acciones: decision.acciones,
    patronesAplicados: decision.patronesAplicados.map(p => ({ campo: p.campo, descripcion: p.descripcion, frecuencia: p.frecuencia })),
    correccionesSugeridas: decision.correccionesSugeridas,
    ranking: decision.ranking,
    veredictoEjecutivo: decision.veredictoEjecutivo,
    ...(decision.saturacion ? { saturacion: decision.saturacion } : {}),
    ...(decision.memoriaEditorial ? { memoriaEditorial: decision.memoriaEditorial } : {}),
  };
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
    titulo: limpiarSufijoLugar(input.fuente.split('\n')[0].slice(0, 100)),
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

  // ═══════════════════════════════════════════════════════════
  // MENI v8: Knowledge ANTES de Editorial Brain
  // El cerebro editorial decide con toda la información disponible
  // ═══════════════════════════════════════════════════════════
  let db: ReturnType<typeof getAdminDb> | undefined;
  try { db = getAdminDb(); } catch { db = undefined; }

  let brain: EditorBrainResult | undefined;
  if (db) {
    try {
      brain = await runEditorBrain(db, {
        titulo: noticiaInput.titulo,
        contenido: input.fuente,
        categoria: input.categoriaSugerida || 'General',
      });
    } catch {
      brain = undefined;
    }
  }

  const knowledgeContext = brain
    ? {
        hasMemory: brain.memory.hasMemory,
        totalArticles: brain.memory.totalArticles,
        antecedentes: brain.memory.antecedentes,
        temasFrecuentes: brain.memory.temasFrecuentes,
        institucionesRelevantes: brain.memory.institucionesRelevantes,
        lugaresRelacionados: brain.memory.lugaresRelacionados,
        timeline: brain.memory.timeline,
        relatedEntities: brain.memory.relatedEntities,
        contextoParaLlm: brain.context.contextoParaLlm,
        preguntasFrecuentes: brain.context.preguntasFrecuentes,
      }
    : undefined;

  const decision = runEditorialBrain({
    ...noticiaInput,
    fuente: input.fuente,
    categoriaSugerida: input.categoriaSugerida,
    knowledgeContext,
  });

  // Quality Gate PRE-LLM: analiza el hecho original antes de redactar.
  const qualityGatePre = runQualityGate({
    titulo: noticiaInput.titulo,
    contenido: input.fuente,
    categoria: input.categoriaSugerida || 'General',
    stage: 'PRE_LLM',
  });
  await appendQualityGateHistory(qualityGatePre, { titulo: noticiaInput.titulo, categoria: input.categoriaSugerida || 'General' }, db);

  if (decision.recomendacionEditorial === 'revisar') {
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
      diagnosticoEditorial: decision.mensajeEditor,
      diagnosticoTecnico: decision.motivoPrincipal,
      riesgoEditorial: decisionRiesgoToRiesgo(decision.riesgoEditorial),
      riesgoTecnico: 'ALTO',
      scoreMeni: decision.score,
      aprobado: false,
      estadoEditorial: decision.estadoEditorial,
      recomendacionEditorial: decision.recomendacionEditorial,
      diagnosticoEditorialNI: decision.diagnostico,
      mensajeEditor: decision.mensajeEditor,
      razonamientoEditorial: decision.razonamiento,
      correccionesAplicadas: [],
      recomendaciones: decision.acciones,
      qualityGatePre,
      editorBrain: brain,
      editorialVerification: undefined,
      _provider: 'groq+editorial-brain',
      _error: decision.mensajeEditor,
      editorialDecision: buildDecisionFlat(decision),
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
      // FASE 3 (calibración): configuración determinística. Mismo input = mismo resultado.
      temperature: 0,
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
    copyWhatsApp: `${instr.tituloSEO} https://nicaraguainformate.com/noticias/${instr.slug}`,
    copyTelegram: `${instr.tituloSEO}\n\n${getString('bajada')}\n\nhttps://nicaraguainformate.com/noticias/${instr.slug}`,
    jsonLd: '',
    checklistEeatDiscover: `EEAT: autor visible, fuentes atribuidas. Discover: título sin clickbait.`,
    diagnosticoEditorial: decision.mensajeEditor,
    diagnosticoTecnico: decision.motivoPrincipal,
    riesgoEditorial: decisionRiesgoToRiesgo(decision.riesgoEditorial),
    riesgoTecnico: 'BAJO',
    scoreMeni: decision.score,
    aprobado: false,
    estadoEditorial: decision.estadoEditorial,
    recomendacionEditorial: decision.recomendacionEditorial,
    diagnosticoEditorialNI: decision.diagnostico,
    mensajeEditor: decision.mensajeEditor,
    razonamientoEditorial: decision.razonamiento,
    correccionesAplicadas: decision.acciones,
    recomendaciones: decision.acciones,
    _provider: 'groq+editorial-brain',
    editorialDecision: buildDecisionFlat(decision),
  };

  const textoPlano = stripHtml(generated.articuloCompleto);
  if (textoPlano.split(/\s+/).filter(Boolean).length < 120) {
    generated.recomendaciones.push('Artículo demasiado corto. Amplíe a mínimo 400 palabras con contexto y desarrollo.');
  }

  // Quality Gate POST-LLM: analiza el texto redactado, compara contra la
  // fuente y aplica correcciones automáticas antes de bloquear.
  // Usa decision editorial como fuente de verdad para evitar scores contradictorios.
  const qualityGatePost = runQualityGate(
    {
      titulo: generated.tituloSEO,
      contenido: generated.articuloCompleto,
      categoria: generated.categoria,
      fuenteOriginal: input.fuente,
      entidadesPrevias: qualityGatePre.entidades,
      stage: 'POST_LLM',
      sourceOfTruth: {
        score: decision.score,
        originalidad: decision.editorialDna.selloNI.originalidad,
        servicio: decision.editorialDna.selloNI.servicio,
        bloqueado: decision.bloquear,
        explanationIndex: {
          porcentajeContexto: decision.editorialDna.selloNI.contextualiza,
          porcentajeExplicacion: decision.editorialDna.selloNI.explica,
          porcentajeServicio: decision.editorialDna.selloNI.servicio,
        },
      },
    },
    decision.nicaraguaInformate.porQueLeerAqui
  );
  await appendQualityGateHistory(qualityGatePost, { titulo: generated.tituloSEO, categoria: generated.categoria }, db);

  generated.qualityGatePre = qualityGatePre;
  generated.qualityGatePost = qualityGatePost;
  generated.editorBrain = brain;

  // ═══════════════════════════════════════════════════════════
  // MENI v8: Verificación post-LLM — ¿se cumplieron las decisiones editoriales?
  // ═══════════════════════════════════════════════════════════
  const verification = verifyEditorialDecisions(decision, qualityGatePost.textoCorregido);
  generated.editorialVerification = verification;

  generated.articuloCompleto = qualityGatePost.textoCorregido;
  generated.correccionesAplicadas = [
    ...generated.correccionesAplicadas,
    ...qualityGatePost.corregidos.map((c) => c.descripcion),
  ];

  if (qualityGatePost.bloqueado) {
    generated.aprobado = false;
    generated.riesgoEditorial = 'ROJO';
    generated.estadoEditorial = 'no_aporta';
    generated.recomendacionEditorial = 'revisar';
    generated.diagnosticoTecnico = `Quality Gate: ${qualityGatePost.motivosBloqueo.join(' | ')}`;
    generated.recomendaciones = [...qualityGatePost.motivosBloqueo, ...generated.recomendaciones];
  }

  // Revisión final MENI — corre sobre el texto ya corregido por el Quality Gate.
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
    // Score derivado del EditorialDecision (ADN NI), no de cálculo paralelo
    generated.scoreMeni = decision.score;
    // Aprobado = EditorialDecision.publicar y no hay issues técnicos críticos
    generated.aprobado = decision.publicar && !qualityGatePost.bloqueado;
    // Si no pasa verificación editorial, bajar recomendación
    if (!verification.pasa && generated.recomendacionEditorial === 'publicar') {
      generated.recomendacionEditorial = 'mejorar';
      generated.estadoEditorial = 'necesita_explicacion';
    }
    // Riesgo derivado del EditorialDecision
    generated.riesgoEditorial = qualityGatePost.bloqueado ? 'ROJO' : decisionRiesgoToRiesgo(decision.riesgoEditorial);
    generated.riesgoTecnico = qualityGatePost.bloqueado ? 'ALTO' : qualityGatePost.issues.length > 0 ? 'MEDIO' : 'BAJO';
  } catch (e) {
    generated.evaluacion = undefined;
    generated._error = `Evaluación local falló: ${e instanceof Error ? e.message : String(e)}`;
    generated.aprobado = false;
  }

  if (!verification.pasa) {
    generated.recomendaciones = [
      ...verification.items.filter(i => !i.cumplido).map(i => `${i.requisito}: ${i.evidencia || 'sin evidencia'}`),
      ...generated.recomendaciones,
    ];
  }

  return generated;
}
