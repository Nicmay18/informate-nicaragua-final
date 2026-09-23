import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const ids = ['CnHlW2RyUcpwlJBKeFug','IFFjvOi1HTG0oeiIuIBo','LFKxOjl36CtcbkmTiQuA','dPkDD0dcGtcngpCjk7W0','n64la9Hnrkp0sENv0z5U','nHdlNT1s7XRkdkYIEDKO','y8gWejnBZDoLhgYaRWlP'];
for (const id of ids) {
  const d = (await db.collection('noticias').doc(id).get()).data();
  const txt = String(d.contenido||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  console.log('\n===== '+id+' | '+d.titulo+' =====');
  console.log(txt.slice(0,1200));
}
