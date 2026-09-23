import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const q = await db.collection('editorial_review_queue').get();
console.log('Docs en cola:', q.size);
const porTipo={}, porEstado={};
for (const d of q.docs) { const x=d.data(); porTipo[x.tipoProblema]=(porTipo[x.tipoProblema]||0)+1; porEstado[x.estado]=(porEstado[x.estado]||0)+1; }
console.log(porTipo, porEstado);
// sample
for (const d of q.docs.slice(0,3)) console.log(JSON.stringify(d.data()).slice(0,400));
