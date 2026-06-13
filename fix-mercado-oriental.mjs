#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

function meta(c) {
  const tx = c.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const or = tx.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let m = or.slice(0, 2).join(' '); if (m.length < 150) m += ` Noticias Nicaragua.`; if (m.length > 170) m = m.slice(0, 167) + '...';
  return m;
}

const ID_NOTICIA = '0BNeDtDWEGVCQYWrvXtO';

const html = `<h2>Hechos principales</h2><p>Un incendio estructural de gran magnitud destruyó por completo las instalaciones de la tienda comercial <strong>"Emanuel"</strong> y causó afectaciones severas en dos establecimientos contiguos de ropa y calzado, situados en el sector <strong>Ropa-Usame</strong> del <strong>Mercado Oriental</strong>, <strong>Managua</strong>. El siniestro se originó en un edificio de dos plantas y provocó la pérdida total de la mercancía almacenada.</p><p>Las unidades de emergencia de <strong>Bomberos Unidos de Nicaragua</strong> y destacamentos de la <strong>Policía Nacional</strong> desplegaron un operativo conjunto de contención en el perímetro comercial para sofocar el fuego y asegurar el área afectada. Los peritajes preliminares determinaron que el evento fue provocado por fallas mecánicas e inobservancia de medidas de prevención durante trabajos de infraestructura interna.</p><h2>Declaraciones de fuentes</h2><blockquote><p>"Los equipos especializados extinguieron las llamas tras más de dos horas de operaciones complejas en la zona afectada, logrando evitar la propagación del fuego hacia los callejones adyacentes del complejo comercial", explicaron portavoces de las brigadas de rescate.</p></blockquote><blockquote><p>"Los análisis en la escena confirman que las chispas generadas por un equipo de soldadura eléctrica en la planta alta entraron en contacto directo con materiales de alta combustión ubicados en el nivel inferior", detallaron peritos técnicos de los cuerpos de prevención de siniestros.</p></blockquote><h2>Desarrollo</h2><p>El incidente comenzó minutos después de las 14:40 horas en el populoso sector comercial. La velocidad de propagación de las llamas se vio incrementada por la presencia de textiles, mochilas y calzado sintético, elementos altamente inflamables. La tienda principal, propiedad de la ciudadana <strong>María del Rosario Arias López</strong> (59), sufrió el colapso total de sus inventarios de temporada.</p><p>Para controlar la emergencia, se requirió la intervención de más de 65 bomberos y el despliegue de múltiples camiones cisterna de las delegaciones capitalinas, los cuales enfrentaron las dificultades habituales de acceso que caracterizan las vías internas del coloso comercial. De manera simultánea, un contingente de 150 agentes de la <strong>Policía Nacional</strong>, bajo la coordinación del <strong>Comisionado General Bladimir Cerda</strong>, procedió a acordonar los perímetros de seguridad para prevenir altercados y facilitar las maniobras de las mangueras de alta presión.</p><p>Los peritos de la <strong>División de Averías, Explosiones e Incendios (AVEXI)</strong> de los <strong>Bomberos Unidos</strong>, en coordinación con especialistas de criminalística, realizaron el levantamiento de datos en el foco del incendio. El informe conclusivo determinó que los operarios <strong>Rafael Antonio Chavarría</strong> y <strong>Ramón de Jesús Acuña</strong> ejecutaban labores de soldadura en la segunda planta del inmueble sin disponer de pantallas de protección ni extintores portátiles de respaldo. Los fragmentos incandescentes se filtraron hacia el primer piso, dando inicio a la combustión que consumió el patrimonio de las familias afectadas.</p><p>Pie de Foto: Efectos del incendio en el sector Ropa-Usame del Mercado Oriental, Managua. Foto: Cortesía.</p>`;

async function main() {
  const db = initFirebase();
  const ref = db.collection('noticias').doc(ID_NOTICIA);
  const snap = await ref.get();
  if (!snap.exists) { console.log('⚠️ NO EXISTE'); process.exit(1); }

  const contenido = html.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
  const titulo = 'Incendio estructural destruye tres tramos comerciales en el Mercado Oriental de Managua';
  const resumen = meta(contenido);

  await ref.update({
    titulo,
    contenido,
    resumen,
    categoria: 'Sucesos',
    departamento: 'Managua',
    dateline: 'MANAGUA',
    slug: 'incendio-estructural-destruye-tramos-comerciales-mercado-oriental-managua',
    autor: 'Keyling Elieth Rivera Muñoz',
    fechaActualizacion: FieldValue.serverTimestamp(),
    estado: 'publicado'
  });

  console.log('✅ ACTUALIZADA: Incendio estructural destruye tres tramos comerciales en el Mercado Oriental');
  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
