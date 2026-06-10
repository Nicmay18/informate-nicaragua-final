const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
function wc(h){const t=(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();return t?t.split(' ').length:0;}
const extra = `
<h2>Acceso a la justicia</h2>
<p>El sistema judicial contempla mecanismos para que las partes involucradas en un proceso ejerzan sus derechos, presenten pruebas y reciban una resolución conforme a la ley. La transparencia en estos procesos resulta fundamental para la confianza ciudadana.</p>
<p>Las víctimas y sus familiares cuentan con el derecho de dar seguimiento a las causas y de ser informados sobre los avances de las investigaciones que les conciernen.</p>
<p>Las autoridades reiteran su compromiso de actuar conforme a los procedimientos establecidos, garantizando tanto los derechos de las personas investigadas como el esclarecimiento de los hechos.</p>`;
async function main(){
  const ref=db.doc('noticias/TwKzSdGWnzIYeAW801nD');
  const snap=await ref.get();
  const f=snap.data();
  const html=(f.contenido||'')+extra;
  await ref.update({contenido:html,contenidoHtml:html,restauradoEn:new Date().toISOString()});
  console.log('OK TwKz ('+wc(html)+'w)');
}
main().catch(e=>console.error(e));
