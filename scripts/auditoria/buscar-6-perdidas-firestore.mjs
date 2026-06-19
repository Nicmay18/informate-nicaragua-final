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

const titulosBuscados = [
  'Amanda Miguel ofrece concierto internacional en Managua',
  'Guarda de seguridad fallece en complejo fabril de Managua',
  'Dos fallecidos en accidentes de motocicleta en Nicaragua',
  'Comerciante fallece tras altercado en terminal de Rosita',
  'Nicaraguense fallece en accidente laboral en Wisconsin',
  'Juzgado de Masaya dicta prision preventiva por caso penal',
];

async function main() {
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('  BÚSQUEDA DE 6 NOTICIAS PERDIDAS EN FIRESTORE');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const snap = await db.collection('noticias').get();
  const todas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Total noticias en Firestore: ${todas.length}\n`);

  for (const titulo of titulosBuscados) {
    const tLower = titulo.toLowerCase();
    const matches = todas.filter(n => (n.titulo || '').toLowerCase().includes(tLower.substring(0, 30)));

    if (matches.length === 0) {
      console.log(`❌ NO ENCONTRADA: ${titulo}`);
    } else {
      console.log(`✅ ENCONTRADA: ${titulo}`);
      for (const m of matches) {
        const slug = m.slug || 'SIN-SLUG';
        const estado = m.estado || m.nivel || '?';
        const palabras = (m.contenido || '').split(/\s+/).filter(w => w.length > 0).length;
        console.log(`   → ID: ${m.id}`);
        console.log(`   → Slug: ${slug}`);
        console.log(`   → Estado: ${estado}`);
        console.log(`   → Palabras: ${palabras}`);
        console.log(`   → URL: https://nicaraguainformate.com/noticias/${slug}`);
        console.log('');
      }
    }
    console.log('');
  }

  // Búsqueda adicional: Wisconsin / Jalapa / Rancho
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('  BÚSQUEDA ADICIONAL: "wisconsin", "jalapa", "rancho", "jinotegana"');
  console.log('══════════════════════════════════════════════════════════════════\n');

  const keywords = ['wisconsin', 'jalapa', 'rancho', 'jinotegana', 'jicaro', 'jícaro'];
  for (const kw of keywords) {
    const matches = todas.filter(n =>
      (n.titulo || '').toLowerCase().includes(kw) ||
      (n.slug || '').toLowerCase().includes(kw) ||
      (n.contenido || '').toLowerCase().includes(kw)
    );
    if (matches.length > 0) {
      console.log(`🔍 "${kw}": ${matches.length} resultados`);
      for (const m of matches) {
        console.log(`   → ${m.titulo?.substring(0,60)} | slug: ${m.slug}`);
      }
      console.log('');
    }
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
