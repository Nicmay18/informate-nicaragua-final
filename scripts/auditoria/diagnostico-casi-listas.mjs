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

function diagnosticar(n) {
  const textoPlano = (n.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoPlano.split(/\s+/).filter(Boolean).length;
  const tLen = (n.titulo || '').length;
  const rLen = (n.resumen || '').length;
  const tieneImg = n.imagen && n.imagen.trim() !== '' && n.imagen.trim() !== '/logo.webp';
  const tieneH2 = /<h[23][^>]*>/i.test(n.contenido || '');
  const tieneStrong = /<strong[^>]*>|<b>/i.test(n.contenido || '');

  const pts = {
    palabras: palabras >= 500 ? 30 : (palabras >= 250 ? 15 : 0),
    titulo: (tLen >= 30 && tLen <= 70) ? 20 : (tLen > 0 ? 5 : 0),
    resumen: (rLen >= 120 && rLen <= 160) ? 20 : (rLen > 0 ? 5 : 0),
    imagen: tieneImg ? 15 : 0,
    h2: tieneH2 ? 10 : 0,
    strong: tieneStrong ? 5 : 0
  };

  let falta = [];
  if (pts.palabras === 0) falta.push(`+${250 - palabras} palabras (250 min)`);
  else if (pts.palabras === 15) falta.push(`+${500 - palabras} palabras para 30pts`);
  if (pts.titulo !== 20) falta.push(`Titulo ${tLen}chars (meta: 30-70)`);
  if (pts.resumen !== 20) falta.push(`Resumen ${rLen}chars (meta: 120-160)`);
  if (!tieneImg) falta.push('Sin imagen');
  if (!tieneH2) falta.push('Sin subtitulos H2/H3');
  if (!tieneStrong) falta.push('Sin negritas');

  return { pts, falta, palabras, tLen, rLen };
}

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias')
    .where('scoreCalidad', '>=', 70)
    .where('scoreCalidad', '<', 85)
    .limit(15)
    .get();

  if (snap.empty) {
    console.log('No hay noticias en rango 70-84');
    return;
  }

  console.log(`=== NOTICIAS CASI LISTAS (${snap.size}) ===\n`);

  snap.docs.forEach((doc, i) => {
    const d = doc.data();
    const diag = diagnosticar(d);
    console.log(`${i + 1}. [${d.categoria}] Score: ${d.scoreCalidad}/100`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   "${d.titulo?.substring(0, 70)}"`);
    console.log(`   Palabras: ${diag.palabras} | Titulo: ${diag.tLen} | Resumen: ${diag.rLen}`);
    console.log(`   Puntos: palabras=${diag.pts.palabras} titulo=${diag.pts.titulo} resumen=${diag.pts.resumen} img=${diag.pts.imagen} h2=${diag.pts.h2} strong=${diag.pts.strong}`);
    console.log(`   🔧 Para subir a 85+: ${diag.falta.join(', ') || 'YA ESTÁ BIEN'}`);
    console.log();
  });
}

main().catch(err => { console.error(err); process.exit(1); });
