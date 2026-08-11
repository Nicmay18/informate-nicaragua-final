/**
 * FORENSIC POST-PATCH AUDIT — READ ONLY
 * ======================================
 * Extrae valores REALES de Firestore después del patch scoreMeni null vs 0.
 * NO modifica datos. NO ejecuta pipeline. NO escribe Firestore.
 * Solo lee y reporta.
 *
 * Uso: npx tsx scripts/forensic-post-patch-audit.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.local ANTES de importar firebase-admin
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { getAdminDb } = await import('@/lib/firebase-admin');
  const { getLatestSnapshot, getHistoricalSnapshots } = await import('@/lib/nios/intelligence/store');
  const { generateGoogleTrustReport, generateThinContentReport } = await import('@/lib/nios/intelligence/google-trust');
  const { generateAdSenseRecoveryFullReport } = await import('@/lib/nios/intelligence/adsense-recovery-report');
  const { generateContentRecoveryReport } = await import('@/lib/nios/intelligence/content-recovery');

  const db = getAdminDb();

  console.log('\n' + '='.repeat(80));
  console.log('  NIOS POST-PATCH FORENSIC AUDIT — READ ONLY');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. OBTENER SNAPSHOT MÁS RECIENTE
  // ═══════════════════════════════════════════════════════════════
  console.log('>>> Obteniendo snapshot más reciente...');
  const snapshot = await getLatestSnapshot(db);

  if (!snapshot) {
    console.log('❌ No hay snapshots disponibles en Firestore.');
    console.log('    Ejecuta el pipeline NIOS primero (POST /api/admin/nios-collect).');
    return;
  }

  const articles = snapshot.articlesFused || [];
  console.log(`✅ Snapshot encontrado: ${snapshot.date}`);
  console.log(`   Artículos fusionados: ${articles.length}`);
  console.log(`   GSC disponible: ${!!snapshot.gsc}`);
  console.log(`   GA4 disponible: ${!!snapshot.ga4}`);
  console.log(`   Trust reporte guardado: ${!!snapshot.trust}`);
  console.log(`   AdSense reporte guardado: ${!!snapshot.adSenseRecoveryFullReport}`);

  // ═══════════════════════════════════════════════════════════════
  // 2. SCOREMENI — TRES ESTADOS REALES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 2: SCOREMENI — TRES ESTADOS REALES');
  console.log('─'.repeat(60));

  const nullCount = articles.filter(a => a.scoreMeni === null).length;
  const zeroCount = articles.filter(a => a.scoreMeni === 0).length;
  const positiveCount = articles.filter(a => a.scoreMeni !== null && a.scoreMeni > 0).length;
  const undefinedCount = articles.filter(a => a.scoreMeni === undefined).length;

  console.log(`  scoreMeni = null:     ${nullCount} artículos`);
  console.log(`  scoreMeni = 0:        ${zeroCount} artículos`);
  console.log(`  scoreMeni > 0:        ${positiveCount} artículos`);
  console.log(`  scoreMeni = undefined: ${undefinedCount} artículos (debería ser 0)`);

  // Muestra de scoreMeni > 0 si existen
  if (positiveCount > 0) {
    const positiveSamples = articles
      .filter(a => a.scoreMeni !== null && a.scoreMeni > 0)
      .slice(0, 5)
      .map(a => `    ${a.slug} → scoreMeni=${a.scoreMeni}`);
    console.log('\n  Muestra scoreMeni > 0:');
    positiveSamples.forEach(s => console.log(s));
  }

  // Muestra de scoreMeni = 0 si existen
  if (zeroCount > 0) {
    const zeroSamples = articles
      .filter(a => a.scoreMeni === 0)
      .slice(0, 5)
      .map(a => `    ${a.slug} → scoreMeni=0`);
    console.log('\n  Muestra scoreMeni = 0 (real):');
    zeroSamples.forEach(s => console.log(s));
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. GOOGLE TRUST REPORT — RECALCULAR SOBRE DATOS REALES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 3: GOOGLE TRUST REPORT (recalculado sobre datos reales)');
  console.log('─'.repeat(60));

  const trust = generateGoogleTrustReport(articles);
  console.log(`  Total artículos:      ${trust.totalArticles}`);
  console.log(`  Trust Score promedio: ${trust.averageGoogleTrustScore}/100`);
  console.log(`  Riesgo alto:          ${trust.highRiskArticles}`);
  console.log(`  Riesgo medio:         ${trust.mediumRiskArticles}`);
  console.log(`  Riesgo bajo:          ${trust.lowRiskArticles}`);
  console.log(`  Thin content:         ${trust.thinContentCount}`);
  console.log(`  Duplicate risk:       ${trust.duplicateRiskCount}`);
  console.log(`  Sin autor:            ${trust.articlesWithoutAuthor}`);
  console.log(`  Sin fuentes:          ${trust.articlesWithoutSources}`);
  console.log(`  Low Google (<10 imp): ${trust.articlesWithLowGoogle}`);
  console.log(`  MENI≥90 sin impres.:  ${trust.articlesHighMeniZeroImpressions}`);
  console.log(`  MENI<80 con tráfico:  ${trust.articlesLowMeniHighImpressions}`);

  // ═══════════════════════════════════════════════════════════════
  // 4. THIN CONTENT — DESCOMPOSICIÓN POR FLAGS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 4: THIN CONTENT — DESCOMPOSICIÓN POR FLAGS');
  console.log('─'.repeat(60));

  const thinArticles = generateThinContentReport(articles);
  console.log(`  Total thin: ${thinArticles.length} de ${articles.length}`);

  // Contar cada flag
  const flagCounts: Record<string, number> = {};
  for (const a of thinArticles) {
    for (const reason of a.reasons) {
      // Normalizar el flag
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

  // Artículos con 1, 2, 3+ flags
  const oneFlag = thinArticles.filter(a => a.reasons.length === 1).length;
  const twoFlags = thinArticles.filter(a => a.reasons.length === 2).length;
  const threePlus = thinArticles.filter(a => a.reasons.length >= 3).length;
  console.log(`\n  Distribución por número de flags:`);
  console.log(`    1 flag:  ${oneFlag}`);
  console.log(`    2 flags: ${twoFlags}`);
  console.log(`    3+ flags: ${threePlus}`);

  // ═══════════════════════════════════════════════════════════════
  // 5. MUESTRA FORENSE — 5 THIN, 5 NO-THIN, 5 NULL, TODOS scoreMeni=0
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 5: MUESTRA FORENSE');
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
    console.log(`    isThin: ${isThin}${thinData ? `, flags: ${thinData.reasons.join(' | ')}` : ''}`);
    console.log('');
  }

  // Todos scoreMeni = 0
  if (zeroCount > 0) {
    console.log(`  >>> TODOS los artículos scoreMeni = 0 (${zeroCount} total):`);
    for (const a of articles.filter(a => a.scoreMeni === 0)) {
      const isThin = thinArticles.some(t => t.slug === a.slug);
      const thinData = thinArticles.find(t => t.slug === a.slug);
      console.log(`    slug: ${a.slug}`);
      console.log(`    título: ${a.titulo?.substring(0, 60) || 'N/A'}`);
      console.log(`    palabras: ${a.palabras}, gscImp: ${a.gscImpressions}`);
      console.log(`    isThin: ${isThin}${thinData ? `, flags: ${thinData.reasons.join(' | ')}` : ''}`);
      console.log('');
    }
  } else {
    console.log('  >>> scoreMeni = 0: DATOS NO DISPONIBLES (0 artículos con scoreMeni=0 real)');
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. PRUEBA CRÍTICA — 400+ PALABRAS, scoreMeni=null, gscImp=0
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('  FASE 6: PRUEBA CRÍTICA — palabras>=400, scoreMeni=null, gscImp=0');
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
    console.log('\n  >>> Muestra thin (hasta 3):');
    for (const a of criticalThin.slice(0, 3)) {
      const thinData = thinArticles.find(t => t.slug === a.slug)!;
      console.log(`    ${a.slug}: ${a.palabras} palabras, flags: ${thinData.reasons.join(' | ')}`);
    }
  }

  if (criticalNonThin.length > 0) {
    console.log('\n  >>> Muestra NO thin (hasta 3):');
    for (const a of criticalNonThin.slice(0, 3)) {
      console.log(`    ${a.slug}: ${a.palabras} palabras, scoreMeni=${a.scoreMeni} → NO thin (bug eliminado)`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. DUPLICATE RISK — ANÁLISIS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 7: DUPLICATE RISK — ANÁLISIS');
  console.log('─'.repeat(60));

  const dupRiskArticles = articles.filter(a => {
    // Replicar detectDuplicateRisk
    if (a.palabras < 200 && a.gscImpressions === 0) return true;
    if (a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60) return true;
    return false;
  });

  const dupByCond1 = articles.filter(a => a.palabras < 200 && a.gscImpressions === 0);
  const dupByCond2 = articles.filter(a => a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60);

  console.log(`  Total duplicate risk: ${dupRiskArticles.length}`);
  console.log(`  Por condición 1 (palabras<200 + gscImp=0): ${dupByCond1.length}`);
  console.log(`  Por condición 2 (scoreMeni<60, no null):   ${dupByCond2.length}`);
  console.log(`  Por ambas condiciones:                     ${dupByCond1.filter(a => dupByCond2.some(b => b.slug === a.slug)).length}`);

  if (dupRiskArticles.length > 0) {
    console.log('\n  >>> Muestra (hasta 5):');
    for (const a of dupRiskArticles.slice(0, 5)) {
      const cond1 = a.palabras < 200 && a.gscImpressions === 0;
      const cond2 = a.palabras > 0 && a.scoreMeni !== null && a.scoreMeni < 60;
      console.log(`    ${a.slug}: palabras=${a.palabras}, scoreMeni=${a.scoreMeni}, gscImp=${a.gscImpressions} [cond1=${cond1}, cond2=${cond2}]`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. MENI PROMEDIO
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 8: MENI PROMEDIO');
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

  // ═══════════════════════════════════════════════════════════════
  // 9. ADSENSE RECOVERY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 9: ADSENSE RECOVERY');
  console.log('─'.repeat(60));

  // Usar el reporte guardado en el snapshot si existe
  if (snapshot.adSenseRecoveryFullReport) {
    const adsense = snapshot.adSenseRecoveryFullReport;
    console.log(`  AdSense Trust Score: ${adsense.trustCheck?.adSenseTrustScore || 'N/A'}/100`);
    console.log(`  Ready to reapply: ${adsense.readyToReapply}`);
    console.log(`  URLs afectando: ${adsense.topAffectingUrls?.length || 0}`);
    console.log(`  Razón probable: ${adsense.likelyRejectionReason?.substring(0, 100) || 'N/A'}`);

    if (adsense.contentRecovery) {
      console.log(`  Content Recovery:`);
      console.log(`    Total: ${adsense.contentRecovery.totalArticles}`);
      console.log(`    Green: ${adsense.contentRecovery.greenCount} (${adsense.contentRecovery.greenPct}%)`);
      console.log(`    Yellow: ${adsense.contentRecovery.yellowCount} (${adsense.contentRecovery.yellowPct}%)`);
      console.log(`    Red: ${adsense.contentRecovery.redCount} (${adsense.contentRecovery.redPct}%)`);
      console.log(`    Avg Recovery Score: ${adsense.contentRecovery.avgRecoveryScore}`);
    }
  } else {
    // Recalcular
    console.log('  Reporte guardado no disponible. Recalculando...');
    const adsense = await generateAdSenseRecoveryFullReport(
      articles,
      snapshot.ga4 ? {
        totalUsers: snapshot.ga4.totalUsers,
        averageEngagementTimeSec: snapshot.ga4.averageEngagementTimeSec,
        devices: snapshot.ga4.devices,
      } : null,
    );
    console.log(`  AdSense Trust Score: ${adsense.trustCheck?.adSenseTrustScore || 'N/A'}/100`);
    console.log(`  Ready to reapply: ${adsense.readyToReapply}`);
    console.log(`  URLs afectando: ${adsense.topAffectingUrls?.length || 0}`);
    console.log(`  Razón probable: ${adsense.likelyRejectionReason?.substring(0, 100) || 'N/A'}`);

    if (adsense.contentRecovery) {
      console.log(`  Content Recovery:`);
      console.log(`    Total: ${adsense.contentRecovery.totalArticles}`);
      console.log(`    Green: ${adsense.contentRecovery.greenCount} (${adsense.contentRecovery.greenPct}%)`);
      console.log(`    Yellow: ${adsense.contentRecovery.yellowCount} (${adsense.contentRecovery.yellowPct}%)`);
      console.log(`    Red: ${adsense.contentRecovery.redCount} (${adsense.contentRecovery.redPct}%)`);
      console.log(`    Avg Recovery Score: ${adsense.contentRecovery.avgRecoveryScore}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. TRAFFIC
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 10: TRAFFIC INTELLIGENCE');
  console.log('─'.repeat(60));

  if (snapshot.trafficPerformance) {
    const traffic = snapshot.trafficPerformance;
    const totalViews = Object.values(traffic.dailyGrowth || {}).reduce((a, b) => a + b, 0);
    console.log(`  Visitas 7 días: ${totalViews}`);
    console.log(`  Artículos top: ${traffic.topArticles?.length || 0}`);
    console.log(`  Fuentes: ${Object.keys(traffic.topSources || {}).length}`);
    console.log(`  Daily growth: ${JSON.stringify(traffic.dailyGrowth)}`);
  } else {
    console.log('  Traffic Performance: NO DISPONIBLE en snapshot');
  }

  // Verificar traffic_daily collection directamente
  try {
    const today = new Date().toISOString().split('T')[0];
    const trafficDailySnap = await db.collection('traffic_daily').doc(today).collection('articles').limit(1).get();
    console.log(`  traffic_daily (${today}): ${trafficDailySnap.size} documentos`);

    // Verificar últimos 7 días
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const snap = await db.collection('traffic_daily').doc(d).collection('articles').limit(1).get();
      if (snap.size > 0) {
        const fullSnap = await db.collection('traffic_daily').doc(d).collection('articles').get();
        const views = fullSnap.docs.reduce((s, doc) => s + (doc.data().views || 0), 0);
        console.log(`    ${d}: ${fullSnap.size} artículos, ${views} vistas`);
      } else {
        console.log(`    ${d}: 0 artículos (vacío)`);
      }
    }
  } catch (err) {
    console.log(`  Error leyendo traffic_daily: ${err}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. SNAPSHOT HISTORY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 11: SNAPSHOT HISTORY');
  console.log('─'.repeat(60));

  const historical = await getHistoricalSnapshots(db, 14);
  console.log(`  Snapshots disponibles (14 días): ${historical.length}`);
  console.log('\n  ' + '-'.repeat(56));
  console.log(`  ${'Fecha'.padEnd(14)} ${'Artículos'.padStart(10)} ${'articlesFused'.padStart(15)} ${'GSC'.padStart(5)} ${'GA4'.padStart(5)} ${'Trust'.padStart(8)}`);
  console.log('  ' + '-'.repeat(56));

  for (const s of historical) {
    const articlesCount = (s as any).articlesCount ?? s.articlesFused?.length ?? 0;
    const articlesFusedCount = s.articlesFused?.length ?? 0;
    const hasGsc = !!s.gsc;
    const hasGa4 = !!s.ga4;
    const trustScore = s.trust?.averageGoogleTrustScore ?? null;
    console.log(`  ${s.date.padEnd(14)} ${String(articlesCount).padStart(10)} ${String(articlesFusedCount).padStart(15)} ${(hasGsc ? '🟢' : '⚪').padStart(5)} ${(hasGa4 ? '🟢' : '⚪').padStart(5)} ${(trustScore !== null ? `${trustScore}/100` : '—').padStart(8)}`);
  }
  console.log('  ' + '-'.repeat(56));

  // ═══════════════════════════════════════════════════════════════
  // 12. GOOGLE TRUST — DESCOMPOSICIÓN PARA ARTÍCULOS MUESTRA
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 12: GOOGLE TRUST — DESCOMPOSICIÓN (5 muestras)');
  console.log('─'.repeat(60));

  const trustSamples = trust.articles.slice(0, 5);
  for (const a of trustSamples) {
    console.log(`\n  ${a.slug}`);
    console.log(`    Authority: ${a.editorialAuthorityScore}/100 (autor=${a.hasAutor}, fecha=${a.hasFecha}, fuente=${a.hasFuente}, contexto=${a.hasContexto})`);
    console.log(`    Content Value: ${a.contentValueScore}/100`);
    console.log(`    Thin flags: ${a.thinContentFlags.length} → ${a.thinContentFlags.join(' | ') || 'ninguno'}`);
    console.log(`    Penalización: ${a.thinContentFlags.length >= 3 ? '-20' : a.thinContentFlags.length >= 2 ? '-10' : a.thinContentFlags.length >= 1 ? '-5' : '0'}${a.contentValueScore === 0 ? ' -10 (0 imp)' : ''}`);
    console.log(`    Trust Score: ${a.googleTrustScore}/100 (riesgo: ${a.risk})`);
    console.log(`    scoreMeni: ${a.scoreMeni}, gscImp: ${a.gscImpressions}, palabras: ${a.palabras}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 13. RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  RESUMEN EJECUTIVO — VALORES REALES POST-PATCH');
  console.log('='.repeat(80));
  console.log(`  Snapshot: ${snapshot.date}`);
  console.log(`  Artículos: ${articles.length}`);
  console.log(`  scoreMeni null: ${nullCount} | scoreMeni=0: ${zeroCount} | scoreMeni>0: ${positiveCount}`);
  console.log(`  Thin Content: ${trust.thinContentCount}/${articles.length}`);
  console.log(`  Duplicate Risk: ${trust.duplicateRiskCount}/${articles.length}`);
  console.log(`  Google Trust: ${trust.averageGoogleTrustScore}/100`);
  console.log(`  MENI Promedio: ${meniAvg !== null ? `${meniAvg}/100` : 'N/A'}`);
  console.log(`  Sin autor: ${trust.articlesWithoutAuthor}`);
  console.log(`  Riesgo alto: ${trust.highRiskArticles} | medio: ${trust.mediumRiskArticles} | bajo: ${trust.lowRiskArticles}`);
  console.log('='.repeat(80) + '\n');
}

main().catch((e) => {
  console.error('ERROR FATAL:', e);
  process.exit(1);
});
