import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const d=(await db.collection('noticias').doc('AQiSAE7CeGLS9n5AvpzG').get()).data();
console.log(Object.keys(d).join(', '));
console.log('origen:',JSON.stringify({fuente:d.fuente,origen:d.origen,autor:d.autor,generadoPor:d.generadoPor||d.generatedBy,creadoPor:d.creadoPor,meni:d.meni?Object.keys(d.meni):null}));
