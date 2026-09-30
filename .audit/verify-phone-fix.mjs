// Verificación post-fix: relee los 2 docs y confirma.
import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) }));

const slugs = ['tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada', 'accidentes-dejan-varios-lesionados-en-managua-leon-y-bilwi'];
const report = [];
for (const slug of slugs) {
  const s = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
  const x = s.docs[0].data();
  const html = x.contenido || '';
  const r = {
    id: s.docs[0].id, slug,
    fijos505: (html.match(/505-2228-\d{4}/g) || []).length,
    p118: html.includes('118'), p115: html.includes('115'), p128: html.includes('128'),
    cruzBlanca: /cruz blanca/i.test(html),
    fixMarker: x.editorialCorrecciones?.emergenciaFix || null,
    emergBlock: html.match(/<p>[^<]*(?:Polic|Bomberos|Cruz)[^<]*<\/p>/g)?.slice(-3) || [],
  };
  console.log(JSON.stringify(r, null, 1));
  report.push(r);
}
// escaneo global: ningún otro doc con 505-2228
const all = await db.collection('noticias').where('publicado', '==', true).get();
const rest = all.docs.filter(d => /505-2228-\d{4}/.test(d.data().contenido || ''));
console.log(`\nDocs restantes con 505-2228: ${rest.length}`);
writeFileSync('.audit/phone-fix-verified.json', JSON.stringify(report, null, 2));
