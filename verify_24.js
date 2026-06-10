const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
function wc(h){const t=(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();return t?t.split(' ').length:0;}
const ids = Object.keys(require('./oro-final.js'));
async function main(){
  let bajo=0;
  for(const id of ids){
    const s=await db.doc('noticias/'+id).get();
    const w=wc(s.data().contenido);
    if(w<500){bajo++;console.log('BAJO '+id+' '+w+'w');}
  }
  console.log(bajo===0?'\nTODAS las 24 con 500+ palabras.':('\n'+bajo+' aun bajo 500.'));
}
main().catch(e=>console.error(e));
