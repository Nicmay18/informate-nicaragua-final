/**
 * Audita la verdad de MENI en los 286 artículos:
 * - ¿nivel="FORENSE" pero aprobadoMeni=false? (inconsistencia)
 * - ¿campo `score` en 45 docs? ¿es scoreCalidad residual?
 * - ¿Los 5 artículos nuevos (286 vs 281) tienen MENI real o heredado?
 * - Compara scoreMeni vs nivelScore (deberían ser iguales)
 */
const fs = require('fs');
const path = require('path');
try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    }
  }
} catch {}
const admin = require('firebase-admin');
const sa = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection('noticias').get();
  const total = snap.size;
  console.log('Total:', total);

  let nivelForenseAprobadoTrue = 0;
  let nivelForenseAprobadoFalse = 0;
  let nivelRechazado = 0;
  let nivelNoEvaluada = 0;
  let nivelOtro = 0;
  let scoreMeniIgualNivelScore = 0;
  let scoreMeniDistintoNivelScore = 0;
  let conCampoScore = 0;
  let scoreIgualScoreMeni = 0;
  let scoreDistintoScoreMeni = 0;
  let nivelFechaReciente = 0; // >= 2026-08-01
  let nivelFechaAntigua = 0;
  let nivelFechaNull = 0;
  let aprobadoTrueAprobadoMeniFalse = 0;
  let aprobadoFalseAprobadoMeniTrue = 0;

  const inconsistencias = [];
  const conScore = [];
  const nivelFechaDistribucion = {};

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const nivel = d.nivel ?? null;
    const aprobadoMeni = d.aprobadoMeni ?? null;
    const scoreMeni = d.scoreMeni ?? null;
    const nivelScore = d.nivelScore ?? null;
    const score = d.score ?? null;
    const aprobado = d.aprobado ?? null;
    const nivelFecha = d.nivelFecha ?? null;

    if (nivel === 'FORENSE' && aprobadoMeni === true) nivelForenseAprobadoTrue++;
    else if (nivel === 'FORENSE' && aprobadoMeni === false) {
      nivelForenseAprobadoFalse++;
      inconsistencias.push({ id, tipo: 'FORENSE_per_aprobadoMeni_false', scoreMeni, nivel, nivelScore });
    }
    else if (nivel === 'RECHAZADO') nivelRechazado++;
    else if (nivel === 'NO EVALUADA') nivelNoEvaluada++;
    else nivelOtro++;

    if (scoreMeni !== null && nivelScore !== null) {
      if (scoreMeni === nivelScore) scoreMeniIgualNivelScore++;
      else {
        scoreMeniDistintoNivelScore++;
        inconsistencias.push({ id, tipo: 'scoreMeni_distinto_nivelScore', scoreMeni, nivelScore });
      }
    }

    if (score !== null) {
      conCampoScore++;
      if (score === scoreMeni) scoreIgualScoreMeni++;
      else {
        scoreDistintoScoreMeni++;
        conScore.push({ id, score, scoreMeni, titulo: (d.titulo||'').slice(0,60) });
      }
    }

    if (nivelFecha) {
      const month = nivelFecha.slice(0, 7);
      nivelFechaDistribucion[month] = (nivelFechaDistribucion[month] || 0) + 1;
      if (nivelFecha >= '2026-08-01') nivelFechaReciente++;
      else nivelFechaAntigua++;
    } else nivelFechaNull++;

    if (aprobado === true && aprobadoMeni === false) {
      aprobadoTrueAprobadoMeniFalse++;
      inconsistencias.push({ id, tipo: 'aprobado_true_per_aprobadoMeni_false', scoreMeni, titulo: (d.titulo||'').slice(0,60) });
    }
    if (aprobado === false && aprobadoMeni === true) {
      aprobadoFalseAprobadoMeniTrue++;
    }
  }

  console.log('\n=== NIVEL vs APROBADO MENI ===');
  console.log('FORENSE + aprobadoMeni=true:', nivelForenseAprobadoTrue);
  console.log('FORENSE + aprobadoMeni=false (INCONSISTENTE):', nivelForenseAprobadoFalse);
  console.log('RECHAZADO:', nivelRechazado);
  console.log('NO EVALUADA:', nivelNoEvaluada);
  console.log('Otro:', nivelOtro);

  console.log('\n=== scoreMeni vs nivelScore ===');
  console.log('Iguales:', scoreMeniIgualNivelScore);
  console.log('Distintos (INCONSISTENTE):', scoreMeniDistintoNivelScore);

  console.log('\n=== Campo `score` (45 docs) ===');
  console.log('Total con `score`:', conCampoScore);
  console.log('score === scoreMeni:', scoreIgualScoreMeni);
  console.log('score !== scoreMeni:', scoreDistintoScoreMeni);
  if (conScore.length > 0) {
    console.log('Ejemplos donde score !== scoreMeni:');
    for (const s of conScore.slice(0, 10)) console.log(`  ${s.id} | score=${s.score} | scoreMeni=${s.scoreMeni} | ${s.titulo}`);
  }

  console.log('\n=== nivelFecha distribución ===');
  for (const [m, c] of Object.entries(nivelFechaDistribucion).sort()) console.log(`  ${m}: ${c}`);
  console.log('Recientes (>=2026-08-01):', nivelFechaReciente);
  console.log('Antiguos:', nivelFechaAntigua);
  console.log('Null:', nivelFechaNull);

  console.log('\n=== aprobado vs aprobadoMeni ===');
  console.log('aprobado=true & aprobadoMeni=false (PELIGROSO):', aprobadoTrueAprobadoMeniFalse);
  console.log('aprobado=false & aprobadoMeni=true (sub-publicado):', aprobadoFalseAprobadoMeniTrue);

  console.log('\n=== INCONSISTENCIAS (primeras 20) ===');
  for (const i of inconsistencias.slice(0, 20)) console.log(' ', JSON.stringify(i));

  fs.writeFileSync('FORENSIC_MENI_TRUTH_AUDIT.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total,
    nivelForenseAprobadoFalse,
    scoreMeniDistintoNivelScore,
    conCampoScore,
    scoreDistintoScoreMeni,
    aprobadoTrueAprobadoMeniFalse,
    aprobadoFalseAprobadoMeniTrue,
    inconsistencias,
    conScore,
  }, null, 2));
  console.log('\n✓ FORENSIC_MENI_TRUTH_AUDIT.json');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
