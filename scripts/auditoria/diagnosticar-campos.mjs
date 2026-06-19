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

async function main() {
  console.log('🔍 DIAGNÓSTICO — ¿Qué campo está leyendo el script?');
  console.log('=' .repeat(60));

  const snapshot = await getDocs(collection(db, 'noticias'));
  const noticias = [];
  snapshot.forEach(d => noticias.push({ id: d.id, ...d.data() }));

  console.log(`📰 Total noticias: ${noticias.length}\n`);

  // Mostrar campos disponibles de la primera noticia
  const primera = noticias[0];
  console.log('📋 Campos de la primera noticia:');
  Object.keys(primera).forEach(k => {
    const v = primera[k];
    const tipo = typeof v;
    const longitud = tipo === 'string' ? v.length : (Array.isArray(v) ? v.length : 'n/a');
    console.log(`   ${k}: ${tipo} (longitud: ${longitud})`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 MUESTREO DE LAS PRIMERAS 10 NOTICIAS:');
  console.log('='.repeat(60));

  noticias.slice(0, 10).forEach((n, i) => {
    // Probar todos los campos de texto posibles
    const camposTexto = {};
    ['contenido', 'cuerpo', 'texto', 'body', 'resumen', 'descripcion', 'description', 'content'].forEach(campo => {
      if (n[campo] && typeof n[campo] === 'string') {
        camposTexto[campo] = contarPalabras(n[campo]);
      }
    });

    // El campo que usa mi script
    const campoUsado = n.contenido || n.cuerpo || n.texto || n.body || '';
    const palabrasUsadas = contarPalabras(campoUsado);
    const preview = limpiarHTML(campoUsado).substring(0, 200);

    console.log(`\n${i+1}. ${n.titulo?.substring(0, 50) || 'Sin título'}...`);
    console.log(`   ID: ${n.id}`);
    console.log(`   Campos con texto: ${Object.keys(camposTexto).join(', ') || 'NINGUNO'}`);
    console.log(`   Palabras por campo: ${JSON.stringify(camposTexto)}`);
    console.log(`   Mi script usaría: ${palabrasUsadas} palabras`);
    console.log(`   Preview: "${preview}..."`);
  });

  // Buscar noticias con menos de 350 palabras en CUALQUIER campo
  console.log('\n' + '='.repeat(60));
  console.log('🔴 BUSCANDO NOTICIAS CON <350 PALABRAS EN ALGÚN CAMPO:');
  console.log('='.repeat(60));

  let encontradas = 0;
  noticias.forEach(n => {
    const campos = ['contenido', 'cuerpo', 'texto', 'body', 'resumen', 'descripcion', 'description', 'content'];
    let campoCorto = null;
    let palabrasCorto = 9999;

    campos.forEach(c => {
      if (n[c] && typeof n[c] === 'string') {
        const p = contarPalabras(n[c]);
        if (p < palabrasCorto) {
          palabrasCorto = p;
          campoCorto = c;
        }
      }
    });

    if (palabrasCorto < 350) {
      encontradas++;
      console.log(`\n   ❌ ${n.titulo?.substring(0, 50) || 'Sin título'}...`);
      console.log(`      ID: ${n.id}`);
      console.log(`      Campo más corto: ${campoCorto} (${palabrasCorto} palabras)`);
    }
  });

  if (encontradas === 0) {
    console.log('\n   ✅ Ninguna noticia tiene menos de 350 palabras en ningún campo.');
  } else {
    console.log(`\n   🔴 Total con <350 palabras: ${encontradas}`);
  }

  // Guardar reporte completo
  const reporte = noticias.map(n => {
    const campos = {};
    ['contenido', 'cuerpo', 'texto', 'body', 'resumen', 'descripcion', 'description', 'content'].forEach(c => {
      if (n[c] && typeof n[c] === 'string') {
        campos[c] = contarPalabras(n[c]);
      }
    });
    return {
      id: n.id,
      titulo: n.titulo,
      camposDisponibles: Object.keys(n).filter(k => typeof n[k] === 'string' && n[k].length > 10),
      palabrasPorCampo: campos,
      campoUsadoPorScript: n.contenido || n.cuerpo || n.texto || n.body || 'NINGUNO',
      palabrasCampoUsado: contarPalabras(n.contenido || n.cuerpo || n.texto || n.body || '')
    };
  });

  writeFileSync('g:/RESPALDO/informate-nicaragua-final/diagnostico-campos.json', JSON.stringify(reporte, null, 2));
  console.log('\n📄 Reporte completo guardado: diagnostico-campos.json');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
