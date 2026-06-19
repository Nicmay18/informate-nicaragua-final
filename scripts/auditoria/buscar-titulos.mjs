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

const titulosBuscados = [
  "Seis muertos en accidentes",
  "Cuatro nicaragüenses mueren",
  "Pareja muere en accidente",
  "Primeros bebés del Día de las Madres",
  "Oklahoma bajo alerta"
];

async function main() {
  console.log('📡 Buscando noticias...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const todas = [];
  snapshot.forEach(d => todas.push({ id: d.id, titulo: d.data().titulo }));

  console.log('\n🔍 Resultados:\n');
  for (const buscado of titulosBuscados) {
    const encontradas = todas.filter(n => n.titulo.toLowerCase().includes(buscado.toLowerCase()));
    console.log(`🔎 Buscando: "${buscado}"`);
    if (encontradas.length > 0) {
      encontradas.forEach(n => console.log(`   ✅ ${n.titulo} (ID: ${n.id})`));
    } else {
      console.log(`   ❌ No encontrada`);
    }
    console.log('');
  }
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
