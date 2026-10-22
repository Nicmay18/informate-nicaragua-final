// Rectificación de errores propios de la fase-1 + corrección de eufemismo residual.
import { readFileSync, writeFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter((l) => l.includes('=') && !l.startsWith('#'))
  .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) });
const db = getFirestore();

const FIXES = [
  {
    slug: 'dos-muertos-y-dos-heridos-en-accidentes-laborales-en-nicaragua',
    find: 'Cuatro obreros muertos en accidentes laborales en Nicaragua',
    replace: 'Dos obreros muertos y dos heridos en accidentes laborales en Nicaragua',
    motivo: 'Rectificación de error de fase-1: el artículo reporta 2 fallecidos + 2 lesionados; "afectados" cubría a los 4 y la regla TIT_NOMBRE lo convirtió erróneamente en "cuatro muertos".',
  },
  {
    slug: 'tres-ataques-de-pitbull-en-nicaragua-dejan-tres-lesionados',
    find: 'tres afectados',
    replace: 'tres lesionados',
    motivo: 'Eufemismo residual en título: slug y hecho comprometen 3 lesionados, no muertos.',
  },
];

const log = [];
for (const f of FIXES) {
  const snap = await db.collection('noticias').where('slug', '==', f.slug).limit(1).get();
  if (snap.empty) { log.push({ slug: f.slug, error: 'no encontrado' }); continue; }
  const d = snap.docs[0];
  const t = String(d.data().titulo || '');
  if (!t.toLowerCase().includes(f.find.toLowerCase())) {
    log.push({ slug: f.slug, estado: 'TITULO_NO_COINCIDE', titulo: t });
    console.log('skip', f.slug, '→', t);
    continue;
  }
  const nuevo = t.replace(new RegExp(f.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), f.replace);
  await d.ref.update({
    titulo: nuevo,
    requiresReevaluation: true,
    'reparacionForense.rectificacion': { fecha: new Date().toISOString(), motivo: f.motivo },
  });
  log.push({ slug: f.slug, antes: t, despues: nuevo, motivo: f.motivo });
  console.log('corregido:', f.slug, '→', nuevo);
}
writeFileSync('.audit/repair-rectificacion-log.json', JSON.stringify(log, null, 1));
process.exit(0);
