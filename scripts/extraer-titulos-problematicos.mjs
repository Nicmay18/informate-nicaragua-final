import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const serviceAccountPath = path.join(projectRoot, 'informate-instant-nicaragua-firebase-adminsdk-fbsvc-44df69aec9.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount), projectId: 'informate-instant-nicaragua' });
const db = getFirestore();

const PALABRAS_PROHIBIDAS = /tragedia|incre[ií]ble|impactante|desgarrador|triste|fatal|terrible|URGENTE|[uú]LTIMA HORA|apesar(?=\s)/i;

function clasificarProblema(titulo) {
  const problemas = [];
  if (titulo.length > 65) problemas.push('largo');
  if (PALABRAS_PROHIBIDAS.test(titulo)) problemas.push('clickbait/palabra prohibida');
  if (/^[A-ZÁÉÍÓÚÑ]{2,}/.test(titulo)) problemas.push('mayúsculas excesivas');
  if (/(lo que (nadie|no)|no vas a creer|esto es lo que)/i.test(titulo)) problemas.push('estructura clickbait');
  return problemas.join(', ') || 'ninguno';
}

async function main() {
  console.log('🔍 Extrayendo títulos problemáticos de Firestore...\n');
  const snapshot = await db.collection('noticias').orderBy('fecha', 'desc').get();
  const problematicos = [];
  const total = snapshot.size;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const titulo = data.titulo || '';
    const slug = data.slug || '';
    const len = titulo.length;
    const tieneProblema = len > 65 || PALABRAS_PROHIBIDAS.test(titulo) || /^[A-ZÁÉÍÓÚÑ]{2,}/.test(titulo);

    if (tieneProblema) {
      problematicos.push({
        id: doc.id,
        slug,
        titulo,
        caracteres: len,
        razon: clasificarProblema(titulo),
      });
    }
  }

  const outputPath = path.join(projectRoot, 'titulos-problematicos.json');
  fs.writeFileSync(outputPath, JSON.stringify(problematicos, null, 2));

  console.log(`📊 Total noticias analizadas: ${total}`);
  console.log(`🔴 Títulos problemáticos: ${problematicos.length} (${((problematicos.length / total) * 100).toFixed(1)}%)`);
  console.log(`\n✅ Guardado en: ${outputPath}\n`);

  // Mostrar primeros 10 ejemplos
  console.log('📋 Muestra de los primeros 10 problemáticos:');
  problematicos.slice(0, 10).forEach((n, i) => {
    console.log(`${i + 1}. [${n.caracteres}] ${n.titulo.substring(0, 70)}... (${n.razon})`);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
