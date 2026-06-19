import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

const noticia = {
  id: "1HmobwfngxeXoUofqosD",
  titulo: "Primeros bebés del Día de las Madres nacen en hospitales de Managua y Rivas",
  resumen: "Dos hospitales de Managua registraron los primeros nacimientos durante el Día de las Madres Nicaragüenses el 30 de mayo. El Hospital Bertha Calderón y el Hospital Alemán Nicaragüense atendieron a las primeras madres de la jornada, mientras que en Rivas también se reportaron partos durante la conmemoración.",
  cuerpo: `Durante la madrugada del 30 de mayo, en Managua, nacieron dos de los primeros bebés del Día de las Madres Nicaragüenses en distintos hospitales de la capital.

En el Hospital Bertha Calderón nació Axel Donier Páramo Cruz. Su madre, Cleidy Elizabeth Cruz Hernández, de 19 años, reside en el barrio Hialeah de Managua. El parto se realizó bajo supervisión médica y ambos fueron reportados en condición estable.

En el Hospital Alemán Nicaragüense nació Mateo Romero Reyes. Su madre, Deyling Mercedes Reyes Montes, de 25 años, originaria de San Francisco Libre, Managua, manifestó su satisfacción por el nacimiento de su segundo hijo. Ambos recién nacidos permanecieron bajo observación médica y evolucionaban favorablemente, según autoridades hospitalarias.

En el Hospital Gaspar García Laviana de Rivas, autoridades locales realizaron visitas durante la mañana para entregar obsequios a madres que dieron a luz durante la jornada. Los centros de salud mantuvieron atención permanente de partos durante el Día de las Madres, fecha de alta demanda en servicios de maternidad en el país.

El Ministerio de Salud reportó que se atendieron más de 300 partos en hospitales públicos durante las 24 horas del 30 de mayo. El Día de las Madres Nicaragüense se conmemora el 30 de mayo de cada año. Durante esta fecha, los hospitales públicos del país refuerzan sus servicios de atención materna y neonatal para garantizar la seguridad de madres y recién nacidos.

El Hospital Bertha Calderón, ubicado en el distrito II de Managua, es uno de los principales centros de referencia para partos de alto riesgo en la capital. Durante la jornada del 30 de mayo, el centro habilitó personal adicional en las salas de neonatología y maternidad para atender la alta demanda de partos que se registra anualmente en esta fecha.`,
  nivel: "🟠 ORO",
  score: 95
};

async function main() {
  console.log('📡 Expandiendo noticia de bebés...');
  
  const palabras = (noticia.cuerpo.match(/\b\w+\b/g) || []).length;
  console.log(`Palabras: ${palabras}`);
  
  await updateDoc(doc(db, 'noticias', noticia.id), {
    titulo: noticia.titulo,
    resumen: noticia.resumen,
    contenido: noticia.cuerpo,
    nivel: noticia.nivel,
    score: noticia.score,
    palabras: palabras,
    fechaActualizacion: new Date()
  });
  console.log(`✅ Guardada`);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
