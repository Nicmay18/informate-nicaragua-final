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

const DICCIONARIO_SEGURO = {
  'muerte': 'fallecimiento',
  'muertos': 'personas fallecidas',
  'muertas': 'personas fallecidas',
  'muere': 'fallece',
  'muerto': 'persona fallecida',
  'muerta': 'persona fallecida',
  'murió': 'falleció',
  'murieron': 'fallecieron',
  'asesinato': 'homicidio consumado',
  'violación': 'agresión sexual',
  'trágico': 'grave',
  'tragedia': 'incidente grave',
  'homicidio': 'muerte violenta',
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
  const id = 'OrxV5HoQWEZ3pjEHwSb8';
  const doc = await db.collection('noticias').doc(id).get();
  const data = doc.data();
  
  console.log('ID:', id);
  console.log('Titulo:', data.titulo);
  
  const antes = data.contenido || '';
  const despues = sanitizarTexto(antes);
  
  console.log('\nContenido tiene "muerte":', antes.toLowerCase().includes('muerte'));
  console.log('Contenido sanitizado tiene "muerte":', despues.toLowerCase().includes('muerte'));
  console.log('Contenido cambia:', antes !== despues);
  
  if (antes !== despues) {
    await db.collection('noticias').doc(id).update({
      contenido: despues,
      ultimaActualizacionAutomatica: new Date()
    });
    console.log('✅ Noticia actualizada');
  } else {
    console.log('ℹ️ Sin cambios');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
