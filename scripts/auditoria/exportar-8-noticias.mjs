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

  let reporte = '';

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) continue;
    
    const d = doc.data();
    const palabras = contarPalabras(stripHtml(d.contenido || ''));
    
    reporte += `=== NOTICIA ${i + 1} ===\n`;
    reporte += `ID: ${id}\n`;
    reporte += `TITULO: ${d.titulo}\n`;
    reporte += `RESUMEN: ${d.resumen}\n`;
    reporte += `CATEGORIA: ${d.categoria}\n`;
    reporte += `PALABRAS: ${palabras}\n`;
    reporte += `CONTENIDO ACTUAL:\n${stripHtml(d.contenido || '').substring(0, 2000)}\n`;
    reporte += `\n---\n\n`;
  }

  writeFileSync('./ocho-noticias.md', reporte, 'utf8');
  console.log('✅ Exportadas 8 noticias a 8-noticias-completas.txt');
}

main().catch(err => { console.error(err); process.exit(1); });
