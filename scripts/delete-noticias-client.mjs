import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDoc } from 'firebase/firestore';

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
  '7XhLLKm4xgL5vtfLLCU3',
  'sbg2Bm2F9YeslOZe4UXJ',
  'u8TvXrAQfYYIU8A6jnwM',
  'Nl4bnTyEQONPW10OTmtc'
];

for (const id of ids) {
  try {
    const ref = doc(db, 'noticias', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      console.log(`✅ Eliminada: ${id} - ${snap.data().titulo || '(sin título)'}`);
    } else {
      console.log(`⚠️ No existe: ${id}`);
    }
  } catch (err) {
    console.error(`❌ Error ${id}:`, err.message);
    if (err.code === 'permission-denied') {
      console.error('   → Necesitas estar autenticado en el admin primero. Abrí el panel.html en el navegador, iniciá sesión, y luego ejecutá este script en la consola del navegador (F12).');
    }
  }
}
