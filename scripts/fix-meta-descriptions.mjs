import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getCachedNoticias } from '../lib/db/cached-firestore.mjs';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inicializar Firebase
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'informate-instant-nicaragua-c7bc9eb4f553.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Función para contar caracteres (incluye espacios)
function countChars(str) {
  return str ? str.length : 0;
}

// Función para truncar a 160 caracteres sin cortar palabras ni usar puntos suspensivos
function truncateTo160(text) {
  if (text.length <= 160) return text;
  const cutAt = text.lastIndexOf(' ', 159);
  return cutAt > 0 ? text.slice(0, cutAt) : text.slice(0, 159);
}

// Función para generar meta description basada en contenido de la noticia
function generateMetaDescription(noticia) {
  const { titulo, resumen, contenido, categoria, fecha, autor, lugar } = noticia;
  const tituloStr = (titulo || '').trim();
  const resumenStr = (resumen || '').trim();
  const contenidoStr = (contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const categoriaStr = (categoria || 'General').toLowerCase();
  
  // Extraer keyword principal (primeras 3-4 palabras significativas del título)
  const keyword = tituloStr.split(' ').slice(0, 4).join(' ');
  
  let desc = '';
  
  // Si hay resumen usable, usarlo como base
  if (resumenStr && resumenStr.length >= 50) {
    desc = resumenStr;
  } else if (contenidoStr && contenidoStr.length >= 50) {
    // Usar primer párrafo del contenido
    const firstSentence = contenidoStr.split(/[.!?]/)[0];
    desc = firstSentence || contenidoStr.slice(0, 200);
  } else {
    desc = tituloStr;
  }
  
  // Limpiar desc
  desc = desc
    .replace(/\.{3,}/g, '') // Eliminar puntos suspensivos
    .replace(/[!¡]/g, '') // Eliminar signos de exclamación
    .replace(/clickbait|no vas a creer|impactante|indignante|sorprendente|escándalo|revelan/i, '')
    .trim();
  
  // Asegurar keyword en primeros 100 caracteres
  if (!desc.toLowerCase().includes(keyword.toLowerCase().split(' ')[0])) {
    desc = keyword + ': ' + desc;
  }
  
  // Truncar a 150-160 caracteres
  desc = truncateTo160(desc);
  
  // Asegurar que termine con punto si hay espacio
  if (desc.length < 160 && !desc.endsWith('.')) {
    desc = desc + '.';
  }
  
  // Si se pasó de 160 al agregar punto, recortar
  if (desc.length > 160) {
    desc = truncateTo160(desc.slice(0, -1));
    if (!desc.endsWith('.')) desc = desc + '.';
  }
  
  return desc;
}

async function main() {
  console.log('Conectando a Firestore...');
  
  const snapshot = await getCachedNoticias(db);
  console.log(`Total noticias encontradas: ${snapshot.size}`);
  
  const noticiasConMetaMala = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const metaDesc = (data.metaDescription || '').trim();
    const titulo = (data.titulo || '').trim();
    
    const charCount = countChars(metaDesc);
    
    // Criterios para meta description "mala":
    // - Vacía o muy corta (< 120 chars)
    // - Termina con puntos suspensivos
    // - Contiene clickbait
    // - Muy larga (> 165 chars)
    const esMala = 
      !metaDesc || 
      metaDesc.length === 0 ||
      charCount < 120 ||
      metaDesc.endsWith('...') ||
      metaDesc.endsWith('…') ||
      /no vas a creer|impactante|indignante|sorprendente|escándalo/i.test(metaDesc) ||
      charCount > 165;
    
    if (esMala) {
      noticiasConMetaMala.push({
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: titulo,
        metaActual: metaDesc || '(vacía)',
        charsActual: charCount,
        categoria: data.categoria || 'General',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        fecha: data.fecha || '',
        lugar: data.lugar || '',
        autor: data.autor || '',
      });
    }
  }
  
  console.log(`\nNoticias con meta descriptions malas: ${noticiasConMetaMala.length}`);
  console.log('='.repeat(100));
  
  // Ordenar por slug para consistencia
  noticiasConMetaMala.sort((a, b) => a.slug.localeCompare(b.slug));
  
  // Generar y mostrar propuestas (sin aplicar todavía)
  const propuestas = [];
  
  for (const noticia of noticiasConMetaMala) {
    const nuevaMeta = generateMetaDescription(noticia);
    
    console.log(`\nSLUG: ${noticia.slug}`);
    console.log(`TÍTULO: ${noticia.titulo}`);
    console.log(`ACTUAL (${noticia.charsActual} chars): ${noticia.metaActual}`);
    console.log(`NUEVA (${nuevaMeta.length} chars): ${nuevaMeta}`);
    
    propuestas.push({
      id: noticia.id,
      slug: noticia.slug,
      titulo: noticia.titulo,
      actual: noticia.metaActual,
      nueva: nuevaMeta,
      charsNueva: nuevaMeta.length
    });
  }
  
  console.log('\n' + '='.repeat(100));
  console.log(`Total propuestas generadas: ${propuestas.length}`);
  console.log('\nPara aplicar los cambios, descomentar la sección de actualización en el script.');
  
  // SECCIÓN DE ACTUALIZACIÓN - Descomentar para aplicar
  /*
  console.log('\nAplicando cambios a Firestore...');
  let actualizadas = 0;
  
  for (const prop of propuestas) {
    try {
      await db.collection('noticias').doc(prop.id).update({
        metaDescription: prop.nueva,
        fechaActualizacion: new Date().toISOString()
      });
      actualizadas++;
      console.log(`✓ Actualizado: ${prop.slug}`);
    } catch (err) {
      console.error(`✗ Error en ${prop.slug}:`, err.message);
    }
  }
  
  console.log(`\nActualizadas: ${actualizadas}/${propuestas.length}`);
  */
}

main().catch(console.error);
