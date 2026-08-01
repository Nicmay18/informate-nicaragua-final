import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '..', 'scripts', 'cache');
const CACHE_FILE = join(CACHE_DIR, 'noticias-cache.json');

function serialize(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
      }
      if (value._seconds !== undefined && value._nanoseconds !== undefined) {
        return new Date(value._seconds * 1000 + value._nanoseconds / 1_000_000).toISOString();
      }
    }
    return value;
  });
}

function toCacheDocs(snap) {
  return snap.docs.map(doc => ({
    id: doc.id,
    data: doc.data(),
  }));
}

function toSnapshot(docs, db) {
  return {
    size: docs.length,
    docs: docs.map(d => ({
      id: d.id,
      data: () => d.data,
      ref: db.collection('noticias').doc(d.id),
    })),
  };
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export async function getCachedNoticias(db, forceRefresh = false) {
  if (!forceRefresh && existsSync(CACHE_FILE)) {
    const docs = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    console.log(`[cache] Usando ${docs.length} noticias desde caché local`);
    return toSnapshot(docs, db);
  }

  const snap = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const docs = toCacheDocs(snap);

  ensureCacheDir();
  writeFileSync(CACHE_FILE, JSON.stringify(docs, (k, v) => {
    if (v && typeof v === 'object' && v.toDate && typeof v.toDate === 'function') {
      return v.toDate().toISOString();
    }
    return v;
  }, 2), 'utf8');

  console.log(`[cache] Guardadas ${docs.length} noticias en caché local`);
  return toSnapshot(docs, db);
}
