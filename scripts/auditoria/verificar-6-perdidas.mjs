import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: './.env.local' });

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
  process.exit(1);
}

const db = initDb();

const LAS_6 = [
  { titulo: 'Amanda Miguel ofrece concierto internacional en Managua',     slug: 'amanda-miguel-ofrece-concierto-internacional-en-managua-mqdfetnj' },
  { titulo: 'Guarda de seguridad fallece en complejo fabril de Managua',   slug: 'guarda-de-seguridad-fallece-en-complejo-fabril-de-managua-mqdd1tos' },
  { titulo: 'Dos fallecidos en accidentes de motocicleta en Nicaragua',    slug: 'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua-mqdch1dv' },
  { titulo: 'Comerciante fallece tras altercado en terminal de Rosita',    slug: 'comerciante-fallece-tras-altercado-en-terminal-de-rosita-mqdbpn0u' },
  { titulo: 'Nicaraguense fallece en accidente laboral en Wisconsin',      slug: 'nicaraguense-fallece-en-accidente-laboral-en-wisconsin-mqdbghna' },
  { titulo: 'Juzgado de Masaya dicta prision preventiva por caso penal',   slug: 'juzgado-de-masaya-dicta-prision-preventiva-por-caso-penal-mqdaoany' },
];

async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  ESTADO DE LAS 6 NOTICIAS EN FIRESTORE');
  console.log('══════════════════════════════════════════════════════════\n');

  for (const item of LAS_6) {
    const snap = await db.collection('noticias').where('slug', '==', item.slug).limit(1).get();

    if (snap.empty) {
      console.log('❌ NO EXISTE: ' + item.titulo);
      console.log('   URL que da 404: https://nicaraguainformate.com/noticias/' + item.slug);
      console.log('   ACCION: Necesita ser insertada\n');
      continue;
    }

    const doc = snap.docs[0];
    const d = doc.data();
    const contenido = d.contenido || '';
    const palabras = contenido.trim().split(/\s+/).filter(w => w.length > 0).length;
    const tieneContenidoReal = palabras > 50;
    const tituloActual = d.titulo || '';

    const tituloCoincide = tituloActual.toLowerCase().includes(item.titulo.toLowerCase().substring(0, 20));

    console.log((tieneContenidoReal ? '✅' : '⚠️') + ' ' + item.titulo);
    console.log('   ID: ' + doc.id);
    console.log('   Slug: ' + (d.slug || 'SIN SLUG'));
    console.log('   Título en BD: ' + tituloActual.substring(0, 65));
    console.log('   Palabras: ' + palabras);
    console.log('   Nivel: ' + (d.nivel || 'sin nivel'));
    console.log('   URL: https://nicaraguainformate.com/noticias/' + item.slug);
    if (!tieneContenidoReal) {
      console.log('   ⚠️  CONTENIDO INSUFICIENTE — La página abriría pero estaría vacía');
    }
    console.log('');
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
