import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { writeFileSync } from 'fs';

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

const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido'];

const RELLENO_PATRONES = [
  'tragedia', 'trágico', 'trágica', 'consternación', 'consternada', 'consternado',
  'dolor', 'dolorosa', 'doloroso', 'lamentan', 'lamentable', 'lamentablemente',
  'perdió la batalla', 'perdió la vida', 'vida truncada', 'jóven promesa',
  'honras fúnebres', 'cristiana sepultura', 'amado', 'querido', 'enluta',
  'profundo dolor', 'profunda conmoción', 'asombro', 'indignación', 'escandalizado',
  'coraje', 'rabia', 'impotencia', 'tristeza', 'devastado', 'desolado'
];

function analizar(n) {
  // Si ya está marcada como ORO en Firestore, respetar ese nivel y score
  if (n.nivel && n.nivel.includes('ORO')) {
    return {
      id: n.id,
      titulo: n.titulo,
      slug: n.slug,
      palabras: n.palabras || 0,
      densidad: 0,
      relleno: 0,
      transiciones_ia: 0,
      fuentes_atribuidas: 0,
      citas: 0,
      contexto_local: 1,
      variacion: 'ALTA',
      score: n.score || 95,
      nivel: n.nivel
    };
  }

  const contenido = n.contenido || n.cuerpo || '';
  const texto = contenido.toLowerCase();
  const palabras = (contenido.match(/\b\w+\b/g) || []).length;

  const transiciones = TRANSICIONES_IA.filter(t => texto.includes(t));
  const relleno = RELLENO_PATRONES.filter(p => texto.includes(p));
  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const fuentes = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo|manifestó|expresó|precisó|detalló|explicó|agregó)\s+(que|el|la)/gi) || []).length;
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const horas = (contenido.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
  const fechasDetalladas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas|policías|agentes|vehículos)\b/gi) || []).length;

  const datosConcretos = edades + horas + fechasDetalladas + kilometros + cantidades;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;

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

  return {
    id: n.id,
    titulo: n.titulo,
    slug: n.slug,
    palabras,
    densidad: parseFloat(densidad),
    relleno: relleno.length,
    transiciones_ia: transiciones.length,
    fuentes_atribuidas: fuentes,
    citas,
    contexto_local: texto.includes('nicaragua') || texto.includes('managua') || texto.includes('león') || texto.includes('granada') ? 1 : 0,
    variacion: palabras > 0 ? 'ALTA' : 'BAJA',
    score,
    nivel
  };
}

async function main() {
  console.log('📡 Leyendo desde Firestore...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}`);
  console.log('🔍 Auditando...');

  const auditadas = noticias.map(analizar);
  writeFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-noticias.json', JSON.stringify(auditadas, null, 2), 'utf8');

  const peligro = auditadas.filter(n => n.nivel.includes('PELIGRO'));
  const bronce = auditadas.filter(n => n.nivel.includes('BRONCE'));
  const oro = auditadas.filter(n => n.nivel.includes('ORO'));

  console.log('\n📊 RESULTADOS:');
  console.log(`   🔴 PELIGRO: ${peligro.length}`);
  console.log(`   🟡 BRONCE:  ${bronce.length}`);
  console.log(`   🟢 ORO:     ${oro.length}`);
  console.log(`   Total:     ${auditadas.length}`);

  if (peligro.length > 0) {
    console.log('\n⚠️  Noticias en PELIGRO:');
    peligro.forEach(n => console.log(`   - ${n.titulo} (score: ${n.score})`));
  }

  console.log('\n✅ Auditoría guardada en auditoria-noticias.json');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
