import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function analizarH2s() {
  const doc = await db.collection('noticias').doc('8NaG866DTKEaUCHkivrd').get();
  if (!doc.exists) return;
  const data = doc.data();
  const contenido = data.contenido || '';
  
  // Extraer todas las secciones entre H2s
  const secciones = [];
  const regex = /(<h2[^>]*>.*?\u003c\/h2\u003e)([\s\S]*?)(?=<h2[^>]*>|$)/gi;
  let match;
  while ((match = regex.exec(contenido)) !== null) {
    secciones.push({
      h2: match[1],
      contenido: match[2],
      h2Texto: match[1].replace(/<[^>]*>/g, '').trim().toLowerCase()
    });
  }
  
  console.log('Total secciones:', secciones.length);
  
  const vistos = new Map();
  for (const s of secciones) {
    const count = vistos.get(s.h2Texto) || 0;
    vistos.set(s.h2Texto, count + 1);
  }
  
  console.log('\nH2s y repeticiones:');
  for (const [texto, count] of vistos) {
    console.log(`  "${texto}": ${count}x`);
  }
  
  // Mostrar primeras 3 secciones de cada duplicado
  console.log('\n=== Primeras 2 secciones de cada duplicado ===');
  for (const [texto, count] of vistos) {
    if (count > 1) {
      console.log(`\n--- ${texto} (${count}x) ---`);
      let mostrados = 0;
      for (const s of secciones) {
        if (s.h2Texto === texto && mostrados < 2) {
          console.log('H2:', s.h2);
          console.log('Contenido (primeros 200 chars):', s.contenido.substring(0, 200).replace(/\n/g, ' '));
          mostrados++;
        }
      }
    }
  }
}

analizarH2s().catch(console.error);
