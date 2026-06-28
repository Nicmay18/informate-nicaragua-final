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
  console.log('📡 Buscando noticias con palabras clave...\n');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const todas = [];
  snapshot.forEach(d => todas.push({ id: d.id, titulo: d.data().titulo }));

  console.log('🔎 Buscando: "Larreynaga" o "Puente"');
  const larreynaga = todas.filter(n => n.titulo.toLowerCase().includes('larreynaga') || n.titulo.toLowerCase().includes('puente'));
  larreynaga.forEach(n => console.log(`   ✅ ${n.titulo} (ID: ${n.id})`));
  console.log('');

  console.log('🔎 Buscando: "Oklahoma"');
  const oklahoma = todas.filter(n => n.titulo.toLowerCase().includes('oklahoma'));
  oklahoma.forEach(n => console.log(`   ✅ ${n.titulo} (ID: ${n.id})`));
  console.log('');

  console.log('🔎 Buscando: "tornado"');
  const tornado = todas.filter(n => n.titulo.toLowerCase().includes('tornado'));
  tornado.forEach(n => console.log(`   ✅ ${n.titulo} (ID: ${n.id})`));
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
