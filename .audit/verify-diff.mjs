import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const FAKE=['Todo ocurrió muy rápido, era evidente que la situación requería atención de quienes estaban cerca.','La comunidad estaba al tanto de lo que sucedía y algunos documentaron lo ocurrido.','Esta zona ha visto situaciones similares y los vecinos están atentos a lo que ocurre en su entorno.'];
for (const id of ['kR3waCnxVDfMfVCV8sAH','BU0PX0EqHO5ewLCH7Coo','y8gWejnBZDoLhgYaRWlP','EFBlqTZDTyDbFC4PRZ0c']) {
  const d=(await db.collection('noticias').doc(id).get()).data();
  let h=String(d.contenido);
  for(const q of FAKE){const re=new RegExp(`<(?:blockquote|p)[^>]*>[^<]*(?:<strong>)?[^<]*${q.replace(/[.*+?^${}()|[\]\]/g,'\$&')}[^<]*(?:<\/strong>)?[^<]*<\/(?:blockquote|p)>`,'gi');h=h.replace(re,'');}
  h=h.replace(/<a href="[^"]*?&(?:quot|lt|gt);[^>]*>([\s\S]*?)<\/a>/gi,'$1');
  const fakeLeft=FAKE.filter(q=>h.includes(q)).length;
  const tags=(h.match(/<blockquote/g)||[]).length + (h.match(/<\/blockquote>/g)||[]).length;
  console.log(id+' | fakeRestantes:'+fakeLeft+' | blockquoteTags:'+tags+' | len:'+d.contenido.length+'→'+h.length);
}
