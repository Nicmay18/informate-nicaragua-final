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

  for (const id of ids) {
    const doc = await db.collection('noticias').doc(id).get();
    const d = doc.data();
    const score = d.scoreCalidad || 0;
    
    const tLen = (d.titulo || '').length;
    const rLen = (d.resumen || '').length;
    const textoPlano = (d.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
    const tieneImg = d.imagen && d.imagen.trim() !== '' && d.imagen.trim() !== '/logo.webp';
    const tieneH2 = /<h[23][^>]*>/i.test(d.contenido || '');
    const tieneStrong = /<strong[^>]*>|<b>/i.test(d.contenido || '');

    // Calcular puntos individuales
    const ptsPalabras = palabras >= 500 ? 30 : (palabras >= 250 ? 15 : 0);
    const ptsTitulo = (tLen >= 30 && tLen <= 70) ? 20 : (tLen > 0 ? 5 : 0);
    const ptsResumen = (rLen >= 120 && rLen <= 160) ? 20 : (rLen > 0 ? 5 : 0);
    const ptsImg = tieneImg ? 15 : 0;
    const ptsH2 = tieneH2 ? 10 : 0;
    const ptsStrong = tieneStrong ? 5 : 0;
    const total = ptsPalabras + ptsTitulo + ptsResumen + ptsImg + ptsH2 + ptsStrong;

    console.log(`\n=== ${d.titulo?.substring(0,55)} ===`);
    console.log(`ID: ${id}`);
    console.log(`Score: ${score} (recalculado: ${total})`);
    console.log(`Palabras: ${palabras} → ${ptsPalabras}pts`);
    console.log(`Título: ${tLen}chars → ${ptsTitulo}pts (meta: 30-70)`);
    console.log(`Resumen: ${rLen}chars → ${ptsResumen}pts (meta: 120-160)`);
    console.log(`Imagen: ${tieneImg ? 'Sí' : 'No'} → ${ptsImg}pts`);
    console.log(`H2: ${tieneH2 ? 'Sí' : 'No'} → ${ptsH2}pts`);
    console.log(`Strong: ${tieneStrong ? 'Sí' : 'No'} → ${ptsStrong}pts`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
