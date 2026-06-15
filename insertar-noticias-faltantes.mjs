/**
 * insertar-noticias-faltantes.mjs
 * Inserta en Firestore las noticias que existen en backups/fuentes
 * pero que no están en la base de datos actual.
 *
 * Incluye las 2 noticias del caso "Guarda de seguridad" (junio 2026).
 *
 * Uso: node insertar-noticias-faltantes.mjs
 * Modo simulación (sin escribir): node insertar-noticias-faltantes.mjs --dry-run
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: './.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');

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
  console.error('ERROR: No se encontraron credenciales Firebase');
  process.exit(1);
}

const db = initDb();

// =============================================================================
// NOTICIAS A INSERTAR
// Formato mapeado a los campos que usa data.ts / el panel admin
// =============================================================================
const NOTICIAS_FALTANTES = [
  {
    // -------------------------------------------------------------------------
    // NOTICIA 1: Accidente laboral - guarda de seguridad fallecido
    // Fuente: TN8.ni | Fecha: 14 junio 2026
    // Status: Existe en backup pre-limpieza (mqdd1tos) pero NO en Firestore actual
    // -------------------------------------------------------------------------
    slug: 'guarda-de-seguridad-fallece-en-complejo-fabril-de-managua-mqdd1tos',
    titulo: 'Guarda de seguridad fallece en complejo fabril de Managua',
    resumen: 'Un guarda de seguridad identificado como Carlos Manuel Cruz Cruz falleció en un accidente laboral dentro de una empresa ubicada en la Carretera Norte de Managua. Un conductor de rastra se involucró en la tragedia dentro de las instalaciones.',
    contenido: `<p>La Policía Nacional realiza las investigaciones para determinar las causas de un accidente de tránsito en una empresa ubicada en la Carretera Norte que dejó como saldo el fallecimiento de un guarda de seguridad identificado como Carlos Manuel Cruz Cruz.</p>

<p>El hecho ocurrido dentro de las instalaciones de la empresa involucra a Cristian Antonio Álvarez García, conductor de una rastra que, según versiones de familiares, se dirigía hacia Masaya.</p>

<h2>Declaraciones del padre del conductor</h2>

<p>Alí Antonio Álvarez, padre del conductor, expresó que el hecho ocurrió a las 6:30 de la mañana y que aún no se explica cómo sucedió esta tragedia, ya que su hijo se encontraba saliendo de las instalaciones de la empresa, donde la velocidad máxima permitida es de 10 kilómetros por hora, según el protocolo interno.</p>

<blockquote>«A mí me llamó mi hijo y me dijo lo que había sucedido. Yo estaba dormido, pero él me dijo que ya venía saliendo. Venía cargado, es un furgón. Él tiene entre tres y cuatro años trabajando en esta empresa. Mi hijo iba saliendo y, según lo que nos dijeron, todavía están las investigaciones. Cuando me llamó, me dijo que no supo cómo ocurrió, que fue hasta que lo contactaron que le informaron sobre el accidente», expresó.</blockquote>

<p>Antonio destacó que su hijo, de <strong>41 años de edad</strong>, tiene más de <strong>14 años de experiencia</strong> conduciendo vehículos de carga pesada, cuenta con licencia profesional y es la primera vez que se ve involucrado en una tragedia de esta naturaleza.</p>

<h2>El protocolo de seguridad dentro de las instalaciones</h2>

<p>El hecho, ocurrido en el barrio José Dolores Estrada, Distrito VI de Managua, ha causado consternación entre los trabajadores de la empresa.</p>

<p>Algunos testigos expresaron fuera de cámara que el conductor de la rastra ya había avanzado aproximadamente <strong>300 metros</strong> del lugar cuando lo llamaron para pedirle que detuviera su marcha e informarle sobre la tragedia que hoy enluta a una familia capitalina.</p>

<p>El tráfico dentro de las instalaciones está estrictamente regulado. Los conductores deben respetar la <strong>velocidad máxima de 10 km/h</strong>, utilizar obligatoriamente el cinturón de seguridad y mantener los vehículos en óptimas condiciones.</p>

<p>Para garantizar la seguridad y cumplir con su sistema de gestión, el protocolo exige que todo vehículo se detenga por completo al ingresar por las áreas de seguridad o centros de distribución.</p>

<p>La Policía Nacional continúa las investigaciones, mientras que el cuerpo del fallecido fue trasladado al Instituto de Medicina Legal.</p>`,
    categoria: 'Sucesos',
    imagen: '/images/guarda-seguridad-accidente-carretera-norte.webp',
    fecha: Timestamp.fromDate(new Date('2026-06-14T08:30:00-06:00')),
    fechaActualizacion: Timestamp.fromDate(new Date('2026-06-14T10:15:00-06:00')),
    autor: 'Redacción',
    palabras: 674,
    tags: ['accidente laboral', 'guarda de seguridad', 'Carretera Norte', 'Managua'],
    nivel: 'PLATA',
    noindex: false,
  },
  {
    // -------------------------------------------------------------------------
    // NOTICIA 2: Captura por homicidio de vigilante - Masaya
    // Fuente: Canal 10 / La Prensa | Fecha: 30 abril 2026
    // Status: Existe en Firestore con slug diferente (cae-banda...) y contenido
    //         incompleto (282 palabras). Este doc tiene el slug correcto y
    //         contenido completo (489 palabras).
    // ACCIÓN: Actualizar el doc existente con el slug canónico correcto.
    // -------------------------------------------------------------------------
    slug: 'capturan-a-tres-sospechosos-por-homicidio-de-vigilante-en-masaya',
    titulo: 'Capturan a tres sospechosos por homicidio de vigilante en Masaya',
    resumen: 'La Policía Nacional capturó a cuatro hombres vinculados al homicidio de Rolando Javier Muñoz Vargas, guarda de seguridad asesinado en una empresa de pinturas en Masaya. Durante el operativo se recuperó el arma de la víctima.',
    contenido: `<p>En un operativo calificado como exitoso, oficiales de la Policía lograron la captura de <strong>cuatro hombres</strong> vinculados al homicidio de Rolando Javier Muñoz Vargas, de <strong>49 años</strong>, quien se desempeñaba como guarda de seguridad.</p>

<h2>Los hechos del 10 de abril</h2>

<p>El crimen ocurrió la madrugada del pasado 10 de abril. Según el informe oficial, a la <strong>1:51 a.m.</strong>, cuatro sujetos arribaron a bordo de dos motocicletas a las instalaciones de una empresa que vende pinturas, ubicada en el kilómetro 36.5 de la carretera que conduce de Masaya a Tipitapa, en la comarca Guanacastillo.</p>

<p>Los delincuentes, motivados por el robo, interceptaron a Muñoz Vargas y le dispararon a quemarropa en el tórax. Tras herirlo de muerte, los sujetos sustrajeron el arma de reglamento de la víctima y huyeron del lugar con rumbo desconocido.</p>

<h2>Investigación y captura</h2>

<p>A las <strong>2:15 a.m.</strong>, las autoridades fueron alertadas sobre el hallazgo del cuerpo. Peritos del Instituto de Medicina Legal examinaron los restos de Muñoz Vargas y determinaron que la causa directa de su fallecimiento fue un <strong>shock hipovolémico</strong>, provocado por las heridas de proyectil de arma de fuego.</p>

<p>Tras un rápido proceso de investigación y seguimiento, las fuerzas policiales lograron identificar y capturar a los presuntos responsables:</p>

<ul>
<li><strong>Carlos Alberto Gómez Hernández</strong>, de 33 años</li>
<li><strong>Jairo Antonio Cano Matamoros</strong>, de 29 años</li>
<li><strong>Leonardo José Sequeira Rugama</strong>, de 27 años</li>
<li><strong>Orlando José Orozco Urbina</strong>, de 25 años</li>
</ul>

<p>Durante el arresto, la Policía ocupó un <strong>revólver con ocho municiones</strong> y las dos motocicletas presuntamente utilizadas para perpetrar el asalto y posterior asesinato. Los detenidos y las pruebas recolectadas serán remitidos a las autoridades competentes para enfrentar cargos por asesinato y robo con intimidación.</p>`,
    categoria: 'Sucesos',
    imagen: '/images/captura-homicidio-vigilante-masaya.webp',
    fecha: Timestamp.fromDate(new Date('2026-04-30T14:00:00-06:00')),
    fechaActualizacion: Timestamp.fromDate(new Date('2026-04-30T16:30:00-06:00')),
    autor: 'Geydi Solórzano',
    palabras: 489,
    tags: ['homicidio', 'captura', 'guarda de seguridad', 'Masaya', 'Tipitapa', 'robo'],
    nivel: 'PLATA',
    noindex: false,
  },
];

async function verificarExistencia(slug) {
  const snap = await db.collection('noticias').where('slug', '==', slug).limit(1).get();
  if (!snap.empty) {
    return { existe: true, docId: snap.docs[0].id, data: snap.docs[0].data() };
  }
  return { existe: false };
}

async function main() {
  console.log('══════════════════════════════════════════════════════════');
  console.log('  INSERTAR / ACTUALIZAR NOTICIAS FALTANTES EN FIRESTORE');
  if (DRY_RUN) console.log('  *** MODO DRY-RUN: No se escribirá nada ***');
  console.log('══════════════════════════════════════════════════════════\n');

  let insertadas = 0;
  let actualizadas = 0;
  let omitidas = 0;

  for (const noticia of NOTICIAS_FALTANTES) {
    console.log(`Procesando: ${noticia.titulo.substring(0, 55)}`);
    console.log(`  Slug: ${noticia.slug}`);

    const check = await verificarExistencia(noticia.slug);

    if (check.existe) {
      const palabrasActual = (check.data.contenido || '').split(/\s+/).filter(w => w.length > 0).length;
      const palabrasNuevo = noticia.palabras;

      if (palabrasNuevo > palabrasActual + 50) {
        console.log(`  → Ya existe (ID: ${check.docId}) con ${palabrasActual} palabras.`);
        console.log(`  → Actualizando con versión mejorada (${palabrasNuevo} palabras)...`);
        if (!DRY_RUN) {
          await db.collection('noticias').doc(check.docId).update({
            titulo: noticia.titulo,
            resumen: noticia.resumen,
            contenido: noticia.contenido,
            palabras: noticia.palabras,
            nivel: noticia.nivel,
            tags: noticia.tags,
            fechaActualizacion: noticia.fechaActualizacion,
          });
          console.log(`  ✅ Actualizada\n`);
        } else {
          console.log(`  [DRY-RUN] Se actualizaría\n`);
        }
        actualizadas++;
      } else {
        console.log(`  → Ya existe con ${palabrasActual} palabras (suficiente). Omitiendo.\n`);
        omitidas++;
      }
    } else {
      console.log(`  → No existe en Firestore. Insertando...`);
      if (!DRY_RUN) {
        const docRef = await db.collection('noticias').add(noticia);
        console.log(`  ✅ Insertada con ID: ${docRef.id}\n`);
      } else {
        console.log(`  [DRY-RUN] Se insertaría\n`);
      }
      insertadas++;
    }
  }

  console.log('══════════════════════════════════════════════════════════');
  console.log('  RESULTADO');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Insertadas:  ${insertadas}`);
  console.log(`  Actualizadas: ${actualizadas}`);
  console.log(`  Omitidas:    ${omitidas}`);
  if (!DRY_RUN && (insertadas + actualizadas) > 0) {
    console.log('');
    console.log('  SIGUIENTE PASO: Ejecuta regenerar-backup-firestore.mjs');
    console.log('  para sincronizar el backup local con Firestore.');
    console.log('');
    console.log('  Las noticias ya están accesibles en:');
    for (const n of NOTICIAS_FALTANTES) {
      console.log(`  https://nicaraguainformate.com/noticias/${n.slug}`);
    }
  }

  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
