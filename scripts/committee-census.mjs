// Read-only census + editorial classification of all 'noticias' docs.
// Usage: node scripts/committee-census.mjs > census-output.json
// Rules are deterministic and NON-destructive: produces CANDIDATE classes only.
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
let credential;
if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  credential = cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')));
} else {
  credential = cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
}
const db = getFirestore(initializeApp({ credential }));

const toIso = (v) => {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  return Number.isNaN(Date.parse(s)) ? s : new Date(Date.parse(s)).toISOString();
};
const canonMs = (d) => {
  const s = toIso(d.publishedAt) || toIso(d.fechaPublicacion) || toIso(d.fecha);
  const t = s ? Date.parse(s) : NaN;
  return Number.isNaN(t) ? 0 : t;
};
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => stripHtml(s).split(' ').filter(Boolean).length;
const normTitle = (t) => stripHtml(t).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

const snap = await db.collection('noticias').get();
const NOW = Date.now();
const DAY = 86400000;

const rows = snap.docs.map((doc) => {
  const d = doc.data();
  const contenidoWords = d.palabras || words(d.contenido);
  const resumenWords = words(d.resumen);
  const published = d.publicado === true && d.estado === 'publicado' && d.archived !== true;
  const ms = canonMs(d);
  return {
    id: doc.id,
    slug: d.slug || null,
    titulo: stripHtml(d.titulo),
    categoria: d.categoria || 'Sin categoría',
    departamento: d.departamento || null,
    estado: d.estado || null,
    publicado: d.publicado,
    archived: d.archived === true,
    aprobadoMeni: d.aprobadoMeni,
    published,
    nivel: d.nivel || null,
    nivelScore: d.nivelScore ?? null,
    fecha: ms ? new Date(ms).toISOString() : null,
    ageDays: ms ? Math.round((NOW - ms) / DAY) : null,
    futureDated: ms > NOW + DAY,
    words: contenidoWords,
    resumenWords,
    hasImagen: Boolean(d.imagen || d.imagenDestacada),
    imagenPicsum: /picsum/i.test(String(d.imagen || '')),
    vistas: d.vistas || 0,
    destacada: d.destacada === true,
    autor: d.autor || null,
    keywords: Boolean(d.keywords),
    normTitle: normTitle(d.titulo),
  };
});

// ---- Detect duplicates (normalized title) ----
const byTitle = new Map();
for (const r of rows) {
  if (!r.normTitle) continue;
  if (!byTitle.has(r.normTitle)) byTitle.set(r.normTitle, []);
  byTitle.get(r.normTitle).push(r.id);
}
const dupGroups = [...byTitle.values()].filter((g) => g.length > 1);
const dupIds = new Set(dupGroups.flat());

const bySlug = new Map();
for (const r of rows) {
  if (!r.slug) continue;
  if (!bySlug.has(r.slug)) bySlug.set(r.slug, []);
  bySlug.get(r.slug).push(r.id);
}
const dupSlugGroups = [...bySlug.values()].filter((g) => g.length > 1);

// ---- Classification (deterministic, candidates only) ----
// Priority order. Nothing is deleted/unpublished automatically.
function classify(r) {
  if (r.words < 30 || !r.titulo) return 'ELIMINAR'; // datos rotos: sin contenido real
  if (r.published && (r.futureDated || r.words < 100)) return 'DESPUBLICAR'; // publicada pero defectuosa
  if (dupIds.has(r.id) && r.published) return 'ACTUALIZAR'; // duplicada: unificar/redirect
  if (r.archived || r.estado === 'archivado') return 'ARCHIVAR';
  if (!r.published) return r.words >= 350 ? 'RECUPERAR' : 'ARCHIVAR'; // borradores
  if (r.words < 200) return 'PULIR'; // thin content publicado
  if (!r.hasImagen || r.imagenPicsum || r.resumenWords < 15) return 'PULIR';
  if (r.nivel === 'RECHAZADO' || (r.nivelScore != null && r.nivelScore < 50)) return 'PULIR';
  if (r.ageDays != null && r.ageDays > 120 && r.vistas === 0) return 'ACTUALIZAR'; // revisar vigencia
  return 'CONSERVAR';
}
for (const r of rows) r.class = classify(r);

const counts = {};
for (const r of rows) counts[r.class] = (counts[r.class] || 0) + 1;

const byCategory = {};
for (const r of rows) {
  byCategory[r.categoria] = byCategory[r.categoria] || { total: 0, published: 0, thin: 0 };
  byCategory[r.categoria].total++;
  if (r.published) byCategory[r.categoria].published++;
  if (r.words < 200) byCategory[r.categoria].thin++;
}

const buckets = { '0-100': 0, '100-200': 0, '200-350': 0, '350-600': 0, '600-1000': 0, '1000+': 0 };
for (const r of rows) {
  if (r.words < 100) buckets['0-100']++;
  else if (r.words < 200) buckets['100-200']++;
  else if (r.words < 350) buckets['200-350']++;
  else if (r.words < 600) buckets['350-600']++;
  else if (r.words < 1000) buckets['600-1000']++;
  else buckets['1000+']++;
}

const summary = {
  total: rows.length,
  published: rows.filter((r) => r.published).length,
  draftsOrOther: rows.filter((r) => !r.published).length,
  inconsistentFlags: rows.filter(
    (r) => r.estado === 'publicado' && (r.publicado === false || r.archived)
  ).length,
  futureDated: rows.filter((r) => r.futureDated).length,
  missingSlug: rows.filter((r) => !r.slug).length,
  missingImagen: rows.filter((r) => !r.hasImagen).length,
  picsumPlaceholder: rows.filter((r) => r.imagenPicsum).length,
  missingResumen: rows.filter((r) => r.resumenWords < 15).length,
  missingDate: rows.filter((r) => !r.fecha).length,
  duplicateTitleGroups: dupGroups.length,
  duplicateSlugGroups: dupSlugGroups.length,
  zeroViews: rows.filter((r) => r.vistas === 0).length,
  wordBuckets: buckets,
  byCategory,
  classification: counts,
};

const lists = {};
for (const cls of ['CONSERVAR', 'PULIR', 'ACTUALIZAR', 'RECUPERAR', 'ARCHIVAR', 'DESPUBLICAR', 'ELIMINAR']) {
  lists[cls] = rows
    .filter((r) => r.class === cls)
    .map((r) => ({ id: r.id, slug: r.slug, titulo: r.titulo.slice(0, 80), categoria: r.categoria, fecha: r.fecha, words: r.words, estado: r.estado, nivel: r.nivel }));
}

console.log(JSON.stringify({ summary, dupGroups, dupSlugGroups, lists }, null, 1));
await db.terminate();
