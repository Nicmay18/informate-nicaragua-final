import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const ids=['0gGqzH1RBUeVTGHWkuvl','5ygMPBWB8ukF4W5m7uoG','8NaG866DTKEaUCHkivrd','EK8pDgblNpScPCoGCgab','HxsDqbeHSSO2MRyl1Cpu','spoz8oqZQ8Wer7c1GSXp','w5XzTjYCWTJRDX9NIPng','yys8SiF01IpoXTkoaqXo'];
for(const id of ids){
  const d=(await db.collection('noticias').doc(id).get()).data();if(!d)continue;
  const all=String(d.contenido)+' '+String(d.titulo)+' '+String(d.resumen);
  for(const m of all.matchAll(/.{50}el afectación.{60}|.{30}afectado afectada.{40}/gs))console.log(id+' | ...'+m[0].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')+'...');
}
