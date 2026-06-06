import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
  const id = "0gGqzH1RBUeVTGHWkuvl"; // Cinco fallecimientos
  const snap = await getDoc(doc(db, 'noticias', id));
  const n = snap.data();
  const contenido = n.contenido || '';
  
  console.log('=== CONTENIDO ===');
  console.log(contenido);
  console.log('\n=== BUSCANDO "amado" ===');
  
  const idx = contenido.toLowerCase().indexOf('amado');
  if (idx >= 0) {
    console.log(`Encontrado en posición ${idx}`);
    console.log('Contexto:', contenido.substring(Math.max(0, idx-30), idx+30));
  } else {
    console.log('No encontrado');
  }
  
  console.log('\n=== BUSCANDO "pena" ===');
  const idx2 = contenido.toLowerCase().indexOf('pena');
  if (idx2 >= 0) {
    console.log(`Encontrado en posición ${idx2}`);
    console.log('Contexto:', contenido.substring(Math.max(0, idx2-30), idx2+30));
  }
}

main().catch(err => console.error(err));
