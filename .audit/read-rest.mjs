import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const w = JSON.parse(readFileSync('.audit/review-worklist.json','utf8'));
const temporal = w.filter(x=>x.tipo==='temporal_ambigua').map(x=>x.slug);
const institucionales = ['i88RK0Ulgkkzyq6YV4Um','gaCpaA49whA70rqyWBow','7XzL7aTqVYBpTNKgSPxQ','yVuoBkFOUU3OTJTMgv5l','SG87LjFIgCWnd6g8EKDq','2Ufakm1AGqtU7ZBAoERn','R2zQFsmjsu0NvFRU7tDa','BU0PX0EqHO5ewLCH7Coo'];
for (const id of [...temporal, ...institucionales]) {
  const d = (await db.collection('noticias').doc(id).get()).data();
  if (!d) { console.log(id+' NO EXISTE'); continue; }
  const txt = String(d.contenido||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  const pub = d.fechaPublicacion?.toDate?.() ?? d.fecha ?? d.createdAt;
  console.log('\n=== '+id+' | '+String(d.titulo).slice(0,60)+' | pub:'+String(pub).slice(0,24));
  console.log(txt.slice(0,380));
}
