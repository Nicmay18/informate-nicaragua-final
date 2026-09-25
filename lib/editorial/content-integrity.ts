/**
 * VALIDATE → REJECT → LOG para defectos mecánicos conocidos del pipeline de
 * generación. Solo patrones imposibles o verbatim fabricados — nunca heurística
 * editorial. Detectado durante el saneamiento de 474 notas (ver .audit/).
 *
 * Fase 5: cada defecto declara una acción explícita:
 *   BLOCK       → defecto editorial fabricado; contenido no puede publicarse.
 *   AUTO_REMOVE → artefacto técnico inequívoco (marcador de cita IA); se elimina
 *                 del texto antes de evaluar, sin tocar contenido editorial.
 *   REVIEW      → sospechoso pero no inequívoco; requiere revisión humana.
 */

export type DefectAction = 'BLOCK' | 'AUTO_REMOVE' | 'REVIEW';

export interface GenerationDefect {
  code: string;
  desc: string;
  action: DefectAction;
}

const DEFECTS: Array<{ code: string; re: RegExp; desc: string; action: DefectAction }> = [
  // Concatenación imposible del generador: "motocicletacicleta(s)", "...ciclista(s)"
  { code: 'CONCAT_MOTOCICLETA', re: /motocicletaciclet|motocicletaciclist/i, action: 'BLOCK', desc: 'palabra concatenada imposible (motocicleta*)' },
  // Duplicación mecánica observada: "personas personas"
  { code: 'DUP_PERSONAS', re: /\bpersonas\s+personas\b/i, action: 'BLOCK', desc: 'duplicación mecánica "personas personas"' },
  // Concordancia rota del generador: "el afectación", "del afectación", "afectado afectada"
  { code: 'CONCORDANCIA_AFECTACION', re: /\b(?:el|del)\s+afectación\b|afectado\s+afectada/i, action: 'BLOCK', desc: 'concordancia rota en "afectación"' },
  // Citas fabricadas verbatim del pipeline (testigos/vecinos inexistentes)
  { code: 'CITA_FABRICADA', re: /testigo ocular manifestó|vecino que presenció los hechos comentó|declaración de residente local|maría lópez,?\s+vecina del barrio|recabado por la redacción|transeúte que captó el momento/i, action: 'BLOCK', desc: 'plantilla de cita fabricada (testigo/vecino/residente inexistente)' },
  // Remanente de anchor roto en bloque "También te puede interesar": <li>slug">texto
  { code: 'LI_ROTO', re: /<li>[a-z0-9-]{6,}">/i, action: 'BLOCK', desc: 'anchor roto en lista de enlaces relacionados' },
  // ── Artefactos de IA (observados en corpus: iPhone Duo, score 95 ORO) ──
  // Marcadores de cita de ChatGPT/OpenAI: :contentReference[oaicite:1]{index=1},
  // [oaicite:0], 【...†...】. Residuo técnico inequívoco → AUTO_REMOVE.
  { code: 'AI_CITATION_MARKER', re: /:contentReference\[|oaicite:\d+|【[^】]*†[^】]*】|\bcite_turn\d+/i, action: 'AUTO_REMOVE', desc: 'marcador de cita de salida IA residual' },
  // URL de tracking de ChatGPT en enlaces.
  { code: 'AI_TRACKING_URL', re: /[?&]utm_source=chatgpt\.com/i, action: 'AUTO_REMOVE', desc: 'parámetro utm_source=chatgpt.com (residuo de IA)' },
  // Prompt leakage: instrucciones del sistema pegadas en el cuerpo.
  { code: 'AI_PROMPT_LEAK', re: /\b(?:como modelo de lenguaje|as an ai language model|no puedo navegar en internet|según mi base de conocimiento)\b/i, action: 'REVIEW', desc: 'posible fuga de prompt/disclaimer de IA en el texto' },
];

/** Devuelve los defectos encontrados en el texto (título/resumen/contenido). */
export function findGenerationDefects(text: string): GenerationDefect[] {
  if (!text) return [];
  return DEFECTS.filter(d => d.re.test(text)).map(({ code, desc, action }) => ({ code, desc, action }));
}

/** Solo los defectos que bloquean publicación (BLOCK). */
export function findBlockingDefects(text: string): GenerationDefect[] {
  return findGenerationDefects(text).filter(d => d.action === 'BLOCK');
}
