import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap = await db.collection('noticias').get();
// Citas atribuidas a figuras genéricas sin nombre: vecino/testigo/residente/poblador/familiar "que presenció/estaba presente" + verbo + comillas
const RE = /(un[a]? (vecino|vecina|testigo|residente|poblador|habitante|familiar|transeúnte|ciudadano)[^."]{0,80}?(comentó|manifestó|dijo|relató|aseguró|expresó|declaró|afirmó)[:.]?\s*["“])/gi;
const RE2 = /declaración de (residente|un residente|un vecino|testigo)[^:"]{0,60}:/gi;
for (const doc of snap.docs) {
  const d = doc.data();
  const txt = String(d.contenido||'');
  const plain = txt.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  const hits=[];
  for (const m of plain.matchAll(RE)) hits.push(m[0].slice(0,140));
  for (const m of plain.matchAll(RE2)) hits.push('HDR: '+m[0].slice(0,120));
  if (hits.length) console.log(doc.id+' | '+String(d.titulo).slice(0,55)+' | '+hits.join(' ~~ '));
}
