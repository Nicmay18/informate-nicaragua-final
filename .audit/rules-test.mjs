// Test E2E de reglas desplegadas — SDK cliente ANÓNIMO (sin sesión).
// Busca 1 doc publicado y 1 no-publicado vía Admin SDK, luego prueba con SDK público.
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }));
const { initializeApp: initAdmin, cert } = await import('firebase-admin/app');
const { getFirestore: getAdminFs } = await import('firebase-admin/firestore');
const adminDb = getAdminFs(initAdmin({ credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))) }));

const pub = (await adminDb.collection('noticias').where('publicado', '==', true).limit(1).get()).docs[0];
const draft = (await adminDb.collection('noticias').where('publicado', '==', false).limit(1).get()).docs[0];
console.log(`publicado: ${pub.id} (${pub.data().slug}) | borrador: ${draft ? draft.id + ' (' + draft.data().slug + ')' : 'NO HAY'}`);

// SDK cliente anónimo
const { initializeApp } = await import('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = await import('firebase/firestore');
const app = initializeApp({
  apiKey: 'AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA',
  authDomain: 'informate-instant-nicaragua.firebaseapp.com',
  projectId: 'informate-instant-nicaragua',
});
const fs = getFirestore(app);

const tryOp = async (name, fn) => {
  try { await fn(); console.log(`${name}: ALLOW`); return 'ALLOW'; }
  catch (e) { console.log(`${name}: DENY (${e.code || e.message.slice(0, 60)})`); return 'DENY'; }
};

const r = [];
r.push(['público get publicado', await tryOp('público get publicado', () => getDoc(doc(fs, 'noticias', pub.id)))]);
if (draft) r.push(['público get borrador', await tryOp('público get borrador', () => getDoc(doc(fs, 'noticias', draft.id)))]);
r.push(['público list noticias', await tryOp('público list noticias', () => getDocs(collection(fs, 'noticias')))]);
r.push(['público list newsletter', await tryOp('público list newsletter', () => getDocs(collection(fs, 'newsletter')))]);
console.log('\nRESUMEN:', r.map(([n, s]) => `${n}=${s}`).join(' | '));
