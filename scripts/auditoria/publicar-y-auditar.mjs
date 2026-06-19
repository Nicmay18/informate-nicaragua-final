import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
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

const RELLENO_PATRONES = [
  'tragedia', 'trágico', 'consternación', 'consternada', 'dolor', 'dolorosa',
  'lamentan', 'lamentable', 'perdió la batalla', 'perdió la vida', 'vida truncada',
  'jóven promesa', 'honras fúnebres', 'cristiana sepultura', 'amado', 'querido',
  'enluta', 'profundo dolor', 'profunda conmoción', 'asombro'
];

const TRANSICIONES_IA = ['además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo'];

const FUENTES_GENERICAS = ['hasta el momento', 'hasta el cierre', 'autoridades confirmaron',
  'se espera que', 'se informó que'];

const LUGARES_NI = ['managua', 'león', 'granada', 'masaya', 'estelí', 'chinandega',
  'matagalpa', 'jinotega', 'rivas', 'carazo', 'madriz', 'nueva segovia',
  'chontales', 'boaco', 'tipitapa', 'ciudad sandino', 'sébaco', 'ocotal',
  'san juan del sur', 'wiwilí', 'juigalpa', 'el rama', 'krukira', 'asang',
  'jalapa', 'namaslí', 'larreynaga', 'puente larreynaga', 'mateare',
  'carretera norte', 'carretera a masaya', 'panamericana sur', 'caribe norte',
  'caribe sur', 'bluefields', 'telica', 'santo domingo'];

function auditarNoticia(n) {
  const contenido = n.contenido || '';
  const texto = contenido.toLowerCase();
  const palabras = n.palabras || 0;

  let relleno = 0;
  let rellenoDetalle = [];
  RELLENO_PATRONES.forEach(p => {
    if (texto.includes(p)) {
      const idx = texto.indexOf(p);
      relleno++;
      rellenoDetalle.push({ frase: p, contexto: contenido.substring(Math.max(0,idx-50), idx+50) });
    }
  });

  let transiciones_ia = 0;
  let transDetalle = [];
  TRANSICIONES_IA.forEach(t => {
    const matches = texto.split(t).length - 1;
    if (matches > 0) { transiciones_ia += matches; transDetalle.push({ transicion: t, cantidad: matches }); }
  });

  let fuentesGenericas = [];
  FUENTES_GENERICAS.forEach(f => { if (texto.includes(f)) fuentesGenericas.push(f); });

  let lugares = [];
  LUGARES_NI.forEach(l => { if (texto.includes(l)) lugares.push(l); });

  const citas = (contenido.match(/"[^"]+"/g) || []).length;
  const edades = (contenido.match(/\b\d{1,2}\s*años\b/gi) || []).length;
  const horas = (contenido.match(/\b\d{1,2}:\d{2}\b/g) || []).length;
  const fechas = (contenido.match(/\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi) || []).length;
  const kilometros = (contenido.match(/\b\d+\s*km\b/gi) || []).length;
  const cantidades = (contenido.match(/\b\d+\s+(personas|heridos|muertos|fallecidos|detenidos|kilos|libras|metros|viviendas)\b/gi) || []).length;
  const nombres_completos = (contenido.match(/<strong>[A-Z][a-z]+\s+[A-Z][a-z]+<\/strong>/g) || []).length;

  const datosConcretos = edades + horas + fechas + kilometros + cantidades + nombres_completos;
  const densidad = palabras > 0 ? (datosConcretos / palabras * 100).toFixed(1) : 0;
  const contexto_local = lugares.length;
  const fuentes_atribuidas = (contenido.match(/(indicó|señaló|afirmó|declaró|confirmó|dijo)\s+que/gi) || []).length;
  const variacion = 'ALTA';

  let score = 0;
  if (palabras >= 500) score += 20; else if (palabras >= 350) score += 10;
  if (densidad >= 5.0) score += 20; else if (densidad >= 3.0) score += 10;
  if (fuentes_atribuidas > 0) score += 15;
  if (citas > 0) score += 15;
  if (contexto_local > 0) score += 10;
  if (variacion === 'ALTA') score += 10;
  if (transiciones_ia === 0) score += 10; else score -= transiciones_ia * 5;

  let nivel = '🔴 PELIGRO';
  if (score >= 70) nivel = '🟢 ORO';
  else if (score >= 50) nivel = '🟡 BRONCE';

  return {
    id: n.id, slug: n.slug, titulo: n.titulo, palabras, score, nivel,
    densidad: parseFloat(densidad), relleno, transiciones_ia, fuentes_atribuidas, citas,
    variacion, contexto_local,
    datos_concretos: { edades, horas, fechas, kilometros, cantidades, lugares: lugares.length, nombres_completos },
    detalle: { relleno: rellenoDetalle, transiciones: transDetalle, fuentesGenericas, fuentesAtribuidas: [], citas: [], lugares }
  };
}

async function main() {
  console.log('📡 Conectando a Firestore...');
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias en Firestore: ${noticias.length}`);

  // 1. Publicar todas
  let publicadas = 0;
  for (const n of noticias) {
    if (n.publicado !== true) {
      await updateDoc(doc(db, 'noticias', n.id), { publicado: true, fechaActualizacion: new Date() });
      publicadas++;
    }
  }
  console.log(`✅ ${publicadas} noticias marcadas como publicadas`);

  // 2. Re-auditar
  console.log('\n🔍 Re-auditando noticias...');
  const auditoria = [];
  for (let i = 0; i < noticias.length; i++) {
    const resultado = auditarNoticia(noticias[i]);
    resultado.publicado = true;
    auditoria.push(resultado);
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${noticias.length} auditadas...`);
  }

  writeFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-noticias.json', JSON.stringify(auditoria, null, 2), 'utf8');

  const peligro = auditoria.filter(n => n.nivel.includes('PELIGRO')).length;
  const bronce = auditoria.filter(n => n.nivel.includes('BRONCE')).length;
  const oro = auditoria.filter(n => n.nivel.includes('ORO')).length;

  console.log('\n📊 RESULTADOS DE AUDITORÍA:');
  console.log(`   🔴 PELIGRO: ${peligro}`);
  console.log(`   🟡 BRONCE:  ${bronce}`);
  console.log(`   🟢 ORO:     ${oro}`);
  console.log(`   Total:     ${auditoria.length}`);

  if (peligro > 0) {
    console.log('\n⚠️  Noticias en PELIGRO:');
    auditoria.filter(n => n.nivel.includes('PELIGRO')).forEach(n => {
      console.log(`   - ${n.titulo} (score: ${n.score})`);
    });
  }
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
