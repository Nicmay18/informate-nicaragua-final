import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  // Buscar una noticia BRONCE
  const d = await db.collection('noticias').doc('Cuatro nicaragüenses resultan afectados en Costa Rica').get();
  // Buscar por slug mejor
  const snap = await db.collection('noticias').where('titulo', '>=', 'Cuatro nicaragüenses').where('titulo', '<=', 'Cuatro nicaragüenses\uf8ff').limit(1).get();
  if (snap.empty) { console.log('No encontrada'); return; }
  const doc = snap.docs[0];
  const data = doc.data();
  console.log('Titulo:', data.titulo);
  console.log('Nivel:', data.nivel);
  console.log('Puntuacion:', data.puntuacion);
  console.log('aiMetrics:', JSON.stringify(data.aiMetrics, null, 2));
  console.log('accionesRequeridas:', data.accionesRequeridas);
  console.log('palabrasSensibles:', data.palabrasSensiblesDetectadas);
}
main().catch(console.error);
