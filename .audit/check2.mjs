import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
for (const id of ['Pf0VvjOfwZNm7BnQpncl','y8gWejnBZDoLhgYaRWlP']) {
  const doc = await db.collection('noticias').doc(id).get();
  const d = doc.data();
  const txt = String(d.contenido||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  console.log('=== '+d.titulo+' ===');
  for (const s of txt.split(/(?<=[.!?])\s+/)) {
    if (/investig|confirm/i.test(s) && s.length>25) console.log('[C/I] '+s.slice(0,300));
    if (/robó|mató|asesinó|violó|estafó|secuestró|atropelló/i.test(s)) console.log('[DELITO] '+s.slice(0,300));
  }
}
