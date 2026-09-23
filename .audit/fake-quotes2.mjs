import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap = await db.collection('noticias').get();
// Cuarta plantilla: testigo genérico con nombre inventado que "relató lo
// ocurrido y proporcionó detalles" sin decir nada — boilerplate idéntico.
const RE = /María López, vecina del barrio que presenció los hechos, relató a este medio lo ocurrido y proporcionó detalles de la situación\.?/g;
// Patrones afines por si existen otras variantes del boilerplate
const RE2 = /(vecin[oa]s? del barrio que presenció los hechos|testigo ocular manifestó|residente local:|presenció los hechos, relató a este medio)/gi;
for (const doc of snap.docs) {
  const d = doc.data();
  const c = String(d.contenido||'');
  const n1 = (c.match(RE)||[]).length;
  const n2 = new Set([...c.matchAll(RE2)].map(m=>m[0].toLowerCase().slice(0,40))).size;
  if (n1||n2) console.log(doc.id+' | '+String(d.titulo).slice(0,55)+' | exactos:'+n1+' | variantes:'+n2+' | pub:'+d.publicado);
}
