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

const ids = [
  'OKGf076aUjmSNv1k1ret',
  'lsUzLddRdDCzSo3R9VkT',
  'YlSYUQ3nTXWziLYkld74',
  'I5Ctqa8wJi0TYgi4lW3r',
  '4rdCg3m1oNikSJP4nZjH'
];

const DICCIONARIO_SEGURO = {
  'homicidio': 'muerte violenta',
  'homicidios': 'muertes violentas',
};

function sanitizarTexto(texto) {
  if (!texto) return '';
  let limpio = texto;
  Object.keys(DICCIONARIO_SEGURO).forEach((clave) => {
    const regex = new RegExp(clave, 'gi');
    limpio = limpio.replace(regex, DICCIONARIO_SEGURO[clave]);
  });
  return limpio;
}

async function main() {
  const db = initFirebase();
  
  for (const id of ids) {
    const doc = await db.collection('noticias').doc(id).get();
    const data = doc.data();
    
    const titulo = sanitizarTexto(data.titulo || '');
    const resumen = sanitizarTexto(data.resumen || '');
    const contenido = sanitizarTexto(data.contenido || '');
    
    await db.collection('noticias').doc(id).update({
      titulo,
      resumen,
      contenido,
      ultimaActualizacionAutomatica: new Date()
    });
    
    console.log(`✅ ${id}: homicidio -> muerte violenta`);
  }
  
  console.log('\n✅ 5 noticias actualizadas');
}

main().catch(err => { console.error(err); process.exit(1); });
