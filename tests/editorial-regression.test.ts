// @vitest-environment node
import { config } from 'dotenv';
config({ path: '.env.local' });
import { test, expect } from 'vitest';
import { getLatestNews } from '../lib/db/homepage';
import { noticiaToInput } from '../lib/portada/helpers';
import { evaluate } from '../lib/editorial/core/pipeline';
import type { EvaluacionEditorial, ModuleScore } from '../lib/editorial/core/types';
import fs from 'fs/promises';
import path from 'path';

const MODULE_KEYS: (keyof EvaluacionEditorial)[] = ['seo', 'eeat', 'discover', 'adsense', 'valorEditorial', 'forense'];

function getModuleScore(r: EvaluacionEditorial, key: string): number {
  const mod = (r as any)[key] as ModuleScore | undefined;
  return mod?.score ?? 0;
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

test('Auditoría de regresión del Motor Editorial Determinístico', async () => {
  const noticias = await getLatestNews(500);
  const totalNoticias = noticias.length;
  const evaluated: { slug: string; titulo: string; result?: EvaluacionEditorial; error?: string }[] = [];

  for (const noticia of noticias) {
    try {
      const input = noticiaToInput(noticia);
      const result = evaluate(input);
      evaluated.push({ slug: noticia.slug, titulo: noticia.titulo, result });
    } catch (err) {
      evaluated.push({
        slug: noticia.slug,
        titulo: noticia.titulo,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const withResult = evaluated.filter(e => e.result !== undefined) as { slug: string; titulo: string; result: EvaluacionEditorial }[];
  const errors = evaluated.filter(e => e.error);

  // Contradicciones
  const contradictions: { slug: string; tipo: string; detalle: string }[] = [];
  const explainabilityIssues: { slug: string; problema: string }[] = [];

  for (const item of withResult) {
    const r = item.result;
    const scores: Record<string, number> = Object.fromEntries(MODULE_KEYS.map(k => [String(k).toUpperCase(), getModuleScore(r, k)]));

    if (scores.SEO >= 95 && scores.EEAT >= 95 && scores.VALOR_EDITORIAL >= 95 && scores.DISCOVER >= 95 && r.veredicto !== 'cobertura_especial') {
      contradictions.push({ slug: item.slug, tipo: 'A', detalle: `módulos >=95 pero veredicto=${r.veredicto}` });
    }

    const allHigh = Object.values(scores).every(v => v >= 95);
    if (allHigh && r.veredicto === 'no_publicar') {
      contradictions.push({ slug: item.slug, tipo: 'B', detalle: 'todos los módulos >=95 pero veredicto=no_publicar' });
    }

    for (const key of MODULE_KEYS) {
      const mod = (r as any)[key] as ModuleScore;
      if (mod.score === 100 && r.explainability.some(e => e.modulo.toUpperCase() === mod.modulo.toUpperCase() && e.puntosPerdidos > 0)) {
        contradictions.push({ slug: item.slug, tipo: 'C', detalle: `${mod.modulo}=100 con penalizaciones en explainability` });
      }
      if (mod.score < 100) {
        const lost = 100 - mod.score;
        const expItems = r.explainability.filter(e => e.modulo.toUpperCase() === mod.modulo.toUpperCase());
        const expSum = expItems.reduce((a, e) => a + e.puntosPerdidos, 0);
        if (expItems.length === 0 || Math.abs(expSum - lost) > 0.01) {
          contradictions.push({ slug: item.slug, tipo: 'D', detalle: `${mod.modulo}=${mod.score}, explainability suma ${expSum.toFixed(2)}` });
        }
      }
    }

    if (scores.FORENSE === 100 && r.evidence.forense.nivelRiesgo !== 'Bajo') {
      contradictions.push({ slug: item.slug, tipo: 'E', detalle: `forense=100 pero riesgo=${r.evidence.forense.nivelRiesgo}` });
    }

    if (r.riesgo.seguro && r.riesgo.advertencias.some((a: string) => /adsense|monetización/i.test(a))) {
      contradictions.push({ slug: item.slug, tipo: 'F', detalle: 'riesgo.seguro=true pero hay advertencia de monetización' });
    }

    if (scores.EEAT === 100 && r.veredicto === 'no_publicar') {
      contradictions.push({ slug: item.slug, tipo: 'G', detalle: 'EEAT=100 pero veredicto=no_publicar' });
    }

    // Explainability
    const seen = new Set<string>();
    for (const exp of r.explainability) {
      const signature = `${exp.modulo}|${exp.regla}|${exp.motivo}|${exp.puntosPerdidos}`;
      if (seen.has(signature)) {
        explainabilityIssues.push({ slug: item.slug, problema: `explainability duplicado: ${exp.modulo} ${exp.regla}` });
      }
      seen.add(signature);
      const mod = MODULE_KEYS.map(k => (r as any)[k] as ModuleScore).find(m => m.modulo.toUpperCase() === exp.modulo.toUpperCase());
      if (!mod) {
        explainabilityIssues.push({ slug: item.slug, problema: `módulo inexistente en explainability: ${exp.modulo}` });
        continue;
      }
      const trace = mod.trace.entries.find(e => e.regla === exp.regla && Math.abs(Math.abs(e.delta) - exp.puntosPerdidos) < 0.01);
      if (!trace) {
        explainabilityIssues.push({ slug: item.slug, problema: `sin traza: ${exp.modulo}/${exp.regla}` });
      }
    }
  }

  // Determinismo (primeras 20 noticias, 20 ejecuciones cada una)
  const determinismSample = withResult.slice(0, 20);
  const determinismIssues: { slug: string; intento: number }[] = [];
  for (const item of determinismSample) {
    const noticia = noticias.find(n => n.slug === item.slug)!;
    const input = noticiaToInput(noticia);
    const first = evaluate(input);
    const baseline = JSON.stringify({
      scoreFinal: first.scoreFinal,
      veredicto: first.veredicto,
      explainability: first.explainability,
      detalle: first.calidad.detalle,
    });
    for (let i = 2; i <= 20; i++) {
      const next = evaluate(input);
      const candidate = JSON.stringify({
        scoreFinal: next.scoreFinal,
        veredicto: next.veredicto,
        explainability: next.explainability,
        detalle: next.calidad.detalle,
      });
      if (candidate !== baseline) {
        determinismIssues.push({ slug: item.slug, intento: i });
        break;
      }
    }
  }

  // Estadísticas
  const moduleScores: Record<string, number[]> = {};
  for (const item of withResult) {
    for (const key of MODULE_KEYS) {
      const name = String(key).toUpperCase();
      moduleScores[name] = moduleScores[name] || [];
      moduleScores[name].push(getModuleScore(item.result, key));
    }
  }

  const stats: Record<string, { promedio: number; sigma: number }> = {};
  for (const [mod, vals] of Object.entries(moduleScores)) {
    const promedio = vals.reduce((a, b) => a + b, 0) / vals.length;
    stats[mod] = { promedio, sigma: stdDev(vals) };
  }

  const sorted = [...withResult].sort((a, b) => b.result.scoreFinal - a.result.scoreFinal);
  const top20 = sorted.slice(0, 20).map(e => ({ slug: e.slug, score: e.result.scoreFinal, veredicto: e.result.veredicto }));
  const bottom20 = sorted.slice(-20).map(e => ({ slug: e.slug, score: e.result.scoreFinal, veredicto: e.result.veredicto }));

  const veredictos: Record<string, number> = {};
  for (const item of withResult) veredictos[item.result.veredicto] = (veredictos[item.result.veredicto] || 0) + 1;

  const noPublicarCount = veredictos['no_publicar'] || 0;

  // Budget / baseline
  let baseline: any = null;
  let budget: any = null;
  const budgetViolations: string[] = [];
  try {
    baseline = JSON.parse(await fs.readFile(path.resolve('reports/regression-baseline.json'), 'utf8'));
  } catch {
    console.warn('No se encontró reports/regression-baseline.json. Se omite comparación con baseline.');
  }
  try {
    budget = JSON.parse(await fs.readFile(path.resolve('reports/regression-budget.json'), 'utf8'));
  } catch {
    console.warn('No se encontró reports/regression-budget.json. Se omite presupuesto de regresión.');
  }

  if (baseline && budget) {
    for (const [mod, s] of Object.entries(stats)) {
      const baselineAvg = baseline.averages[mod];
      if (baselineAvg !== undefined && baselineAvg - s.promedio > budget.moduleAverageDropThreshold) {
        budgetViolations.push(`${mod} bajó ${(baselineAvg - s.promedio).toFixed(2)} puntos (umbral ${budget.moduleAverageDropThreshold})`);
      }
    }
    const baselineNoPublicar = baseline.noPublicarCount ?? 0;
    const currentNoPublicarPct = totalNoticias > 0 ? (noPublicarCount / totalNoticias) * 100 : 0;
    const baselineNoPublicarPct = baseline.total > 0 ? (baselineNoPublicar / baseline.total) * 100 : 0;
    if (currentNoPublicarPct - baselineNoPublicarPct > budget.noPublicarIncreasePercentagePointsThreshold) {
      budgetViolations.push(`no_publicar subió de ${baselineNoPublicarPct.toFixed(2)}% a ${currentNoPublicarPct.toFixed(2)}% (umbral +${budget.noPublicarIncreasePercentagePointsThreshold} puntos porcentuales)`);
    }
  }

  // Reporte
  const lines: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  lines.push('# Editorial Engine Regression Report');
  lines.push(`**Fecha:** ${new Date().toISOString()}`);
  lines.push(`**Noticias analizadas:** ${totalNoticias}`);
  lines.push(`**Evaluaciones exitosas:** ${withResult.length}`);
  lines.push(`**Errores de ejecución:** ${errors.length}`);
  lines.push(`**Contradicciones:** ${contradictions.length}`);
  lines.push(`**Fallas determinismo:** ${determinismIssues.length}`);
  lines.push(`**Violaciones de presupuesto:** ${budgetViolations.length}`);
  lines.push('');
  lines.push('## Promedios por módulo (actual)');
  lines.push('| Módulo | Promedio | σ | vs baseline |');
  lines.push('|--------|----------|---|-------------|');
  for (const [mod, s] of Object.entries(stats)) {
    const baselineAvg = baseline?.averages?.[mod];
    const vsBaseline = baselineAvg !== undefined ? `(${s.promedio >= baselineAvg ? '+' : ''}${(s.promedio - baselineAvg).toFixed(2)})` : '';
    lines.push(`| ${mod} | ${s.promedio.toFixed(2)} | ${s.sigma.toFixed(2)} | ${vsBaseline} |`);
  }
  lines.push('');
  lines.push('## Distribución de veredictos');
  for (const [v, c] of Object.entries(veredictos).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${v}: ${c}`);
  }
  lines.push('');
  lines.push(`## Contradicciones: ${contradictions.length}`);
  for (const c of contradictions.slice(0, 20)) lines.push(`- [${c.tipo}] ${c.slug}: ${c.detalle}`);
  lines.push('');
  lines.push(`## Problemas explainability: ${explainabilityIssues.length}`);
  for (const e of explainabilityIssues.slice(0, 20)) lines.push(`- ${e.slug}: ${e.problema}`);
  lines.push('');
  lines.push(`## Fallas determinismo: ${determinismIssues.length}`);
  for (const d of determinismIssues.slice(0, 20)) lines.push(`- ${d.slug} (intento ${d.intento})`);
  lines.push('');
  lines.push(`## Violaciones de presupuesto: ${budgetViolations.length}`);
  for (const v of budgetViolations) lines.push(`- ${v}`);
  lines.push('');
  lines.push('## Top 20');
  for (const item of top20) lines.push(`- ${item.slug}: ${item.score} (${item.veredicto})`);
  lines.push('');
  lines.push('## Bottom 20');
  for (const item of bottom20) lines.push(`- ${item.slug}: ${item.score} (${item.veredicto})`);

  const outDir = path.resolve(process.cwd(), 'reports');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, `regression-${timestamp}.md`), lines.join('\n'), 'utf8');
  await fs.writeFile(path.join(outDir, 'regression-latest.json'), JSON.stringify({
    fecha: new Date().toISOString(),
    noticias: totalNoticias,
    exitosas: withResult.length,
    errores: errors.length,
    contradictions: contradictions.length,
    determinismFailures: determinismIssues.length,
    budgetViolations,
    stats,
    veredictos,
    noPublicarCount,
  }, null, 2), 'utf8');

  // Aserciones de regresión
  expect(errors, `Errores de ejecución: ${errors.map(e => e.slug).join(', ')}`).toHaveLength(0);
  expect(contradictions, `Contradiciones detectadas: ${contradictions.length}`).toHaveLength(0);
  expect(explainabilityIssues, `Problemas de explainability: ${explainabilityIssues.length}`).toHaveLength(0);
  expect(determinismIssues, `Fallas de determinismo: ${determinismIssues.length}`).toHaveLength(0);
  expect(budgetViolations, `Violaciones de presupuesto de regresión:\n${budgetViolations.join('\n')}`).toHaveLength(0);

  console.log('Regression reports saved to reports/');
  console.table(stats);
  console.log('Veredictos:', veredictos);
}, 600000);
