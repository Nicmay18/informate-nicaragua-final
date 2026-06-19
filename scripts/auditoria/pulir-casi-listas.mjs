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

function calcularScoreEditorial(noticia) {
  let score = 0;
  if (!noticia) return 0;
  const textoPlano = (noticia.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;

  if (palabras >= 500) score += 30;
  else if (palabras >= 250) score += 15;

  const largoTitulo = noticia.titulo ? noticia.titulo.length : 0;
  if (largoTitulo >= 30 && largoTitulo <= 70) score += 20;
  else if (largoTitulo > 0) score += 5;

  const largoResumen = noticia.resumen ? noticia.resumen.length : 0;
  if (largoResumen >= 120 && largoResumen <= 160) score += 20;
  else if (largoResumen > 0) score += 5;

  if (noticia.imagen && noticia.imagen.trim() !== '' && noticia.imagen.trim() !== '/logo.webp') score += 15;

  const tieneSubtitulos = /<h[23][^>]*>/i.test(noticia.contenido || '');
  const tieneNegritas = /<strong[^>]*>|<b>/i.test(noticia.contenido || '');
  if (tieneSubtitulos) score += 10;
  if (tieneNegritas) score += 5;

  return Math.max(0, Math.min(100, score));
}

function truncarTexto(texto, maximo) {
  if (!texto || texto.length <= maximo) return texto;
  const corte = texto.lastIndexOf(' ', maximo - 3);
  if (corte === -1) return texto.substring(0, maximo - 3) + '...';
  return texto.substring(0, corte) + '...';
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias')
    .where('scoreCalidad', '>=', 70)
    .where('scoreCalidad', '<', 85)
    .limit(30)
    .get();

  let arregladas = 0;
  let necesitanMasPalabras = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    let titulo = data.titulo || '';
    let resumen = data.resumen || '';
    let contenido = data.contenido || '';
    let cambios = [];

    // 1. Arreglar título si > 70
    if (titulo.length > 70) {
      const nuevo = truncarTexto(titulo, 70);
      if (nuevo !== titulo) {
        cambios.push(`titulo ${titulo.length}→${nuevo.length}`);
        titulo = nuevo;
      }
    }

    // 2. Arreglar resumen si > 160
    if (resumen.length > 160) {
      const nuevo = truncarTexto(resumen, 160);
      if (nuevo !== resumen) {
        cambios.push(`resumen ${resumen.length}→${nuevo.length}`);
        resumen = nuevo;
      }
    }

    // 3. Si hay cambios, recalcular score
    if (cambios.length > 0) {
      const scoreNuevo = calcularScoreEditorial({ titulo, resumen, contenido, imagen: data.imagen });
      
      await db.collection('noticias').doc(doc.id).update({
        titulo,
        resumen,
        scoreCalidad: scoreNuevo,
        ultimaActualizacionAutomatica: new Date()
      });

      arregladas++;
      console.log(`✅ ${doc.id}: ${data.scoreCalidad}→${scoreNuevo} | ${cambios.join(', ')}`);
    }

    // 4. Verificar palabras para reportar las que aún faltan
    const textoPlano = (contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
    const scoreActual = calcularScoreEditorial({ titulo, resumen, contenido, imagen: data.imagen });
    
    if (scoreActual < 85) {
      const falta = palabras < 250 ? (250 - palabras) : (palabras < 500 ? (500 - palabras) : 0);
      const razon = [];
      if (palabras < 250) razon.push(`+${250 - palabras} palabras (meta 250)`);
      else if (palabras < 500) razon.push(`+${500 - palabras} palabras para 30pts (meta 500)`);
      if (titulo.length < 30 || titulo.length > 70) razon.push(`Título ${titulo.length}chars`);
      if (resumen.length < 120 || resumen.length > 160) razon.push(`Resumen ${resumen.length}chars`);
      
      necesitanMasPalabras.push({
        id: doc.id,
        titulo: titulo.substring(0, 55),
        score: scoreActual,
        palabras,
        falta: razon.join(', ')
      });
    }
  }

  console.log(`\n📊 Arregladas automáticamente: ${arregladas}`);
  
  console.log(`\n=== QUE AÚN NECESITAN MÁS PALABRAS (${necesitanMasPalabras.length}) ===`);
  necesitanMasPalabras.forEach((n, i) => {
    console.log(`${i+1}. Score ${n.score} | ${n.palabras} palabras | ${n.titulo}`);
    console.log(`   🔧 ${n.falta}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
