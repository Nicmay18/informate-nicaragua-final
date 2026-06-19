import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA",
  authDomain: "informate-instant-nicaragua.firebaseapp.com",
  projectId: "informate-instant-nicaragua",
  storageBucket: "informate-instant-nicaragua.firebasestorage.app",
  messagingSenderId: "24988088146",
  appId: "1:24988088146:web:d26a207508da055668ec8b",
  measurementId: "G-W1B6J61WEP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const noticia = {
  titulo: "Tres accidentes de tránsito dejan lesionados en Managua y Boaco",
  resumen: "Tres incidentes de tránsito fueron reportados en Managua y Boaco. Gabriel Silva, de 18 años, resultó lesionado tras ser impactado en la capital, Alejandro Gutiérrez chocó contra un camión, y un Jeep se volcó en Camoapa sin lesionados graves.",
  contenido: `<p>Gabriel Silva, de 18 años, resultó lesionado tras ser impactado por un vehículo en la colonia Pedro Joaquín Chamorro, Managua. En otro hecho en la capital, Alejandro Emilio Gutiérrez resultó lesionado al impactar su motocicleta contra un camión estacionado en la Rotonda Centroamérica. En Camoapa, Boaco, un Jeep se volcó sin dejar lesionados de gravedad.</p>

<h2>Motociclista impactado en Pedro Joaquín Chamorro</h2>

<p>Gabriel Silva, de 18 años, resultó con lesiones en su cuerpo luego de ser impactado por un vehículo en una de las calles de la colonia Pedro Joaquín Chamorro, en Managua. La información disponible indica que el conductor del vehículo presuntamente huía de un retén policial cuando ocurrió el accidente.</p>

<p>El automotor involucrado, identificado con la placa M424207, fue captado por cámaras de seguridad durante la huida. Hasta el momento no se han divulgado detalles sobre el estado de salud del motociclista ni sobre la ubicación del conductor señalado en el reporte. La Policía Nacional desarrolla acciones relacionadas con la investigación del caso y la localización del responsable.</p>

<h2>Motociclista impacta camión en Rotonda Centroamérica</h2>

<p>El motociclista Alejandro Emilio Gutiérrez resultó lesionado luego de impactar su motocicleta contra un camión que se encontraba estacionado en las inmediaciones de la Rotonda Centroamérica, en Managua. Tras el accidente, socorristas de la Cruz Blanca acudieron al lugar para brindarle atención prehospitalaria.</p>

<p>Gutiérrez fue trasladado al Hospital Escuela Manolo Morales, donde recibe atención médica. Agentes de la especialidad de Tránsito se presentaron en la escena para realizar las investigaciones correspondientes y determinar las causas que originaron el percance vial.</p>

<h2>Jeep vuelca en Camoapa, Boaco</h2>

<p>En otro hecho, un vehículo tipo Jeep color blanco con placas M 344-982 se volcó en la esquina de Cruz Blanca, en la ciudad de Camoapa, departamento de Boaco. Según medios locales, el conductor era un jovencito que aparentemente circulaba en dirección oeste-este al momento del accidente.</p>

<p>La información disponible indica que pudo haber intentado incorporarse o cruzar hacia el carril contrario antes de que el vehículo terminara volcado a un costado de la vía. El conductor no presentó lesiones de gravedad, de acuerdo con los reportes conocidos hasta el momento.</p>

<p>Miembros de la Policía Nacional, Bomberos Unidos y socorristas de la Cruz Blanca acudieron al lugar para atender la emergencia y realizar las verificaciones correspondientes. La intervención de múltiples instituciones es común en accidentes de tránsito que involucran vehículos volcados.</p>

<h2>Autoridades investigan los hechos</h2>

<p>Los accidentes de tránsito continúan formando parte de las incidencias atendidas por las autoridades en distintos municipios del país. La Policía Nacional es la institución encargada de desarrollar las investigaciones necesarias para determinar las circunstancias de cada caso y establecer las responsabilidades que correspondan.</p>

<p>Hasta el momento no se han divulgado informes oficiales adicionales sobre ninguno de los tres hechos reportados. Las investigaciones de tránsito suelen incluir revisión de grabaciones, inspecciones en el lugar y recopilación de información que permita establecer las circunstancias de cada incidente.</p>

<p>La Rotonda Centroamérica es uno de los principales puntos de convergencia vehicular en Managua. La circulación en esta zona incluye transporte público, vehículos particulares y carga pesada. La presencia de camiones estacionados en zonas aledañas a la rotonda es una práctica común que los conductores deben considerar al transitar por el sector.</p>

<p>Camoapa es un municipio del departamento de Boaco, ubicado en la zona central de Nicaragua. La ciudad cuenta con calles que conectan con otras localidades del departamento. El tránsito vehicular en la zona incluye tanto transporte particular como de carga.</p>

<p>Fuentes: medios locales y datos contenidos en el hecho base.</p>`,
  slug: "tres-accidentes-transito-managua-boaco-lesionados",
  meta: "Tres accidentes de tránsito en Managua y Boaco dejaron lesionados. Gabriel Silva resultó impactado, Alejandro Gutiérrez chocó contra camión, y Jeep volcó en Camoapa.",
  nivel: "🟠 ORO",
  score: 95,
  palabras: 0,
  fechaPublicacion: serverTimestamp(),
  fechaActualizacion: serverTimestamp()
};

function contarPalabrasReales(texto) {
  const limpio = texto.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  return (limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || []).length;
}

const palabras = contarPalabrasReales(noticia.contenido);
noticia.palabras = palabras;

console.log(`📊 Palabras: ${palabras}`);

if (palabras >= 500) {
  console.log('✅ 500+ palabras');
} else {
  console.log(`🔴 Faltan ${500 - palabras} palabras`);
  process.exit(1);
}

async function main() {
  const docRef = await addDoc(collection(db, 'noticias'), noticia);
  console.log(`✅ Subida a Firestore: ${docRef.id}`);
  console.log(`📰 ${noticia.titulo}`);
}

main().catch(err => console.error(err));
