/**
 * Balance Analyzer — Inteligencia de Portada
 * ============================================
 * Analiza el equilibrio editorial: categorías, frescura, geografía, autores.
 */

import type { Noticia } from '@/lib/types';
import type { BalanceReport, StrategyConfig } from './types';
import { EXPECTED_CATEGORIES, DEPARTAMENTOS_NICARAGUA } from './types';

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val !== null && 'toDate' in val) {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function analyzeBalance(
  portadaArticles: Noticia[],
  config: StrategyConfig,
): BalanceReport {
  const total = portadaArticles.length || 1;

  // ─── Categorías ───
  const categoryDistribution: Record<string, number> = {};
  for (const a of portadaArticles) {
    const cat = a.categoria || 'General';
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  }

  const presentCategories = Object.keys(categoryDistribution);
  const missing = EXPECTED_CATEGORIES.filter((c) => !presentCategories.includes(c));

  const overrepresented: string[] = [];
  const underrepresented: string[] = [];

  for (const cat of EXPECTED_CATEGORIES) {
    const count = categoryDistribution[cat] || 0;
    const target = config.targetCategoryDistribution[cat] || 5;
    const actualPct = (count / total) * 100;
    if (count > 0 && actualPct > target * 1.5) {
      overrepresented.push(cat);
    }
    if (actualPct < target * 0.3 && count === 0) {
      underrepresented.push(cat);
    }
  }

  // Diversidad de categorías (Shannon entropy normalizada)
  const categoryEntropy = presentCategories.length > 0
    ? presentCategories.reduce((entropy, cat) => {
        const p = (categoryDistribution[cat] || 0) / total;
        return entropy - (p > 0 ? p * Math.log2(p) : 0);
      }, 0)
    : 0;
  const maxEntropy = Math.log2(EXPECTED_CATEGORIES.length);
  const categoryDiversity = Math.round((categoryEntropy / maxEntropy) * 100);

  // ─── Frescura ───
  const now = Date.now();
  let totalAgeHours = 0;
  let staleCount = 0;

  for (const a of portadaArticles) {
    const fecha = parseDate(a.fecha);
    if (fecha) {
      const ageHours = (now - fecha.getTime()) / (1000 * 60 * 60);
      totalAgeHours += ageHours;
      if (ageHours > config.freshnessThresholdHours) staleCount++;
    }
  }

  const avgFreshnessHours = Math.round(totalAgeHours / total);

  // ─── Geografía ───
  const departamentos: string[] = [];
  for (const a of portadaArticles) {
    const dep = (a as unknown as Record<string, unknown>).departamento as string | undefined;
    if (dep && !departamentos.includes(dep)) departamentos.push(dep);
  }
  const departamentosAusentes = DEPARTAMENTOS_NICARAGUA.filter(
    (d) => !departamentos.includes(d),
  );
  const geoDiversity = Math.round((departamentos.length / DEPARTAMENTOS_NICARAGUA.length) * 100);

  // ─── Autores ───
  const authorCounts: Record<string, number> = {};
  for (const a of portadaArticles) {
    const autor = a.autor || 'Sin autor';
    authorCounts[autor] = (authorCounts[autor] || 0) + 1;
  }
  const autores = Object.keys(authorCounts);
  const maxAuthorCount = Math.max(...Object.values(authorCounts), 0);
  const maxAuthorConcentration = Math.round((maxAuthorCount / total) * 100);
  const authorDiversity = autores.length > 0
    ? Math.round((autores.length / total) * 100)
    : 0;

  // ─── Score general ───
  const w = config.balanceWeights;
  const freshnessScore = Math.max(0, 100 - (avgFreshnessHours / config.freshnessThresholdHours) * 50);

  const balanceScore = Math.round(
    categoryDiversity * w.categoryDiversity +
    geoDiversity * w.geoDiversity +
    authorDiversity * w.authorDiversity +
    freshnessScore * w.freshness,
  );

  let estado: 'EQUILIBRADO' | 'DESEQUILIBRADO' | 'CRITICO' = 'EQUILIBRADO';
  if (balanceScore < 40 || overrepresented.length > 2 || maxAuthorConcentration > 60) {
    estado = 'CRITICO';
  } else if (balanceScore < 70 || overrepresented.length > 0 || staleCount > total * 0.3) {
    estado = 'DESEQUILIBRADO';
  }

  return {
    categoryDiversity,
    categoryDistribution,
    overrepresented,
    underrepresented,
    missing,
    avgFreshnessHours,
    staleInPortada: staleCount,
    geoDiversity,
    departamentos,
    departamentosAusentes,
    authorDiversity,
    autores,
    maxAuthorConcentration,
    balanceScore,
    estado,
  };
}
