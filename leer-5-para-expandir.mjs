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
  "0tmiH8fXJTVXNmiM0W5U",
  "1EMwcTEbV1ugQWmqVUAt",
  "1HmobwfngxeXoUofqosD"
];

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contarPalabrasReales(texto) {
  const limpio = limpiarHTML(texto);
  const palabras = limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || [];
  return palabras.length;
}

async function main() {
  console.log('📡 Leyendo 3 noticias en PELIGRO...\n');
  for (const id of ids) {
    const snap = await getDoc(doc(db, 'noticias', id));
    if (snap.exists()) {
      const n = snap.data();
      const contenido = n.contenido || n.cuerpo || '';
      const palabras = contarPalabrasReales(contenido);
      console.log(`\n=== ${n.titulo} ===`);
      console.log(`ID: ${id}`);
      console.log(`Palabras (tu método): ${palabras}`);
      console.log(`\nCONTENIDO ACTUAL:`);
      console.log(contenido);
      console.log('\n' + '='.repeat(60));
    }
  }
}

main().catch(err => console.error(err));
