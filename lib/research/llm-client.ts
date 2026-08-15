/**
 * LLM Client — wrapper unificado para Gemini
 * Reutiliza GEMINI_API_KEY ya configurada en el proyecto.
 * No inventa datos: solo retorna lo que el modelo produce.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export interface LLMResponse {
  text: string;
  model: string;
  ok: boolean;
  error?: string;
}

export function isLLMAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

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
