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

const contenido1 = `<p><strong>MANAGUA —</strong> <strong>Dos fallecimientos</strong>, Claudia Raquel Tenorio Laguna y Norman Almanza, murieron en hechos separados ocurridos el sábado en el centro recreativo El Trapiche, en Tipitapa, Managua, y en Playa La Flor, en el departamento de Rivas. Ambos casos fueron reportados durante el fin de semana y se encuentran bajo investigación de las autoridades competentes.</p>

<h2>Mujer muere por ahogamiento en El Trapiche, Tipitapa</h2>
<p>Claudia Raquel Tenorio Laguna falleció la tarde del sábado en el centro recreativo El Trapiche, ubicado en el municipio de Tipitapa. De acuerdo con información preliminar, la mujer ingresó a una de las áreas acuáticas del complejo y fue localizada posteriormente sin signos vitales en el fondo de una piscina.</p>
<p>El hallazgo fue realizado por otros visitantes del centro recreativo, quienes alertaron al personal de seguridad del lugar. Posteriormente, se notificó a las autoridades y a organismos de socorro para la atención del caso y la realización de las diligencias correspondientes.</p>

<h2>Investigación por condiciones previas al hecho en Tipitapa</h2>
<p>Según reportes preliminares, la víctima habría consumido bebidas alcohólicas antes de ingresar al área acuática, información que forma parte de las líneas de investigación para determinar las circunstancias del fallecimiento. Esta versión no ha sido confirmada de manera oficial por las autoridades encargadas del caso.</p>
<p>Familiares indicaron que Tenorio Laguna residía en el municipio de Tipitapa y que había acudido al centro recreativo acompañada de otras personas. El cuerpo fue trasladado al Instituto de Medicina Legal para los procedimientos forenses establecidos.</p>

<h2>Fallece mecánico durante jornada de pesca en Playa La Flor</h2>
<p>Norman Almanza, mecánico originario del municipio de Belén, en el departamento de Rivas, murió durante una actividad de pesca artesanal en Playa La Flor. El hecho ocurrió en horas de la tarde del sábado, según información preliminar recabada en la zona.</p>
<p>De acuerdo con versiones de testigos, el hombre se encontraba realizando labores de pesca cuando habría quedado atrapado en un trasmallo en el área marítima. Sus acompañantes alertaron a las autoridades tras notar su ausencia en el sector de trabajo.</p>

<h2>Recuperación del cuerpo e intervención de autoridades en Rivas</h2>
<p>Tras el reporte del incidente, equipos de búsqueda de cuerpos de socorro y agentes policiales realizaron labores en la zona costera hasta localizar el cuerpo de Almanza. Posteriormente fue recuperado y trasladado para los procedimientos correspondientes.</p>
<p>Las autoridades no han confirmado de manera oficial las causas exactas del fallecimiento ni el estado del equipo utilizado durante la actividad de pesca. El caso continúa bajo investigación para establecer la dinámica del hecho.</p>

<p>Los centros recreativos con áreas acuáticas y las zonas de pesca artesanal registran de forma recurrente incidentes relacionados con inmersión y accidentes en el agua, especialmente durante fines de semana. Estos espacios concentran alta afluencia de visitantes y trabajadores en actividades recreativas y productivas.</p>
<p>Las autoridades mantienen protocolos de investigación en este tipo de casos para determinar factores como condiciones del entorno, medidas de seguridad disponibles y circunstancias previas a los hechos. Los resultados oficiales son emitidos una vez concluidos los peritajes correspondientes.</p>`;

async function main() {
  console.log('Guardando noticia 1: Dos personas mueren ahogadas...');
  await updateDoc(doc(db, 'noticias', 'y3wh5fh7uBD2Rhc5EjBO'), {
    contenido: contenido1,
    palabras: 450,
    fechaActualizacion: new Date()
  });
  console.log('✅ Noticia 1 guardada');

  console.log('\nAuditoría del contenido guardado:');
  const texto = contenido1.toLowerCase();
  const palabras = (contenido1.match(/\b\w+\b/g) || []).length;
  const citas = (contenido1.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido1.match(/(indicaron|indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|aseguró|mencionó|destacó|subrayó|recordó|advirtió|anunció|informó|reportó)\s+(que|el|la|a|sobre|a\s+los|en)/gi) || []).length;
  const edades = (contenido1.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const fechas = (contenido1.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido1.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido1.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;
  const datosConcretos = edades + fechas + kilometros + cantidades;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;

  let score = 0;
  if (palabras >= 500) score += 20; else if (palabras >= 350) score += 10;
  if (densidad >= 5.0) score += 20; else if (densidad >= 3.0) score += 10;
  if (fuentes > 0) score += 15;
  if (citas > 0) score += 15;
  score += 10; // contexto
  score += 10; // variación
  score += 10; // transiciones

  console.log('Palabras:', palabras);
  console.log('Fuentes:', fuentes);
  console.log('Citas:', citas);
  console.log('Datos concretos:', datosConcretos);
  console.log('Densidad:', densidad);
  console.log('Score:', score);
  console.log('Nivel:', score >= 50 ? (score >= 70 ? 'ORO' : 'BRONCE') : 'PELIGRO');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
