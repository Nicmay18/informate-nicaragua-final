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

// Mapeo de categorías a slugs
const CATEGORIA_SLUG = {
  'Sucesos': 'sucesos',
  'Nacionales': 'nacionales',
  'Deportes': 'deportes',
  'Internacionales': 'internacionales',
  'Tecnología': 'tecnologia',
  'Espectáculos': 'espectaculos',
  'Cultura': 'cultura',
  'Economía': 'economia',
  'Salud': 'salud',
  'Judicial': 'judicial',
  'Infraestructura': 'infraestructura',
  'General': 'nacionales',
};

// Entidades conocidas para extraer
const MUNICIPIOS = [
  'managua', 'león', 'granada', 'masaya', 'estelí', 'chinandega', 'matagalpa',
  'jinotega', 'rivas', 'boaco', 'chontales', 'madriz', 'nueva segovia', 'río san juan',
  'carazo', 'rjds', 'north caribbean', 'south caribbean', 'bluefields', 'bilwi',
  'corn island', 'ometepe', 'san juan del sur', 'diriamba', 'jinotepe', 'nagarote',
  'la concepción', 'la paz centro', 'mulukukú', 'siuna', 'rosita', 'waslala',
  'nindirí', 'tipitapa', 'diriomo', 'diría', 'jiquilillo', 'las peñitas',
];

const INSTITUCIONES = [
  'minsa', 'policía nacional', 'enatrel', 'ineter', 'mific', 'migración',
  'cse', 'asamblea nacional', 'ejército', 'hospital bertha calderón',
  'hospital del niño', 'hospital militar', 'universidad nacional',
  'upoli', 'unan', 'ucan', 'migración y extranjería', 'intur',
];

// Verificar si el contenido ya tiene links internos
function hasInternalLinks(contenido) {
  if (!contenido) return false;
  return contenido.includes('href="/categoria/') || contenido.includes('href="/noticias/');
}

// Extraer lugar del título o resumen
function extractLugar(titulo, resumen, contenido) {
  const texto = `${titulo} ${resumen} ${contenido}`.toLowerCase();
  
  for (const mun of MUNICIPIOS) {
    if (texto.includes(mun)) return mun;
  }
  
  for (const inst of INSTITUCIONES) {
    if (texto.includes(inst)) return inst;
  }
  
  return null;
}

// Buscar noticia relacionada reciente
async function findRelatedNoticia(db, categoria, excludeId, fechaLimite) {
  try {
    const snapshot = await db.collection('noticias')
      .where('categoria', '==', categoria)
      .where('fecha', '>=', fechaLimite)
      .orderBy('fecha', 'desc')
      .limit(5)
      .get();
    
    for (const doc of snapshot.docs) {
      if (doc.id !== excludeId) {
        const data = doc.data();
        return { slug: data.slug || doc.id, titulo: data.titulo || '' };
      }
    }
  } catch (e) {
    // Si el índice no existe, fallback a query sin where de fecha
  }
  
  // Fallback: buscar sin filtro de fecha
  try {
    const snapshot = await db.collection('noticias')
      .where('categoria', '==', categoria)
      .orderBy('fecha', 'desc')
      .limit(5)
      .get();
    
    for (const doc of snapshot.docs) {
      if (doc.id !== excludeId) {
        const data = doc.data();
        return { slug: data.slug || doc.id, titulo: data.titulo || '' };
      }
    }
  } catch (e2) {
    // Sin índice compuesto
  }
  
  return null;
}

async function main() {
  console.log('Conectando a Firestore...');
  
  const snapshot = await db.collection('noticias').get();
  console.log(`Total noticias: ${snapshot.size}\n`);
  
  const noticiasSinLinks = [];
  const todasNoticias = [];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const contenido = (data.contenido || '').toLowerCase();
    
    todasNoticias.push({
      id: doc.id,
      slug: data.slug || doc.id,
      titulo: data.titulo || '',
      categoria: data.categoria || 'General',
      fecha: data.fecha || '',
      resumen: data.resumen || '',
      contenido: data.contenido || '',
    });
    
    if (!hasInternalLinks(contenido)) {
      noticiasSinLinks.push({
        id: doc.id,
        slug: data.slug || doc.id,
        titulo: data.titulo || '',
        categoria: data.categoria || 'General',
        fecha: data.fecha || '',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
      });
    }
  }
  
  console.log(`Noticias sin links internos: ${noticiasSinLinks.length}`);
  console.log('='.repeat(120));
  
  // Ordenar para consistencia
  noticiasSinLinks.sort((a, b) => a.slug.localeCompare(b.slug));
  
  const resultados = [];
  const fechaHace30Dias = new Date();
  fechaHace30Dias.setDate(fechaHace30Dias.getDate() - 30);
  const fechaISO = fechaHace30Dias.toISOString();
  
  for (const noticia of noticiasSinLinks) {
    const catSlug = CATEGORIA_SLUG[noticia.categoria] || 'nacionales';
    const lugar = extractLugar(noticia.titulo, noticia.resumen, noticia.contenido);
    
    let linkEtiqueta = null;
    let anchorEtiqueta = null;
    
    if (lugar) {
      linkEtiqueta = lugar; // El slug del lugar
      anchorEtiqueta = lugar.charAt(0).toUpperCase() + lugar.slice(1);
    }
    
    const related = await findRelatedNoticia(db, noticia.categoria, noticia.id, fechaISO);
    
    const linea = `${noticia.slug} | /categoria/${catSlug} | ${linkEtiqueta || '(ninguno)'} | ${related ? related.slug : '(ninguna)'} | Noticias de ${catSlug} | ${anchorEtiqueta || 'Nicaragua'} | ${related ? related.titulo.split(' ').slice(0, 4).join(' ') : 'Archivo de noticias'}`;
    resultados.push(linea);
    
    console.log(`\nSLUG: ${noticia.slug}`);
    console.log(`  Link 1 (categoría): /categoria/${catSlug} | "Noticias de ${catSlug}"`);
    console.log(`  Link 2 (etiqueta):  ${linkEtiqueta ? linkEtiqueta : 'N/A'} | "${anchorEtiqueta || 'N/A'}"`);
    console.log(`  Link 3 (relacionada): ${related ? related.slug : 'N/A'} | "${related ? related.titulo.split(' ').slice(0, 4).join(' ') : 'N/A'}"`);
  }
  
  console.log('\n' + '='.repeat(120));
  console.log(`Total: ${resultados.length} noticias para agregar links`);
  
  // Guardar propuestas
  console.log('\nPara aplicar los links al campo related_links, descomenta la sección de actualización.');
  
  /*
  // SECCIÓN DE ACTUALIZACIÓN
  console.log('\nAplicando related_links a Firestore...');
  let actualizadas = 0;
  
  for (let i = 0; i < noticiasSinLinks.length; i++) {
    const noticia = noticiasSinLinks[i];
    const catSlug = CATEGORIA_SLUG[noticia.categoria] || 'nacionales';
    const lugar = extractLugar(noticia.titulo, noticia.resumen, noticia.contenido);
    const related = await findRelatedNoticia(db, noticia.categoria, noticia.id, fechaISO);
    
    const relatedLinks = [
      { url: `/categoria/${catSlug}`, anchor: `Noticias de ${catSlug}`, type: 'categoria' },
    ];
    
    if (lugar) {
      relatedLinks.push({ url: `/buscar?q=${encodeURIComponent(lugar)}`, anchor: lugar.charAt(0).toUpperCase() + lugar.slice(1), type: 'etiqueta' });
    }
    
    if (related) {
      relatedLinks.push({ url: `/noticias/${related.slug}`, anchor: related.titulo.split(' ').slice(0, 6).join(' '), type: 'relacionada' });
    }
    
    try {
      await db.collection('noticias').doc(noticia.id).update({
        related_links: relatedLinks,
        fechaActualizacion: new Date().toISOString()
      });
      actualizadas++;
      console.log(`✓ ${noticia.slug} (${relatedLinks.length} links)`);
    } catch (err) {
      console.error(`✗ ${noticia.slug}:`, err.message);
    }
  }
  
  console.log(`\nActualizadas: ${actualizadas}/${noticiasSinLinks.length}`);
  */
}

main().catch(console.error);
