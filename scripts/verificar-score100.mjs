import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const snapshot = await db.collection('noticias').get();
  const total = snapshot.size;

  let conLinks = 0;
  let conFuentes = 0;
  let titulosOpt = 0;
  let titulosMalos = [];
  let conRelatedLinks = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const contenido = data.contenido || '';
    const titulo = (data.titulo || '').trim();

    const linksEnContenido = (contenido.match(/href="\/noticias\//gi) || []).length;
    const tieneRelated = data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0;
    if (tieneRelated) conRelatedLinks++;
    if (linksEnContenido >= 1 || tieneRelated) conLinks++;

    const linksExternos = (contenido.match(/href="https?:\/\//gi) || []).length;
    const blockquotes = (contenido.match(/<blockquote>/gi) || []).length;
    if (linksExternos >= 1 || blockquotes >= 1) conFuentes++;

    if (titulo.length >= 30 && titulo.length <= 70) {
      titulosOpt++;
    } else {
      titulosMalos.push({ slug: data.slug || doc.id, length: titulo.length, preview: titulo.slice(0, 50) });
    }
  }

  console.log('=== ANÁLISIS PARA SCORE 100 ===');
  console.log(`Total noticias: ${total}`);
  console.log(`\nLinks internos (contenido + related_links): ${conLinks}/${total} = ${Math.round(conLinks/total*100)}%`);
  console.log(`  - Con related_links: ${conRelatedLinks}`);
  console.log(`  - Con links en contenido: ${conLinks - conRelatedLinks}`);
  console.log(`\nFuentes/citas (links externos o blockquotes): ${conFuentes}/${total} = ${Math.round(conFuentes/total*100)}%`);
  console.log(`\nTítulos optimizados (30-70 chars): ${titulosOpt}/${total} = ${Math.round(titulosOpt/total*100)}%`);
  console.log(`Títulos NO optimizados (${titulosMalos.length}):`);
  titulosMalos.slice(0, 10).forEach(t => console.log(`  - "${t.preview}" (${t.length}c)`));

  const scoreLinks = Math.round((conLinks / total) * 100);
  const scoreFuentes = Math.round((conFuentes / total) * 100);
  const scoreTitulos = Math.round((titulosOpt / total) * 100);

  console.log(`\n=== PROYECCIÓN SCORE MAESTRO ===`);
  // Asumiendo dominio=94, eeat depende de fuentes, frescas=100, meta=100
  const scoreEeat = 30 + (scoreFuentes/100)*40 + 30; // 3+ autores + sinAutor=0
  const scoreDominio = 25 + 15 + 15 + 10 + scoreTitulos*0.10 + 10 + scoreLinks*0.10 + scoreEeat*0.05;
  const scoreMaestro = Math.round(scoreDominio*0.35 + scoreEeat*0.20 + 100*0.15 + scoreTitulos*0.10 + 100*0.10 + scoreLinks*0.10);
  console.log(`Score Links: ${scoreLinks}`);
  console.log(`Score E-E-A-T: ${Math.round(scoreEeat)}`);
  console.log(`Score Dominio: ${Math.round(scoreDominio)}`);
  console.log(`Score Maestro PROYECTADO: ${scoreMaestro}`);
  console.log(`\nPara llegar a 100 necesitás:`);
  if (scoreLinks < 100) console.log(`  - Links internos: ${total - conLinks} noticias más`);
  if (scoreFuentes < 100) console.log(`  - Fuentes/citas: ${total - conFuentes} noticias más`);
  if (scoreTitulos < 100) console.log(`  - Títulos: ${titulosMalos.length} noticias con títulos fuera de rango`);
}

main().catch(console.error);
