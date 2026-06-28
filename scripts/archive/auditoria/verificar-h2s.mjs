import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function verificar() {
  const snapshot = await db.collection('noticias').get();
  let conH2Dup = 0;
  let total = 0;
  
  for (const doc of snapshot.docs) {
    total++;
    const data = doc.data();
    const contenido = data.contenido || '';
    const h2s = (contenido.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []);
    const h2Texts = h2s.map(h => {
      const m = h.match(/<h2[^>]*>(.*?)<\/h2>/i);
      return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
    }).filter(t => t.length > 0);
    const h2Counts = new Map();
    for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
    const dup = Array.from(h2Counts.entries()).filter(([,c]) => c > 1);
    if (dup.length > 0) {
      conH2Dup++;
      console.log('🚨', data.titulo, '—', dup.map(([t,c]) => `${t}(${c}x)`).join(', '));
    }
  }
  
  console.log(`\n✅ Verificación completa: ${conH2Dup} noticias con H2s duplicados de ${total} total`);
}
verificar().catch(console.error);
