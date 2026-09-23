import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const NOW=new Date().toISOString();
const ids=['0gGqzH1RBUeVTGHWkuvl','5ygMPBWB8ukF4W5m7uoG','8NaG866DTKEaUCHkivrd','EK8pDgblNpScPCoGCgab','HxsDqbeHSSO2MRyl1Cpu','spoz8oqZQ8Wer7c1GSXp','w5XzTjYCWTJRDX9NIPng','yys8SiF01IpoXTkoaqXo'];
const log=[];
for(const id of ids){
  const ref=db.collection('noticias').doc(id); const d=(await ref.get()).data(); if(!d)continue;
  const upd={}; const ch=[];
  for(const f of ['contenido','resumen','titulo']){
    let v=String(d[f]||''); const o=v;
    v=v.replace(/\bel afectación\b/g,()=>{ch.push('el afectación→la afectación');return 'la afectación';});
    v=v.replace(/\bdel afectación\b/g,()=>{ch.push('del afectación→de la afectación');return 'de la afectación';});
    v=v.replace(/\bafectado afectada\b/g,()=>{ch.push('afectado afectada→afectada');return 'afectada';});
    v=v.replace(/\bafectada afectado\b/g,()=>{ch.push('afectada afectado→afectado');return 'afectado';});
    if(v!==o)upd[f]=v;
  }
  if(Object.keys(upd).length){
    upd.ultimaRevisionEditorial={fecha:NOW,proceso:'saneamiento-editorial-fase-cierre',tipo:'concordancia_mecanica'};
    await ref.update(upd);
    log.push({id,titulo:d.titulo,cambios:ch});
    console.log(id+' | '+ch.join(' ; '));
  }
}
writeFileSync('.audit/fix-afectacion.json',JSON.stringify(log,null,2));
console.log('corregidas:',log.length);
