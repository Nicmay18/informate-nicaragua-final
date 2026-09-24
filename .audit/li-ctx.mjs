import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const snap=await db.collection('noticias').get();
const slugs=snap.docs.map(d=>d.data().slug).filter(Boolean);
for(const frag of ['managua-y-caribe-norte-mplrwih2','dejan-seis-afectados-en-managua-y-caribe-norte-mplrwih2','afectados-en-managua-y-caribe-norte-mplrwih2','mueren-en-el-exterior-en-menos-de-una-semana']){
  const ends=slugs.filter(s=>s.endsWith(frag)||frag.endsWith(s));
  console.log('endsWith '+frag.slice(0,40)+' -> '+JSON.stringify(ends));
}
for(const id of ['EFBlqTZDTyDbFC4PRZ0c','gXTkMry6uueR9BxXcTdF']){
  const t=String((await db.collection('noticias').doc(id).get()).data().contenido);
  const i=t.search(/<li>[a-z0-9-]{6,}">/);
  console.log('\n'+id.slice(0,6)+': '+JSON.stringify(t.slice(i,i+220)));
}
