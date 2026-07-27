/**
 * Pulir 171 notas: generar tags/keywords faltantes y guardar en Firestore
 * Uso: node .audit/pulir-tags.mjs
 */
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.local');
const envText = await fs.readFile(envPath, 'utf8');
const b64 = envText.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_BASE64='))?.split('=')[1];
if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local');
const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
process.env.FIREBASE_PROJECT_ID = sa.project_id;
process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
process.env.FIREBASE_PRIVATE_KEY = sa.private_key;

const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

if (getApps().length === 0) initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Copia local del extractor para no depender de la compilación TS
const STOPWORDS = new Set([
  'el','la','los','las','de','del','a','en','y','o','que','con','por','un','una','unos','unas','al','se','su','sus','para','es','son','fue','fueron','ha','han','este','esta','estos','estas','pero','como','lo','le','les','me','te','nos','como','mas','más','ya','hasta','desde','sin','sobre','entre','durante','ante','tras','trás','segun','según','cabe','bajo','contra','mediante','hacia','excepto','salvo','pues','si','no','ni','sino','aunque','cuando','mientras','porque','asi','así','tan','tanto','muy','poco','mucho','bastante','demasiado','cada','todo','todos','todas','nada','alguien','nadie','otro','otra','otros','otras','mismo','misma','mismos','mismas','cual','cuales','quien','quienes','cuyo','cuya','cuyos','cuyas','donde','aun','nicaragua','informate','noticia','noticias','pais','país','mundo','año','años','mes','dia','día','hoy','ayer','mañana','tambien','también','ademas','además'
]);

function extractKeywords(texto, max = 12) {
  const clean = (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-záéíóúñ0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = clean.split(/\s+/);
  const counts = new Map();
  for (const w of words) {
    if (w.length < 4 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([w]) => w)
    .slice(0, max);
}

function normalizeKeywords(texto, max = 12) {
  const words = extractKeywords(texto, max);
  return words.join(', ');
}

const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
const toUpdate = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const keywords = data.keywords || '';

  if (tags.length === 0 || !keywords) {
    const text = `${data.titulo || ''} ${data.resumen || ''} ${data.metaDescription || ''} ${data.metaDescripcion || ''} ${(data.contenido || '').replace(/<[^>]+>/g, ' ')}`;
    const newTags = extractKeywords(text, 12);
    const newKeywords = normalizeKeywords(text, 12);

    if (newTags.length === 0) {
      console.warn(`No se pudieron generar tags para ${doc.id}`);
      continue;
    }

    const update = {};
    if (tags.length === 0) update.tags = newTags;
    if (!keywords) update.keywords = newKeywords;
    if (Object.keys(update).length > 0) update.updatedAt = FieldValue.serverTimestamp();

    toUpdate.push({ ref: doc.ref, id: doc.id, titulo: data.titulo, update });
  }
}

if (toUpdate.length === 0) {
  console.log('No hay notas que pulir.');
  process.exit(0);
}

console.log(`Pulirendo ${toUpdate.length} notas sin tags/keywords...`);

// Batch writes de 500 max
const BATCH_SIZE = 450;
let updated = 0;
for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = toUpdate.slice(i, i + BATCH_SIZE);
  for (const item of chunk) {
    batch.update(item.ref, item.update);
  }
  await batch.commit();
  updated += chunk.length;
  console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${updated}/${toUpdate.length} actualizadas`);
}

const summary = {
  total: snapshot.size,
  polished: updated,
  samples: toUpdate.slice(0, 5).map(item => ({
    id: item.id,
    titulo: item.titulo,
    tags: item.update.tags,
    keywords: item.update.keywords,
  })),
};

const outPath = path.join(rootDir, '.audit', 'pulir-tags-resultado.json');
await fs.writeFile(outPath, JSON.stringify(summary, null, 2), 'utf8');
console.log('Listo. Resultado guardado en .audit/pulir-tags-resultado.json');
