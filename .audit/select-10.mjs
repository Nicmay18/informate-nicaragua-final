// Selección de 10 noticias reales — solo lectura.
// Uso: node .audit/select-10.mjs
import { readFileSync, writeFileSync } from 'fs';

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

const snap = await db.collection('noticias').get();
const rows = snap.docs.map(d => {
  const x = d.data();
  return {
    id: d.id,
    slug: x.slug || '',
    categoria: x.categoria || '',
    titulo: (x.titulo || '').substring(0, 90),
    fecha: x.fecha?.toDate ? x.fecha.toDate().toISOString() : String(x.fecha || ''),
    publicado: x.publicado === true,
    estado: x.estado || '',
    aprobadoMeni: x.aprobadoMeni,
    scoreMeni: x.scoreMeni,
    supervisorVerdict: x.supervisorDecision?.verdict || '',
    supervisorApproved: x.supervisorApproved,
    requiresReevaluation: x.requiresReevaluation === true,
    editorialState: x.editorialState || '',
    mutationLog: Array.isArray(x.mutationLog) ? x.mutationLog.length : 0,
    hasLifecycle: false, // filled below
    distribuida: x.distribuida === true,
    palabras: x.palabras || 0,
    contentLen: (x.contenido || '').length,
    contentHash: x.contentHash || '',
    meniVersion: x.meniVersion || '',
    hasResearch: !!x.research,
    hasStory: !!x.story,
  };
});
rows.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

// lifecycles existentes
const lc = await db.collection('article_lifecycles').get();
const lcIds = new Set(lc.docs.map(d => d.id));
for (const r of rows) r.hasLifecycle = lcIds.has(r.id);

writeFileSync('.audit/corpus-10.json', JSON.stringify(rows, null, 2));
console.log(`total: ${rows.length}`);
// resumen por categoría (publicadas)
const byCat = {};
for (const r of rows.filter(r => r.publicado)) {
  byCat[r.categoria] = (byCat[r.categoria] || 0) + 1;
}
console.log('por categoría (publicadas):', JSON.stringify(byCat, null, 1));
