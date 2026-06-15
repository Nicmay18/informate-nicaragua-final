import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: 'e:/PROYECTO/informate-nicaragua-final/.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  if (privateKeyRaw && projectId && clientEmail) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore();
  }
  console.error('❌ No hay credenciales Firebase');
  process.exit(1);
}

const db = initDb();

async function main() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  BÚSQUEDA EN FIRESTORE — 6 noticias perdidas');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const snap = await db.collection('noticias').get();
  const todas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Total en Firestore: ${todas.length} noticias\n`);

  // Buscar por palabras clave parciales
  const busquedas = [
    { nombre: 'Amanda Miguel', keywords: ['amanda', 'miguel'] },
    { nombre: 'Guarda seguridad / Complejo fabril', keywords: ['guarda', 'seguridad'] },
    { nombre: 'Dos fallecidos motocicleta', keywords: ['fallecidos', 'motocicleta'] },
    { nombre: 'Comerciante / Rosita / Terminal', keywords: ['comerciante'] },
    { nombre: 'Wisconsin / Accidente laboral', keywords: ['wisconsin'] },
    { nombre: 'Juzgado Masaya / Prisión preventiva', keywords: ['juzgado', 'masaya'] },
  ];

  for (const b of busquedas) {
    const matches = todas.filter(n =>
      b.keywords.every(k =>
        (n.titulo || '').toLowerCase().includes(k) ||
        (n.slug || '').toLowerCase().includes(k) ||
        (n.contenido || '').toLowerCase().includes(k)
      )
    );

    console.log(`🔍 ${b.nombre}:`);
    if (matches.length === 0) {
      console.log('   ❌ No encontrada en Firestore\n');
    } else {
      console.log(`   ✅ ${matches.length} resultado(s):`);
      for (const m of matches) {
        const slug = m.slug || 'SIN-SLUG';
        const palabras = (m.contenido || '').split(/\s+/).filter(w => w.length > 0).length;
        console.log(`      → ID: ${m.id}`);
        console.log(`      → Título: ${(m.titulo || 'SIN TÍTULO').substring(0,65)}`);
        console.log(`      → Slug: ${slug}`);
        console.log(`      → Palabras: ${palabras}`);
        console.log(`      → URL: https://nicaraguainformate.com/noticias/${slug}`);
        console.log('');
      }
    }
  }

  // Extra: buscar por los slugs exactos del pre-limpieza
  const slugsPre = [
    'amanda-miguel-ofrece-concierto-internacional-en-managua',
    'guarda-de-seguridad-fallece-en-complejo-fabril-de-managua',
    'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua',
    'comerciante-fallece-tras-altercado-en-terminal-de-rosita',
    'nicaraguense-fallece-en-accidente-laboral-en-wisconsin',
    'juzgado-de-masaya-dicta-prision-preventiva-por-caso-penal',
  ];

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('  BÚSQUEDA POR SLUGS DEL PRE-LIMPIEZA');
  console.log('══════════════════════════════════════════════════════════════════\n');

  for (const slugBase of slugsPre) {
    const matches = todas.filter(n => (n.slug || '').includes(slugBase.substring(0, 30)));
    if (matches.length > 0) {
      console.log(`✅ Slug parcial "${slugBase.substring(0,35)}...":`);
      matches.forEach(m => console.log(`   → ${m.titulo?.substring(0,60)} | slug: ${m.slug}`));
    } else {
      console.log(`❌ Slug "${slugBase.substring(0,45)}..." no encontrado`);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
