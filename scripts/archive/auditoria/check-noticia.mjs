import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
  const doc = await db.collection('noticias').doc('8NaG866DTKEaUCHkivrd').get();
  if (!doc.exists) return console.log('No existe');
  const data = doc.data();
  console.log('publicado:', data.publicado);
  console.log('estado:', data.estado);
  console.log('categoria:', data.categoria);
  console.log('fecha:', data.fecha?.toDate?.());
}
check();
