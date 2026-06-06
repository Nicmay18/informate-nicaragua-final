import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('g:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json', 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const auditoria = JSON.parse(readFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-noticias.json', 'utf8'));

async function publicarTodas() {
  let publicadas = 0;
  let errores = 0;
  const batch = db.batch();
  
  for (const noticia of auditoria) {
    const ref = db.collection('noticias').doc(noticia.id);
    batch.update(ref, { publicado: true, fechaActualizacion: new Date() });
    publicadas++;
    
    // Cada 500 hacemos commit
    if (publicadas % 500 === 0) {
      await batch.commit();
      console.log(`✓ ${publicadas} noticias marcadas como publicadas...`);
    }
  }
  
  await batch.commit();
  console.log(`\n✅ ${publicadas} noticias publicadas exitosamente`);
  if (errores > 0) console.log(`❌ ${errores} errores`);
}

publicarTodas().catch(console.error);
