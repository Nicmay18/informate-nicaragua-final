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
  console.log('📡 Leyendo noticias...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  let menos350 = 0;
  let entre350y500 = 0;
  let mas500 = 0;
  const listaMenos350 = [];

  noticias.forEach(n => {
    const contenido = n.contenido || n.cuerpo || '';
    const palabras = (contenido.match(/\b\w+\b/g) || []).length;
    if (palabras < 350) {
      menos350++;
      listaMenos350.push({ id: n.id, titulo: n.titulo, palabras });
    } else if (palabras < 500) {
      entre350y500++;
    } else {
      mas500++;
    }
  });

  console.log('\n📊 Distribución de palabras:');
  console.log(`   Menos de 350: ${menos350}`);
  console.log(`   350-499: ${entre350y500}`);
  console.log(`   500+: ${mas500}`);
  console.log(`   Total: ${noticias.length}`);

  if (listaMenos350.length > 0) {
    console.log('\n🔴 Noticias con menos de 350 palabras:');
    listaMenos350.forEach(n => {
      console.log(`   - ${n.titulo.substring(0, 50)}... (${n.palabras} palabras) - ID: ${n.id}`);
    });
  }
}

main().catch(err => console.error(err));
