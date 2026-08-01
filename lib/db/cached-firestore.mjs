import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '..', 'scripts', 'cache');
const CACHE_FILE = join(CACHE_DIR, 'noticias-cache.json');
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

function isCacheFresh() {
  try {
    const { mtime } = statSync(CACHE_FILE);
    return Date.now() - mtime.getTime() < CACHE_TTL_MS;
  } catch {
    return false;
  }
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
  if (!forceRefresh && existsSync(CACHE_FILE) && isCacheFresh()) {
    const docs = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
    console.log(`[cache] Usando ${docs.length} noticias desde caché local`);
    return toSnapshot(docs, db);
  }

  if (existsSync(CACHE_FILE) && !isCacheFresh()) {
    console.log('[cache] Caché expirada, refrescando desde Firestore');
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
