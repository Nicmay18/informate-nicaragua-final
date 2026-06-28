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

const ids = ["0tmiH8fXJTVXNmiM0W5U", "1PRR0VQRF8oXLfzFDhm5"];

async function main() {
  for (const id of ids) {
    const snap = await getDoc(doc(db, 'noticias', id));
    if (snap.exists()) {
      const n = snap.data();
      console.log(`ID: ${id}`);
      console.log(`Título: ${n.titulo}`);
      console.log(`Nivel: ${n.nivel}`);
      console.log(`Score: ${n.score}`);
      console.log(`Palabras: ${n.palabras}`);
      console.log(`Contenido length: ${n.contenido ? n.contenido.length : 0}`);
      console.log('');
    }
  }
}

main().catch(err => console.error(err));
