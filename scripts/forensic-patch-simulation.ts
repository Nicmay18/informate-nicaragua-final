/**
 * FORENSIC PATCH SIMULATION — READ ONLY
 * Simula qué produciría el pipeline con el código parchado,
 * cargando datos reales de Firestore pero SIN escribir nada.
 *
 * Uso: npx tsx scripts/forensic-patch-simulation.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { getAdminDb } = await import('@/lib/firebase-admin');
  const { loadNoticiasFromFirestore, mergeArticleData } = await import('@/lib/nios/intelligence/data-merger');
  const { generateGoogleTrustReport, generateThinContentReport } = await import('@/lib/nios/intelligence/google-trust');
  const { generateAdSenseRecoveryFullReport } = await import('@/lib/nios/intelligence/adsense-recovery-report');

  const db = getAdminDb();

  console.log('\n' + '='.repeat(80));
  console.log('  FORENSIC PATCH SIMULATION — READ ONLY (no escribe Firestore)');
  console.log('  Simula el pipeline con código PATCHED sobre datos reales');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. Cargar noticias reales desde Firestore (con código parchado)
  // ═══════════════════════════════════════════════════════════════
  console.log('>>> Cargando noticias desde Firestore con código PATCHED...');
  const noticias = await loadNoticiasFromFirestore(db);
  console.log(`   Total noticias cargadas: ${noticias.length}`);

  // Verificar scoreCalidad después de load
  const hasScoreCalidad = noticias.filter(n => n.scoreCalidad !== undefined).length;
  const noScoreCalidad = noticias.filter(n => n.scoreCalidad === undefined).length;
  console.log(`   Con scoreCalidad definido: ${hasScoreCalidad}`);
  console.log(`   Sin scoreCalidad (undefined): ${noScoreCalidad}`);

  // ═══════════════════════════════════════════════════════════════
  // 2. Merge con código parchado (scoreCalidad ?? null)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n>>> Ejecutando mergeArticleData con código PATCHED...');
  const articles = mergeArticleData(noticias, null, null, null, new Map(), new Map());
  console.log(`   Artículos fusionados: ${articles.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 3. SCOREMENI — TRES ESTADOS REALES (POST-PATCH)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  SCOREMENI — TRES ESTADOS (SIMULACIÓN POST-PATCH)');
  console.log('─'.repeat(60));

  const nullCount = articles.filter(a => a.scoreMeni === null).length;
  const zeroCount = articles.filter(a => a.scoreMeni === 0).length;
  const positiveCount = articles.filter(a => a.scoreMeni !== null && a.scoreMeni > 0).length;

  console.log(`  scoreMeni = null:  ${nullCount} artículos ← (antes eran 0 con código antiguo)`);
  console.log(`  scoreMeni = 0:     ${zeroCount} artículos`);
  console.log(`  scoreMeni > 0:     ${positiveCount} artículos`);

  // Muestra de scoreMeni > 0
  if (positiveCount > 0) {
    const positiveSamples = articles
      .filter(a => a.scoreMeni !== null && a.scoreMeni > 0)
      .slice(0, 5)
      .map(a => `    ${a.slug} → scoreMeni=${a.scoreMeni}, palabras=${a.palabras}`);
    console.log('\n  Muestra scoreMeni > 0:');
    positiveSamples.forEach(s => console.log(s));
  }

  // Muestra de scoreMeni = null (debería ser los 208 que antes eran 0)
  if (nullCount > 0) {
    const nullSamples = articles
      .filter(a => a.scoreMeni === null)
      .slice(0, 5)
      .map(a => `    ${a.slug} → scoreMeni=null, palabras=${a.palabras}`);
    console.log('\n  Muestra scoreMeni = null (NUEVO con patch):');
    nullSamples.forEach(s => console.log(s));
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. GOOGLE TRUST — POST-PATCH
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  GOOGLE TRUST REPORT (SIMULACIÓN POST-PATCH)');
  console.log('─'.repeat(60));

  const trust = generateGoogleTrustReport(articles);
  console.log(`  Total artículos:       ${trust.totalArticles}`);
  console.log(`  Trust Score promedio:  ${trust.averageGoogleTrustScore}/100`);
  console.log(`  Riesgo alto:           ${trust.highRiskArticles}`);
  console.log(`  Riesgo medio:          ${trust.mediumRiskArticles}`);
  console.log(`  Riesgo bajo:           ${trust.lowRiskArticles}`);
  console.log(`  Thin content:          ${trust.thinContentCount}`);
  console.log(`  Duplicate risk:        ${trust.duplicateRiskCount}`);
  console.log(`  Sin autor:             ${trust.articlesWithoutAuthor}`);
  console.log(`  Sin fuentes:           ${trust.articlesWithoutSources}`);
  console.log(`  Low Google (<10 imp):  ${trust.articlesWithLowGoogle}`);
  console.log(`  MENI≥90 sin impres.:   ${trust.articlesHighMeniZeroImpressions}`);
  console.log(`  MENI<80 con tráfico:   ${trust.articlesLowMeniHighImpressions}`);

  // ═══════════════════════════════════════════════════════════════
  // 5. THIN CONTENT — DESCOMPOSICIÓN POR FLAGS (POST-PATCH)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  THIN CONTENT — DESCOMPOSICIÓN POR FLAGS (POST-PATCH)');
  console.log('─'.repeat(60));

  const thinArticles = generateThinContentReport(articles);
  console.log(`  Total thin: ${thinArticles.length} de ${articles.length}`);

  // Contar cada flag
  const flagCounts: Record<string, number> = {};
  for (const a of thinArticles) {
    for (const reason of a.reasons) {
      let flag: string;
      if (reason.includes('Menos de 400')) flag = 'palabras < 400';
      else if (reason.includes('muy corto')) flag = 'palabras < 200 (posible duplicado)';
      else if (reason.includes('pocos tags')) flag = 'tags < 2';
      else if (reason.includes('enlaces internos')) flag = 'relatedLinksCount < 1';
      else if (reason.includes('autor')) flag = 'sin autor';
      else if (reason.includes('MENI bajo')) flag = 'scoreMeni < 80 + 0 impresiones';
      else flag = reason;
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    }
  }

  console.log('\n  Tabla de causas:');
  console.log('  ' + '-'.repeat(56));
  console.log(`  ${'Flag'.padEnd(40)} ${'Artículos'.padStart(8)} ${'% corpus'.padStart(8)}`);
  console.log('  ' + '-'.repeat(56));
  for (const [flag, count] of Object.entries(flagCounts).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / articles.length) * 100).toFixed(1);
    console.log(`  ${flag.padEnd(40)} ${String(count).padStart(8)} ${pct.padStart(7)}%`);
  }
  console.log('  ' + '-'.repeat(56));

  // Distribución por número de flags
  const oneFlag = thinArticles.filter(a => a.reasons.length === 1).length;
  const twoFlags = thinArticles.filter(a => a.reasons.length === 2).length;
  const threePlus = thinArticles.filter(a => a.reasons.length >= 3).length;
  console.log(`\n  Distribución por número de flags:`);
  console.log(`    1 flag:  ${oneFlag}`);
  console.log(`    2 flags: ${twoFlags}`);
  console.log(`    3+ flags: ${threePlus}`);

  // ═══════════════════════════════════════════════════════════════
  // 6. DUPLICATE RISK — POST-PATCH
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  DUPLICATE RISK (POST-PATCH)');
  console.log('─'.repeat(60));

  const dupByCond1 = articles.filter(a => a.palabras < 200 && a.gscImpressions === 0);
  const dupByCond2 = articles.filter(a => a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60);
  const dupRiskArticles = articles.filter(a => {
    if (a.palabras < 200 && a.gscImpressions === 0) return true;
    if (a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60) return true;
    return false;
  });

  console.log(`  Total duplicate risk: ${dupRiskArticles.length}`);
  console.log(`  Por condición 1 (palabras<200 + gscImp=0): ${dupByCond1.length}`);
  console.log(`  Por condición 2 (scoreMeni<60, no null):   ${dupByCond2.length}`);

  if (dupRiskArticles.length > 0 && dupRiskArticles.length <= 20) {
    console.log('\n  >>> TODOS los duplicate risk:');
    for (const a of dupRiskArticles) {
      const cond1 = a.palabras < 200 && a.gscImpressions === 0;
      const cond2 = a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60;
      console.log(`    ${a.slug}: palabras=${a.palabras}, scoreMeni=${a.scoreMeni}, gscImp=${a.gscImpressions} [cond1=${cond1}, cond2=${cond2}]`);
    }
  } else if (dupRiskArticles.length > 20) {
    console.log('\n  >>> Muestra (primeros 10):');
    for (const a of dupRiskArticles.slice(0, 10)) {
      const cond1 = a.palabras < 200 && a.gscImpressions === 0;
      const cond2 = a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60;
      console.log(`    ${a.slug}: palabras=${a.palabras}, scoreMeni=${a.scoreMeni}, gscImp=${a.gscImpressions} [cond1=${cond1}, cond2=${cond2}]`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. MENI PROMEDIO — POST-PATCH
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  MENI PROMEDIO (POST-PATCH)');
  console.log('─'.repeat(60));

  const meniScores = articles
    .map(a => a.scoreMeni)
    .filter((s): s is number => s !== null);
  const meniAvg = meniScores.length > 0
    ? Math.round(meniScores.reduce((s, v) => s + v, 0) / meniScores.length)
    : null;

  console.log(`  Artículos con scoreMeni real (no null): ${meniScores.length}`);
  console.log(`  Artículos con scoreMeni null:            ${nullCount}`);
  console.log(`  MENI promedio: ${meniAvg !== null ? `${meniAvg}/100` : 'N/A (sin scores reales)'}`);

  if (meniScores.length > 0) {
    console.log(`  Scores reales: min=${Math.min(...meniScores)}, max=${Math.max(...meniScores)}, count=${meniScores.length}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. PRUEBA CRÍTICA — 400+ PALABRAS, scoreMeni=null, gscImp=0
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  PRUEBA CRÍTICA — palabras>=400, scoreMeni=null, gscImp=0');
  console.log('─'.repeat(60));

  const criticalTest = articles.filter(a =>
    a.palabras >= 400 && a.scoreMeni === null && a.gscImpressions === 0
  );
  console.log(`  Artículos que cumplen criterio: ${criticalTest.length}`);

  const criticalThin = criticalTest.filter(a => thinArticles.some(t => t.slug === a.slug));
  const criticalNonThin = criticalTest.filter(a => !thinArticles.some(t => t.slug === a.slug));
  console.log(`  De esos, son thin: ${criticalThin.length}`);
  console.log(`  De esos, NO son thin: ${criticalNonThin.length}`);

  if (criticalThin.length > 0) {
    console.log('\n  >>> Muestra thin (hasta 5):');
    for (const a of criticalThin.slice(0, 5)) {
      const thinData = thinArticles.find(t => t.slug === a.slug)!;
      console.log(`    ${a.slug}: ${a.palabras} palabras, flags: ${thinData.reasons.join(' | ')}`);
    }
  }

  if (criticalNonThin.length > 0) {
    console.log(`\n  >>> NO thin: ${criticalNonThin.length} artículos (bug eliminado)`);
    console.log(`      Estos artículos ya NO son thin por scoreMeni porque scoreMeni=null (no evaluado)`);
    for (const a of criticalNonThin.slice(0, 5)) {
      console.log(`    ${a.slug}: ${a.palabras} palabras, scoreMeni=${a.scoreMeni} → NO thin`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. MUESTRA FORENSE — 5 THIN, 5 NO-THIN, 5 NULL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  MUESTRA FORENSE (POST-PATCH)');
  console.log('─'.repeat(60));

  // 5 thin
  console.log('\n  >>> 5 artículos THIN:');
  for (const a of thinArticles.slice(0, 5)) {
    const article = articles.find(x => x.slug === a.slug)!;
    console.log(`    slug: ${a.slug}`);
    console.log(`    título: ${article?.titulo?.substring(0, 60) || 'N/A'}`);
    console.log(`    palabras: ${a.palabras}, scoreMeni: ${a.scoreMeni}, gscImp: ${a.gscImpressions}`);
    console.log(`    tags: ${article?.tags?.length || 0}, relatedLinks: ${article?.relatedLinksCount || 0}, autor: ${article?.autor || 'N/A'}`);
    console.log(`    flags: ${a.reasons.join(' | ')}`);
    console.log('');
  }

  // 5 non-thin
  console.log('  >>> 5 artículos NO THIN:');
  const nonThin = articles.filter(a => !thinArticles.some(t => t.slug === a.slug)).slice(0, 5);
  for (const a of nonThin) {
    console.log(`    slug: ${a.slug}`);
    console.log(`    título: ${a.titulo?.substring(0, 60) || 'N/A'}`);
    console.log(`    palabras: ${a.palabras}, scoreMeni: ${a.scoreMeni}, gscImp: ${a.gscImpressions}`);
    console.log(`    tags: ${a.tags?.length || 0}, relatedLinks: ${a.relatedLinksCount || 0}, autor: ${a.autor || 'N/A'}`);
    console.log('');
  }

  // 5 scoreMeni = null
  console.log('  >>> 5 artículos scoreMeni = null:');
  const nullArticles = articles.filter(a => a.scoreMeni === null).slice(0, 5);
  for (const a of nullArticles) {
    const isThin = thinArticles.some(t => t.slug === a.slug);
    const thinData = thinArticles.find(t => t.slug === a.slug);
    console.log(`    slug: ${a.slug}`);
    console.log(`    título: ${a.titulo?.substring(0, 60) || 'N/A'}`);
    console.log(`    palabras: ${a.palabras}, gscImp: ${a.gscImpressions}`);
    console.log(`    tags: ${a.tags?.length || 0}, relatedLinks: ${a.relatedLinksCount || 0}, autor: ${a.autor || 'N/A'}`);
    console.log(`    isThin: ${isThin}${thinData ? `, flags: ${thinData.reasons.join(' | ')}` : ', flags: NINGUNO'}`);
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. ADSENSE RECOVERY — POST-PATCH
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('  ADSENSE RECOVERY (POST-PATCH)');
  console.log('─'.repeat(60));

  const adsense = await generateAdSenseRecoveryFullReport(articles, null);
  console.log(`  AdSense Trust Score: ${adsense.trustCheck?.adSenseTrustScore || 'N/A'}/100`);
  console.log(`  Ready to reapply: ${adsense.readyToReapply}`);
  console.log(`  URLs afectando: ${adsense.topAffectingUrls?.length || 0}`);
  console.log(`  Razón probable: ${adsense.likelyRejectionReason?.substring(0, 120) || 'N/A'}`);

  if (adsense.contentRecovery) {
    console.log(`  Content Recovery:`);
    console.log(`    Total: ${adsense.contentRecovery.totalArticles}`);
    console.log(`    Green: ${adsense.contentRecovery.greenCount} (${adsense.contentRecovery.greenPct}%)`);
    console.log(`    Yellow: ${adsense.contentRecovery.yellowCount} (${adsense.contentRecovery.yellowPct}%)`);
    console.log(`    Red: ${adsense.contentRecovery.redCount} (${adsense.contentRecovery.redPct}%)`);
    console.log(`    Avg Recovery Score: ${adsense.contentRecovery.avgRecoveryScore}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. COMPARACIÓN ANTES vs DESPUÉS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  COMPARACIÓN ANTES vs DESPUÉS (SIMULADO)');
  console.log('='.repeat(80));
  console.log(`  ${'Métrica'.padEnd(30)} ${'ANTES (snapshot)'.padStart(18)} ${'DESPUÉS (sim)'.padStart(18)} ${'Cambio'.padStart(12)}`);
  console.log('  ' + '-'.repeat(78));

  const comparisons = [
    ['scoreMeni = null', '0', String(nullCount), `+${nullCount}`],
    ['scoreMeni = 0', '208', String(zeroCount), `${zeroCount - 208 > 0 ? '+' : ''}${zeroCount - 208}`],
    ['scoreMeni > 0', '67', String(positiveCount), `${positiveCount - 67 > 0 ? '+' : ''}${positiveCount - 67}`],
    ['Thin Content', '275', String(trust.thinContentCount), `${trust.thinContentCount - 275 > 0 ? '+' : ''}${trust.thinContentCount - 275}`],
    ['Duplicate Risk', '208', String(trust.duplicateRiskCount), `${trust.duplicateRiskCount - 208 > 0 ? '+' : ''}${trust.duplicateRiskCount - 208}`],
    ['Google Trust', '27/100', `${trust.averageGoogleTrustScore}/100`, `${trust.averageGoogleTrustScore - 27 > 0 ? '+' : ''}${trust.averageGoogleTrustScore - 27}`],
    ['MENI Promedio', '23/100', meniAvg !== null ? `${meniAvg}/100` : 'N/A', meniAvg !== null ? `${meniAvg - 23 > 0 ? '+' : ''}${meniAvg - 23}` : 'N/A'],
    ['Riesgo alto', '275', String(trust.highRiskArticles), `${trust.highRiskArticles - 275 > 0 ? '+' : ''}${trust.highRiskArticles - 275}`],
    ['Sin autor', '0', String(trust.articlesWithoutAuthor), `${trust.articlesWithoutAuthor - 0 > 0 ? '+' : ''}${trust.articlesWithoutAuthor}`],
  ];

  for (const [metric, before, after, change] of comparisons) {
    console.log(`  ${metric.padEnd(30)} ${before.padStart(18)} ${after.padStart(18)} ${change.padStart(12)}`);
  }
  console.log('  ' + '-'.repeat(78));
  console.log('='.repeat(80) + '\n');
}

main().catch((e) => {
  console.error('ERROR FATAL:', e);
  process.exit(1);
});
