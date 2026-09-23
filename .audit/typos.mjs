import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap = await db.collection('noticias').get();
const RE_DUPWORD = /\b([a-záéíóúñü]{4,})\s+\1\b/gi;           // "la la", "policia policia"
const RE_OVERLAP = /\b\w*?([a-záéíóúñ]{5,})\1\w*\b/gi;       // "motocicletacicletas"
for (const doc of snap.docs) {
  const d = doc.data();
  const txt = `${d.titulo||''} ${String(d.contenido||'').replace(/<[^>]+>/g,' ')}`;
  const hits = new Set();
  for (const m of txt.matchAll(RE_DUPWORD)) hits.add('DUP: '+m[0]);
  for (const m of txt.matchAll(RE_OVERLAP)) hits.add('OVERLAP: '+m[0]);
  if (hits.size) console.log(`${doc.id} | ${d.titulo} | ${[...hits].join(' ; ')}`);
}
