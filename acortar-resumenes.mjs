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

  // Noticias con resúmenes largos que necesitan acortarse
  const noticias = [
    { id: '0gGqzH1RBUeVTGHWkuvl', tituloNuevo: 'Cinco fallecimientos en 24 horas por accidentes de tránsito' },
    { id: '1HmobwfngxeXoUofqosD', tituloNuevo: null }, // ya tiene buen título
    { id: '0tmiH8fXJTVXNmiM0W5U', tituloNuevo: null },
    { id: '1PRR0VQRF8oXLfzFDhm5', tituloNuevo: null },
    { id: 'XHsdnSKHniKyMI1AWBXL', tituloNuevo: null },
  ];

  for (const { id, tituloNuevo } of noticias) {
    const doc = await db.collection('noticias').doc(id).get();
    if (!doc.exists) continue;

    const d = doc.data();
    let resumen = d.resumen || '';
    let titulo = tituloNuevo || d.titulo || '';

    if (resumen.length > 160) {
      resumen = truncarTexto(resumen, 160);
    }

    // Verificar título también
    if (titulo.length > 70) {
      titulo = truncarTexto(titulo, 70);
    }

    const scoreNuevo = calcularScoreEditorial({
      titulo: titulo,
      resumen: resumen,
      contenido: d.contenido,
      imagen: d.imagen,
    });

    await db.collection('noticias').doc(id).update({
      titulo: titulo,
      resumen: resumen,
      scoreCalidad: scoreNuevo,
      resumenAcortado: true,
      fechaArreglo: new Date(),
    });

    console.log(`✅ ${id}: score ${d.scoreCalidad}→${scoreNuevo} | resumen ${d.resumen?.length}→${resumen.length} | titulo ${titulo.length}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
