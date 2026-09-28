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

  // ── Defectos mecánicos genéricos (barrera final anti-generación) ──
  // Mojibake / caracteres de reemplazo: corrupción de codificación inequívoca.
  { code: 'MOJIBAKE', re: /\uFFFD|Ã©|Ã±|Ã³|Ã¡|Ã­|â€|â€œ/i, action: 'BLOCK', desc: 'caracteres corruptos (mojibake) en el texto' },
  // Duplicación mecánica genérica: misma palabra de 6+ letras repetida.
  // Whitelist: reduplicaciones legítimas del español (ja ja, je je, etc. <6 letras).
  { code: 'DUP_WORD_GENERIC', re: /\b([a-záéíóúñü]{6,})\s+\1\b/, action: 'BLOCK', desc: 'palabra duplicada mecánicamente (ej. "texto texto")' },
  // Duplicación de palabras funcionales (<6 letras): "que que", "de de",
  // "la la" son errores mecánicos inequívocos — no existen en prosa
  // periodística como reduplicación legítima. Solo minúsculas: nombres
  // propios (Cáceres Cáceres) nunca son funcionales en minúscula.
  // "no"/"sí" llevan coma en diálogo legítimo ("No, no"), así que la
  // forma con espacio simple sigue siendo defecto.
  { code: 'DUP_FUNCTION_WORD', re: /\b(que|de|la|el|en|un|una|se|su|lo|al|del|con|por|para|pero|como|muy|sin|sobre|cuando|porque|mas|más|aunque|sino|también|tampoco|solo|sólo|ya|aún|aun|no|sí|es|fue|son|hay|así|me|te|le|les|nos|está|están|era|ser)\s+\1\b/, action: 'BLOCK', desc: 'palabra funcional duplicada (ej. "que que", "de de")' },
  // Puntuación duplicada imposible: !! ?? ;; ,, :: (puntos suspensivos "..." son válidos).
  { code: 'DUP_PUNCT', re: /[!?]{2,}|[;,:]{2,}/, action: 'BLOCK', desc: 'signos de puntuación duplicados (ej. "!!", ";;", ",,")' },
  // Encabezado HTML duplicado de forma consecutiva e idéntica.
  { code: 'DUP_HEADER', re: /(<h[2-4][^>]*>([^<]{4,120})<\/h[2-4]>)\s*<h[2-4][^>]*>\2<\/h[2-4]>/i, action: 'BLOCK', desc: 'encabezado duplicado consecutivo' },
  // Token sospechosamente largo: en español casi ninguna palabra supera 23 letras;
  // un token de 24+ suele ser concatenación defectuosa → REVIEW, no BLOCK.
  { code: 'LONG_TOKEN', re: /\b[a-záéíóúñü]{24,}\b/i, action: 'REVIEW', desc: 'token inusualmente largo (posible concatenación)' },
  // Espacio antes de puntuación: artefacto mecánico, pero puede ser intencional
  // en casos tipográficos → REVIEW.
  { code: 'SPACE_BEFORE_PUNCT', re: /\s[,;:!?]/, action: 'REVIEW', desc: 'espacio incorrecto antes de puntuación' },
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

/**
 * Repara únicamente artefactos mecánicos inequívocos producidos por el
 * generador. No corrige lenguaje editorial, citas ni hechos. Se ejecuta sobre
 * la salida canónica de MENI antes del último gate para evitar que un bug de
 * generación conocido convierta una nota válida en un falso rechazo.
 */
export function repairMechanicalDefects(text: string): {
  text: string;
  repaired: string[];
} {
  if (!text) return { text, repaired: [] };

  let out = text;
  const repaired: string[] = [];

  const replacements: Array<[RegExp, string, string]> = [
    [/motocicletacicleta/gi, 'motocicleta', 'CONCAT_MOTOCICLETA'],
    [/motocicletaciclistas?/gi, 'motociclista', 'CONCAT_MOTOCICLETA'],
    [/\bpersonas\s+personas\b/gi, 'personas', 'DUP_PERSONAS'],
    [/\bel\s+afectación\b/gi, 'la afectación', 'CONCORDANCIA_AFECTACION'],
    [/\bdel\s+afectación\b/gi, 'de la afectación', 'CONCORDANCIA_AFECTACION'],
    [/afectado\s+afectada/gi, 'afectado', 'CONCORDANCIA_AFECTACION'],
  ];

  for (const [re, replacement, code] of replacements) {
    if (re.test(out)) {
      out = out.replace(re, replacement);
      if (!repaired.includes(code)) repaired.push(code);
    }
  }

  // LI_ROTO: elimina solo la forma inválida <li>slug"> y conserva el texto
  // que le sigue; nunca modifica anchors HTML válidos.
  if (/<li>[a-z0-9-]{6,}">/i.test(out)) {
    out = out.replace(/<li>([a-z0-9-]{6,})">/gi, '<li>');
    repaired.push('LI_ROTO');
  }

  return { text: out, repaired };
}
