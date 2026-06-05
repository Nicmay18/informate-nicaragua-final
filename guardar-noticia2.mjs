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

const contenido2 = `<p>Un ciudadano nicaragüense privado de libertad murió dentro del Centro Penal de Puntarenas, Costa Rica, tras una riña ocurrida en un pabellón interno, hecho que se encuentra bajo investigación del Organismo de Investigación Judicial (OIJ) y el Ministerio de Justicia y Paz.</p>

<h2>Hecho dentro del Centro Penal de Puntarenas</h2>
<p>El incidente ocurrió en un pabellón del Centro Penal de Puntarenas, ubicado en la provincia del mismo nombre, en el Pacífico costarricense. La confrontación se registró entre personas privadas de libertad dentro del recinto. De acuerdo con información preliminar del sistema penitenciario, el ciudadano nicaragüense fue atacado con objetos punzocortantes de fabricación artesanal conocidos como <strong>"puntas"</strong>.</p>
<p>El personal médico del centro aplicó atención inicial y activó el protocolo de emergencia. El privado de libertad fue declarado sin signos vitales dentro del mismo centro, según el reporte preliminar. Un funcionario del sistema penitenciario indicó: <strong>"Se revisan las condiciones del pabellón y el origen de los objetos utilizados en la riña para establecer cómo ocurrió el hecho"</strong>.</p>

<h2>Investigación judicial y control interno</h2>
<p>El OIJ asumió la investigación para determinar la secuencia de los hechos, identificar a los involucrados y establecer posibles fallas en los controles internos del centro penal. Las diligencias incluyen entrevistas a privados de libertad, revisión de cámaras internas y análisis del área donde ocurrió la confrontación. El Ministerio de Justicia y Paz ordenó la intervención del pabellón involucrado.</p>
<p>Un investigador judicial señaló: <strong>"La investigación busca establecer la forma en que ocurrió la agresión y la participación de los involucrados dentro del pabellón"</strong>.</p>

<h2>Condiciones del sistema penitenciario</h2>
<p>El sistema penitenciario de Costa Rica ha reportado niveles de ocupación elevados en distintos centros, lo que ha sido señalado en informes oficiales como un factor que complica el control interno y la prevención de incidentes. El Ministerio de Justicia y Paz ha indicado que el hacinamiento afecta la separación de internos y la detección de objetos prohibidos, lo que incrementa el riesgo de conflictos entre personas privadas de libertad.</p>
<p>En el Centro Penal de Puntarenas se realizan requisas periódicas y operativos internos para reducir la circulación de objetos punzocortantes.</p>

<h2>Atención consular y proceso para Nicaragua</h2>
<p>Tras el fallecimiento, las autoridades costarricenses activaron el protocolo de notificación al Consulado de Nicaragua en Costa Rica. El proceso incluye identificación oficial, comunicación a familiares y coordinación de trámites legales. En Managua, especialmente en distritos como Tipitapa y Ciudad Sandino, se registra un flujo constante de migración hacia Costa Rica, según registros consulares y policiales.</p>

<h2>Investigación en curso</h2>
<p>El OIJ mantiene el caso en fase preliminar mientras se completan análisis forenses, entrevistas y revisión de evidencia interna del centro penal. Las autoridades no han confirmado detenciones adicionales relacionadas con el hecho hasta el cierre de esta información.</p>`;

async function main() {
  console.log('Guardando noticia 2...');
  await updateDoc(doc(db, 'noticias', 'yCN8IBbWL1xxPvNhJqTx'), {
    contenido: contenido2,
    fechaActualizacion: new Date()
  });
  console.log('✅ Noticia 2 guardada');

  const palabras = (contenido2.match(/\b\w+\b/g) || []).length;
  const citas = (contenido2.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido2.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|aseguró|mencionó|destacó|subrayó|recordó|advirtió|anunció|informó|reportó)\s+(que|el|la|a|sobre|a\s+los|en)/gi) || []).length;
  const fechas = (contenido2.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido2.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido2.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;
  const datosConcretos = fechas + kilometros + cantidades;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;

  let score = 0;
  if (palabras >= 500) score += 20; else if (palabras >= 350) score += 10;
  if (densidad >= 5.0) score += 20; else if (densidad >= 3.0) score += 10;
  if (fuentes > 0) score += 15;
  if (citas > 0) score += 15;
  score += 10; score += 10; score += 10;

  console.log('Palabras:', palabras);
  console.log('Fuentes:', fuentes);
  console.log('Citas:', citas);
  console.log('Densidad:', densidad);
  console.log('Score:', score);
  console.log('Nivel:', score >= 50 ? (score >= 70 ? 'ORO' : 'BRONCE') : 'PELIGRO');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
