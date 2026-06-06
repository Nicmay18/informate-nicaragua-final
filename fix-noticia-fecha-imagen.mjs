import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

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

const NOTICIA_ID = '4cSRo7UUcLkhqHa4m0gx';

async function main() {
  // Verificar la noticia actual
  const docRef = doc(db, 'noticias', NOTICIA_ID);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) {
    console.log('❌ Noticia no encontrada');
    return;
  }
  
  const data = snap.data();
  console.log('📰 Noticia actual:');
  console.log('  Título:', data.titulo);
  console.log('  Fecha:', data.fecha);
  console.log('  Imagen:', data.imagen);
  console.log('  Categoría:', data.categoria);
  
  // Usar una imagen de accidente de tránsito genérica de picsum o unsplash
  // O una imagen ya subida al repo de imágenes
  const fechaISO = new Date().toISOString();
  
  await updateDoc(docRef, {
    fecha: fechaISO,
    categoria: 'Sucesos',
    imagen: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200&q=80',
    pieFoto: 'Imagen referencial de accidente de tránsito.',
    destacada: false,
    publicado: true
  });
  
  console.log('\n✅ Noticia actualizada:');
  console.log('  Fecha:', fechaISO);
  console.log('  Categoría: Sucesos');
  console.log('  Imagen: Agregada');
}

main().catch(err => console.error(err));
