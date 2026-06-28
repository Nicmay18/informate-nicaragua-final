import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B5J61WEP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log('📡 Leyendo noticias...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}\n`);

  const sinNivel = noticias.filter(n => !n.nivel);
  console.log(`📰 Noticias sin nivel: ${sinNivel.length}\n`);

  let asignadas = 0;
  let omitidas = 0;

  for (const n of sinNivel) {
    const contenido = n.contenido || n.cuerpo || '';
    const palabras = (contenido.match(/\b\w+\b/g) || []).length;

    if (palabras >= 350) {
      await updateDoc(doc(db, 'noticias', n.id), {
        nivel: '🟠 ORO',
        score: 95,
        palabras: palabras
      });
      console.log(`✅ ${n.titulo.substring(0, 40)}... (${palabras} palabras) → ORO`);
      asignadas++;
    } else {
      console.log(`⏭️  ${n.titulo.substring(0, 40)}... (${palabras} palabras) → omitida`);
      omitidas++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`✅ Asignadas a ORO: ${asignadas}`);
  console.log(`⏭️  Omitidas (<350 palabras): ${omitidas}`);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
