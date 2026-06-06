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
const NUEVA_IMAGEN = 'https://raw.githubusercontent.com/Nicmay18/informate-images/main/images/tres-accidentes-de-transito-dejan-lesion-1780712541814.webp';

async function main() {
  // 1. Actualizar imagen en Firestore
  const docRef = doc(db, 'noticias', NOTICIA_ID);
  await updateDoc(docRef, {
    imagen: NUEVA_IMAGEN,
    pieFoto: 'Imagen referencial de los accidentes de tránsito reportados.',
    fechaActualizacion: new Date().toISOString()
  });
  console.log('✅ Imagen actualizada en Firestore');

  // 2. Reenviar a Telegram con la foto real
  const noticia = {
    titulo: "Tres accidentes de tránsito dejan lesionados en Managua y Boaco",
    resumen: "Tres incidentes de tránsito fueron reportados en Managua y Boaco. Gabriel Silva, de 18 años, resultó lesionado tras ser impactado en la capital, Alejandro Gutiérrez chocó contra un camión, y un Jeep se volcó en Camoapa sin lesionados graves.",
    categoria: "Sucesos",
    slug: "tres-accidentes-transito-managua-boaco-lesionados",
    imagen: NUEVA_IMAGEN
  };

  const CONFIG = {
    telegram: {
      token: "8750159697:AAEATUsPhdU7rd0unPDQKJh6van9AiDMuQw",
      chatId: "-1003431574597"
    }
  };

  try {
    const response = await fetch('https://nicaraguainformate.com/api/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticia, config: CONFIG })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Reenviado a Telegram con foto real. Message ID:', data.messageId);
    } else {
      console.log('❌ Error Telegram:', data.error);
      console.log('Detalles:', data.details || 'N/A');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main().catch(err => console.error(err));
