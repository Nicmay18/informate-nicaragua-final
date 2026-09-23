import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const NOW=new Date().toISOString();
const ids=['R2zQFsmjsu0NvFRU7tDa','gaCpaA49whA70rqyWBow','xaEUqIpn5aFqjar7b4nv','y8gWejnBZDoLhgYaRWlP'];
for (const id of ids){
  const ref=db.collection('noticias').doc(id); const d=(await ref.get()).data(); if(!d)continue;
  let h=String(d.contenido); let n=0;
  h=h.replace(/<p>María López, vecina del barrio que presenció los hechos, relató a este medio lo ocurrido y proporcionó detalles de la situación\.?<\/p>/g,()=>{n++;return '';});
  if(n>0){await ref.update({contenido:h,ultimaRevisionEditorial:{fecha:NOW,proceso:'saneamiento-editorial-fase-cierre',tipo:'cita_fabricada_eliminada'}});console.log(id+' | '+n+' bloques María López eliminados');}
}
// actualizar la cola para las que estaban en REVISION resueltas con esta evidencia adicional
const q=await db.collection('editorial_review_queue').get();
for(const qd of q.docs){const q=qd.data();if(['R2zQFsmjsu0NvFRU7tDa','gaCpaA49whA70rqyWBow','y8gWejnBZDoLhgYaRWlP'].includes(qd.id)){await qd.ref.update({resolutionReason:(q.resolutionReason||'')+' + cita fabricada "María López vecina" eliminada (plantilla adicional detectada).'});}}
console.log('done');
