import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
for (const id of ['R2zQFsmjsu0NvFRU7tDa','y8gWejnBZDoLhgYaRWlP']) {
  const d=(await db.collection('noticias').doc(id).get()).data();
  const h=String(d.contenido);
  for (const m of h.matchAll(/.{0,60}(testigo ocular|residente local|presenció los hechos).{0,220}/gs)) console.log(id+' RAW:',m[0].slice(0,280));
}
