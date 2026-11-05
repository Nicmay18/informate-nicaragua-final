import type { PuntoPerdido } from './types';

/** Diagnóstico auxiliar: no altera el ADN ni suma consecuencias de una causa. */
export function dedupeCriteria(items: PuntoPerdido[]): PuntoPerdido[] {
  const key = (value: string) => {
    const normalized = value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[¿?.,:;]/g, '').trim();
    // Sinónimos explícitos del contrato. Peritajes, víctimas y estado
    // judicial se mantienen separados: no son el mismo dato.
    if (/^(que sigue(?: en la investigacion)?|siguiente paso|como continua el proceso|que haran las autoridades)$/.test(normalized)) return 'proximos pasos';
    return normalized.replace(/\s+/g, ' ');
  };
  const merged = new Map<string, PuntoPerdido>();
  for (const item of items) {
    const id = key(item.concepto);
    const existing = merged.get(id);
    if (!existing) merged.set(id, { ...item });
    else existing.puntos = Math.max(existing.puntos, item.puntos);
  }
  return [...merged.values()];
}
