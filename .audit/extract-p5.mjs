import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const ids=['81UQk1YkWPpF7BzIdaDo','9xCHaZO7JEwhyRpdHHJY','eHwPppvuoey1DpRCh7cc','kR3waCnxVDfMfVCV8sAH','ku8tzMdLM3030JgD5B8K','pMXu8KvKsz9gJzg0U9bf','xaEUqIpn5aFqjar7b4nv'];
const uniq=new Set();
for(const id of ids){
  const t=String((await db.collection('noticias').doc(id).get()).data().contenido);
  for(const m of t.matchAll(/<p>[^<]*(recabado por la redacción|transeúte que captó)[^<]*<\/p>/gi))uniq.add(m[0]);
}
console.log('BLOQUES UNIQ:',uniq.size); [...uniq].forEach(u=>console.log('>>> '+u));
console.log('\n=== LI contexto ===');
for(const id of ['9xCHaZO7JEwhyRpdHHJY','EFBlqTZDTyDbFC4PRZ0c','gXTkMry6uueR9BxXcTdF','v0gwsceiaZQeNSLPHmee']){
  const t=String((await db.collection('noticias').doc(id).get()).data().contenido);
  for(const m of t.matchAll(/<li>[a-z0-9-]{6,}">[^<]*<\/li>/g))console.log(id.slice(0,6)+': '+m[0]);
}
// slugs existentes para prefix-match
const snap=await db.collection('noticias').get();
const slugs=snap.docs.map(d=>d.data().slug).filter(Boolean);
for(const frag of ['managua-y-caribe-norte-mplrwih2','dejan-seis-afectados-en-managua-y-caribe-norte-mplrwih2','afectados-en-managua-y-caribe-norte-mplrwih2','mueren-en-el-exterior-en-menos-de-una-semana']){
  const hits=slugs.filter(s=>s===frag||s.startsWith(frag)||frag.startsWith(s)||s.includes(frag.slice(0,20)));
  console.log('FRAG '+frag.slice(0,35)+' -> '+JSON.stringify(hits.slice(0,3)));
}
