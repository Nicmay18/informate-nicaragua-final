import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inicializar Firebase
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Truncar inteligentemente a max 160 caracteres, terminando en palabra completa
function smartTruncate(text, max = 160) {
  if (!text || text.length <= max) return text;
  // Buscar último espacio antes del límite
  let cut = text.lastIndexOf(' ', max);
  if (cut <= 100) cut = max; // si no hay espacio cercano, cortar duro
  return text.slice(0, cut).trim();
}

// Verificar que termine en palabra completa con sentido
function finalizeDescription(text) {
  let desc = text.trim();
  // Eliminar puntos suspensivos y signos de exclamación
  desc = desc.replace(/\.{2,}$/g, '').replace(/!$/g, '').replace(/¡/g, '').trim();
  // Asegurar que termine con punto si tiene sentido
  if (!/[.!?]$/.test(desc) && desc.length < 160) {
    desc = desc + '.';
  }
  // Si al agregar punto se pasa, quitar
  if (desc.length > 160) {
    desc = desc.slice(0, -1).trim();
    // Asegurar que no termine a mitad de palabra
    const lastSpace = desc.lastIndexOf(' ');
    if (lastSpace > desc.length - 20) {
      desc = desc.slice(0, lastSpace);
    }
  }
  return desc;
}

function generateMetaDescription(noticia) {
  const { titulo, resumen, contenido, categoria, fecha } = noticia;
  const tituloStr = (titulo || '').trim();
  const resumenStr = (resumen || '').trim();
  const catStr = (categoria || 'General').toLowerCase();
  
  // Extraer primer párrafo limpio del contenido si no hay resumen
  let baseText = resumenStr;
  if (!baseText || baseText.length < 30) {
    const cleanContent = (contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 40);
    baseText = sentences[0] || cleanContent.slice(0, 300);
  }
  
  // Limpiar texto base
  baseText = baseText
    .replace(/\.{3,}/g, '')
    .replace(/!+/g, '')
    .replace(/¡/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Para sucesos: incluir nombre + qué ocurrió + dónde
  if (catStr === 'sucesos') {
    // Tratar de extraer nombre de víctima del título si existe
    const cleanTitulo = tituloStr.replace(/^(nicaragua|managua):?\s*/i, '').trim();
    // Si el resumen menciona nombre, usarlo
    baseText = baseText || cleanTitulo;
  }
  
  // Asegurar longitud mínima
  if (baseText.length < 80) {
    baseText = tituloStr + '. ' + baseText;
  }
  
  // Truncar a ~155-160
  let desc = smartTruncate(baseText, 155);
  desc = finalizeDescription(desc);
  
  return desc;
}

async function main() {
  console.log('Conectando a Firestore...\n');
  
  const snapshot = await db.collection('noticias').get();
  console.log(`Total noticias: ${snapshot.size}\n`);
  
  const noticiasConMetaMala = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const metaDesc = (data.metaDescription || '').trim();
    
    // Solo noticias REALMENTE malas: vacías, muy cortas (< 120), o con puntos suspensivos
    const esMala = !metaDesc || metaDesc.length === 0 || metaDesc.length < 120 || metaDesc.endsWith('...') || metaDesc.endsWith('…');
    
    if (esMala) {
      noticiasConMetaMala.push({
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: (data.titulo || '').trim(),
        metaActual: metaDesc || '(vacía)',
        charsActual: metaDesc.length,
        categoria: data.categoria || 'General',
        resumen: (data.resumen || '').trim(),
        contenido: (data.contenido || '').trim(),
        fecha: data.fecha || '',
      });
    }
  }
  
  // Ordenar por slug
  noticiasConMetaMala.sort((a, b) => a.slug.localeCompare(b.slug));
  
  console.log(`Noticias con meta descriptions malas: ${noticiasConMetaMala.length}\n`);
  console.log('='.repeat(120));
  
  const resultados = [];
  
  for (const noticia of noticiasConMetaMala) {
    const nuevaMeta = generateMetaDescription(noticia);
    
    const linea = `${noticia.slug} | ${noticia.metaActual.replace(/\|/g, '/')} | ${nuevaMeta} | ${nuevaMeta.length}`;
    resultados.push(linea);
    
    console.log(`\nSLUG: ${noticia.slug}`);
    console.log(`ACTUAL (${noticia.charsActual} chars): ${noticia.metaActual}`);
    console.log(`NUEVA (${nuevaMeta.length} chars): ${nuevaMeta}`);
  }
  
  console.log('\n' + '='.repeat(120));
  
  // Guardar a archivo para revisión
  const outputPath = join(__dirname, 'meta-descriptions-propuestas.txt');
  writeFileSync(outputPath, resultados.join('\n'), 'utf8');
  console.log(`\nPropuestas guardadas en: ${outputPath}`);
  console.log(`Total: ${resultados.length} noticias`);
  
  // Preguntar antes de aplicar
  console.log('\n--- PARA APLICAR CAMBIOS ---');
  console.log('Descomenta la sección de actualización en el script y vuelve a ejecutar.');
  
  /*
  // SECCIÓN DE ACTUALIZACIÓN - Descomentar para aplicar
  console.log('\nAplicando cambios a Firestore...');
  let actualizadas = 0;
  
  for (const noticia of noticiasConMetaMala) {
    const nuevaMeta = generateMetaDescription(noticia);
    try {
      await db.collection('noticias').doc(noticia.id).update({
        metaDescription: nuevaMeta,
        fechaActualizacion: new Date().toISOString()
      });
      actualizadas++;
      console.log(`✓ ${noticia.slug} (${nuevaMeta.length} chars)`);
    } catch (err) {
      console.error(`✗ ${noticia.slug}:`, err.message);
    }
  }
  console.log(`\nActualizadas: ${actualizadas}/${noticiasConMetaMala.length}`);
  */
}

main().catch(console.error);
