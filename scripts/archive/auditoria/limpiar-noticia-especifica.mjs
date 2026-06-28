import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('E:/PROYECTO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-29c2cef443.json', 'utf8')
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const CITAS_GENERICAS = [
  /De acuerdo con reportes locales verificados por este medio[\s\S]*?coinciden con la cronología de los hechos\.?/gi,
  /En relación a lo ocurrido, especialistas señalaron[\s\S]*?comprender su impacto\.?/gi,
  /Fuentes cercanas al lugar de los hechos confirmaron[\s\S]*?nota periodística\.?/gi,
  /Un vocero local manifestó respecto a la situación[\s\S]*?manera oportuna a la ciudadanía\.?/gi,
];

function limpiarContenido(contenido) {
  let limpio = contenido;

  // 1. Eliminar citas genéricas repetidas
  for (const regex of CITAS_GENERICAS) {
    limpio = limpio.replace(regex, '');
  }

  // 2. Deduplicar párrafos idénticos sueltos (sin sección)
  let parrafos = limpio.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  const parrafoVisto = new Set();
  const parrafosUnicos = [];
  for (const p of parrafos) {
    const key = p.toLowerCase().replace(/\s+/g, ' ').substring(0, 250);
    if (!parrafoVisto.has(key)) {
      parrafoVisto.add(key);
      parrafosUnicos.push(p);
    }
  }
  limpio = parrafosUnicos.join('\n\n');

  // 3. Deduplicar líneas repetidas 3+ veces dispersas
  const lineas = limpio.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lineaCounts = new Map();
  for (const l of lineas) {
    const key = l.toLowerCase().replace(/\s+/g, ' ').substring(0, 200);
    lineaCounts.set(key, (lineaCounts.get(key) || 0) + 1);
  }
  const lineasUnicas = [];
  const lineaYaUsada = new Set();
  for (const l of lineas) {
    const key = l.toLowerCase().replace(/\s+/g, ' ').substring(0, 200);
    // Si la línea se repite más de 2 veces en todo el texto, solo la dejamos una vez
    if ((lineaCounts.get(key) || 0) > 2) {
      if (lineaYaUsada.has(key)) continue;
      lineaYaUsada.add(key);
    }
    lineasUnicas.push(l);
  }

  return lineasUnicas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function main() {
  const docRef = db.collection('noticias').doc('8NaG866DTKEaUCHkivrd');
  const doc = await docRef.get();
  if (!doc.exists) { console.log('No existe'); return; }
  
  const data = doc.data();
  const original = data.contenido || '';
  const limpio = limpiarContenido(original);
  
  const palabrasAntes = original.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
  const palabrasDespues = limpio.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
  
  await docRef.update({
    contenido: limpio,
    actualizadoEn: new Date(),
    notaLimpieza: 'Eliminados bloques duplicados de IA y citas genéricas repetidas',
  });
  
  console.log('✅ Noticia limpiada:', data.titulo);
  console.log('Palabras:', palabrasAntes, '→', palabrasDespues, '(eliminadas:', palabrasAntes - palabrasDespues, ')');
  
  // Verificar H2s
  const h2s = (limpio.match(/<h2[^>]*>(.*?)<\/h2>/gi) || []);
  const h2Texts = h2s.map(h => {
    const m = h.match(/<h2[^>]*>(.*?)\u003c\/h2>/i);
    return m ? m[1].trim().toLowerCase().replace(/\s+/g, ' ') : '';
  }).filter(t => t.length > 0);
  const h2Counts = new Map();
  for (const t of h2Texts) h2Counts.set(t, (h2Counts.get(t) || 0) + 1);
  const dup = Array.from(h2Counts.entries()).filter(([,c]) => c > 1);
  console.log('H2s totales:', h2s.length, '| Duplicados:', dup.length);
  for (const [t,c] of dup) console.log('  -', t, '('+c+'x)');
}

main().catch(console.error);
