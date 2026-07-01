import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const snap = await db.collection('noticias').get();
const total = snap.size;
let conLinks = 0, conFuentes = 0, titulosOpt = 0, metaOpt = 0;

snap.docs.forEach(d => {
  const data = d.data();
  const c = data.contenido || '';
  const t = (data.titulo || '').trim();
  const r = (data.resumen || '').trim();
  const linksEnC = (c.match(/href="\/noticias\//gi) || []).length;
  const tieneRL = data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0;
  if (linksEnC >= 1 || tieneRL) conLinks++;
  const linksExt = (c.match(/href="https?:\/\//gi) || []).length;
  const bq = (c.match(/<blockquote>/gi) || []).length;
  if (linksExt >= 1 || bq >= 1) conFuentes++;
  if (t.length >= 30 && t.length <= 65) titulosOpt++;
  if (r.length >= 120 && r.length <= 160) metaOpt++;
});

const sLinks = Math.round(conLinks / total * 100);
const sFuentes = Math.round(conFuentes / total * 100);
const sTit = Math.round(titulosOpt / total * 100);
const sMeta = Math.round(metaOpt / total * 100);
const sEeat = Math.round(30 + Math.min(40, (conFuentes + 66) / total * 40) + 30);
const sDom = Math.round(25 + 15 + 15 + 10 + sTit * 0.10 + sMeta * 0.10 + sLinks * 0.10 + sEeat * 0.05);
const sM = Math.round(sDom * 0.35 + sEeat * 0.20 + 100 * 0.15 + sTit * 0.10 + sMeta * 0.10 + sLinks * 0.10);

console.log(`Links: ${sLinks}%  E-E-A-T: ${sEeat}  Titulos: ${sTit}%  Meta: ${sMeta}%`);
console.log(`Dominio: ${sDom}  MAESTRO: ${sM}`);
