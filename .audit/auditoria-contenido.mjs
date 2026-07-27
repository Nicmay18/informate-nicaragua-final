/**
 * Audit script: detecta noticias de bajo valor en Firestore
 * Uso: node .audit/auditar-contenido.mjs
 * Salida: .audit/auditoria-contenido.json
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
const { getFirestore } = await import('firebase-admin/firestore');

if (getApps().length === 0) {
  initializeApp({ credential: cert(sa) });
}
const db = getFirestore();

const MIN_WORDS = 300;
const MIN_RESUMEN_CHARS = 80;
const LOW_QUALITY_THRESHOLD = 70;
const SIMILARITY_THRESHOLD = 0.65;

function bigrams(text) {
  const words = text.toLowerCase().replace(/[^a-záéíóúñ0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i = 0; i < words.length - 1; i++) set.add(`${words[i]} ${words[i + 1]}`);
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
const articles = snapshot.docs.map(doc => {
  const data = doc.data();
  const contenido = data.contenido || '';
  const plain = contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = data.palabras || (plain ? plain.split(' ').filter(w => w.length > 0).length : 0);
  return {
    id: doc.id,
    slug: data.slug || doc.id,
    titulo: data.titulo || '',
    resumen: data.resumen || data.metaDescription || data.metaDescripcion || '',
    contenido: data.contenido || '',
    plain,
    wordCount,
    imagen: data.imagen || '',
    categoria: data.categoria || '',
    estado: data.estado || 'publicado',
    noindex: data.noindex || false,
    scoreCalidad: data.scoreCalidad || 0,
    tags: Array.isArray(data.tags) ? data.tags : [],
    keywords: data.keywords || '',
    fecha: data.fecha,
    bigrams: bigrams(`${data.titulo || ''} ${data.resumen || ''} ${plain}`),
  };
});

const result = {
  total: articles.length,
  tooShort: [],
  noResumen: [],
  noImage: [],
  lowQuality: [],
  noTags: [],
  orphanEconomia: [],
  noindexArchive: [],
  genericImage: [],
  similarContent: [],
  emptyTitle: [],
  duplicateTitles: [],
};

const titleMap = {};
const textBigrams = new Map();

for (let i = 0; i < articles.length; i++) {
  const a = articles[i];

  // Filter only active articles for analysis
  if (a.estado === 'archivado' || a.noindex) {
    result.noindexArchive.push({ id: a.id, slug: a.slug, titulo: a.titulo, estado: a.estado, noindex: a.noindex });
    continue;
  }

  // Title duplicates
  const tk = a.titulo.trim().toLowerCase();
  if (tk) {
    if (!titleMap[tk]) titleMap[tk] = [];
    titleMap[tk].push(a.slug);
  }
  if (a.titulo.trim().length < 20) {
    result.emptyTitle.push({ id: a.id, slug: a.slug, titulo: a.titulo });
  }

  // Basic thresholds
  if (a.wordCount < MIN_WORDS) {
    result.tooShort.push({ id: a.id, slug: a.slug, titulo: a.titulo, wordCount: a.wordCount });
  }
  if (a.resumen.trim().length < MIN_RESUMEN_CHARS) {
    result.noResumen.push({ id: a.id, slug: a.slug, titulo: a.titulo, length: a.resumen.trim().length });
  }

  // Image quality
  const hasImage = a.imagen && a.imagen !== '/logo.webp' && a.imagen !== '/logo.png' && a.imagen !== '';
  if (!hasImage) {
    result.noImage.push({ id: a.id, slug: a.slug, titulo: a.titulo });
  } else if (a.imagen.includes('picsum.photos') || a.imagen.includes('unsplash') || a.imagen.includes('placeholder')) {
    result.genericImage.push({ id: a.id, slug: a.slug, titulo: a.titulo, imagen: a.imagen });
  }

  // Tags/keywords
  if (!a.tags.length && !a.keywords) {
    result.noTags.push({ id: a.id, slug: a.slug, titulo: a.titulo });
  }

  // Quality score
  if (a.scoreCalidad && a.scoreCalidad < LOW_QUALITY_THRESHOLD) {
    result.lowQuality.push({ id: a.id, slug: a.slug, titulo: a.titulo, scoreCalidad: a.scoreCalidad });
  }

  // Orphan Economía
  if (a.categoria === 'Economía') {
    result.orphanEconomia.push({ id: a.id, slug: a.slug, titulo: a.titulo });
  }

  // Duplicate titles (collect)
  textBigrams.set(i, a.bigrams);
}

// Find duplicate titles
result.duplicateTitles = Object.entries(titleMap)
  .filter(([_, sl]) => sl.length > 1)
  .map(([titulo, slugs]) => ({ titulo, count: slugs.length, slugs }));

// Find similar content (O(n²) but n<=208)
for (let i = 0; i < articles.length; i++) {
  for (let j = i + 1; j < articles.length; j++) {
    const sim = jaccard(textBigrams.get(i), textBigrams.get(j));
    if (sim >= SIMILARITY_THRESHOLD) {
      result.similarContent.push({
        a: { id: articles[i].id, slug: articles[i].slug, titulo: articles[i].titulo },
        b: { id: articles[j].id, slug: articles[j].slug, titulo: articles[j].titulo },
        similarity: Math.round(sim * 100) / 100,
      });
    }
  }
}

// Counts summary
const summary = {
  total: result.total,
  tooShort: result.tooShort.length,
  noResumen: result.noResumen.length,
  noImage: result.noImage.length,
  genericImage: result.genericImage.length,
  lowQuality: result.lowQuality.length,
  noTags: result.noTags.length,
  orphanEconomia: result.orphanEconomia.length,
  noindexArchive: result.noindexArchive.length,
  similarContent: result.similarContent.length,
  emptyTitle: result.emptyTitle.length,
  duplicateTitles: result.duplicateTitles.length,
};

const outPath = path.join(rootDir, '.audit', 'auditoria-contenido.json');
await fs.writeFile(outPath, JSON.stringify({ summary, result }, null, 2), 'utf8');

console.log('Audit complete:', JSON.stringify(summary, null, 2));
