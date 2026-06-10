const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const backup = JSON.parse(fs.readFileSync(path.join(__dirname, 'firestore-current-backup-1781106719360.json'), 'utf-8'));
const recuperables = JSON.parse(fs.readFileSync(path.join(__dirname, 'recuperables.json'), 'utf-8'));

function cleanTitle(t) {
  return (t || '').split('\\n\\n##')[0].split('\n\n##')[0].split('\\n')[0].replace(/\\n/g, ' ').trim();
}

function isPlaceholder(s) {
  return (s || '').includes('Lead de 40 palabras') || (s || '').includes('Contenido ORO genérico');
}

async function main() {
  let updated = 0, errors = 0;
  for (const id of recuperables) {
    const f = backup[id];
    // Elegir el mejor contenido real
    const htmlReal = f.contenidoHtml && f.contenidoHtml.length > 300 && !isPlaceholder(f.contenidoHtml);
    const contReal = f.contenido && f.contenido.length > 300 && !isPlaceholder(f.contenido);
    const realContent = htmlReal ? f.contenidoHtml : (contReal ? f.contenido : '');
    if (!realContent) { console.log(`SKIP ${id} (sin contenido real)`); continue; }

    const titulo = cleanTitle(f.titulo);
    try {
      await db.doc(`noticias/${id}`).update({
        titulo,
        contenido: realContent,
        contenidoHtml: realContent,
        restauradoEn: new Date().toISOString(),
      });
      updated++;
      if (updated % 25 === 0) console.log(`... ${updated} actualizados`);
    } catch (e) {
      console.error(`ERROR ${id}: ${e.message}`);
      errors++;
    }
  }
  console.log(`\nListo. Actualizados: ${updated}, Errores: ${errors}`);
}

main().catch(e => console.error('Fatal', e));
