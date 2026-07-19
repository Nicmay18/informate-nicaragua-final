import type { ModuleScore, ExplainabilityItem } from './types';

export function buildExplainability(modules: ModuleScore[]): ExplainabilityItem[] {
  const items: ExplainabilityItem[] = [];

  for (const m of modules) {
    const recs = m.recommendations;
    let recIndex = 0;
    for (const entry of m.trace.entries) {
      if (entry.delta >= 0) continue;
      const solucion = recs[recIndex++] ?? 'Revisar';
      items.push({
        modulo: m.modulo,
        regla: entry.regla,
        parrafo: entry.motivo,
        motivo: entry.motivo,
        solucion,
        puntosPerdidos: Math.abs(entry.delta),
      });
    }
  }

  return items;
}
