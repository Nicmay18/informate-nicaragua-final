import type { EvaluacionEditorial, ModuleScore, ExplainabilityItem } from './types';

export class InvariantError extends Error {
  constructor(message: string) {
    super(`InvariantError: ${message}`);
    this.name = 'InvariantError';
  }
}

const VEREDICT_ORDER = [
  'no_publicar',
  'publicar_breve',
  'publicar_estandar',
  'publicar_destacado',
  'portada',
  'cobertura_especial',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new InvariantError(message);
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function verifyIntegrity(result: EvaluacionEditorial): void {
  const modules: ModuleScore[] = [
    result.seo,
    result.eeat,
    result.discover,
    result.adsense,
    result.valorEditorial,
    result.forense,
  ];

  // 1. Cada módulo está acotado y coincide con su traza
  for (const m of modules) {
    assert(m.score >= 0 && m.score <= 100, `${m.modulo}: score fuera de rango [0,100]`);
    assert(m.trace.start === 100, `${m.modulo}: la traza no inicia en 100`);
    assert(round(m.trace.end) === round(m.score), `${m.modulo}: trace.end no coincide con score`);
    for (const e of m.trace.entries) {
      assert(round(e.after) === round(e.before + e.delta), `${m.modulo}: delta inconsistente en ${e.regla}`);
    }
  }

  // 2. scoreFinal coincide con la suma ponderada declarada
  const weights = result.calidad.detalle;
  const weighted =
    weights.reduce((acc, d) => acc + d.score * d.peso, 0) /
    weights.reduce((acc, d) => acc + d.peso, 0);
  assert(round(result.scoreFinal) === round(weighted), 'scoreFinal no coincide con el promedio ponderado de calidad');

  // 3. scoreFinal está entre el mínimo y el máximo de los módulos de calidad
  const calidadScores = [result.seo.score, result.eeat.score, result.discover.score, result.adsense.score, result.valorEditorial.score];
  const min = Math.min(...calidadScores);
  const max = Math.max(...calidadScores);
  assert(result.scoreFinal >= min - 0.01 && result.scoreFinal <= max + 0.01, 'scoreFinal fuera del rango de módulos de calidad');

  // 4. Explainability exacto por módulo: una entrada por penalización
  const negativeEntries = modules
    .flatMap(m => m.trace.entries)
    .filter(e => e.delta < 0);
  assert(result.explainability.length === negativeEntries.length, 'explainability no tiene exactamente una entrada por penalización');

  const byModule = groupByModule(result.explainability);
  for (const m of modules) {
    const items = byModule.get(m.modulo) ?? [];
    const penalties = m.trace.entries.filter(e => e.delta < 0);
    assert(items.length === penalties.length, `${m.modulo}: explainability no cubre todas las penalizaciones`);
    const lost = sum(penalties.map(e => Math.abs(e.delta)));
    if (m.score > 0) {
      assert(round(lost) === round(100 - m.score), `${m.modulo}: suma de puntos perdidos no explica el score`);
    } else {
      assert(round(lost) >= 100, `${m.modulo}: score 0 sin suficientes penalizaciones`);
    }
  }

  // 5. Invariante de alto rendimiento
  const allHigh = calidadScores.every(s => s >= 95) && result.riesgo.seguro;
  if (allHigh) {
    const expectedMin = result.eeat.score >= 95 && result.riesgo.seguro && result.forense.score >= 95
      ? 'publicar_destacado'
      : 'publicar_estandar';
    const index = VEREDICT_ORDER.indexOf(result.veredicto as typeof VEREDICT_ORDER[number]);
    const minIndex = VEREDICT_ORDER.indexOf(expectedMin);
    assert(index >= minIndex, `invariante rota: todos los módulos >=95 y seguro=true produjeron ${result.veredicto}`);
  }

  // 6. Forense 100 implica riesgo bajo
  if (result.forense.score === 100) {
    assert(result.riesgo.advertencias.length === 0, 'Forense 100 no puede coexistir con advertencias de riesgo');
    assert(result.evidence.forense.nivelRiesgo !== 'Crítico' && result.evidence.forense.nivelRiesgo !== 'Alto', 'Forense 100 incompatible con nivel de riesgo alto/crítico');
  }

  // 7. Adsense seguro implica no hay palabras sensibles en evidencia
  if (result.riesgo.seguro) {
    assert(result.evidence.adsense.palabrasSensibles.length === 0, 'Adsense seguro con palabras sensibles en evidencia');
  }
}

function groupByModule(items: ExplainabilityItem[]): Map<string, ExplainabilityItem[]> {
  const map = new Map<string, ExplainabilityItem[]>();
  for (const item of items) {
    const list = map.get(item.modulo) ?? [];
    list.push(item);
    map.set(item.modulo, list);
  }
  return map;
}
