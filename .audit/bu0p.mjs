import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const d = (await db.collection('noticias').doc('BU0PX0EqHO5ewLCH7Coo').get()).data();
console.log(String(d.contenido).replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
// también: escanear todos los titulares por errores de concordancia
const snap = await db.collection('noticias').get();
for (const doc of snap.docs) {
  const t = String(doc.data().titulo||'');
  if (/\bun[oa]?\s+personas\b|\bpersonas\b[^.]{0,40}\bafectados\b|afectadas y afectados|\bafectado\b[^.]{0,20}\bafectado\b/i.test(t))
    console.log('TITLE-ERR: '+doc.id+' | '+t);
}
