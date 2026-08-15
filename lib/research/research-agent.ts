/**
 * Research Agent — Motor de investigación
 * =======================================
 * Recibe datos crudos del editor.
 * Investiga ANTES de redactar.
 * No inventa datos. No inventa fuentes.
 */

import { callLLM, extractJson, isLLMAvailable } from './llm-client';
import type { ResearchInput, ResearchResult, ResearchSource, ResearchFact, ResearchConflict, MissingInformation } from './types';
import type { Firestore } from 'firebase-admin/firestore';

const MODEL_VERSION = 'research-agent-v1.0';

/**
 * Consulta el Knowledge Base local para contexto adicional.
 * Reutiliza la infraestructura existente.
 */
async function getKnowledgeContext(db: Firestore | undefined, input: ResearchInput): Promise<string[]> {
  if (!db) return [];
  try {
    const { loadGraph } = await import('@/lib/meni/knowledge-base');
    const { queryKnowledge } = await import('@/lib/meni/knowledge-base/knowledge-query');
    const graph = await loadGraph(db);
    const result = queryKnowledge(input.titulo, input.contenido, input.categoria || 'General', graph);
    return [
      ...result.antecedentes,
      ...result.contexto,
    ];
  } catch {
    return [];
  }
}

function buildResearchPrompt(input: ResearchInput, knowledgeContext: string[], isWatch: boolean): string {
  const watchSection = isWatch && input.existingArticle
    ? `
ARTÍCULO PUBLICADO ORIGINAL:
Título: ${input.existingArticle.titulo}
Fecha: ${input.existingArticle.fecha}
Contenido: ${input.existingArticle.contenido.substring(0, 2000)}

MISIÓN ESPECIAL: Estás monitoreando una noticia YA PUBLICADA.
Busca información NUEVA que haya surgido DESPUÉS de la publicación.
Compara con el contenido original.
Detecta: nuevas cifras, desmentidos, liberaciones, capturas, fallecidos, cambios.
`
    : '';

  return `Eres un investigador periodístico de Nicaragua Informate.
Tu trabajo es INVESTIGAR antes de redactar.

REGLAS ESTRICTAS:
1. NO inventes fuentes, citas, fechas, nombres ni datos.
2. Si no sabes algo, di "no se sabe".
3. Prioriza fuentes primarias (INTERPOL, Policía, gobiernos, ministerios).
4. Detecta contradicciones entre fuentes.
5. Detecta información faltante.
6. Si hay información nueva que cambia el enfoque, indícalo.

DATOS CRUDOS DEL EDITOR:
Título: ${input.titulo}
Resumen: ${input.resumen || '(no proporcionado)'}
Contenido: ${input.contenido.substring(0, 3000)}
${watchSection}
CONTEXTO DE ARCHIVO (Knowledge Base):
${knowledgeContext.length > 0 ? knowledgeContext.join('\n') : '(sin antecedentes en archivo)'}

Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "summary": "resumen de qué se sabe",
  "factsFound": [
    { "claim": "...", "status": "CONFIRMED|REPORTED|UNVERIFIED|CONFLICTING|OUTDATED", "sources": [{"name":"...","level":"PRIMARY|MEDIA|SECONDARY|SOCIAL","url":"...","snippet":"..."}], "confidence": 0.0-1.0 }
  ],
  "sourcesChecked": [{"name":"...","level":"PRIMARY|MEDIA|SECONDARY|SOCIAL"}],
  "conflictsFound": [
    { "topic":"...", "versionA":{"claim":"...","source":{"name":"...","level":"MEDIA"}}, "versionB":{"claim":"...","source":{"name":"...","level":"MEDIA"}}, "recommendation":"..." }
  ],
  "missingInformation": [
    { "question":"...", "importance":"HIGH|MEDIUM|LOW", "why":"..." }
  ],
  "additionalContext": ["..."],
  "hasNewInformation": false,
  "newInformationSummary": "",
  "changesOriginalFocus": false,
  "recommendedAction": "PROCEED|UPDATE_FOCUS|INVESTIGATE_MORE|DO_NOT_PUBLISH",
  "reason": "..."
}`;
}

function buildFallbackResult(input: ResearchInput, error: string): ResearchResult {
  const now = new Date().toISOString();
  return {
    researchStartedAt: now,
    researchCompletedAt: now,
    modelVersion: MODEL_VERSION,
    rawInput: input.titulo,
    summary: `Investigación no disponible: ${error}. El editor debe verificar manualmente.`,
    factsFound: [],
    sourcesChecked: [],
    sourcesAccepted: [],
    sourcesRejected: [],
    conflictsFound: [],
    missingInformation: [
      { question: 'No se pudo investigar automáticamente', importance: 'HIGH', why: error },
    ],
    additionalContext: [],
    hasNewInformation: false,
    changesOriginalFocus: false,
    recommendedAction: 'INVESTIGATE_MORE',
    reason: 'Research Agent no disponible. Se requiere verificación manual.',
  };
}

export async function runResearch(
  input: ResearchInput,
  options?: { db?: Firestore }
): Promise<ResearchResult> {
  const startedAt = new Date().toISOString();
  const isWatch = !!input.existingArticle;

  const knowledgeContext = await getKnowledgeContext(options?.db, input);

  if (!isLLMAvailable()) {
    return buildFallbackResult(input, 'GEMINI_API_KEY no configurada');
  }

  const prompt = buildResearchPrompt(input, knowledgeContext, isWatch);
  const response = await callLLM(prompt, 4000);

  if (!response.ok || !response.text) {
    return buildFallbackResult(input, response.error || 'LLM sin respuesta');
  }

  const parsed = extractJson<ResearchResult>(response.text);
  if (!parsed) {
    return buildFallbackResult(input, 'LLM no retornó JSON válido');
  }

  const completedAt = new Date().toISOString();

  const result: ResearchResult = {
    researchStartedAt: startedAt,
    researchCompletedAt: completedAt,
    modelVersion: MODEL_VERSION,
    rawInput: input.titulo,
    summary: parsed.summary || '',
    factsFound: (parsed.factsFound || []).map(normalizeFact),
    sourcesChecked: (parsed.sourcesChecked || []).map(normalizeSource),
    sourcesAccepted: (parsed.sourcesChecked || []).filter(s => s.level === 'PRIMARY' || s.level === 'MEDIA').map(normalizeSource),
    sourcesRejected: [],
    conflictsFound: (parsed.conflictsFound || []).map(normalizeConflict),
    missingInformation: (parsed.missingInformation || []).map(normalizeMissing),
    additionalContext: parsed.additionalContext || [],
    hasNewInformation: !!parsed.hasNewInformation,
    newInformationSummary: parsed.newInformationSummary || undefined,
    changesOriginalFocus: !!parsed.changesOriginalFocus,
    recommendedAction: parsed.recommendedAction || 'INVESTIGATE_MORE',
    reason: parsed.reason || '',
  };

  return result;
}

function normalizeSource(s: Partial<ResearchSource>): ResearchSource {
  return {
    name: String(s.name || 'Fuente desconocida'),
    level: (s.level as ResearchSource['level']) || 'SECONDARY',
    url: s.url,
    snippet: s.snippet,
    date: s.date,
  };
}

function normalizeFact(f: Partial<ResearchFact>): ResearchFact {
  return {
    claim: String(f.claim || ''),
    status: (f.status as ResearchFact['status']) || 'UNVERIFIED',
    sources: (f.sources || []).map(normalizeSource),
    confidence: typeof f.confidence === 'number' ? Math.max(0, Math.min(1, f.confidence)) : 0,
  };
}

function normalizeConflict(c: Partial<ResearchConflict>): ResearchConflict {
  return {
    topic: String(c.topic || ''),
    versionA: {
      claim: String(c.versionA?.claim || ''),
      source: normalizeSource(c.versionA?.source || {}),
    },
    versionB: {
      claim: String(c.versionB?.claim || ''),
      source: normalizeSource(c.versionB?.source || {}),
    },
    recommendation: String(c.recommendation || ''),
  };
}

function normalizeMissing(m: Partial<MissingInformation>): MissingInformation {
  return {
    question: String(m.question || ''),
    importance: (m.importance as MissingInformation['importance']) || 'MEDIUM',
    why: String(m.why || ''),
  };
}
