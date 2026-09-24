import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap=await db.collection('noticias').get();
const rotos=[];
for(const doc of snap.docs){
  const t=String(doc.data().contenido||'');
  const m=t.match(/<li>[a-z0-9-]{6,}">/g);
  if(m)rotos.push(doc.id+' | '+String(doc.data().titulo||'').slice(0,40)+' | '+m.join(' '));
}
console.log('LI REALMENTE ROTOS:',rotos.length); rotos.slice(0,10).forEach(r=>console.log('  '+r));
console.log('\n=== ATRIBUCIONES UN HIT ===');
for(const id of ['ksmI7JomnHgJB6NKcA71','NA6PqCReq06PdIMSICEe']){
  const d=(await db.collection('noticias').doc(id).get()).data();
  console.log('--- '+id+' | '+d.titulo);
  for(const m of String(d.contenido).matchAll(/.{80}(indicó|comentó) un (residente|vecino|testigo|transeúte)[^<]{0,100}/gi))console.log('  ...'+m[0].replace(/<[^>]+>/g,' '));
}
