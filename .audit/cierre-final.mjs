import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));

const snap = await db.collection('noticias').get();
let pub=0, slugs=new Set(), dupSlug=0;
const pats = [
  /motocicletaciclet/i, /motocicletaciclist/i, /personas personas/i,
  /testigo ocular manifest/i, /vecino que presenci/i, /residente local/i,
  /María López, vecina/i, /\b(el|del|El|Del) afectación\b/, /afectado afectada/i
];
const residuos=[];
for(const doc of snap.docs){
  const d=doc.data();
  if(d.publicado===true||d.estado==='PUBLICADO'||d.publicada===true)pub++;
  if(slugs.has(d.slug))dupSlug++; slugs.add(d.slug);
  const t=[d.titulo,d.resumen,d.contenido,d.bajada].map(x=>String(x||'')).join(' ');
  for(const p of pats)if(p.test(t)){residuos.push(doc.id+' | '+String(d.titulo||'').slice(0,45)+' | '+p);break;}
}
console.log('NOTAS:',snap.size,'| PUBLICADAS:',pub,'| DUP_SLUGS:',dupSlug);
console.log('RESIDUOS:',residuos.length); residuos.forEach(r=>console.log('  '+r));

const cola = await db.collection('editorial_review_queue').get();
const est={}; let stale=null;
for(const doc of cola.docs){const s=doc.data().estado||'SIN_ESTADO';est[s]=(est[s]||0)+1;if(doc.data().problema==='contradiccion_factual')stale=doc.id+':'+s;}
console.log('COLA:',cola.size,JSON.stringify(est),'| stale_doc:',stale);
