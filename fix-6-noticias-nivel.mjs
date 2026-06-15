/**
 * fix-6-noticias-nivel.mjs
 * Asigna nivel correcto a las 4 noticias sin nivel y
 * corrige el contenido de "Guarda de seguridad" que quedó incompleto.
 *
 * Uso: node fix-6-noticias-nivel.mjs
 */
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

// Noticias que solo necesitan que se les asigne nivel
const SOLO_NIVEL = [
  { slug: 'amanda-miguel-ofrece-concierto-internacional-en-managua-mqdfetnj',       nivel: 'ORO',   palabras: 567 },
  { slug: 'dos-fallecidos-en-accidentes-de-motocicleta-en-nicaragua-mqdch1dv',      nivel: 'ORO',   palabras: 729 },
  { slug: 'comerciante-fallece-tras-altercado-en-terminal-de-rosita-mqdbpn0u',      nivel: 'ORO',   palabras: 676 },
  { slug: 'nicaraguense-fallece-en-accidente-laboral-en-wisconsin-mqdbghna',         nivel: 'ORO',   palabras: 674 },
  { slug: 'juzgado-de-masaya-dicta-prision-preventiva-por-caso-penal-mqdaoany',     nivel: 'ORO',   palabras: 615 },
];

// Noticia que además necesita contenido completo con HTML
const GUARDA_SLUG = 'guarda-de-seguridad-fallece-en-complejo-fabril-de-managua-mqdd1tos';
const GUARDA_CONTENIDO = `<p>La Policía Nacional realiza las investigaciones para determinar las causas de un accidente de tránsito en una empresa ubicada en la Carretera Norte que dejó como saldo el fallecimiento de un guarda de seguridad identificado como <strong>Carlos Manuel Cruz Cruz</strong>.</p>

<p>El hecho ocurrido dentro de las instalaciones de la empresa involucra a Cristian Antonio Álvarez García, conductor de una rastra que, según versiones de familiares, se dirigía hacia Masaya.</p>

<h2>Declaraciones del padre del conductor</h2>

<p>Alí Antonio Álvarez, padre del conductor, expresó que el hecho ocurrió a las <strong>6:30 de la mañana</strong> y que aún no se explica cómo sucedió esta tragedia, ya que su hijo se encontraba saliendo de las instalaciones de la empresa, donde la velocidad máxima permitida es de <strong>10 kilómetros por hora</strong>, según el protocolo interno.</p>

<blockquote>«A mí me llamó mi hijo y me dijo lo que había sucedido. Yo estaba dormido, pero él me dijo que ya venía saliendo. Venía cargado, es un furgón. Él tiene entre tres y cuatro años trabajando en esta empresa. Mi hijo iba saliendo y, según lo que nos dijeron, todavía están las investigaciones. Cuando me llamó, me dijo que no supo cómo ocurrió, que fue hasta que lo contactaron que le informaron sobre el accidente», expresó Alí Álvarez.</blockquote>

<p>Antonio destacó que su hijo, de <strong>41 años de edad</strong>, tiene más de <strong>14 años de experiencia</strong> conduciendo vehículos de carga pesada, cuenta con licencia profesional y es la primera vez que se ve involucrado en una tragedia de esta naturaleza.</p>

<h2>Protocolo de seguridad dentro de las instalaciones</h2>

<p>El hecho, ocurrido en el barrio José Dolores Estrada, Distrito VI de Managua, ha causado consternación entre los trabajadores de la empresa.</p>

<p>Algunos testigos expresaron fuera de cámara que el conductor de la rastra ya había avanzado aproximadamente <strong>300 metros</strong> del lugar cuando lo llamaron para pedirle que detuviera su marcha e informarle sobre la tragedia que hoy enluta a una familia capitalina.</p>

<p>El tráfico dentro de las instalaciones está estrictamente regulado. Los conductores deben respetar la velocidad máxima de 10 km/h, utilizar obligatoriamente el cinturón de seguridad y mantener los vehículos en óptimas condiciones.</p>

<p>Para garantizar la seguridad y cumplir con su sistema de gestión, el protocolo exige que todo vehículo se detenga por completo al ingresar por las áreas de seguridad o centros de distribución.</p>

<p>La Policía Nacional continúa las investigaciones, mientras que el cuerpo del fallecido fue trasladado al <strong>Instituto de Medicina Legal</strong>.</p>`;

async function actualizarNivel(slug, nivel, palabras) {
  const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (snap.empty) {
    console.log('  ❌ No encontrada: ' + slug);
    return false;
  }
  await snap.docs[0].ref.update({ nivel, palabras });
  console.log('  ✅ Nivel asignado: ' + nivel + ' | ' + slug.substring(0, 50));
  return true;
}

async function actualizarGuarda() {
  const snap = await db.collection('noticias').where('slug', '==', GUARDA_SLUG).limit(1).get();
  if (snap.empty) {
    console.log('  ❌ No encontrada: ' + GUARDA_SLUG);
    return;
  }
  await snap.docs[0].ref.update({
    contenido: GUARDA_CONTENIDO,
    palabras: 674,
    nivel: 'PLATA',
  });
  console.log('  ✅ Contenido y nivel actualizados: guarda-de-seguridad (' + GUARDA_CONTENIDO.trim().split(/\s+/).length + ' palabras aprox)');
}

async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  FIX: Nivel + Contenido de las 6 noticias');
  console.log('══════════════════════════════════════════════════════════\n');

  console.log('1. Asignando nivel a las 5 noticias sin nivel...');
  for (const n of SOLO_NIVEL) {
    await actualizarNivel(n.slug, n.nivel, n.palabras);
  }

  console.log('\n2. Corrigiendo contenido de "Guarda de seguridad"...');
  await actualizarGuarda();

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  HECHO. Todas las 6 noticias están listas en Firestore.');
  console.log('  Ejecuta: node regenerar-backup-firestore.mjs');
  console.log('  para actualizar el backup local.');
  console.log('══════════════════════════════════════════════════════════');

  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
