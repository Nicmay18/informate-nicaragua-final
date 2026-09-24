import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
for(const id of ['ksmI7JomnHgJB6NKcA71','NA6PqCReq06PdIMSICEe','023LnrGSslRkXP9djUAW','0Cf8O7fK6djImEYZbhXJ','ziYWYRi5TOLyNu645cTY']){
  const d=(await db.collection('noticias').doc(id).get()).data();
  const t=String(d.contenido||'');
  console.log('=== '+id+' | '+String(d.titulo).slice(0,55));
  for(const m of t.matchAll(/<li>[^<]{0,80}/g))console.log('  LI: '+m[0]);
  for(const m of t.matchAll(/.{60}(indicó|comentó) un (residente|vecino|testigo|transeúte)[^<]{0,80}/gi))console.log('  ATTR: ...'+m[0]);
}
