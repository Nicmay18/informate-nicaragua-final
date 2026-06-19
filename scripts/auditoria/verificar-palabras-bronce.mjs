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

  const bronce = noticias.filter(n => n.nivel && n.nivel.includes('BRONCE'));
  console.log(`\n🟡 Noticias en BRONCE: ${bronce.length}\n`);

  let bajo350 = 0;
  let entre350y500 = 0;
  let sobre500 = 0;

  bronce.forEach(n => {
    const contenido = n.contenido || n.cuerpo || '';
    const palabras = (contenido.match(/\b\w+\b/g) || []).length;
    if (palabras < 350) bajo350++;
    else if (palabras < 500) entre350y500++;
    else sobre500++;
  });

  console.log('📊 Distribución de palabras en BRONCE:');
  console.log(`   Menos de 350: ${bajo350}`);
  console.log(`   350-499: ${entre350y500}`);
  console.log(`   500+: ${sobre500}`);

  console.log('\n🔍 Ejemplos de noticias con menos de 350 palabras:');
  const ejemplos = bronce.filter(n => {
    const contenido = n.contenido || n.cuerpo || '';
    const palabras = (contenido.match(/\b\w+\b/g) || []).length;
    return palabras < 350;
  }).slice(0, 5);

  ejemplos.forEach(n => {
    const contenido = n.contenido || n.cuerpo || '';
    const palabras = (contenido.match(/\b\w+\b/g) || []).length;
    console.log(`   - ${n.titulo.substring(0, 50)}... (${palabras} palabras)`);
  });
}

main().catch(err => console.error(err));
