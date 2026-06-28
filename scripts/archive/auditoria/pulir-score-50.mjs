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

function agregarNegritas(html) {
  if (!html) return html;
  // Solo números de 2+ dígitos (años, edades, cantidades, kilómetros)
  // Evitar reemplazar dentro de tags HTML existentes
  let resultado = html;
  resultado = resultado.replace(/>([^<]*\b\d{2,}\b[^<]*)</g, (match, contenido) => {
    const resaltado = contenido.replace(/(\b\d{2,}\b)/g, '<strong>$1</strong>');
    return '>' + resaltado + '<';
  });
  return resultado;
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').limit(300).get();

  let modificadas = 0;
  let reporte = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const scoreAntes = data.scoreCalidad || calcularScoreEditorial(data);

    if (scoreAntes > 55) continue; // Solo pulir las de score bajo

    let cambios = [];
    let titulo = data.titulo || '';
    let resumen = data.resumen || '';
    let contenido = data.contenido || '';

    // 1. Truncar título si > 70
    if (titulo.length > 70) {
      const nuevo = truncarTexto(titulo, 70);
      if (nuevo !== titulo) {
        cambios.push(`titulo: ${titulo.length}→${nuevo.length}`);
        titulo = nuevo;
      }
    }

    // 2. Truncar resumen si > 160
    if (resumen.length > 160) {
      const nuevo = truncarTexto(resumen, 160);
      if (nuevo !== resumen) {
        cambios.push(`resumen: ${resumen.length}→${nuevo.length}`);
        resumen = nuevo;
      }
    }

    // 3. Agregar negritas si no tiene
    const tieneNegritas = /<strong[^>]*>|<b>/i.test(contenido);
    if (!tieneNegritas) {
      const nuevoContenido = agregarNegritas(contenido);
      if (nuevoContenido !== contenido) {
        cambios.push('negritas: +strong en cifras');
        contenido = nuevoContenido;
      }
    }

    if (cambios.length === 0) continue;

    const scoreDespues = calcularScoreEditorial({
      titulo, resumen, contenido, imagen: data.imagen
    });

    await db.collection('noticias').doc(doc.id).update({
      titulo, resumen, contenido,
      scoreCalidad: scoreDespues,
      ultimaActualizacionAutomatica: new Date()
    });

    modificadas++;
    reporte.push({
      id: doc.id,
      titulo: titulo.substring(0, 60),
      antes: scoreAntes,
      despues: scoreDespues,
      cambios: cambios.join(', ')
    });

    console.log(`✅ ${doc.id}: score ${scoreAntes}→${scoreDespues} | ${cambios.join(', ')}`);
  }

  console.log(`\n📊 Total modificadas: ${modificadas}`);
  console.log('\n=== RESUMEN ===');
  reporte.forEach(r => {
    console.log(`${r.antes}→${r.despues} | ${r.cambios} | ${r.titulo}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
