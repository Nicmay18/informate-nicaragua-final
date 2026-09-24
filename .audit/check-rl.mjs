import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
for(const id of ['9xCHaZO7JEwhyRpdHHJY','xaEUqIpn5aFqjar7b4nv']){
  const d=(await db.collection('noticias').doc(id).get()).data();
  const t=String(d.contenido||'');
  console.log('=== '+id+' | '+d.titulo);
  for(const m of t.matchAll(/.{120}residente local.{200}/gis))console.log('...'+m[0].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')+'...\n---');
}
