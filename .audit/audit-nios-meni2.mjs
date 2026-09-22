// READ-ONLY. Segunda pasada: antigüedad de colas atascadas + estados operacionales.
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const credential = env.FIREBASE_SERVICE_ACCOUNT_BASE64
  ? cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')))
  : cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') });
const db = getFirestore(initializeApp({ credential }));

const toMs = (v) => {
  if (v == null) return null;
  if (v instanceof Timestamp) return v.toDate().getTime();
  if (typeof v === 'object' && v._seconds) return v._seconds * 1000;
  const t = Date.parse(String(v)); return Number.isNaN(t) ? null : t;
};
const dias = (ms) => (ms == null ? null : Math.round((Date.now() - ms) / 86400000));
const out = {};

// nios_actions PENDING: ¿desde cuándo?
const acts = await db.collection('nios_actions').get();
const pend = [];
for (const d of acts.docs) {
  const x = d.data();
  if (x.status === 'PENDING') pend.push({ kind: x.kind, dias: dias(toMs(x.createdAt || x.proposedAt)), expiresAt: x.expiresAt ? dias(toMs(x.expiresAt)) : null });
}
const buckets = {};
for (const p of pend) { const b = p.dias == null ? 'sin fecha' : p.dias > 30 ? '>30d' : p.dias > 7 ? '8-30d' : p.dias > 1 ? '2-7d' : '<=1d'; buckets[b] = (buckets[b] || 0) + 1; }
out.acciones_pending_antiguedad = { total: pend.length, buckets, masVieja: Math.max(...pend.map((p) => p.dias ?? 0)) };

// operational_approval: estados
const mem = await db.collection('nios_memory').get();
const apr = {}, inc = {}, sinKind = {};
for (const d of mem.docs) {
  const x = d.data();
  if (x.kind === 'operational_approval') apr[x.status || x.state || 'SIN'] = (apr[x.status || x.state || 'SIN'] || 0) + 1;
  if (x.kind === 'operational_incident') inc[x.status || x.state || 'SIN'] = (inc[x.status || x.state || 'SIN'] || 0) + 1;
  if (!x.kind) { const k = Object.keys(x).slice(0, 4).join(','); sinKind[k] = (sinKind[k] || 0) + 1; }
}
out.operational_approval_estados = apr;
out.operational_incident_estados = inc;
out.nios_memory_sinKind_forma = sinKind;

// ceo_loop: autonomyReport real
const loops = await db.collection('nios_memory').where('kind', '==', 'ceo_loop').limit(60).get();
const rep = {}; let conEvidencia = 0;
for (const d of loops.docs) {
  const x = d.data();
  const r = x.autonomyReport || x.autonomy?.report || x.payload?.autonomyReport || 'SIN_CAMPO';
  rep[r] = (rep[r] || 0) + 1;
  if (x.autonomyEvidence || x.autonomy?.evidence || x.payload?.autonomyEvidence) conEvidencia++;
}
out.ceo_loop_autonomy = { muestreados: loops.size, reportes: rep, conEvidencia };

// noticias: notas con score<90 (las que MENI castigó) y sus rasgos
const nots = await db.collection('noticias').get();
const bajas = [];
for (const d of nots.docs) {
  const x = d.data();
  const s = x.scoreMeni ?? x.meniScore ?? x.scoreFinal;
  if (typeof s === 'number' && s < 90) {
    const pal = x.palabras || (x.contenido ? String(x.contenido).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length : 0);
    bajas.push({ id: d.id, score: s, cat: x.categoria, palabras: pal, publicado: x.publicado === true && x.estado === 'publicado', titulo: String(x.titulo || '').slice(0, 60) });
  }
}
out.notas_score_bajo = { total: bajas.length, publicadas: bajas.filter((b) => b.publicado).length, muestra: bajas.slice(0, 15) };

// ¿cuántas notas publicadas tienen aprobadoMeni=false? (publicadas pese a rechazo)
let pubSinAprobar = 0;
for (const d of nots.docs) {
  const x = d.data();
  if (x.publicado === true && x.estado === 'publicado' && x.archived !== true && x.aprobadoMeni !== true) pubSinAprobar++;
}
out.publicadas_sin_aprobacion_meni = pubSinAprobar;

console.log(JSON.stringify(out, null, 2));
