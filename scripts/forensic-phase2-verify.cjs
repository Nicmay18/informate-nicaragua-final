/**
 * FASE 2 — Verificación post-backfill.
 * Relee Firestore directamente. NO confía en memoria ni en el log del backfill.
 * Genera FORENSIC_POST_BACKFILL_REPORT.json
 */
const fs = require('fs');
const path = require('path');
try { const e = path.join(process.cwd(), '.env.local'); if (fs.existsSync(e)) { for (const l of fs.readFileSync(e, 'utf8').split('\n')) { const l2 = l.replace(/\r$/, ''); const m = l2.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'); } } } catch {}
const admin = require('firebase-admin');
let sa;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try { sa = JSON.parse(fs.readFileSync(saPath, 'utf8')); } catch {
  let pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) { sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')); }
  else if (pk) { sa = { projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua', clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pk }; }
  else { console.error('FALTA KEY'); process.exit(1); }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function stripHtml(h) { return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cw(t) { return t.split(/\s+/).filter(Boolean).length; }

async function main() {
  console.log('\n=== FASE 2: VERIFICACIÓN POST-BACKFILL (releyendo Firestore) ===\n');
  const snap = await db.collection('noticias').get();
  const total = snap.size;
  console.log('Total artículos leídos:', total);

  let conScoreMeni = 0, sinScoreMeni = 0;
  let conAprobadoMeni = 0, sinAprobadoMeni = 0;
  let scoreNull = 0, scoreZero = 0;
  let aprobadoTrue = 0, aprobadoFalse = 0;
  let nivelForense = 0;
  let conCalificacion = 0, conDiagnostico = 0, conEditorialTier = 0, conNivelScore = 0;
  let conNivel = 0;
  let publicadoSinAprobacion = 0;
  let htmlArtifacts = 0;
  let scoreEqualsNivelScore = 0;
  let scoreFromCalidad = 0; // Can't directly detect but check if scoreCalidad exists and equals scoreMeni
  let conScoreCalidad = 0;
  let thinCount = 0;
  const scoreBuckets = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0, 'null': 0 };
  const nivelDist = {};
  const catDist = {};
  const records = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const contenidoStr = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    const palabras = cw(stripHtml(contenidoStr));

    // Core checks
    const hasScoreMeni = d.scoreMeni !== undefined && d.scoreMeni !== null;
    const hasAprobadoMeni = d.aprobadoMeni !== undefined && d.aprobadoMeni !== null;
    const hasNivelScore = d.nivelScore !== undefined && d.nivelScore !== null;
    const hasNivel = d.nivel !== undefined && d.nivel !== null;
    const hasCalificacion = d.calificacionMeni !== undefined && d.calificacionMeni !== null;
    const hasDiagnostico = d.diagnosticoMeni !== undefined && d.diagnosticoMeni !== null;
    const hasEditorialTier = d.editorialTier !== undefined && d.editorialTier !== null;
    const hasScoreCalidad = d.scoreCalidad !== undefined && d.scoreCalidad !== null;

    if (hasScoreMeni) conScoreMeni++; else { sinScoreMeni++; scoreNull++; }
    if (hasAprobadoMeni) conAprobadoMeni++; else sinAprobadoMeni++;
    if (d.scoreMeni === 0) scoreZero++;
    if (d.aprobadoMeni === true) aprobadoTrue++;
    if (d.aprobadoMeni === false) aprobadoFalse++;
    if (d.nivel === 'FORENSE') nivelForense++;
    if (hasCalificacion) conCalificacion++;
    if (hasDiagnostico) conDiagnostico++;
    if (hasEditorialTier) conEditorialTier++;
    if (hasNivelScore) conNivelScore++;
    if (hasNivel) conNivel++;
    if (hasScoreCalidad) conScoreCalidad++;

    // Check published without approval
    if (d.publicado !== false && d.aprobadoMeni !== true) publicadoSinAprobacion++;

    // Check HTML artifacts
    const artifacts = [];
    if (/<[^>]*\bid\s*=/i.test(contenidoStr)) artifacts.push('id');
    if (/<[^>]*\bstyle\s*=/i.test(contenidoStr)) artifacts.push('style');
    if (/<[^>]*\bclass\s*=/i.test(contenidoStr)) artifacts.push('class');
    if (/<[^>]*\bdata-/i.test(contenidoStr)) artifacts.push('data');
    if (/```/.test(contenidoStr)) artifacts.push('codefence');
    if (/<script/i.test(contenidoStr)) artifacts.push('script');
    if (artifacts.length > 0) htmlArtifacts++;

    // Check scoreMeni == nivelScore
    if (hasScoreMeni && hasNivelScore && d.scoreMeni === d.nivelScore) scoreEqualsNivelScore++;

    // Check if scoreCalidad exists and equals scoreMeni (would indicate copy)
    if (hasScoreCalidad && hasScoreMeni && d.scoreCalidad === d.scoreMeni) scoreFromCalidad++;

    // Thin
    if (palabras < 400) thinCount++;

    // Score buckets
    if (!hasScoreMeni) scoreBuckets['null']++;
    else if (d.scoreMeni < 50) scoreBuckets['0-49']++;
    else if (d.scoreMeni < 70) scoreBuckets['50-69']++;
    else if (d.scoreMeni < 90) scoreBuckets['70-89']++;
    else scoreBuckets['90-100']++;

    // Nivel distribution
    const n = d.nivel || 'NONE';
    nivelDist[n] = (nivelDist[n] || 0) + 1;

    // Category distribution
    const c = d.categoria || 'General';
    catDist[c] = (catDist[c] || 0) + 1;

    records.push({
      id, slug: d.slug || id, titulo: d.titulo || '', categoria: c,
      palabrasReales: palabras, scoreMeni: d.scoreMeni ?? null,
      aprobadoMeni: d.aprobadoMeni ?? null, calificacionMeni: d.calificacionMeni ?? null,
      nivel: d.nivel ?? null, nivelScore: d.nivelScore ?? null,
      editorialTier: d.editorialTier ?? null, diagnosticoMeni: d.diagnosticoMeni ?? null,
      publicado: d.publicado !== false, scoreCalidad: d.scoreCalidad ?? null,
      htmlArtifacts: artifacts, nivelFecha: d.nivelFecha || null,
    });
  }

  const report = {
    timestamp: new Date().toISOString(),
    total,
    conScoreMeni,
    sinScoreMeni,
    conAprobadoMeni,
    sinAprobadoMeni,
    scoreNull,
    scoreZero,
    aprobadoTrue,
    aprobadoFalse,
    nivelForense,
    conCalificacion,
    conDiagnostico,
    conEditorialTier,
    conNivelScore,
    conNivel,
    conScoreCalidad,
    publicadoSinAprobacion,
    htmlArtifacts,
    scoreEqualsNivelScore,
    scoreFromCalidad,
    thinCount,
    scoreBuckets,
    nivelDist,
    catDist,
    records,
  };

  const outPath = path.join(process.cwd(), 'FORENSIC_POST_BACKFILL_REPORT.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Reporte:', outPath);

  console.log('\n--- VERIFICACIÓN POST-BACKFILL ---');
  console.log('Total:', total);
  console.log('Con scoreMeni:', conScoreMeni, '/ Sin scoreMeni:', sinScoreMeni);
  console.log('Con aprobadoMeni:', conAprobadoMeni, '/ Sin aprobadoMeni:', sinAprobadoMeni);
  console.log('ScoreMeni null:', scoreNull);
  console.log('ScoreMeni = 0:', scoreZero);
  console.log('Aprobado true:', aprobadoTrue, '/ Aprobado false:', aprobadoFalse);
  console.log('Nivel FORENSE:', nivelForense);
  console.log('Con calificacionMeni:', conCalificacion);
  console.log('Con diagnosticoMeni:', conDiagnostico);
  console.log('Con editorialTier:', conEditorialTier);
  console.log('Con nivelScore:', conNivelScore);
  console.log('Con nivel:', conNivel);
  console.log('Con scoreCalidad (campo legacy):', conScoreCalidad);
  console.log('Publicados sin aprobación MENI:', publicadoSinAprobacion);
  console.log('Con artefactos HTML:', htmlArtifacts);
  console.log('scoreMeni == nivelScore:', scoreEqualsNivelScore);
  console.log('scoreMeni == scoreCalidad (posible copia):', scoreFromCalidad);
  console.log('Thin (<400 palabras):', thinCount);
  console.log('Distribución scores:', JSON.stringify(scoreBuckets));
  console.log('Distribución niveles:', JSON.stringify(nivelDist));
  console.log('Distribución categorías:', JSON.stringify(catDist));

  // Veredicto
  console.log('\n--- VEREDICTO ---');
  const checks = [
    { name: '281/281 con scoreMeni', pass: conScoreMeni === 281 },
    { name: '0 sin scoreMeni', pass: sinScoreMeni === 0 },
    { name: '281/281 con aprobadoMeni', pass: conAprobadoMeni === 281 },
    { name: '0 scoreMeni null', pass: scoreNull === 0 },
    { name: '0 scoreMeni = 0', pass: scoreZero === 0 },
    { name: '0 scoreMeni = scoreCalidad', pass: scoreFromCalidad === 0 },
    { name: '0 publicados sin aprobación', pass: publicadoSinAprobacion === 0 },
    { name: '0 artefactos HTML', pass: htmlArtifacts === 0 },
  ];
  for (const c of checks) console.log(`  ${c.pass ? '✅' : '❌'} ${c.name}`);
  const allPass = checks.every(c => c.pass);
  console.log(`\n  ${allPass ? '✅ CERTIFICADO' : '❌ NO CERTIFICADO'}`);

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
