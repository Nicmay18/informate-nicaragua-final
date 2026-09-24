import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap=await db.collection('noticias').get();
for(const doc of snap.docs){
  const s=String(doc.data().slug||''), t=String(doc.data().titulo||'');
  if(/cinco|cuatro-nicaraguenses/i.test(s)||/Cinco afectados|Cuatro nicarag/i.test(t))
    console.log(doc.id+' | '+s+' | '+t.slice(0,60));
}
