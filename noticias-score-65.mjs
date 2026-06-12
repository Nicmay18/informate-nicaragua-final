import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
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

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function contarPalabras(texto) {
  return texto.split(/\s+/).filter(Boolean).length;
}

async function main() {
  const db = initFirebase();
  
  // IDs de las 8 noticias que se quedaron en 65
  const ids = [
    '0gGqzH1RBUeVTGHWkuvl',
    '0tmiH8fXJTVXNmiM0W5U', 
    '1HmobwfngxeXoUofqosD',
    '1PRR0VQRF8oXLfzFDhm5',
    '3Dlu4tCQZedztrompEgV',
    'CaxNVIKzrIl5rBpKs0vy',
    'OWppqYU03AfZQHIoqEL7',
    'XHsdnSKHniKyMI1AWBXL'
  ];

  let reporte = `# LAS 8 NOTICIAS QUE NECESITAN 500+ PALABRAS\n`;
  reporte += `# Para subir de score 65 a 95\n\n`;

  for (const id of ids) {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) {
      reporte += `## ⚠️ ${id}: NO ENCONTRADA\n\n`;
      continue;
    }
    
    const d = doc.data();
    const palabras = contarPalabras(stripHtml(d.contenido || ''));
    const faltan = Math.max(0, 500 - palabras);
    
    reporte += `## ${d.titulo}\n`;
    reporte += `**ID:** ${id}\n`;
    reporte += `**Categoría:** ${d.categoria}\n`;
    reporte += `**Score:** 65/100\n`;
    reporte += `**Palabras actuales:** ${palabras}\n`;
    reporte += `**Faltan para 500:** ${faltan} palabras\n\n`;
    reporte += `### ¿Qué agregar para llegar a 95?\n\n`;
    reporte += `- 2 párrafos más de contexto analítico (200+ palabras)\n`;
    reporte += `- 1 subtítulo <h2> adicional con información de fondo\n`;
    reporte += `- Datos históricos o estadísticos del tema\n`;
    reporte += `- Implicaciones a largo plazo o recomendaciones\n\n`;
    reporte += `---\n\n`;
  }

  writeFileSync('./noticias-score-65.md', reporte, 'utf8');
  console.log('✅ Reporte generado: noticias-score-65.md');
}

main().catch(err => { console.error(err); process.exit(1); });
