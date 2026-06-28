const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function paras(html){
  return (html.match(/<p>(.*?)<\/p>/gs)||[]).map(p=>p.replace(/<\/?p>/g,'').replace(/\s+/g,' ').trim()).filter(p=>p.length>40);
}

async function main(){
  const snap = await db.collection('noticias').get();
  const paraMap = {}; // parrafo -> [ids]
  const docs = {};
  snap.forEach(d=>{ docs[d.id]=d.data(); });
  for(const [id,f] of Object.entries(docs)){
    const ps = paras(f.contenido||'');
    for(const p of ps){
      (paraMap[p] = paraMap[p]||[]).push(id);
    }
  }
  // Parrafos que aparecen en mas de 1 documento
  const repetidos = Object.entries(paraMap).filter(([p,ids])=>ids.length>1)
    .sort((a,b)=>b[1].length-a[1].length);
  console.log('=== PARRAFOS DUPLICADOS ENTRE NOTAS (riesgo AdSense) ===');
  console.log('Total de parrafos distintos repetidos: '+repetidos.length+'\n');
  repetidos.forEach(([p,ids])=>{
    console.log('['+ids.length+' notas] '+p.substring(0,90)+'...');
  });
  // Cuantas notas estan afectadas
  const afectadas = new Set();
  repetidos.forEach(([p,ids])=>ids.forEach(i=>afectadas.add(i)));
  console.log('\nNotas afectadas por contenido duplicado: '+afectadas.size);
  fs.writeFileSync(path.join(__dirname,'afectadas.json'), JSON.stringify([...afectadas],null,2));
}
main().catch(e=>console.error(e));
