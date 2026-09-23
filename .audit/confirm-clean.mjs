import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
for (const id of ['R2zQFsmjsu0NvFRU7tDa','y8gWejnBZDoLhgYaRWlP','BU0PX0EqHO5ewLCH7Coo','n64la9Hnrkp0sENv0z5U']) {
  const d=(await db.collection('noticias').doc(id).get()).data();
  const c=String(d.contenido);
  console.log(id,'| fakeQuote:',/testigo ocular|residente local|presenció los hechos/.test(c),'| personas personas:',/personas personas/.test(c),'| motocicletacicleta:',/motocicletacicleta/.test(c),'| el afectación:',/el afectación/.test(c),'| titulo:',String(d.titulo).slice(0,60));
}
const q=await db.collection('editorial_review_queue').where('estado','==','PENDING').count().get();
console.log('PENDING en cola:',q.data().count);
