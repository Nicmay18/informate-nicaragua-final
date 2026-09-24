import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap=await db.collection('noticias').get();
// corpus scan for 5th template family
const hits=[];
for(const doc of snap.docs){
  const t=String(doc.data().contenido||'');
  const n=(t.match(/recabado por la redacci/gi)||[]).length + (t.match(/indicó un residente local/gi)||[]).length + (t.match(/transeúte que captó/gi)||[]).length;
  if(n)hits.push(doc.id+' x'+n+' | '+String(doc.data().titulo||'').slice(0,50));
}
console.log('NOTAS CON PLANTILLA-5:',hits.length); hits.forEach(h=>console.log('  '+h));
console.log('\n=== RAW xaEUq ===');
const d1=(await db.collection('noticias').doc('xaEUqIpn5aFqjar7b4nv').get()).data();
const t1=String(d1.contenido);
const i1=t1.indexOf('recabado');
console.log(t1.slice(Math.max(0,i1-300),i1+900));
console.log('\n=== RAW 9xCH (enlaces rotos) ===');
const d2=(await db.collection('noticias').doc('9xCHaZO7JEwhyRpdHHJY').get()).data();
const t2=String(d2.contenido);
const i2=t2.indexOf('También te puede interesar');
console.log(t2.slice(Math.max(0,i2-200),i2+700));
