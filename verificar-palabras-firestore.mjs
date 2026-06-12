import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  return getFirestore(app);
}

const DICCIONARIO_SEGURO = {
  'trágico accidente': 'incidente vial fatal',
  'tragico accidente': 'incidente vial fatal',
  'trágica muerte': 'pérdida fatal',
  'tragica muerte': 'pérdida fatal',
  'murió de forma': 'perdió la vida de forma',
  'murio de forma': 'perdió la vida de forma',
  ' sangrienta': ' de alto impacto',
  'horrendo homicidio': 'hecho delictivo bajo investigación',
  'muere': 'fallece',
  'muerto': 'persona fallecida',
  'muerta': 'persona fallecida',
  'muertos': 'personas fallecidas',
  'muertas': 'personas fallecidas',
  'muerte': 'fallecimiento',
  'murió': 'falleció',
  'murieron': 'fallecieron',
  'víctima mortal': 'deceso confirmado',
  'victima mortal': 'deceso confirmado',
  'asesinado': 'víctima de homicidio',
  'asesinada': 'víctima de homicidio',
  'crimen': 'delito',
  'criminal': 'delincuente',
  'homicidio': 'muerte violenta',
  'suicidio': 'muerte autoinfligida',
  'masacre': 'ataque múltiple',
  'tragedia': 'incidente grave',
  'trágico': 'grave',
  'tragicos': 'graves',
  'trágicos': 'graves',
  'sepelio': 'ceremonia fúnebre',
  'funeral': 'ceremonia fúnebre',
  'luto': 'duelo',
};

function sanitizarTexto(texto) {
  if (!texto) return '';
  let limpio = texto;
  Object.keys(DICCIONARIO_SEGURO).forEach((clave) => {
    const regex = new RegExp(clave, 'gi');
    limpio = limpio.replace(regex, DICCIONARIO_SEGURO[clave]);
  });
  return limpio;
}

async function main() {
  const db = initFirebase();
  const doc = await db.collection('noticias').doc('zwqEVVwFeeMooUBQpBR7').get();
  const data = doc.data();
  
  console.log('=== PRUEBA DE SANITIZACION ===\n');
  console.log('TITULO (actual en Firestore):');
  console.log(data.titulo);
  console.log('\nTITULO (sanitizado):');
  console.log(sanitizarTexto(data.titulo));
  
  console.log('\n--- PARRAFO DEL CONTENIDO ---');
  const parrafo = data.contenido?.substring(200, 400) || '';
  console.log('ORIGINAL:', parrafo.substring(0, 150));
  console.log('SANITIZADO:', sanitizarTexto(parrafo).substring(0, 150));
  
  console.log('\n--- BUSQUEDA MANUAL ---');
  const texto = `${data.titulo} ${data.resumen} ${data.contenido}`.toLowerCase();
  const claves = Object.keys(DICCIONARIO_SEGURO);
  let hallazgos = [];
  claves.forEach(k => {
    if (texto.includes(k.toLowerCase())) hallazgos.push(k);
  });
  console.log('Palabras del diccionario encontradas:', hallazgos.length);
  hallazgos.slice(0, 10).forEach(h => console.log(' -', h));

  console.log('\n--- COMPARACION DIRECTA ---');
  const tituloSan = sanitizarTexto(data.titulo || '');
  const contSan = sanitizarTexto(data.contenido || '');
  console.log('Titulo cambia:', tituloSan !== data.titulo);
  console.log('Contenido cambia:', contSan !== data.contenido);
  if (contSan !== data.contenido) {
    console.log('\nPrimer cambio en contenido:');
    // Encontrar primera diferencia
    for (let i = 0; i < Math.min(data.contenido.length, contSan.length); i++) {
      if (data.contenido[i] !== contSan[i]) {
        console.log('  Original:', data.contenido.substring(Math.max(0, i-30), i+30));
        console.log('  Sanitiz:', contSan.substring(Math.max(0, i-30), i+30));
        break;
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
