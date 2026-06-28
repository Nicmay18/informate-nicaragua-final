import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8QCVjN6CSb1C0y0JbC1P4e1A2B3C4D5E",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

initializeApp(firebaseConfig);
const db = getFirestore();

async function publicarTodas() {
  console.log('Obteniendo noticias de Firestore...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push(d.id));
  
  console.log(`Total noticias encontradas: ${noticias.length}`);
  console.log('Marcando como publicadas...');
  
  let count = 0;
  for (const id of noticias) {
    await updateDoc(doc(db, 'noticias', id), { publicado: true });
    count++;
    if (count % 50 === 0) console.log(`  ${count}/${noticias.length}...`);
  }
  
  console.log(`✅ ${count} noticias marcadas como publicadas`);
}

publicarTodas().catch(err => console.error('Error:', err.message));
