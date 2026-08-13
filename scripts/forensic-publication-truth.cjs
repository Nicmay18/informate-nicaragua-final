/**
 * Verifica la verdad de la publicación:
 * - ¿Cuántos artículos con estado="publicado" tienen aprobadoMeni=false?
 * - ¿Campo `score` en 45 docs — es residual o se usa en algún lado?
 * - Distribución de estado, publicado, aprobado, aprobadoMeni
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

  const dist = {
    estado: {},
    publicado: { true: 0, false: 0, null: 0 },
    aprobado: { true: 0, false: 0, null: 0 },
    aprobadoMeni: { true: 0, false: 0, null: 0 },
    conScore: 0,
    sinScore: 0,
  };
  const publicadosPeroRechazadosMeni = [];
  const publicadosPeroRechazadosMeniBajoScore = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const estado = d.estado ?? 'NULL';
    dist.estado[estado] = (dist.estado[estado] || 0) + 1;
    if (d.publicado === true) dist.publicado.true++;
    else if (d.publicado === false) dist.publicado.false++;
    else dist.publicado.null++;
    if (d.aprobado === true) dist.aprobado.true++;
    else if (d.aprobado === false) dist.aprobado.false++;
    else dist.aprobado.null++;
    if (d.aprobadoMeni === true) dist.aprobadoMeni.true++;
    else if (d.aprobadoMeni === false) dist.aprobadoMeni.false++;
    else dist.aprobadoMeni.null++;
    if (d.score !== undefined && d.score !== null) dist.conScore++; else dist.sinScore++;

    // Crítico: estado=publicado pero aprobadoMeni=false
    if (estado === 'publicado' && d.aprobadoMeni === false) {
      publicadosPeroRechazadosMeni.push({
        id: doc.id,
        titulo: (d.titulo || '').slice(0, 70),
        scoreMeni: d.scoreMeni,
        estado: d.estado,
        publicado: d.publicado,
        aprobado: d.aprobado,
        aprobadoMeni: d.aprobadoMeni,
        fecha: d.fecha?.toDate ? d.fecha.toDate().toISOString() : null,
      });
      if (d.scoreMeni < 85) publicadosPeroRechazadosMeniBajoScore.push(doc.id);
    }
  }

  console.log('\n=== estado ===');
  for (const [e, c] of Object.entries(dist.estado).sort((a,b) => b[1]-a[1])) console.log(`  ${e}: ${c}`);
  console.log('\n=== publicado ===', JSON.stringify(dist.publicado));
  console.log('=== aprobado ===', JSON.stringify(dist.aprobado));
  console.log('=== aprobadoMeni ===', JSON.stringify(dist.aprobadoMeni));
  console.log('=== con campo score ===', dist.conScore, 'sin score:', dist.sinScore);

  console.log('\n=== CRÍTICO: estado=publicado & aprobadoMeni=false ===');
  console.log('Total:', publicadosPeroRechazadosMeni.length);
  console.log('De esos, con score < 85:', publicadosPeroRechazadosMeniBajoScore.length);
  console.log('\nLista completa:');
  for (const p of publicadosPeroRechazadosMeni) {
    console.log(`  ${p.id} | score=${p.scoreMeni} | pub=${p.publicado} | apr=${p.aprobado} | ${p.titulo}`);
  }

  // Guardar
  fs.writeFileSync('FORENSIC_PUBLICATION_TRUTH.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total,
    dist,
    publicadosPeroRechazadosMeni,
    publicadosPeroRechazadosMeniBajoScore,
  }, null, 2));
  console.log('\n✓ FORENSIC_PUBLICATION_TRUTH.json');

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
