const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const data = require('./oro-final.js');

function wordCount(html) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

async function main() {
  const ids = Object.keys(data);
  console.log(`Inyectando ${ids.length} notas expandidas...`);
  let ok = 0, err = 0, bajo = 0;
  for (const id of ids) {
    const { titulo, contenidoHtml } = data[id];
    const wc = wordCount(contenidoHtml);
    if (wc < 500) { console.log(`  AVISO ${id} solo ${wc}w`); bajo++; }
    try {
      await db.doc(`noticias/${id}`).update({
        titulo,
        contenido: contenidoHtml,
        contenidoHtml,
        restauradoEn: new Date().toISOString(),
      });
      console.log(`OK ${id} (${wc}w)`);
      ok++;
    } catch (e) {
      console.error(`ERROR ${id}: ${e.message}`);
      err++;
    }
  }
  console.log(`\nListo. OK: ${ok}, Errores: ${err}, Bajo 500w: ${bajo}`);
}

main().catch(e => console.error('Fatal', e));
