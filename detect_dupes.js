const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const ids = Object.keys(require('./oro-final.js'));
async function main(){
  for(const id of ids){
    const s=await db.doc('noticias/'+id).get();
    const c=s.data().contenido||'';
    const h2s=(c.match(/<h2>(.*?)<\/h2>/g)||[]).map(x=>x.replace(/<\/?h2>/g,''));
    const dupes=h2s.filter((x,i)=>h2s.indexOf(x)!==i);
    if(dupes.length) console.log(id+' DUPLICADOS: '+[...new Set(dupes)].join(' | '));
  }
  console.log('Fin');
}
main().catch(e=>console.error(e));
