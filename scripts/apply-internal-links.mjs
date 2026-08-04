import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getCachedNoticias } from '../lib/db/cached-firestore.mjs';

config({ path: '.env.local' });

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
let credential;
if (b64 && b64.trim().length > 10) {
  const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  credential = cert(sa);
} else {
  credential = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
}

initializeApp({ credential });
const db = getFirestore();

const CATEGORIA_SLUG = {
  'Sucesos': 'sucesos', 'Nacionales': 'nacionales', 'Deportes': 'deportes',
  'Internacionales': 'internacionales', 'Tecnología': 'tecnologia', 'Espectáculos': 'espectaculos',
  'Cultura': 'cultura', 'Economía': 'economia', 'Salud': 'salud',
  'Judicial': 'judicial', 'Infraestructura': 'infraestructura', 'General': 'nacionales',
};

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

function extractLugar(titulo, resumen, contenido) {
  const texto = `${titulo} ${resumen} ${contenido}`.toLowerCase();
  for (const mun of MUNICIPIOS) { if (texto.includes(mun)) return mun; }
  for (const inst of INSTITUCIONES) { if (texto.includes(inst)) return inst; }
  return null;
}

function hasInternalLinks(contenido) {
  if (!contenido) return false;
  return contenido.includes('href="/categoria/') || contenido.includes('href="/noticias/');
}

async function main() {
  console.log('Cargando todas las noticias...');
  const snapshot = await getCachedNoticias(db);
  const todas = [];
  snapshot.docs.forEach(d => {
    const data = d.data();
    todas.push({ id: d.id, slug: data.slug || d.id, categoria: data.categoria || 'General', fecha: data.fecha || '', titulo: data.titulo || '' });
  });

  // Indexar por categoría para búsqueda rápida
  const porCategoria = {};
  for (const n of todas) {
    if (!porCategoria[n.categoria]) porCategoria[n.categoria] = [];
    porCategoria[n.categoria].push(n);
  }
  // Ordenar cada categoría por fecha descendente
  for (const cat of Object.keys(porCategoria)) {
    porCategoria[cat].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  }

  const noticiasSinLinks = [];
  for (const d of snapshot.docs) {
    const data = d.data();
    const tieneRelatedLinks = data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0;
    if (!hasInternalLinks(data.contenido || '') && !tieneRelatedLinks) {
      noticiasSinLinks.push({ id: d.id, slug: data.slug || d.id, titulo: data.titulo || '', categoria: data.categoria || 'General', resumen: data.resumen || '', contenido: data.contenido || '', fecha: data.fecha || '' });
    }
  }

  console.log(`Noticias sin links: ${noticiasSinLinks.length}`);
  noticiasSinLinks.sort((a, b) => a.slug.localeCompare(b.slug));

  let actualizadas = 0;
  for (const noticia of noticiasSinLinks) {
    const catSlug = CATEGORIA_SLUG[noticia.categoria] || 'nacionales';
    const lugar = extractLugar(noticia.titulo, noticia.resumen, noticia.contenido);

    const relatedLinks = [
      { url: `/categoria/${catSlug}`, anchor: `Noticias de ${catSlug}`, type: 'categoria' },
    ];

    if (lugar) {
      relatedLinks.push({ url: `/buscar?q=${encodeURIComponent(lugar)}`, anchor: lugar.charAt(0).toUpperCase() + lugar.slice(1), type: 'etiqueta' });
    }

    // Buscar noticia relacionada en memoria (sin índice Firestore)
    const catNoticias = porCategoria[noticia.categoria] || [];
    const relacionada = catNoticias.find(n => n.id !== noticia.id && n.slug !== noticia.slug);
    if (relacionada) {
      const anchorWords = relacionada.titulo.split(' ').slice(0, 6).join(' ');
      relatedLinks.push({ url: `/noticias/${relacionada.slug}`, anchor: anchorWords, type: 'relacionada' });
    }

    try {
      await db.collection('noticias').doc(noticia.id).update({
        related_links: relatedLinks,
        fechaActualizacion: new Date().toISOString()
      });
      actualizadas++;
      console.log(`OK ${noticia.slug} (${relatedLinks.length} links)`);
    } catch (err) {
      console.error(`FAIL ${noticia.slug}:`, err.message);
    }
  }

  console.log(`\n=== Actualizadas: ${actualizadas}/${noticiasSinLinks.length} ===`);
}

main().catch(console.error);
