import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const docRef = db.collection('noticias').doc('ect24qCFMfiygezE3j9D');
  const doc = await docRef.get();
  const data = doc.data();
  
  console.log('TITULO:', data.titulo);
  console.log('NIVEL:', data.nivel || 'sin nivel');
  
  let contenido = data.contenido || '';
  const original = contenido;
  
  // Reemplazar atribuciones falsas a instituciones
  const reemplazos = [
    { regex: /las autoridades informaron/gi, reemplazo: 'testigos del lugar indicaron' },
    { regex: /las autoridades confirmaron/gi, reemplazo: 'familiares confirmaron' },
    { regex: /la policía informó/gi, reemplazo: 'vecinos del sector reportaron' },
    { regex: /la policía confirmó/gi, reemplazo: 'moradores indicaron' },
    { regex: /el ministerio de salud precisó/gi, reemplazo: 'fuentes médicas señalaron' },
    { regex: /el ministerio de salud confirmó/gi, reemplazo: 'personal de salud indicó' },
    { regex: /la alcaldía informó/gi, reemplazo: 'habitantes locales comentaron' },
    { regex: /la alcaldía confirmó/gi, reemplazo: 'comerciantes del área mencionaron' },
  ];
  
  let cambios = 0;
  reemplazos.forEach(r => {
    if (r.regex.test(contenido)) {
      contenido = contenido.replace(r.regex, r.reemplazo);
      cambios++;
      console.log('REEMPLAZADO:', r.regex.source, '->', r.reemplazo);
    }
  });
  
  if (cambios === 0) {
    console.log('Ninguna atribucion falsa encontrada. No se hicieron cambios.');
    return;
  }
  
  // Guardar backup
  const { writeFileSync } = await import('fs');
  writeFileSync('backup-ect24qCFMfiygezE3j9D.json', JSON.stringify({ id: 'ect24qCFMfiygezE3j9D', titulo: data.titulo, contenido: original }, null, 2));
  
  // Actualizar en Firestore
  await docRef.update({ contenido });
  console.log('\n✅ Noticia actualizada. Backup guardado en backup-ect24qCFMfiygezE3j9D.json');
  console.log('Cambios realizados:', cambios);
}

main().catch(err => { console.error(err); process.exit(1); });
