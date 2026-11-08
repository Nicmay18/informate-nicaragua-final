const normalize = (s: string) => s.replace(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')
  .replace(/<[^>]*>/g, ' ').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Evidencia textual por concepto, no coincidencia entre pregunta y titular.
 * Los encabezados solos y las preguntas sin respuesta no son evidencia. */
export function hasReaderAnswer(question: string, content: string): boolean {
  const q = normalize(question);
  const body = normalize(content).replace(/¿[^?]*\?/g, ' ');
  if (/no (?:se )?(?:especific|inform|detall)|se desconoce|por determinar/.test(body)
    && /causa|hora|fecha|identidad/.test(q)) return false;
  const rules: [RegExp, RegExp][] = [
    [/quien.*(?:anunci|inform|confirm)|institucion|fuente|confirmado/, /(?:segun|de acuerdo con)\s+(?:el|la|los|las)?\s*[a-z]{3,}|(?:ministerio|policia|alcaldia|agencia|banco|instituto).{0,80}(?:inform|anunci|confirm|comunic)/],
    [/cuando|fecha|hora/, /\b\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4}\b|\b(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b|\b\d{1,2}:\d{2}\b/],
    [/donde|ubicacion|lugar/, /\b(?:en|desde|hacia)\s+(?:el |la )?(?:municipio|ciudad|barrio|carretera|estadio|centro|managua|leon|bluefields|jinotega|esteli)\b/],
    [/cifra|cuanto|costo|precio|monto|dato o medida/, /\b\d[\d.,]*\s*(?:%|millones|cordobas|dolares|personas|puntos|libras)|c\$\s*\d|calificacion.{0,80}(?:de|a)\s*["“]?[a-c][+-]?/],
    [/que investiga|estado.*caso|que sigue|siguiente paso/, /\b(?:investigaciones? continu|investigacion (?:continua|abierta|en curso)|presentado a la fiscalia|audiencia|pendiente de|se investiga)/],
    [/causa|por que ocurrio|motivo/, /\b(?:debido a|a causa de|provocado por|causado por)\s+[a-z]{3,}/],
    [/quien.*gan|resultado|marcador/, /\b(?:gano|vencio|derroto|empato).{0,100}\d+\s*[-–]\s*\d+|decision (?:mayoritaria|unanime|dividida)/],
    [/requisito|que hacer|recomendacion/, /\b(?:deben|debe|se recomienda|se requiere|se necesita|presentar)\s+[a-z]{3,}/],
  ];
  const rule = rules.find(([pattern]) => pattern.test(q));
  if (rule) return rule[1].test(body);
  // Fallback: solapamiento de contenido. Solo palabras significativas de la
  // pregunta (>4 letras, fuera de muletillas interrogativas).
  const STOP = new Set(['quien', 'quienes', 'cuando', 'donde', 'cuanto', 'cuanta', 'cual', 'cuales', 'porque', 'como', 'para', 'sobre', 'entre', 'desde', 'hasta', 'este', 'esta', 'estos', 'estas', 'fue', 'son', 'ser', 'han', 'hay', 'mas', 'pero', 'sin', 'con', 'los', 'las', 'del', 'una', 'uno', 'estan', 'tiene', 'tienen']);
  const tokens = q.split(/\s+/).filter(w => w.length > 4 && !STOP.has(w) && !/^[¿?]$/.test(w));
  if (tokens.length === 0) return true; // pregunta sin contenido comprobable
  const hits = tokens.filter(w => body.includes(w)).length;
  return hits >= Math.max(1, Math.ceil(tokens.length * 0.3));
}
