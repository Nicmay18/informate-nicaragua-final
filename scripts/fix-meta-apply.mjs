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

function smartTruncate(text, max = 158) {
  if (!text || text.length <= max) return text;
  let cut = text.lastIndexOf(' ', max);
  if (cut < max - 20) cut = max;
  return text.slice(0, cut).trim();
}

function generateMeta(noticia) {
  const { titulo, resumen, contenido, categoria } = noticia;
  const tituloStr = (titulo || '').trim();
  const resumenStr = (resumen || '').trim();
  const catStr = (categoria || 'General').toLowerCase();
  
  let base = resumenStr;
  if (!base || base.length < 30) {
    const clean = (contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 40);
    base = sentences[0] || clean.slice(0, 300);
  }
  
  base = base.replace(/\.{3,}/g, '').replace(/!+/g, '').replace(/¡/g, '').replace(/\s+/g, ' ').trim();
  
  if (base.length < 80) base = tituloStr + '. ' + base;
  
  let desc = smartTruncate(base, 155);
  
  // Asegurar punto final si cabe
  if (!/[.!?]$/.test(desc) && desc.length < 160) {
    desc = desc + '.';
  }
  if (desc.length > 160) {
    desc = desc.slice(0, -1).trim();
    const lastSpace = desc.lastIndexOf(' ');
    if (lastSpace > desc.length - 15) desc = desc.slice(0, lastSpace);
  }
  
  return desc;
}

async function main() {
  console.log('Conectando a Firestore...');
  const snapshot = await db.collection('noticias').get();
  console.log(`Total noticias: ${snapshot.size}\n`);
  
  const malas = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const meta = (data.metaDescription || '').trim();
    if (!meta || meta.length === 0 || meta.length < 120 || meta.endsWith('...') || meta.endsWith('…')) {
      malas.push({ id: doc.id, slug: data.slug || doc.id, titulo: data.titulo || '', meta, resumen: data.resumen || '', contenido: data.contenido || '', categoria: data.categoria || 'General' });
    }
  }
  
  console.log(`Noticias con meta descriptions malas: ${malas.length}\n`);
  console.log('Aplicando correcciones...\n');
  
  let ok = 0, fail = 0;
  for (const n of malas) {
    const nueva = generateMeta(n);
    try {
      await db.collection('noticias').doc(n.id).update({
        metaDescription: nueva,
        fechaActualizacion: new Date().toISOString()
      });
      ok++;
      console.log(`OK ${nueva.length.toString().padStart(3)} chars | ${n.slug}`);
    } catch (e) {
      fail++;
      console.log(`FAIL | ${n.slug} | ${e.message}`);
    }
  }
  
  console.log(`\n=================================`);
  console.log(`Actualizadas: ${ok}/${malas.length}`);
  console.log(`Fallidas: ${fail}`);
  console.log(`=================================`);
}

main().catch(console.error);
