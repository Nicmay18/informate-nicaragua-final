import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap = await db.collection('noticias').get();
const PATTERNS=[
  /Todo ocurrió muy rápido, era evidente que la situación requería atención/i,
  /La comunidad estaba al tanto de lo que sucedía y algunos documentaron/i,
  /Esta zona ha visto situaciones similares y los vecinos están atentos/i,
  /presenció los hechos, relató a este medio/i,
  /Declaración de residente local/i,
  /testigo ocular manifestó/i,
  /motocicletacicleta/i,
  /personas personas/i,
  /el afectación/i,
];
let hits=0;
for (const doc of snap.docs) {
  const d=doc.data(); const c=String(d.contenido||'')+' '+String(d.titulo||'')+' '+String(d.resumen||'');
  const found=PATTERNS.filter(p=>p.test(c));
  if(found.length){hits++;console.log(doc.id+' | '+String(d.titulo).slice(0,50)+' | '+found.map(f=>f.source.slice(0,40)).join(';'));}
}
console.log('notas con residuos:',hits,'/',snap.size);
const q=await db.collection('editorial_review_queue').get();
const est={};for(const x of q.docs)est[x.data().estado]=(est[x.data().estado]||0)+1;
console.log('cola:',est);
