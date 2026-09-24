import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap=await db.collection('noticias').get();
const pats=[/recabado por la redacci/gi,/indicó un (residente|vecino|testigo|transeúte)/gi,/manifestó un (residente|vecino|testigo|transeúte)/gi,/comentó un (residente|vecino|testigo|transeúte)/gi,/declaró un (residente|vecino|testigo|transeúte)/gi,/relató un (residente|vecino|testigo|transeúte)/gi,/transeúte que captó/gi,/según testimonio de un/gi];
const hits={}, liRotos=[];
for(const doc of snap.docs){
  const t=String(doc.data().contenido||'');
  for(const p of pats){const n=(t.match(p)||[]).length; if(n){const k=p.source;(hits[k]=hits[k]||[]).push(doc.id+' x'+n);}}
  if(/<li>(?!<a )/.test(t)||/<li>[^<]*">/.test(t))liRotos.push(doc.id+' | '+String(doc.data().titulo||'').slice(0,45));
}
for(const[k,v]of Object.entries(hits)){console.log('\nPATTERN:',k,'->',v.length,'notas');v.forEach(h=>console.log('  '+h));}
console.log('\nLI ROTOS:',liRotos.length); liRotos.forEach(h=>console.log('  '+h));
