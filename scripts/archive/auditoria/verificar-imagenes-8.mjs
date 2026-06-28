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
  
  const ids = [
    '0gGqzH1RBUeVTGHWkuvl',
    '0tmiH8fXJTVXNmiM0W5U', 
    '1HmobwfngxeXoUofqosD',
    '1PRR0VQRF8oXLfzFDhm5',
    '3Dlu4tCQZedztrompEgV',
    'CaxNVIKzrIl5rBpKs0vy',
    'OWppqYU03AfZQHIoqEL7',
    'XHsdnSKHniKyMI1AWBXL'
  ];

  console.log('=== IMÁGENES DE LAS 8 NOTICIAS ===\n');

  for (const id of ids) {
    const doc = await db.collection('noticias').doc(id).get();
    const d = doc.data();
    const imagen = d.imagen || '(sin imagen)';
    const score = d.scoreCalidad || 0;
    
    const tieneImgReal = imagen && 
      imagen.trim() !== '' && 
      imagen.trim() !== '/logo.webp' &&
      !imagen.includes('placeholder');
    
    console.log(`${id}:`);
    console.log(`  Score: ${score}`);
    console.log(`  Imagen: ${imagen.substring(0, 80)}`);
    console.log(`  ¿Tiene imagen real?: ${tieneImgReal ? '✅ SÍ' : '❌ NO'}`);
    console.log();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
