import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snap = await db.collection('noticias').where('titulo', '>=', 'Cuatro nicaragüenses').where('titulo', '<=', 'Cuatro nicaragüenses\uf8ff').limit(1).get();
  if (snap.empty) { console.log('No encontrada'); return; }
  const data = snap.docs[0].data();
  
  const payload = {
    titulo: data.titulo || '',
    contenido: data.contenido || '',
    resumen: data.resumen || '',
    categoria: data.categoria || 'General',
    autor: data.autor || '',
    fecha: data.fecha?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    slug: data.slug || '',
    imagenDestacada: data.imagenDestacada || data.imagen || '',
    palabrasClave: data.palabrasClave || [],
  };

  const res = await fetch('http://localhost:3000/api/admin/analizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const analisis = await res.json();
  console.log(JSON.stringify(analisis, null, 2));
}
main().catch(console.error);
