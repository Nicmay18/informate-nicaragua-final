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

const ids = [
  "0gGqzH1RBUeVTGHWkuvl",
  "0tmiH8fXJTVXNmiM0W5U",
  "1EMwcTEbV1ugQWmqVUAt",
  "1HmobwfngxeXoUofqosD",
  "1PRR0VQRF8oXLfzFDhm5"
];

async function main() {
  for (const id of ids) {
    const snap = await getDoc(doc(db, 'noticias', id));
    if (snap.exists()) {
      const n = snap.data();
      const contenido = n.contenido || n.cuerpo || '';
      const palabras = (contenido.match(/\b\w+\b/g) || []).length;
      console.log(`\n=== ${n.titulo} ===`);
      console.log(`ID: ${id}`);
      console.log(`Palabras: ${palabras}`);
      console.log(`CONTENIDO ORIGINAL:`);
      console.log(contenido);
      console.log('\n' + '='.repeat(60));
    }
  }
}

main().catch(err => console.error(err));
