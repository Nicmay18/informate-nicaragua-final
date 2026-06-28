const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load service account credentials
const credPath = path.join(__dirname, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
if (!fs.existsSync(credPath)) {
  console.error('Service account file not found:', credPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Load the noticias-60-80.json backup
const backupPath = path.join(__dirname, 'noticias-60-80.json');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

// Load markdown files for additional content
const mdFiles = [
  '0gGqzH1RBUeVTGHWkuvl.md',
  '0tmiH8fXJTVXNmiM0W5U.md',
  '1EMwcTEbV1ugQWmqVUAt.md',
  '1HmobwfngxeXoUofqosD.md',
  '1PRR0VQRF8oXLfzFDhm5.md'
];

async function main() {
  let restored = 0;
  
  // Restore from noticias-60-80.json
  for (const item of backup) {
    const id = item.id;
    try {
      await db.doc(`noticias/${id}`).update({
        titulo: item.titulo,
        contenido: item.contenido,
        categoria: item.categoria,
        departamento: item.departamento,
        resumen: item.resumen,
        restauradoEn: new Date().toISOString(),
      });
      console.log(`✅ Restored ${id} from JSON backup`);
      restored++;
    } catch (e) {
      console.error(`❌ Error restoring ${id}:`, e.message);
    }
  }
  
  // Restore from markdown files (they have more complete content)
  for (const mdFile of mdFiles) {
    const id = mdFile.replace('.md', '');
    const mdPath = path.join(__dirname, mdFile);
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf-8');
      // Parse title from first line
      const lines = content.split('\n');
      const title = lines[0].replace('# ', '').trim();
      const body = content.replace(lines[0], '').trim();
      
      try {
        await db.doc(`noticias/${id}`).update({
          titulo: title,
          contenido: body,
          restauradoEn: new Date().toISOString(),
        });
        console.log(`✅ Restored ${id} from markdown backup`);
        restored++;
      } catch (e) {
        console.error(`❌ Error restoring ${id} from MD:`, e.message);
      }
    }
  }
  
  console.log(`\nTotal restored: ${restored} articles`);
  console.log('\n⚠️  IMPORTANT: Only 5 articles had backups in the project files.');
  console.log('The other 195 articles were overwritten with placeholders and cannot be recovered from local files.');
}

main().catch(err => console.error('Fatal error', err));
