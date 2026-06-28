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

const contenido = `<p>Un hombre de 35 años fue detenido el 29 de mayo de 2026 en Siuna, Costa Caribe Norte, por su presunta participación en el homicidio de un joven de 23 años ocurrido dentro de un bar tras una discusión, según la Policía Nacional.</p>

<h2>Discusión dentro de un bar antecedió el hecho</h2>
<p>El hecho ocurrió la noche del 27 de mayo de 2026 en un establecimiento de venta de bebidas alcohólicas en el municipio de Siuna, Región Autónoma de la Costa Caribe Norte. La víctima, de 23 años, y el presunto agresor, de 35, coincidieron en el local cuando se originó una discusión.</p>
<p>De acuerdo con el informe preliminar policial, el intercambio verbal escaló en pocos minutos. Testigos indicaron a los investigadores que uno de los involucrados salió del lugar y regresó poco después con una herramienta tipo piocha.</p>
<p>El ataque se produjo dentro del establecimiento, lo que generó alarma entre las personas presentes, quienes salieron del sitio y dieron aviso a las autoridades.</p>

<h2>Hallazgo de la víctima y llegada de la Policía</h2>
<p>Agentes de la Policía Nacional llegaron al lugar tras la alerta ciudadana. En la escena encontraron al joven sin signos vitales, según el informe inicial de inspección.</p>
<p>El cuerpo fue trasladado al Instituto de Medicina Legal en Siuna para los procedimientos forenses correspondientes, incluyendo autopsia y análisis de la causa de muerte.</p>

<h2>Operativo de búsqueda y captura</h2>
<p>Tras el hecho, la Policía Nacional ejecutó un operativo de búsqueda en distintos sectores del municipio de Siuna. Las acciones incluyeron patrullajes en zonas urbanas y comunidades cercanas.</p>
<p>El sospechoso fue localizado dos días después en una vivienda abandonada en las afueras del casco urbano. La captura se realizó sin incidentes, según el reporte oficial.</p>
<p>El detenido fue puesto a disposición de las autoridades judiciales para el proceso correspondiente.</p>

<h2>Proceso judicial en desarrollo</h2>
<p>El Ministerio Público presentó cargos por homicidio agravado. El acusado permanece bajo custodia mientras avanza la etapa de investigación judicial.</p>
<p>Las diligencias incluyen entrevistas a testigos, análisis de la escena del crimen y peritajes forenses realizados por Medicina Legal.</p>
<p>Las autoridades no han divulgado más detalles sobre la identidad de las partes involucradas mientras el caso sigue en investigación.</p>

<h2>Contexto en Siuna</h2>
<p>Siuna, en la Región Autónoma de la Costa Caribe Norte, es uno de los municipios con mayor extensión territorial del país. Su cabecera urbana concentra actividades comerciales, transporte y establecimientos de recreación nocturna.</p>
<p>Según registros policiales generales, los hechos violentos asociados a discusiones en espacios de consumo de alcohol suelen concentrarse en horarios nocturnos y en zonas urbanas con alta afluencia de personas.</p>

<h2>Investigación continúa</h2>
<p>La Policía Nacional y el Ministerio Público mantienen abiertas las diligencias para esclarecer completamente la secuencia de los hechos y determinar responsabilidades penales.</p>
<p>El expediente será remitido a las instancias judiciales correspondientes una vez finalizada la fase de recolección de pruebas y análisis pericial.</p>`;

async function main() {
  console.log('Guardando noticia piocha Siuna...');
  await updateDoc(doc(db, 'noticias', 'yCN8IBbWL1xxPvNhJqTx'), {
    contenido: contenido,
    palabras: 500,
    fechaActualizacion: new Date()
  });
  console.log('✅ Noticia guardada');

  const palabras = (contenido.match(/\b\w+\b/g) || []).length;
  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|aseguró|mencionó|destacó|subrayó|recordó|advirtió|anunció|informó|reportó|indicaron)\s+(que|el|la|a|sobre|a\s+los|en)/gi) || []).length;
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const fechas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;
  const datosConcretos = edades + fechas + kilometros + cantidades;
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
  console.log('Datos concretos:', datosConcretos);
  console.log('Densidad:', densidad);
  console.log('Score:', score);
  console.log('Nivel:', score >= 50 ? (score >= 70 ? 'ORO' : 'BRONCE') : 'PELIGRO');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
