import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function buscarNoticia() {
  const titulo = 'Tres afectados en hechos viales este viernes en Managua y Granada';
  
  // Buscar por título exacto o parcial
  const snap = await db.collection('noticias')
    .where('titulo', '>=', titulo)
    .where('titulo', '<=', titulo + '\uf8ff')
    .limit(5)
    .get();
    
  console.log('Búsqueda por título:', snap.size, 'resultados');
  for (const d of snap.docs) {
    console.log('ID:', d.id, '| Slug:', d.data().slug);
  }
  
  // Buscar por slug
  const slugSnap = await db.collection('noticias')
    .where('slug', '==', 'tres-fallecidos-en-hechos-viales-este-viernes-en-managua-y-granada')
    .limit(5)
    .get();
    
  console.log('\nBúsqueda por slug:', slugSnap.size, 'resultados');
  for (const d of slugSnap.docs) {
    console.log('ID:', d.id, '| Titulo:', d.data().titulo);
    const data = d.data();
    const contenido = data.contenido || '';
    const h2s = (contenido.match(/\u003ch2[^\u003e]*\u003e(.*?)\u003c\/h2\u003e/gi) || []);
    console.log('H2s encontrados:', h2s.length);
    const h2Texts = h2s.map(h => {
      const m = h.match(/\u003ch2[^\u003e]*\u003e(.*?)\u003c\/h2\u003e/i);
      return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
    }).filter(t => t.length > 0);
    const h2Counts = new Map();
    for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
    const dup = Array.from(h2Counts.entries()).filter(([,c]) => c > 1);
    console.log('H2s duplicados:', dup.length, dup.map(([t,c]) => `${t}(${c}x)`).join(', '));
  }
}

buscarNoticia().catch(console.error);
