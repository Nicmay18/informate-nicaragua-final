import { config } from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
  'carazo', 'bluefields', 'bilwi', 'corn island', 'ometepe', 'san juan del sur',
  'diriamba', 'jinotepe', 'nagarote', 'la concepción', 'la paz centro', 'tipitapa',
  'nindirí', 'diriomo', 'diría', 'jiquilillo', 'las peñitas', 'siuna', 'rosita', 'waslala',
];

function extractLugar(titulo, resumen, contenido) {
  const texto = `${titulo} ${resumen} ${contenido}`.toLowerCase();
  for (const mun of MUNICIPIOS) { if (texto.includes(mun)) return mun; }
  return null;
}

async function main() {
  console.log('Cargando todas las noticias...');
  const snap = await db.collection('noticias').get();
  const todas = [];
  snap.docs.forEach(d => {
    const data = d.data();
    todas.push({
      id: d.id,
      slug: data.slug || d.id,
      categoria: data.categoria || 'General',
      fecha: data.fecha || '',
      titulo: data.titulo || '',
    });
  });

  // Indexar por categoría
  const porCategoria = {};
  for (const n of todas) {
    if (!porCategoria[n.categoria]) porCategoria[n.categoria] = [];
    porCategoria[n.categoria].push(n);
  }
  for (const cat of Object.keys(porCategoria)) {
    porCategoria[cat].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  }

  // Filtrar SOLO las que NO tienen related_links
  const sinLinks = [];
  for (const d of snap.docs) {
    const data = d.data();
    const tiene = data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0;
    if (!tiene) {
      sinLinks.push({
        id: d.id,
        slug: data.slug || d.id,
        titulo: data.titulo || '',
        categoria: data.categoria || 'General',
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        fecha: data.fecha || '',
      });
    }
  }

  console.log(`Noticas sin related_links: ${sinLinks.length}`);

  let actualizadas = 0;
  for (const noticia of sinLinks) {
    const catSlug = CATEGORIA_SLUG[noticia.categoria] || 'nacionales';
    const lugar = extractLugar(noticia.titulo, noticia.resumen, noticia.contenido);

    const relatedLinks = [
      { url: `/categoria/${catSlug}`, anchor: `Noticias de ${noticia.categoria}`, type: 'categoria' },
    ];

    if (lugar) {
      relatedLinks.push({
        url: `/buscar?q=${encodeURIComponent(lugar)}`,
        anchor: lugar.charAt(0).toUpperCase() + lugar.slice(1),
        type: 'etiqueta',
      });
    }

    // Buscar 2 noticias relacionadas de la misma categoría
    const catNoticias = porCategoria[noticia.categoria] || [];
    const relacionadas = catNoticias
      .filter(n => n.id !== noticia.id && n.slug !== noticia.slug)
      .slice(0, 2);

    for (const rel of relacionadas) {
      const anchorWords = rel.titulo.split(' ').slice(0, 6).join(' ');
      relatedLinks.push({ url: `/noticias/${rel.slug}`, anchor: anchorWords, type: 'relacionada' });
    }

    // Asegurar mínimo 3 links
    if (relatedLinks.length < 3) {
      const otrasCats = Object.keys(porCategoria).filter(c => c !== noticia.categoria);
      for (const oc of otrasCats) {
        if (relatedLinks.length >= 3) break;
        const otras = porCategoria[oc];
        if (otras && otras.length > 0) {
          const rel = otras[0];
          relatedLinks.push({
            url: `/noticias/${rel.slug}`,
            anchor: rel.titulo.split(' ').slice(0, 6).join(' '),
            type: 'relacionada',
          });
        }
      }
    }

    try {
      await db.collection('noticias').doc(noticia.id).update({
        related_links: relatedLinks,
        fechaActualizacion: new Date().toISOString(),
      });
      actualizadas++;
      console.log(`OK ${noticia.slug} (${relatedLinks.length} links)`);
    } catch (err) {
      console.error(`FAIL ${noticia.slug}:`, err.message);
    }
  }

  console.log(`\n=== Actualizadas: ${actualizadas}/${sinLinks.length} ===`);

  // Verificación final
  const snap2 = await db.collection('noticias').get();
  let conLinks = 0;
  for (const d of snap2.docs) {
    const data = d.data();
    if (data.related_links && Array.isArray(data.related_links) && data.related_links.length > 0) conLinks++;
  }
  console.log(`Verificación: ${conLinks}/${snap2.size} con related_links (${Math.round(conLinks / snap2.size * 100)}%)`);
}

main().catch(console.error);
