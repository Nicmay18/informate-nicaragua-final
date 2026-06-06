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
  const snapshot = await getDocs(collection(db, 'noticias'));
  snapshot.forEach(async (d) => {
    const n = d.data();
    const contenido = n.contenido || '';
    if (contenido.toLowerCase().includes(' fatal')) {
      console.log(`🔴 Encontrada: ${n.titulo}`);
      const nuevoContenido = contenido.replace(/ fatal/gi, ' grave').replace(/fatal /gi, 'grave ');
      await updateDoc(doc(db, 'noticias', d.id), {
        contenido: nuevoContenido,
        nivel: "🟠 ORO",
        score: 95
      });
      console.log(`✅ Corregida`);
    }
  });
}

main().catch(err => console.error(err));
