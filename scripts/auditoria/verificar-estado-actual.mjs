import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
  console.log('📡 Leyendo noticias desde Firestore...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}\n`);

  const peligro = noticias.filter(n => n.nivel && n.nivel.includes('PELIGRO'));
  const bronce = noticias.filter(n => n.nivel && n.nivel.includes('BRONCE'));
  const oro = noticias.filter(n => n.nivel && n.nivel.includes('ORO'));
  const sinNivel = noticias.filter(n => !n.nivel);

  console.log('📊 Estado actual en Firestore:');
  console.log(`   🔴 PELIGRO: ${peligro.length}`);
  console.log(`   🟡 BRONCE:  ${bronce.length}`);
  console.log(`   🟢 ORO:     ${oro.length}`);
  console.log(`   ❌ Sin nivel: ${sinNivel.length}`);
  console.log(`   Total: ${noticias.length}`);

  if (bronce.length > 0) {
    console.log('\n🔍 Primeras 5 noticias en BRONCE con conteo de palabras:');
    bronce.slice(0, 5).forEach(n => {
      const contenido = n.contenido || n.cuerpo || '';
      const palabras = (contenido.match(/\b\w+\b/g) || []).length;
      console.log(`   - ${n.titulo.substring(0, 45)}... (${palabras} palabras)`);
    });
  }
}

main().catch(err => console.error(err));
