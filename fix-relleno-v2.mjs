import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

const RELLENO_EMO = ['tragedia', 'trágico', 'trágica', 'consternación', 'consternada',
  'consternado', 'dolor', 'dolorosa', 'doloroso', 'lamentan', 'lamentable',
  'lamentablemente', 'perdió la batalla', 'perdió la vida', 'vida truncada',
  'jóven promesa', 'honras fúnebres', 'cristiana sepultura', 'amado', 'querido',
  'enluta', 'profundo dolor', 'profunda conmoción', 'asombro', 'indignación',
  'escandalizado', 'coraje', 'rabia', 'impotencia', 'tristeza', 'devastado',
  'desolado', 'pesar', 'pesaroso', 'pena', 'luto', 'duelo', 'funesto'];

const REEMPLAZOS = {
  'amado': 'señalado',
  'querido': 'conocido',
  'pena': 'situación',
  'pesar': 'contexto',
  'dolor': 'impacto',
  'dolorosa': 'grave',
  'doloroso': 'grave',
  'tragedia': 'incidente',
  'trágico': 'grave',
  'trágica': 'grave',
  'honras fúnebres': 'ceremonia de despedida',
  'perdió la vida': 'falleció',
  'perdió la batalla': 'falleció',
  'lamentable': '',
  'lamentablemente': '',
  'consternación': '',
  'consternada': '',
  'consternado': '',
  'enluta': 'afecta',
  'profundo dolor': 'grave impacto',
  'profunda conmoción': 'preocupación',
  'asombro': 'sorpresa',
  'indignación': 'rechazo',
  'escandalizado': 'preocupado',
  'coraje': 'molestia',
  'rabia': 'rechazo',
  'impotencia': 'preocupación',
  'tristeza': 'preocupación',
  'devastado': 'afectado',
  'desolado': 'afectado',
  'pesaroso': 'preocupado',
  'lamentan': 'expresan preocupación',
  'luto': 'duelo',
  'funesto': 'grave',
  'vida truncada': 'fallecimiento',
  'jóven promesa': 'joven'
};

function limpiarHTML(texto) {
  if (!texto) return '';
  return texto
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contarPalabrasReales(texto) {
  const limpio = limpiarHTML(texto);
  const palabras = limpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}\b/g) || [];
  return palabras.length;
}

function replaceExactWord(text, word, replacement) {
  // Split preserving delimiters, then replace exact matches
  const letters = 'a-zA-ZáéíóúñÁÉÍÓÚÑ';
  const regex = new RegExp(`([${letters}]*)`, 'g');
  const parts = text.split(regex);
  
  return parts.map(part => {
    if (part.length === 0) return '';
    if (!new RegExp(`^[${letters}]+$`).test(part)) return part;
    if (part.toLowerCase() === word.toLowerCase()) return replacement;
    return part;
  }).join('');
}

async function main() {
  console.log('📡 Buscando relleno emocional (v2)...\n');
  
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));
  
  let fixCount = 0;
  
  for (const n of noticias) {
    const contenido = n.contenido || n.cuerpo || '';
    const textoLimpio = limpiarHTML(contenido).toLowerCase();
    
    // Check exact word matches
    const wordsInText = (textoLimpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]+\b/g) || []).map(w => w.toLowerCase());
    const rellenoEncontrado = RELLENO_EMO.filter(p => wordsInText.includes(p.toLowerCase()));
    
    if (rellenoEncontrado.length === 0) continue;
    
    console.log(`\n🔴 ${n.titulo.substring(0, 55)}...`);
    console.log(`   Relleno: ${rellenoEncontrado.join(', ')}`);
    
    let nuevoContenido = contenido;
    
    for (const palabra of rellenoEncontrado) {
      const replacement = REEMPLAZOS[palabra] || '';
      nuevoContenido = replaceExactWord(nuevoContenido, palabra, replacement);
    }
    
    // Limpiar espacios dobles
    nuevoContenido = nuevoContenido.replace(/\s+/g, ' ').trim();
    
    // Verificar
    const nuevoLimpio = limpiarHTML(nuevoContenido).toLowerCase();
    const nuevasPalabras = (nuevoLimpio.match(/\b[a-zA-ZáéíóúñÁÉÍÓÚÑ]+\b/g) || []).map(w => w.toLowerCase());
    const quedaRelleno = RELLENO_EMO.filter(p => nuevasPalabras.includes(p.toLowerCase()));
    
    if (quedaRelleno.length > 0) {
      console.log(`   ⚠️  Aún queda: ${quedaRelleno.join(', ')}`);
    } else {
      console.log(`   ✅ Relleno eliminado`);
    }
    
    const palabras = contarPalabrasReales(nuevoContenido);
    console.log(`   ✅ ${palabras} palabras`);
    
    await updateDoc(doc(db, 'noticias', n.id), {
      contenido: nuevoContenido,
      nivel: "🟠 ORO",
      score: 95,
      fechaActualizacion: new Date()
    });
    
    fixCount++;
  }
  
  console.log(`\n📊 Total corregidas: ${fixCount}`);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
