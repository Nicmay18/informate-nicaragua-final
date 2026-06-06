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
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido', 'en primer lugar',
  'en segundo lugar', 'dicho esto', 'de igual manera', 'en tanto que', 'así mismo',
  'de la misma forma', 'en contraste', 'por ende', 'consecuentemente'];

const RELLENO_EMO = ['tragedia', 'trágico', 'trágica', 'consternación', 'consternado',
  'consternada', 'dolor', 'dolorosa', 'doloroso', 'lamentan', 'lamentable',
  'lamentablemente', 'perdió la batalla', 'perdió la vida', 'vida truncada',
  'jóven promesa', 'honras fúnebres', 'cristiana sepultura', 'amado', 'querido',
  'enluta', 'profundo dolor', 'profunda conmoción', 'asombro', 'indignación',
  'escandalizado', 'coraje', 'rabia', 'impotencia', 'tristeza', 'devastado',
  'desolado', 'pesar', 'pesaroso', 'pena', 'luto', 'duelo', 'funesto'];

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contarPalabras(texto) {
  const limpio = limpiarHTML(texto);
  const palabras = limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || [];
  return palabras.length;
}

function analizarCuerpo(n) {
  // SOLO auditar el campo cuerpo: contenido o contenidoHtml
  const campoCuerpo = n.contenido || n.contenidoHtml || '';
  const textoLimpio = limpiarHTML(campoCuerpo).toLowerCase();
  const palabras = contarPalabras(campoCuerpo);

  const relleno = RELLENO_EMO.filter(p => textoLimpio.includes(p));
  const transiciones = TRANSICIONES_IA.filter(t => textoLimpio.includes(t));

  let nivel = '🟠 ORO';
  let score = 95;
  let problemas = [];

  if (palabras < 350) {
    problemas.push(`DESARROLLO INSUFICIENTE: ${palabras} palabras (mínimo 350)`);
    nivel = '🔴 PELIGRO';
    score = 40;
  } else if (palabras < 500) {
    problemas.push(`DESARROLLO BAJO: ${palabras} palabras (recomendado 500+)`);
    nivel = '🟡 BRONCE';
    score = 55;
  }

  if (relleno.length > 0) {
    problemas.push(`RELLENO EMOCIONAL: ${relleno.join(', ')}`);
    if (score > 50) score -= 10;
  }

  if (transiciones.length > 2) {
    problemas.push(`RASTROS DE IA: ${transiciones.slice(0,3).join(', ')}`);
    if (score > 50) score -= 10;
  }

  return {
    id: n.id,
    titulo: n.titulo || 'Sin título',
    palabrasCuerpo: palabras,
    palabrasResumen: contarPalabras(n.resumen || ''),
    relleno,
    transiciones,
    nivel,
    score,
    problemas,
    preview: limpiarHTML(campoCuerpo).substring(0, 150)
  };
}

async function main() {
  console.log('🔬 AUDITORÍA REAL — Solo campo cuerpo (contenido/contenidoHtml)');
  console.log('Ignorando resumen porque es un lead de 30-40 palabras por definición');
  console.log('=' .repeat(60));

  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}\n`);

  const auditoria = noticias.map(analizarCuerpo);

  const peligro = auditoria.filter(a => a.nivel.includes('PELIGRO'));
  const bronce = auditoria.filter(a => a.nivel.includes('BRONCE'));
  const oro = auditoria.filter(a => a.nivel.includes('ORO'));

  console.log('📊 RESULTADOS REALES DEL CUERPO:');
  console.log(`   🔴 PELIGRO (<350 palabras): ${peligro.length}`);
  console.log(`   🟡 BRONCE (350-499 palabras): ${bronce.length}`);
  console.log(`   🟠 ORO (500+ palabras): ${oro.length}`);
  console.log(`   ─────────────────────────`);
  console.log(`   TOTAL: ${auditoria.length}\n`);

  if (peligro.length > 0) {
    console.log('🔴 NOTICIAS CON CUERPO <350 PALABRAS:');
    peligro.forEach(a => {
      console.log(`\n   ❌ ${a.titulo.substring(0, 60)}...`);
      console.log(`      ID: ${a.id}`);
      console.log(`      Cuerpo: ${a.palabrasCuerpo} palabras | Resumen: ${a.palabrasResumen} palabras`);
      console.log(`      Problemas: ${a.problemas.join(' | ')}`);
    });
  }

  if (bronce.length > 0) {
    console.log(`\n🟡 NOTICIAS CON CUERPO 350-499 PALABRAS (${bronce.length}):`);
    bronce.slice(0, 10).forEach(a => {
      console.log(`   ⚠️  ${a.titulo.substring(0, 55)}... (${a.palabrasCuerpo} palabras)`);
    });
    if (bronce.length > 10) console.log(`   ... y ${bronce.length - 10} más`);
  }

  writeFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-cuerpo.json', JSON.stringify(auditoria, null, 2));
  console.log(`\n✅ Auditoría guardada: auditoria-cuerpo.json`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
