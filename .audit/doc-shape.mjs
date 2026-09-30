// Solo lectura: forma real de un doc reciente (claves top-level + mutationLog + meni)
import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) }));
const slug = process.argv[2] || 'tres-dias-siete-muertos-el-saldo-de-los-accidentes-de-transito';
const s = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
const x = s.docs[0].data();
const strip = (v) => JSON.stringify(v, (k, val) => (typeof val === 'string' && val.length > 160 ? val.slice(0, 160) + '…' : val), 1);
console.log('KEYS:', Object.keys(x).sort().join(', '));
console.log('\nmutationLog:', strip(x.mutationLog));
console.log('\nsupervisorDecision:', strip(x.supervisorDecision));
console.log('\nmeni (keys):', x.meni ? Object.keys(x.meni).join(', ') : 'n/a');
console.log('\nqualityGate:', strip(x.qualityGate));
console.log('\nconfianza:', strip(x.confianza));
console.log('\nfactuality:', strip(x.factualitySignals ?? x.factuality));
console.log('\ncontentHash/evaluationTimestamp:', x.contentHash, x.evaluationTimestamp);
console.log('\nfuente/fuentes:', x.fuente, strip(x.fuentes), strip(x.fuentesComplementarias));
console.log('\nautor:', x.autor, '| seo:', strip(x.seo));
writeFileSync(`.audit/doc-${slug}.json`, JSON.stringify(x, null, 2));

// Colecciones existentes (inventario)
const cols = await db.listCollections();
console.log('\nCOLECCIONES:', cols.map(c => c.id).sort().join(', '));
for (const c of cols) {
  const cnt = await db.collection(c.id).count().get();
  console.log(`  ${c.id.padEnd(32)} ${cnt.data().count}`);
}
