/**
 * LLM Client — wrapper unificado para Gemini
 * Reutiliza GEMINI_API_KEY ya configurada en el proyecto.
 * No inventa datos: solo retorna lo que el modelo produce.
 *
 * Ahora soporta Google Search Retrieval para investigación web real.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const MAX_RESEARCH_TOKENS = parseInt(process.env.MAX_RESEARCH_TOKENS || '4096', 10);

export interface LLMResponse {
  text: string;
  model: string;
  ok: boolean;
  error?: string;
  /** Fuentes web reales cuando se usa google_search_retrieval */
  sources?: ResearchSourceWeb[];
}

export interface ResearchSourceWeb {
  title: string;
  url?: string;
  domain: string;
  snippet?: string;
  retrievedAt: string;
}

export function isLLMAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

/**
 * Llamada básica a Gemini sin búsqueda web.
 */
export async function callLLM(prompt: string, maxTokens = 4000): Promise<LLMResponse> {
  if (!GEMINI_API_KEY) {
    return {
      text: '',
      model: GEMINI_MODEL,
      ok: false,
      error: 'GEMINI_API_KEY no configurada',
    };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { text: '', model: GEMINI_MODEL, ok: false, error: `Gemini ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text, model: GEMINI_MODEL, ok: true };
  } catch (err) {
    return {
      text: '',
      model: GEMINI_MODEL,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Llamada a Gemini con Google Search Retrieval.
 * ESTA ES LA FUNCIÓN QUE INVESTIGA EN INTERNET.
 *
 * Documentación:
 * - Gemini 1.5 Pro / 2.0 Flash con google_search_retrieval
 * - https://ai.google.dev/gemini-api/docs/grounding
 *
 * Requiere GEMINI_API_KEY con grounding habilitado.
 * Costo: aproximadamente 35% más por llamada. Controlado por MAX_RESEARCH_TOKENS.
 */
export async function callLLMWithWebSearch(
  prompt: string,
  options?: { maxTokens?: number; searchThreshold?: number }
): Promise<LLMResponse> {
  if (!GEMINI_API_KEY) {
    return {
      text: '',
      model: GEMINI_MODEL,
      ok: false,
      error: 'GEMINI_API_KEY no configurada',
    };
  }

  const maxTokens = options?.maxTokens || MAX_RESEARCH_TOKENS;
  const threshold = options?.searchThreshold ?? 0.7;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
          tools: [{
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: 'MODE_DYNAMIC',
                dynamicThreshold: threshold,
              },
            },
          }],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { text: '', model: GEMINI_MODEL, ok: false, error: `Gemini search ${res.status}: ${errText}` };
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';

    // Extraer fuentes web reales si vienen en groundingMetadata
    const sources: ResearchSourceWeb[] = [];
    const grounding = candidate?.groundingMetadata;
    const chunks = grounding?.groundingChunks || [];
    const supports = grounding?.groundingSupports || [];

    for (const chunk of chunks) {
      const web = chunk?.web;
      if (web?.uri || web?.title) {
        sources.push({
          title: web.title || 'Fuente web',
          url: web.uri,
          domain: web.domainDisplayName || (web.uri ? new URL(web.uri).hostname : 'desconocido'),
          snippet: supports.find((s: any) => s.groundingChunkIndices?.includes(chunks.indexOf(chunk)))?.segment?.text,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return { text, model: GEMINI_MODEL, ok: true, sources };
  } catch (err) {
    return {
      text: '',
      model: GEMINI_MODEL,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Extrae JSON de una respuesta de LLM que puede venir envuelta en markdown.
 */
export function extractJson<T = unknown>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
