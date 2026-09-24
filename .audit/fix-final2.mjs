import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');
const db = getFirestore(initializeApp({credential: cert(JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64,'base64').toString('utf8')))}));
const WRITE = process.argv.includes('--write');
const audit=[];

// 1) 9xCH: bloque <blockquote> con la misma cita fabricada verbatim
{
  const ref=db.collection('noticias').doc('9xCHaZO7JEwhyRpdHHJY');
  const d=(await ref.get()).data();
  let c=String(d.contenido); const before=c;
  c=c.replace(/<blockquote>[^<]*residente local[^<]*<\/blockquote>/gi,'');
  if(c!==before){audit.push({id:'9xCHaZO7JEwhyRpdHHJY',cambio:'blockquote_cita_fabricada'});
    if(WRITE)await ref.update({contenido:c,ultimaRevisionEditorial:{fecha:new Date().toISOString(),proceso:'saneamiento-editorial-cierre',tipo:'cita_fabricada_blockquote'}});}
}

// 2) AQiS: nota nueva del pipeline con corrupción mecánica conocida
{
  const ref=db.collection('noticias').doc('AQiSAE7CeGLS9n5AvpzG');
  const d=(await ref.get()).data();
  let c=String(d.contenido); const before=c;
  c=c.replace(/motocicletacicletas/gi,'motocicletas').replace(/motocicletacicleta/gi,'motocicleta').replace(/motocicletaciclistas/gi,'motociclistas').replace(/motocicletaciclista/gi,'motociclista');
  if(c!==before){audit.push({id:'AQiSAE7CeGLS9n5AvpzG',cambio:'motocicletacicleta*'});
    if(WRITE)await ref.update({contenido:c,ultimaRevisionEditorial:{fecha:new Date().toISOString(),proceso:'correccion-editorial-normal',tipo:'concatenacion_mecanica'}});}
}
audit.forEach(a=>console.log(a.id.slice(0,8)+' | '+a.cambio));
writeFileSync('.audit/fix-final2.json',JSON.stringify(audit,null,2));
console.log('WRITE:',WRITE);
