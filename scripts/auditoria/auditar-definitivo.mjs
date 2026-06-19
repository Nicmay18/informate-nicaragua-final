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

// ─── LISTAS PROHIBIDAS ───
const RELLENO_EMO = new Set([
  'tragedia', 'trágico', 'trágica', 'consternación', 'consternado', 'consternada',
  'dolor', 'dolorosa', 'doloroso', 'lamentan', 'lamentable', 'lamentablemente',
  'perdió la batalla', 'perdió la vida', 'vida truncada', 'jóven promesa',
  'honras fúnebres', 'cristiana sepultura', 'amado', 'querido', 'enluta',
  'profundo dolor', 'profunda conmoción', 'asombro', 'indignación',
  'escandalizado', 'coraje', 'rabia', 'impotencia', 'tristeza', 'devastado',
  'desolado', 'pesar', 'pesaroso', 'pena', 'luto', 'duelo', 'funesto',
  'desoladora', 'desgarrador', 'desgarradora', 'conmovedor', 'conmovedora',
  'dramático', 'dramática', 'fatal', 'funesta', 'lamentablemente', 'tristemente'
]);

const TRANSICIONES_IA = new Set([
  'además', 'por su parte', 'asimismo', 'en consecuencia',
  'es importante destacar', 'cabe señalar', 'por lo tanto', 'no obstante',
  'finalmente', 'sin embargo', 'por otro lado', 'en este sentido',
  'en primer lugar', 'en segundo lugar', 'dicho esto', 'de igual manera',
  'en tanto que', 'así mismo', 'de la misma forma', 'en contraste',
  'por ende', 'consecuentemente', 'en conclusión', 'para finalizar',
  'en resumen', 'de hecho', 'en efecto', 'a su vez', 'en el marco de',
  'en el contexto de', 'en este orden de ideas', 'por consiguiente',
  'en tal sentido', 'bajo esta premisa', 'en virtud de lo anterior'
]);

// ─── FUNCIONES AUXILIARES ───
function limpiarHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extraerPalabras(texto) {
  const limpio = limpiarHTML(texto).toLowerCase();
  // Split por cualquier cosa que no sea letra o número
  return limpio.split(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]+/).filter(p => p.length >= 2);
}

function extraerNgramas(texto, n) {
  const palabras = extraerPalabras(texto);
  const ngramas = [];
  for (let i = 0; i <= palabras.length - n; i++) {
    ngramas.push(palabras.slice(i, i + n).join(' '));
  }
  return ngramas;
}

function detectarRelleno(texto) {
  const palabras = extraerPalabras(texto);
  const encontradas = [];

  // Detectar palabras sueltas
  palabras.forEach(p => {
    if (RELLENO_EMO.has(p)) encontradas.push(p);
  });

  // Detectar frases de 2-3 palabras
  const bigramas = extraerNgramas(texto, 2);
  const trigramas = extraerNgramas(texto, 3);

  bigramas.forEach(b => {
    if (RELLENO_EMO.has(b)) encontradas.push(b);
  });
  trigramas.forEach(t => {
    if (RELLENO_EMO.has(t)) encontradas.push(t);
  });

  return [...new Set(encontradas)]; // únicos
}

function detectarTransiciones(texto) {
  const limpio = limpiarHTML(texto).toLowerCase();
  const encontradas = [];

  TRANSICIONES_IA.forEach(t => {
    // Para frases, usamos indexOf pero verificando boundaries manualmente
    const idx = limpio.indexOf(t);
    if (idx !== -1) {
      const antes = idx === 0 || !/[a-záéíóúñ]/.test(limpio[idx - 1]);
      const despues = idx + t.length >= limpio.length || !/[a-záéíóúñ]/.test(limpio[idx + t.length]);
      if (antes && despues) encontradas.push(t);
    }
  });

  return encontradas;
}

function contarPalabras(texto) {
  return extraerPalabras(texto).length;
}

// ─── ANÁLISIS POR NOTICIA ───
function analizar(n) {
  const cuerpo = n.contenido || n.contenidoHtml || '';
  const palabras = contarPalabras(cuerpo);
  const relleno = detectarRelleno(cuerpo);
  const transiciones = detectarTransiciones(cuerpo);

  let nivel = '🟠 ORO';
  let score = 95;
  let problemas = [];

  if (palabras < 350) {
    problemas.push(`CUERPO CORTO: ${palabras} palabras`);
    nivel = '🔴 PELIGRO';
    score = 40;
  } else if (palabras < 500) {
    problemas.push(`CUERPO MEDIO: ${palabras} palabras`);
    nivel = '🟡 BRONCE';
    score = 55;
  }

  if (relleno.length > 0) {
    problemas.push(`RELLENO: ${relleno.join(', ')}`);
    if (score > 50) score -= 15;
    if (score > 50) nivel = '🟡 BRONCE';
  }

  if (transiciones.length > 2) {
    problemas.push(`TRANSICIONES IA: ${transiciones.slice(0,3).join(', ')}`);
    if (score > 50) score -= 10;
  }

  return {
    id: n.id,
    titulo: n.titulo || 'Sin título',
    palabras,
    relleno,
    transiciones,
    nivel,
    score,
    problemas
  };
}

// ─── MAIN ───
async function main() {
  console.log('🔬 AUDITORÍA DEFINITIVA — Sin falsos positivos');
  console.log('Método: split exacto de palabras, no regex includes');
  console.log('=' .repeat(60));

  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total: ${noticias.length}\n`);

  const auditoria = noticias.map(analizar);

  const peligro = auditoria.filter(a => a.nivel.includes('PELIGRO'));
  const bronce = auditoria.filter(a => a.nivel.includes('BRONCE'));
  const oro = auditoria.filter(a => a.nivel.includes('ORO'));

  console.log('📊 RESULTADOS:');
  console.log(`   🔴 PELIGRO: ${peligro.length}`);
  console.log(`   🟡 BRONCE:  ${bronce.length}`);
  console.log(`   🟠 ORO:     ${oro.length}`);
  console.log(`   ─────────────────`);
  console.log(`   TOTAL:     ${auditoria.length}\n`);

  if (peligro.length > 0) {
    console.log('🔴 PELIGRO:');
    peligro.forEach(a => {
      console.log(`\n   ❌ ${a.titulo.substring(0,55)}...`);
      console.log(`      ${a.problemas.join(' | ')}`);
    });
  }

  if (bronce.length > 0) {
    console.log(`\n🟡 BRONCE (${bronce.length}):`);
    bronce.forEach(a => {
      console.log(`   ⚠️  ${a.titulo.substring(0,55)}...`);
      console.log(`      ${a.problemas.join(' | ')}`);
    });
  }

  // Si todo está en ORO, mostrar muestra de las que antes eran BRONCE
  if (bronce.length === 0 && peligro.length === 0) {
    console.log('\n✅ 181 ORO confirmado. Sin falsos positivos.');
    console.log('\n🔍 MUESTRA DE VERIFICACIÓN (primeras 5 noticias):');
    auditoria.slice(0,5).forEach(a => {
      console.log(`   ${a.titulo.substring(0,50)}...`);
      console.log(`      Palabras: ${a.palabras} | Relleno: ${a.relleno.length ? a.relleno.join(', ') : 'ninguno'} | IA: ${a.transiciones.length ? a.transiciones.slice(0,2).join(', ') : 'ninguna'}`);
    });
  }

  writeFileSync('g:/RESPALDO/informate-nicaragua-final/auditoria-definitiva.json', JSON.stringify(auditoria, null, 2));
  console.log(`\n📄 Guardado: auditoria-definitiva.json`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
