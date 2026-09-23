import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const FAKE=['Todo ocurrió muy rápido, era evidente que la situación requería atención de quienes estaban cerca.','La comunidad estaba al tanto de lo que sucedía y algunos documentaron lo ocurrido.','Esta zona ha visto situaciones similares y los vecinos están atentos a lo que ocurre en su entorno.'];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, m => '\\'+m);
const ids=['5JyYmiQUFmH29eqxGFuC','ASk1oDEiDQXOAlP3JYAT','HBaAK77yqswYn3uCf7al','KqbSciGsztV7VDFB7XFC','M5Ivl0fqvyOivSZMuNLY','M9vj4XiOdmMrLwreHlff','V1GsdHFZ0SdE2KAimfzx','fIgt55qqhg6ysMQHEsl4','mpU9oJImLDYi8lWhziII','q3QgspnxFL9buTcqe9Pm'];
const NOW=new Date().toISOString();
let fixed=0;
for (const id of ids) {
  const ref = db.collection('noticias').doc(id);
  const d=(await ref.get()).data(); if(!d) continue;
  let h=String(d.contenido); let n=0;
  for(const q of FAKE){
    const re=new RegExp('<(?:blockquote|p)[^>]*>[\\s\\S]*?'+esc(q)+'[\\s\\S]*?<\\/(?:blockquote|p)>','gi');
    h=h.replace(re,()=>{n++;return '';});
  }
  if(n>0){await ref.update({contenido:h,ultimaRevisionEditorial:{fecha:NOW,proceso:'saneamiento-editorial-fase-cierre',tipo:'cita_fabricada_eliminada'}});fixed++;console.log(id+' | '+String(d.titulo).slice(0,50)+' | '+n+' bloques');}
}
console.log('fuera de cola corregidas:',fixed);
const q=await db.collection('editorial_review_queue').get();
const est={};for(const x of q.docs)est[x.data().estado]=(est[x.data().estado]||0)+1;
console.log('estados cola:',est);
