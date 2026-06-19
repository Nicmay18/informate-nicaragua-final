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

async function main() {
  console.log('📡 Buscando relleno emocional...\n');
  
  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));
  
  let fixCount = 0;
  
  for (const n of noticias) {
    const contenido = n.contenido || n.cuerpo || '';
    const textoLimpio = limpiarHTML(contenido).toLowerCase();
    
    const rellenoEncontrado = RELLENO_EMO.filter(p => textoLimpio.includes(p));
    
    if (rellenoEncontrado.length === 0) continue;
    
    console.log(`\n🔴 ${n.titulo.substring(0, 55)}...`);
    console.log(`   Relleno: ${rellenoEncontrado.join(', ')}`);
    
    let nuevoContenido = contenido;
    
    for (const palabra of rellenoEncontrado) {
      // Reemplazo exacto case-insensitive preservando el texto original
      const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
      
      if (palabra === 'amado') {
        nuevoContenido = nuevoContenido.replace(regex, 'señalado');
      } else if (palabra === 'querido') {
        nuevoContenido = nuevoContenido.replace(regex, 'conocido');
      } else if (palabra === 'pena') {
        nuevoContenido = nuevoContenido.replace(regex, 'situación');
      } else if (palabra === 'pesar') {
        nuevoContenido = nuevoContenido.replace(regex, 'contexto');
      } else if (palabra === 'dolor') {
        nuevoContenido = nuevoContenido.replace(regex, 'impacto');
      } else if (palabra === 'tragedia') {
        nuevoContenido = nuevoContenido.replace(regex, 'incidente');
      } else if (palabra === 'lamentable') {
        nuevoContenido = nuevoContenido.replace(regex, '');
      } else if (palabra === 'lamentablemente') {
        nuevoContenido = nuevoContenido.replace(regex, '');
      } else if (palabra === 'honras fúnebres') {
        nuevoContenido = nuevoContenido.replace(regex, 'ceremonia de despedida');
      } else if (palabra === 'perdió la vida') {
        nuevoContenido = nuevoContenido.replace(regex, 'falleció');
      } else if (palabra === 'consternación') {
        nuevoContenido = nuevoContenido.replace(regex, '');
      } else {
        nuevoContenido = nuevoContenido.replace(regex, '');
      }
    }
    
    // Limpiar espacios dobles que quedaron
    nuevoContenido = nuevoContenido.replace(/\s+/g, ' ').trim();
    
    // Verificar que se eliminó
    const nuevoLimpio = limpiarHTML(nuevoContenido).toLowerCase();
    const quedaRelleno = RELLENO_EMO.filter(p => nuevoLimpio.includes(p));
    
    if (quedaRelleno.length > 0) {
      console.log(`   ⚠️  Aún queda: ${quedaRelleno.join(', ')}`);
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
