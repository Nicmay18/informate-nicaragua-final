import { initializeApp } from 'firebase/app';
import { getFirestore, getDoc, doc } from 'firebase/firestore';

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
  { id: 'y3wh5fh7uBD2Rhc5EjBO', titulo: 'Dos personas mueren ahogadas...' },
  { id: 'yCN8IBbWL1xxPvNhJqTx', titulo: 'Capturan a hombre que mató...' }
];

function analizar(contenido, titulo) {
  const texto = contenido.toLowerCase();
  const palabras = (contenido.match(/\b\w+\b/g) || []).length;

  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|aseguró|mencionó|destacó|subrayó|recordó|advirtió|anunció|informó)\s+(que|el|la|a|sobre)/gi) || []).length;
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const horas = (contenido.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
  const fechas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;

  const datosConcretos = edades + horas + fechas + kilometros + cantidades;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;

  const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
    'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
    'finalmente', 'sin embargo', 'por otro lado', 'en este sentido'];
  const transiciones = TRANSICIONES_IA.filter(t => texto.includes(t));

  let score = 0;
  if (palabras >= 500) score += 20; else if (palabras >= 350) score += 10;
  if (densidad >= 5.0) score += 20; else if (densidad >= 3.0) score += 10;
  if (fuentes > 0) score += 15;
  if (citas > 0) score += 15;
  score += 10; // contexto local
  score += 10; // variación
  if (transiciones.length === 0) score += 10; else score -= transiciones.length * 5;

  let nivel = '🔴 PELIGRO';
  if (score >= 70) nivel = '🟢 ORO';
  else if (score >= 50) nivel = '🟡 BRONCE';

  return { palabras, densidad: parseFloat(densidad), citas, fuentes, transiciones: transiciones.length, score, nivel };
}

async function main() {
  for (const item of ids) {
    const snap = await getDoc(doc(db, 'noticias', item.id));
    if (snap.exists()) {
      const n = snap.data();
      const contenido = n.contenido || n.cuerpo || '';
      const a = analizar(contenido, n.titulo);
      console.log('');
      console.log('========================================');
      console.log('NOTICIA:', n.titulo);
      console.log('========================================');
      console.log('Palabras:', a.palabras, '(necesita 500 para +20, 350 para +10)');
      console.log('Densidad:', a.densidad, '(necesita 3.0 para +10)');
      console.log('Fuentes atribuidas:', a.fuentes, '(necesita 1 para +15)');
      console.log('Citas textuales:', a.citas, '(necesita 1 para +15)');
      console.log('Transiciones IA:', a.transiciones);
      console.log('SCORE:', a.score, '-', a.nivel);
      console.log('');
      console.log('PRIMERAS 200 PALABRAS DEL CONTENIDO:');
      console.log(contenido.substring(0, 800));
      console.log('');
    } else {
      console.log('NO ENCONTRADA:', item.id);
    }
  }
}

main().catch(console.error);
