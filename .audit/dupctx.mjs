import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const ids = ['NTa3Gb797l9FINZ2E7RU','RCjqgw3ea2K6cZHXmbRV','3Zg8Q6OaaXEut0fA81CH','EyR39NNAk2XXXTSjhA9g','gPe3e3k6GAmgPpBJzGkX','pfeJ8II72gXqjriz7alv','y5k6UDnNuUmDRlBhGL2l','gXTkMry6uueR9BxXcTdF','phUuAtrQ4H3qV4heuZlH'];
for (const id of ids) {
  const d = (await db.collection('noticias').doc(id).get()).data();
  const txt = String(d.contenido||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  for (const m of txt.matchAll(/\b([a-záéíóúñüA-ZÁÉÍÓÚÑ]{4,})\s+\1\b/g)) {
    const i = m.index;
    console.log(`${id.slice(0,8)} | ...${txt.slice(Math.max(0,i-70), i+m[0].length+70)}...`);
  }
}
