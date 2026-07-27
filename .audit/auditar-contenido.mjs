/**
 * Audit script: detecta noticias de bajo contenido en Firestore
 * Uso: npx node .audit/auditar-contenido.mjs
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

const MIN_WORDS = 150;
const MIN_RESUMEN_CHARS = 60;

const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').limit(500).get();
const articles = snapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: doc.id,
    slug: data.slug || doc.id,
    titulo: data.titulo || '',
    resumen: data.resumen || data.metaDescription || data.metaDescripcion || '',
    contenido: data.contenido || '',
    imagen: data.imagen || '',
    categoria: data.categoria || '',
    estado: data.estado || 'publicado',
    noindex: data.noindex || false,
    palabras: data.palabras || 0,
    fecha: data.fecha,
  };
});

const result = {
  total: articles.length,
  thinContent: [],
  noResumen: 0,
  noImage: 0,
  tooShort: 0,
  duplicatedTitles: [],
  orphanEconomia: 0,
};

const titleMap = {};

for (const a of articles) {
  if (a.estado === 'archivado' || a.noindex) continue;

  const plain = a.contenido.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = a.palabras || plain.split(' ').filter(w => w.length > 0).length;
  const resumenLength = a.resumen.trim().length;
  const hasImage = a.imagen && a.imagen !== '/logo.webp' && a.imagen !== '/logo.png' && !a.imagen.includes('picsum.photos');
  const reasons = [];

  if (wordCount < MIN_WORDS) { reasons.push(`Solo ${wordCount} palabras`); result.tooShort++; }
  if (resumenLength < MIN_RESUMEN_CHARS) { reasons.push(`Resumen corto (${resumenLength} chars)`); result.noResumen++; }
  if (!hasImage) { reasons.push('Sin imagen propia'); result.noImage++; }
  if (a.categoria === 'Economía') { reasons.push('Categoría Economía'); result.orphanEconomia++; }

  if (reasons.length > 0) {
    result.thinContent.push({
      id: a.id,
      slug: a.slug,
      titulo: a.titulo,
      categoria: a.categoria,
      wordCount,
      resumenLength,
      hasImage: !!hasImage,
      reasons,
    });
  }

  const tk = a.titulo.trim().toLowerCase();
  if (tk) {
    if (!titleMap[tk]) titleMap[tk] = [];
    titleMap[tk].push(a.slug);
  }
}

result.duplicatedTitles = Object.entries(titleMap)
  .filter(([_, sl]) => sl.length > 1)
  .map(([titulo, slugs]) => ({ titulo, count: slugs.length, slugs }));

result.thinContent.sort((a, b) => a.wordCount - b.wordCount);

const outPath = path.join(rootDir, '.audit', 'auditoria-contenido.json');
await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');

console.log('Audit complete:', JSON.stringify({
  total: result.total,
  flagged: result.thinContent.length,
  tooShort: result.tooShort,
  noImage: result.noImage,
  noResumen: result.noResumen,
  orphanEconomia: result.orphanEconomia,
  duplicatedTitles: result.duplicatedTitles.length,
}, null, 2));
