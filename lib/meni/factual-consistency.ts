import { detectFactualitySignals, type FactualityInput, type FactualitySignal } from '@/lib/editorial/factuality-signals';

const plain = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const norm = (s: string) => plain(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const scorePattern = /(?<![\d-])\b(\d{1,2})\s*[-–]\s*(\d{1,2})\b(?!\s*[-–]\s*\d)/g;
const resultVerb = /\b(?:golea|goleo|vence|vencio|derrota|derroto|gana|gano|pierde|perdio|empata|empato)\b/;
const historical = /\b(?:anterior|pasado|antes|ida|vuelta|parcial|descanso|set|sets|global|penales|prorroga|rectific|corrig|actualiz|inicialmente)\b/;
const uncertainty = /\b(?:segun|reporto|informo|version|provisional|preliminar|hasta|inicial|despues|luego|ahora|ayer|hoy|anterior)\b/;

function scores(text: string): string[] {
  return [...text.matchAll(scorePattern)].map(m => `${Number(m[1])}-${Number(m[2])}`);
}

/**
 * Comparación interna conservadora, no verificación externa.
 * Se conserva la barrera de atribución existente. La mera existencia de
 * dos cifras, dos fechas o dos fuentes NO demuestra una contradicción.
 */
export function detectMeniFactuality(input: FactualityInput): FactualitySignal[] {
  const signals = detectFactualitySignals(input).map(signal => {
    // El detector legado agrupa números por sustantivo sin identificar el
    // suceso, el corte temporal ni la fuente. No demuestra incompatibilidad.
    if (signal.code === 'INTERNAL_CONTRADICTION') {
      return {
        ...signal, code: 'COMPARABLE_COUNTS_REVIEW', severity: 'IMPORTANT' as const,
        desc: 'Hay cantidades diferentes de la misma clase; comprobar suceso, fuente y corte temporal. No se ha demostrado falsedad.',
      };
    }
    // Ausencia de respaldo / provenance de IA son riesgos, no prueba de error.
    return signal.severity === 'CRITICAL'
      ? { ...signal, severity: 'IMPORTANT' as const }
      : signal;
  });

  const title = norm(input.titulo || '');
  const titleScores = scores(title);
  const verb = title.match(resultVerb);
  // Identificamos el equipo protagonista desde el titular; exigimos que
  // vuelva a aparecer en la oración comparada, no en otra noticia.
  const team = verb?.index ? title.slice(0, verb.index).trim() : '';
  const sentences = plain(input.contenido).split(/(?<=[.!?])\s+|\n+/);
  if (team.length >= 3 && titleScores.length === 1 && !historical.test(title)) {
    for (const sentence of sentences) {
      const s = norm(sentence);
      const bodyScores = scores(s);
      if (!s.includes(team) || historical.test(s) || !resultVerb.test(s) || bodyScores.length === 0) continue;
      const contradictory = bodyScores.some(score => score !== titleScores[0]);
      if (!contradictory) continue;
      // La inversión 2-1 / 1-2 puede expresar el mismo resultado desde el
      // adversario. Necesita revisión, no bloqueo.
      const reversed = titleScores[0].split('-').reverse().join('-');
      const explicitAct = /\b(?:aunque|pero|sin embargo)\b.*\bacta oficial\b.*\b(?:termino|registra|registro)\b/.test(s);
      const sameSubject = s.startsWith(`${team} `);
      const demonstrated = (explicitAct || (sameSubject && !uncertainty.test(s)))
        && bodyScores.some(score => score !== titleScores[0] && score !== reversed);
      signals.push({
        code: demonstrated ? 'INTERNAL_CONTRADICTION' : 'RESULT_DISCREPANCY',
        severity: demonstrated ? 'CRITICAL' : 'IMPORTANT',
        evidence: `${input.titulo}; ${sentence}`,
        desc: demonstrated
          ? 'El titular y el relato del mismo resultado contienen marcadores incompatibles. Comparación interna; no se consultó el acta externa.'
          : 'Los marcadores asociados al protagonista difieren; comprobar evento, orden de equipos, fuente y momento.',
      });
      break;
    }
  }
  return signals;
}
