/**
 * Story Editor — Motor editorial
 * ==============================
 * Recibe ResearchResult + datos crudos.
 * Determina si vale la pena publicar.
 * Propone el mejor enfoque.
 * Redacta como periodista profesional.
 */

import { callLLM, extractJson } from '@/lib/research/llm-client';
import type { StoryEditorInput, StoryProposal, EditorialVerdict } from './types';

const MODEL_VERSION = 'story-editor-v1.0';

function buildStoryPrompt(input: StoryEditorInput): string {
  const r = input.research;
  const factsJson = JSON.stringify(r.factsFound.map(f => ({ claim: f.claim, status: f.status, confidence: f.confidence })), null, 2);
  const conflictsJson = JSON.stringify(r.conflictsFound, null, 2);
  const missingJson = JSON.stringify(r.missingInformation, null, 2);
  const contextJson = JSON.stringify(r.additionalContext, null, 2);

  return `Eres un editor periodístico senior de Nicaragua Informate.
Recibes el resultado de una investigación y los datos crudos del editor.

REGLAS ESTRICTAS:
1. NO inventes datos, citas, fechas, nombres ni fuentes.
2. Si la investigación dice "no se sabe", NO lo rellenes.
3. Encuentra el VERDADERO hecho noticioso, no el titular genérico.
4. Si hay conflictos no resueltos, NO recomiendes publicar como hecho confirmado.
5. Si falta información crítica, recomienda INVESTIGAR más.
6. El texto debe sonar a periodista profesional (estilo BBC/Reuters), no a IA.
7. Sin emojis. Sin clickbait. Sin exageración.

INVESTIGACIÓN:
Resumen: ${r.summary}
Hechos encontrados:
${factsJson}
Conflictos:
${conflictsJson}
Información faltante:
${missingJson}
Contexto adicional:
${contextJson}
Acción recomendada por investigación: ${r.recommendedAction}
Razón: ${r.reason}

DATOS CRUDOS:
Título: ${input.rawInput.titulo}
Resumen: ${input.rawInput.resumen || '(no proporcionado)'}
Contenido: ${input.rawInput.contenido.substring(0, 2000)}

Responde ÚNICAMENTE en JSON:
{
  "verdict": "PUBLICAR|MEJORAR|INVESTIGAR|ACTUALIZAR|NO_PUBLICAR|ARCHIVAR",
  "reason": "...",
  "focusAngle": "cuál es el verdadero hecho noticioso y por qué",
  "suggestedTitle": "...",
  "alternativeTitles": ["...", "..."],
  "suggestedSummary": "...",
  "suggestedBody": "<p>...</p><p>...</p>",
  "context": "...",
  "keyData": ["...", "..."],
  "sources": ["...", "..."],
  "questionsAnswered": ["¿...?", "¿...?"],
  "readerSatisfaction": {
    "understandsWhatHappened": true,
    "understandsWhyItMatters": true,
    "understandsWhere": true,
    "understandsWhen": true,
    "knowsWhoConfirmed": true,
    "hasNecessaryContext": true,
    "score": 0-100,
    "improvements": ["...", "..."]
  },
  "seo": {
    "title": "...",
    "metaDescription": "...",
    "slug": "...",
    "keywords": ["...", "..."],
    "entities": ["...", "..."],
    "searchIntent": "..."
  },
  "distribution": {
    "social": "...",
    "telegram": "..."
  }
}`;
}

function buildFallbackProposal(input: StoryEditorInput, error: string): StoryProposal {
  const r = input.research;
  const verdict: EditorialVerdict = r.recommendedAction === 'DO_NOT_PUBLISH' ? 'NO_PUBLICAR' : 'INVESTIGAR';
  return {
    verdict,
    reason: `Story Editor no disponible: ${error}. ${r.reason}`,
    focusAngle: input.rawInput.titulo,
    suggestedTitle: input.rawInput.titulo,
    alternativeTitles: [],
    suggestedSummary: input.rawInput.resumen || '',
    suggestedBody: input.rawInput.contenido,
    context: r.additionalContext.join('; '),
    keyData: r.factsFound.map(f => f.claim),
    sources: r.sourcesChecked.map(s => s.name),
    questionsAnswered: [],
    readerSatisfaction: {
      understandsWhatHappened: false,
      understandsWhyItMatters: false,
      understandsWhere: false,
      understandsWhen: false,
      knowsWhoConfirmed: false,
      hasNecessaryContext: false,
      score: 0,
      improvements: ['Story Editor no disponible, requiere edición manual'],
    },
    seo: {
      title: input.rawInput.titulo,
      metaDescription: input.rawInput.resumen || '',
      slug: input.rawInput.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60),
      keywords: [],
      entities: [],
      searchIntent: '',
    },
    distribution: {
      social: input.rawInput.titulo,
      telegram: input.rawInput.titulo,
    },
  };
}

export async function runStoryEditor(input: StoryEditorInput): Promise<StoryProposal> {
  const prompt = buildStoryPrompt(input);
  const response = await callLLM(prompt, 6000);

  if (!response.ok || !response.text) {
    return buildFallbackProposal(input, response.error || 'LLM sin respuesta');
  }

  const parsed = extractJson<StoryProposal>(response.text);
  if (!parsed) {
    return buildFallbackProposal(input, 'LLM no retornó JSON válido');
  }

  return {
    verdict: (parsed.verdict as EditorialVerdict) || 'INVESTIGAR',
    reason: parsed.reason || '',
    focusAngle: parsed.focusAngle || '',
    suggestedTitle: parsed.suggestedTitle || input.rawInput.titulo,
    alternativeTitles: parsed.alternativeTitles || [],
    suggestedSummary: parsed.suggestedSummary || input.rawInput.resumen || '',
    suggestedBody: parsed.suggestedBody || input.rawInput.contenido,
    context: parsed.context || '',
    keyData: parsed.keyData || [],
    sources: parsed.sources || [],
    questionsAnswered: parsed.questionsAnswered || [],
    readerSatisfaction: {
      understandsWhatHappened: !!parsed.readerSatisfaction?.understandsWhatHappened,
      understandsWhyItMatters: !!parsed.readerSatisfaction?.understandsWhyItMatters,
      understandsWhere: !!parsed.readerSatisfaction?.understandsWhere,
      understandsWhen: !!parsed.readerSatisfaction?.understandsWhen,
      knowsWhoConfirmed: !!parsed.readerSatisfaction?.knowsWhoConfirmed,
      hasNecessaryContext: !!parsed.readerSatisfaction?.hasNecessaryContext,
      score: typeof parsed.readerSatisfaction?.score === 'number' ? parsed.readerSatisfaction.score : 0,
      improvements: parsed.readerSatisfaction?.improvements || [],
    },
    seo: {
      title: parsed.seo?.title || input.rawInput.titulo,
      metaDescription: parsed.seo?.metaDescription || '',
      slug: parsed.seo?.slug || input.rawInput.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60),
      keywords: parsed.seo?.keywords || [],
      entities: parsed.seo?.entities || [],
      searchIntent: parsed.seo?.searchIntent || '',
    },
    distribution: {
      social: parsed.distribution?.social || input.rawInput.titulo,
      telegram: parsed.distribution?.telegram || input.rawInput.titulo,
    },
  };
}

export { MODEL_VERSION };
