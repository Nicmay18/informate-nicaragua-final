// Dump completo de 10 noticias + lifecycle + predictions — solo lectura.
import { readFileSync, writeFileSync } from 'fs';

const IDS = [
  'gh7lOQJoZIJeY5bXhoTe', // Sucesos/accidente: 10 lesionados autobús Río Blanco
  'eA53ptkMPQdrNlotbJ7c', // Sucesos: niña atropellada (info incompleta?)
  'pAv7atGxknGok8Wtt6uC', // Nacionales: La Mascota cardiopatías (mut:3)
  'AQiSAE7CeGLS9n5AvpzG', // Nacionales: 94 detenidos ebriedad (defecto corregido)
  'gPe3e3k6GAmgPpBJzGkX', // Internacionales: PUBLICAR_CON_CAMBIOS
  '51OIyVo7HhoY8dcsmoto', // Internacionales: 22,000 migrantes (cifras)
  'gE9P2rHVhRM0rLqAlb2U', // Deportes: Nisi Blass (mut:3)
  'EzMFBmEbwymm9YYvvcW5', // Espectáculos: muerte Pedro Dixon
  'ioylw52HAMCLqp5NlLBb', // Tecnología: iPhone Duo (¿fabricada?)
  'd1JwxltReT1Wj88Jl4ZD', // Tecnología: Meta gafas (mut:3)
];

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({
  credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))),
}));

const out = {};
for (const id of IDS) {
  const doc = await db.collection('noticias').doc(id).get();
  const data = doc.exists ? doc.data() : null;
  const lc = await db.collection('article_lifecycles').doc(id).get();
  const pred = await db.collection('meni_predictions').where('articleId', '==', id).limit(3).get();
  const corr = await db.collection('editor_corrections').where('articleId', '==', id).limit(10).get();
  out[id] = {
    article: data,
    lifecycle: lc.exists ? lc.data() : null,
    predictions: pred.docs.map(d => d.data()),
    corrections: corr.docs.map(d => d.data()),
  };
}
writeFileSync('.audit/dump-10.json', JSON.stringify(out, (k, v) => {
  // Timestamps → ISO
  if (v && typeof v === 'object' && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v && typeof v === 'object' && v._seconds !== undefined) return new Date(v._seconds * 1000).toISOString();
  return v;
}, 2));
console.log('dumped', Object.keys(out).length, 'articles');
for (const id of IDS) {
  const a = out[id].article;
  console.log(id, '|', (a?.titulo || '?').substring(0, 55), '| pred:', out[id].predictions.length, '| lc:', !!out[id].lifecycle, '| corr:', out[id].corrections.length);
}
