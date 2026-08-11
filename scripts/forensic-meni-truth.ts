/**
 * MENI INTEGRATION FORENSIC TRUTH — READ ONLY
 * Traza por qué 73 artículos tienen scoreMeni y 208 no.
 * NO modifica nada. Solo lee y reporta.
 *
 * Uso: npx tsx scripts/forensic-meni-truth.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { getAdminDb } = await import('@/lib/firebase-admin');
  const db = getAdminDb();

  console.log('\n' + '='.repeat(80));
  console.log('  MENI INTEGRATION FORENSIC TRUTH REPORT');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  // ═══════════════════════════════════════════════════════════════
  // 1. Cargar TODOS los documentos de noticias
  // ═══════════════════════════════════════════════════════════════
  const allSnap = await db.collection('noticias').get();
  console.log(`Total documentos en noticias: ${allSnap.size}\n`);

  interface ArticleData {
    id: string;
    slug: string;
    titulo: string;
    fecha?: any;
    autor?: string;
    categoria?: string;
    palabras?: number;
    scoreMeni?: number;
    scoreCalidad?: number;
    aprobadoMeni?: boolean;
    calificacionMeni?: string;
    nivel?: string;
    nivelScore?: number;
    nivelFecha?: string;
    diagnosticoMeni?: string;
    editorialTier?: string;
    editorialReason?: string;
    profile_used?: string;
    profile_confidence?: number;
    articleHash?: string;
    evaluationTimestamp?: string;
    recomendacionesMeni?: string[];
    estado?: string;
    publicado?: boolean;
    contenido?: string;
    tags?: string[];
    related_links?: any[];
    puntosClave?: any[];
    fuente?: string;
    distribuida?: boolean;
    premium?: boolean;
    [key: string]: any;
  }

  const articles: ArticleData[] = allSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ArticleData);

  // ═══════════════════════════════════════════════════════════════
  // 2. Clasificar por presencia de scoreMeni
  // ═══════════════════════════════════════════════════════════════
  const withMeni = articles.filter(a => typeof a.scoreMeni === 'number' && a.scoreMeni > 0);
  const withMeniZero = articles.filter(a => a.scoreMeni === 0);
  const withoutMeni = articles.filter(a => a.scoreMeni === undefined || a.scoreMeni === null);
  const withScoreCalidad = articles.filter(a => typeof a.scoreCalidad === 'number');

  console.log('─'.repeat(60));
  console.log('  CLASIFICACIÓN POR scoreMeni');
  console.log('─'.repeat(60));
  console.log(`  scoreMeni > 0 (evaluado real):    ${withMeni.length}`);
  console.log(`  scoreMeni = 0:                    ${withMeniZero.length}`);
  console.log(`  scoreMeni = undefined/null:        ${withoutMeni.length}`);
  console.log(`  scoreCalidad presente:             ${withScoreCalidad.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 3. FASE 2 — Trazar los 73 con MENI
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  FASE 2: ARTÍCULOS CON scoreMeni > 0 (MENI evaluado)');
  console.log('─'.repeat(60));

  // Campos MENI que indican que pasó por el flujo
  const meniFields = [
    'scoreMeni', 'aprobadoMeni', 'calificacionMeni', 'nivel',
    'nivelScore', 'nivelFecha', 'diagnosticoMeni', 'editorialTier',
    'editorialReason', 'profile_used', 'profile_confidence',
    'articleHash', 'evaluationTimestamp', 'recomendacionesMeni',
  ];

  console.log('\n  Campos MENI presentes en artículos CON scoreMeni > 0:');
  for (const field of meniFields) {
    const count = withMeni.filter(a => a[field] !== undefined && a[field] !== null).length;
    console.log(`    ${field.padEnd(25)} ${count}/${withMeni.length}`);
  }

  console.log('\n  Campos MENI presentes en artículos SIN scoreMeni:');
  for (const field of meniFields) {
    const count = withoutMeni.filter(a => a[field] !== undefined && a[field] !== null).length;
    console.log(`    ${field.padEnd(25)} ${count}/${withoutMeni.length}`);
  }

  // Muestra de 10 artículos CON MENI
  console.log('\n  >>> Muestra de 10 artículos CON scoreMeni > 0:');
  for (const a of withMeni.slice(0, 10)) {
    const fechaStr = a.fecha?.toDate ? a.fecha.toDate().toISOString().split('T')[0] :
                     typeof a.fecha === 'string' ? a.fecha.split('T')[0] : 'N/A';
    console.log(`    slug: ${a.slug || a.id}`);
    console.log(`      scoreMeni: ${a.scoreMeni}, nivel: ${a.nivel || 'N/A'}, nivelScore: ${a.nivelScore ?? 'N/A'}`);
    console.log(`      fecha: ${fechaStr}, autor: ${a.autor || 'N/A'}, categoria: ${a.categoria || 'N/A'}`);
    console.log(`      editorialTier: ${a.editorialTier || 'N/A'}, profile_used: ${a.profile_used || 'N/A'}`);
    console.log(`      evaluationTimestamp: ${a.evaluationTimestamp || 'N/A'}`);
    console.log(`      articleHash: ${a.articleHash || 'N/A'}`);
    console.log(`      aprobadoMeni: ${a.aprobadoMeni}, calificacionMeni: ${a.calificacionMeni || 'N/A'}`);
    console.log(`      palabras: ${a.palabras || 'N/A'}, tags: ${a.tags?.length ?? 0}`);
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. FASE 3 — Trazar los 208 sin MENI
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('  FASE 3: ARTÍCULOS SIN scoreMeni (MENI no evaluado)');
  console.log('─'.repeat(60));

  // Muestra de 10 artículos SIN MENI
  console.log('\n  >>> Muestra de 10 artículos SIN scoreMeni:');
  for (const a of withoutMeni.slice(0, 10)) {
    const fechaStr = a.fecha?.toDate ? a.fecha.toDate().toISOString().split('T')[0] :
                     typeof a.fecha === 'string' ? a.fecha.split('T')[0] : 'N/A';
    console.log(`    slug: ${a.slug || a.id}`);
    console.log(`      scoreMeni: ${a.scoreMeni ?? 'undefined'}`);
    console.log(`      scoreCalidad: ${a.scoreCalidad ?? 'undefined'}`);
    console.log(`      fecha: ${fechaStr}, autor: ${a.autor || 'N/A'}, categoria: ${a.categoria || 'N/A'}`);
    console.log(`      nivel: ${a.nivel || 'N/A'}, nivelScore: ${a.nivelScore ?? 'N/A'}`);
    console.log(`      editorialTier: ${a.editorialTier || 'N/A'}`);
    console.log(`      palabras: ${a.palabras || 'N/A'}, tags: ${a.tags?.length ?? 0}`);
    console.log(`      publicado: ${a.publicado}, estado: ${a.estado || 'N/A'}`);
    console.log(`      tiene contenido: ${!!a.contenido}, longitud: ${a.contenido?.length || 0} chars`);
    console.log('');
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ANÁLISIS — ¿Qué tienen en común los CON MENI?
  // ═══════════════════════════════════════════════════════════════
  console.log('─'.repeat(60));
  console.log('  ANÁLISIS: ¿Qué tienen en común los CON MENI?');
  console.log('─'.repeat(60));

  // Fecha range
  const meniDates = withMeni.map(a => {
    if (a.fecha?.toDate) return a.fecha.toDate().toISOString().split('T')[0];
    if (typeof a.fecha === 'string') return a.fecha.split('T')[0];
    return null;
  }).filter(Boolean).sort();
  const noMeniDates = withoutMeni.map(a => {
    if (a.fecha?.toDate) return a.fecha.toDate().toISOString().split('T')[0];
    if (typeof a.fecha === 'string') return a.fecha.split('T')[0];
    return null;
  }).filter(Boolean).sort();

  console.log(`  CON MENI — fechas: ${meniDates[0] || 'N/A'} a ${meniDates[meniDates.length - 1] || 'N/A'}`);
  console.log(`  SIN MENI — fechas: ${noMeniDates[0] || 'N/A'} a ${noMeniDates[noMeniDates.length - 1] || 'N/A'}`);

  // nivel field
  const meniNiveles = withMeni.filter(a => a.nivel && a.nivel !== 'NO EVALUADA').length;
  const noMeniNiveles = withoutMeni.filter(a => a.nivel && a.nivel !== 'NO EVALUADA').length;
  console.log(`  CON MENI — tiene nivel (no NO EVALUADA): ${meniNiveles}/${withMeni.length}`);
  console.log(`  SIN MENI — tiene nivel (no NO EVALUADA): ${noMeniNiveles}/${withoutMeni.length}`);

  // nivelScore
  const meniNivelScore = withMeni.filter(a => typeof a.nivelScore === 'number' && a.nivelScore > 0).length;
  const noMeniNivelScore = withoutMeni.filter(a => typeof a.nivelScore === 'number' && a.nivelScore > 0).length;
  console.log(`  CON MENI — tiene nivelScore > 0: ${meniNivelScore}/${withMeni.length}`);
  console.log(`  SIN MENI — tiene nivelScore > 0: ${noMeniNivelScore}/${withoutMeni.length}`);

  // editorialTier
  const meniTier = withMeni.filter(a => a.editorialTier).length;
  const noMeniTier = withoutMeni.filter(a => a.editorialTier).length;
  console.log(`  CON MENI — tiene editorialTier: ${meniTier}/${withMeni.length}`);
  console.log(`  SIN MENI — tiene editorialTier: ${noMeniTier}/${withoutMeni.length}`);

  // profile_used
  const meniProfile = withMeni.filter(a => a.profile_used).length;
  const noMeniProfile = withoutMeni.filter(a => a.profile_used).length;
  console.log(`  CON MENI — tiene profile_used: ${meniProfile}/${withMeni.length}`);
  console.log(`  SIN MENI — tiene profile_used: ${noMeniProfile}/${withoutMeni.length}`);

  // articleHash
  const meniHash = withMeni.filter(a => a.articleHash).length;
  const noMeniHash = withoutMeni.filter(a => a.articleHash).length;
  console.log(`  CON MENI — tiene articleHash: ${meniHash}/${withMeni.length}`);
  console.log(`  SIN MENI — tiene articleHash: ${noMeniHash}/${withoutMeni.length}`);

  // evaluationTimestamp
  const meniEvalTs = withMeni.filter(a => a.evaluationTimestamp).length;
  const noMeniEvalTs = withoutMeni.filter(a => a.evaluationTimestamp).length;
  console.log(`  CON MENI — tiene evaluationTimestamp: ${meniEvalTs}/${withMeni.length}`);
  console.log(`  SIN MENI — tiene evaluationTimestamp: ${noMeniEvalTs}/${withoutMeni.length}`);

  // distribuida
  const meniDistribuida = withMeni.filter(a => a.distribuida === true).length;
  const noMeniDistribuida = withoutMeni.filter(a => a.distribuida === true).length;
  console.log(`  CON MENI — distribuida: ${meniDistribuida}/${withMeni.length}`);
  console.log(`  SIN MENI — distribuida: ${noMeniDistribuida}/${withoutMeni.length}`);

  // premium
  const meniPremium = withMeni.filter(a => a.premium === true).length;
  const noMeniPremium = withoutMeni.filter(a => a.premium === true).length;
  console.log(`  CON MENI — premium: ${meniPremium}/${withMeni.length}`);
  console.log(`  SIN MENI — premium: ${noMeniPremium}/${withoutMeni.length}`);

  // autor
  const meniAutores = new Set(withMeni.map(a => a.autor).filter(Boolean));
  const noMeniAutores = new Set(withoutMeni.map(a => a.autor).filter(Boolean));
  console.log(`  CON MENI — autores únicos: ${meniAutores.size} (${[...meniAutores].join(', ')})`);
  console.log(`  SIN MENI — autores únicos: ${noMeniAutores.size} (${[...noMeniAutores].join(', ')})`);

  // ¿Tienen campos que indican guardar-directo vs admin/news?
  // guardar-directo escribe: scoreMeni, aprobadoMeni, calificacionMeni, nivel, nivelScore, nivelFecha, diagnosticoMeni, editorialTier, editorialReason, recomendacionesMeni
  // admin/news escribe: nivel: 'FORENSE', nivelScore: 0, nivelFecha (sin scoreMeni, sin aprobadoMeni, etc.)

  const guardarDirectoMarkers = ['aprobadoMeni', 'calificacionMeni', 'diagnosticoMeni', 'editorialTier', 'editorialReason'];
  const adminNewsMarkers = ['puntosClave', 'fuentesComplementarias'];

  console.log('\n  Marcadores de flujo:');
  for (const marker of guardarDirectoMarkers) {
    const conMeni = withMeni.filter(a => a[marker] !== undefined).length;
    const sinMeni = withoutMeni.filter(a => a[marker] !== undefined).length;
    console.log(`    ${marker.padEnd(25)} CON: ${conMeni}/${withMeni.length}  SIN: ${sinMeni}/${withoutMeni.length}`);
  }
  for (const marker of adminNewsMarkers) {
    const conMeni = withMeni.filter(a => a[marker] !== undefined).length;
    const sinMeni = withoutMeni.filter(a => a[marker] !== undefined).length;
    console.log(`    ${marker.padEnd(25)} CON: ${conMeni}/${withMeni.length}  SIN: ${sinMeni}/${withoutMeni.length}`);
  }

  // nivel = 'FORENSE' con nivelScore = 0 es marca de admin/news (sin MENI)
  const forenseZero = withoutMeni.filter(a => a.nivel === 'FORENSE' && a.nivelScore === 0).length;
  const forenseZeroConMeni = withMeni.filter(a => a.nivel === 'FORENSE' && a.nivelScore === 0).length;
  console.log(`\n  nivel='FORENSE' + nivelScore=0:`);
  console.log(`    SIN MENI: ${forenseZero}/${withoutMeni.length}`);
  console.log(`    CON MENI: ${forenseZeroConMeni}/${withMeni.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 6. VERIFICAR — ¿Los SIN MENI pasaron por admin/news (sin MENI)?
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '─'.repeat(60));
  console.log('  VERIFICACIÓN: Flujo de creación (admin/news vs guardar-directo)');
  console.log('─'.repeat(60));

  // admin/news POST escribe: nivel='FORENSE', nivelScore=0, nivelFecha, puntosClave, fuente, fuentesComplementarias, related_links
  // pero NO escribe: scoreMeni, aprobadoMeni, calificacionMeni, diagnosticoMeni, editorialTier, editorialReason
  // guardar-directo escribe: scoreMeni, aprobadoMeni, calificacionMeni, nivel, nivelScore, nivelFecha, diagnosticoMeni, editorialTier, editorialReason, recomendacionesMeni

  const adminNewsCount = articles.filter(a =>
    a.nivel === 'FORENSE' && a.nivelScore === 0 &&
    a.scoreMeni === undefined && a.aprobadoMeni === undefined
  ).length;

  const guardarDirectoCount = articles.filter(a =>
    a.scoreMeni !== undefined && a.aprobadoMeni !== undefined
  ).length;

  const cronFetchCount = articles.filter(a =>
    a.scoreMeni === undefined && a.nivel === undefined && a.nivelScore === undefined &&
    a.aprobadoMeni === undefined && a.puntosClave === undefined
  ).length;

  const articlesRouteCount = articles.filter(a =>
    a.scoreMeni === undefined && a.nivel === undefined &&
    a.autorRol !== undefined && a.premium !== undefined
  ).length;

  console.log(`  Artículos con marca de admin/news (FORENSE+0, sin MENI): ${adminNewsCount}`);
  console.log(`  Artículos con marca de guardar-directo (scoreMeni+aprobadoMeni): ${guardarDirectoCount}`);
  console.log(`  Artículos con marca de cron-fetch (sin nivel, sin puntosClave): ${cronFetchCount}`);
  console.log(`  Artículos con marca de /api/articles (autorRol, premium): ${articlesRouteCount}`);

  // Otros: no encajan en ningún patrón
  const classified = new Set<string>();
  for (const a of articles) {
    if (a.nivel === 'FORENSE' && a.nivelScore === 0 && a.scoreMeni === undefined && a.aprobadoMeni === undefined) classified.add(a.id);
    if (a.scoreMeni !== undefined && a.aprobadoMeni !== undefined) classified.add(a.id);
    if (a.scoreMeni === undefined && a.nivel === undefined && a.nivelScore === undefined && a.aprobadoMeni === undefined && a.puntosClave === undefined) classified.add(a.id);
    if (a.scoreMeni === undefined && a.nivel === undefined && a.autorRol !== undefined && a.premium !== undefined) classified.add(a.id);
  }
  const unclassified = articles.filter(a => !classified.has(a.id));
  console.log(`  Artículos sin clasificar: ${unclassified.length}`);
  if (unclassified.length > 0 && unclassified.length <= 20) {
    console.log('\n  >>> Sin clasificar:');
    for (const a of unclassified.slice(0, 10)) {
      console.log(`    ${a.slug || a.id}: scoreMeni=${a.scoreMeni}, nivel=${a.nivel}, nivelScore=${a.nivelScore}, aprobadoMeni=${a.aprobadoMeni}, puntosClave=${!!a.puntosClave}, autorRol=${a.autorRol ?? 'N/A'}, premium=${a.premium ?? 'N/A'}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(80));
  console.log('  RESUMEN FORENSIC TRUTH');
  console.log('='.repeat(80));
  console.log(`  Total noticias: ${articles.length}`);
  console.log(`  CON scoreMeni > 0 (pasaron por guardar-directo con MENI): ${withMeni.length}`);
  console.log(`  SIN scoreMeni (NO pasaron por guardar-directo): ${withoutMeni.length + withMeniZero.length}`);
  console.log(`    - Marca admin/news (FORENSE+0): ${adminNewsCount}`);
  console.log(`    - Marca cron-fetch: ${cronFetchCount}`);
  console.log(`    - Marca /api/articles: ${articlesRouteCount}`);
  console.log(`    - Sin clasificar: ${unclassified.length}`);
  console.log('='.repeat(80) + '\n');
}

main().catch((e) => {
  console.error('ERROR FATAL:', e);
  process.exit(1);
});
