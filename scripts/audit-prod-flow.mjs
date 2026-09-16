// Read-only Firestore audit for the publication flow.
// Usage: node scripts/audit-prod-flow.mjs
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

const typeOf = (v) =>
  v == null ? 'missing' : v instanceof Timestamp ? 'timestamp' : v instanceof Date ? 'date' : typeof v;
const toIso = (v) => {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return String(v);
};
const canonMs = (d) => {
  const s = toIso(d.publishedAt) || toIso(d.fechaPublicacion) || toIso(d.fecha);
  const t = s ? Date.parse(s) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

const snap = await db.collection('noticias').get();
console.log('TOTAL DOCS:', snap.size);

const combos = {};
const fechaTypes = {};
const rows = [];
for (const doc of snap.docs) {
  const d = doc.data();
  const estado = d.estado ?? (d.publicado === false ? 'borrador' : d.publicado === true ? 'publicado' : 'MISSING');
  const combo = `estado=${String(d.estado)}|publicado=${String(d.publicado)}|archived=${String(d.archived)}|aprobadoMeni=${String(d.aprobadoMeni)}`;
  combos[combo] = (combos[combo] || 0) + 1;
  const ft = typeOf(d.fecha);
  fechaTypes[ft] = (fechaTypes[ft] || 0) + 1;
  rows.push({
    id: doc.id,
    slug: d.slug,
    titulo: (d.titulo || '').slice(0, 70),
    estado: d.estado,
    publicado: d.publicado,
    aprobadoMeni: d.aprobadoMeni,
    archived: d.archived,
    categoria: d.categoria,
    fechaT: ft,
    fecha: toIso(d.fecha),
    publishedAt: toIso(d.publishedAt),
    canon: canonMs(d),
  });
}

console.log('\n=== COMBINACIONES estado|publicado|archived|aprobadoMeni ===');
Object.entries(combos).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`${v}\t${k}`));
console.log('\n=== TIPOS DE campo fecha ===', fechaTypes);

// Inconsistencias: publicado=true pero estado!=publicado, o estado=publicado pero publicado!=true
const inconsistent = rows.filter(
  (r) => (r.publicado === true && r.estado !== 'publicado') || (r.estado === 'publicado' && r.publicado !== true)
);
console.log(`\n=== INCONSISTENTES estado/publicado: ${inconsistent.length} ===`);
inconsistent.slice(0, 30).forEach((r) =>
  console.log(` ${r.id} | estado=${r.estado} publicado=${r.publicado} meni=${r.aprobadoMeni} | ${r.fecha} | ${r.titulo}`)
);

// Publicados segun filtro canonico (estado==publicado && publicado===true && aprobadoMeni===true && !archived)
const publicPool = rows.filter(
  (r) => r.estado === 'publicado' && r.publicado === true && r.aprobadoMeni === true && r.archived !== true
);
console.log(`\n=== POOL PUBLICO CANONICO: ${publicPool.length} ===`);
publicPool.sort((a, b) => b.canon - a.canon);
console.log('Top 15 por fecha canonica:');
publicPool.slice(0, 15).forEach((r) =>
  console.log(` ${r.fechaT.padEnd(9)} canon=${new Date(r.canon).toISOString()} | ${r.categoria} | ${r.titulo}`)
);

// Lo que orderBy('fecha','desc') devolveria realmente en Firestore (orden por tipo)
const qDesc = await db.collection('noticias').where('estado', '==', 'publicado').orderBy('fecha', 'desc').limit(15).get();
console.log('\n=== orderBy(fecha,desc) estado=publicado — top 15 RAW (orden real Firestore) ===');
for (const doc of qDesc.docs) {
  const d = doc.data();
  console.log(` ${typeOf(d.fecha).padEnd(9)} ${toIso(d.fecha)} | pub=${d.publicado} meni=${d.aprobadoMeni} | ${(d.titulo || '').slice(0, 60)}`);
}
process.exit(0);
