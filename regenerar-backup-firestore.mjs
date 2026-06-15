/**
 * regenerar-backup-firestore.mjs
 * Exporta TODAS las noticias de Firestore a un backup JSON sincronizado.
 * Uso: node regenerar-backup-firestore.mjs
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config({ path: './env.local' });
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
  console.error('ERROR: No se encontraron credenciales Firebase en .env.local');
  process.exit(1);
}

const db = initDb();

function safeDate(value) {
  if (!value) return '';
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try { return value.toDate().toISOString(); } catch { return ''; }
  }
  if (typeof value === 'object' && value._seconds) {
    return new Date(value._seconds * 1000).toISOString();
  }
  return String(value);
}

async function main() {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const outputFile = `backup-noticias-${fechaHoy}.json`;

  console.log('══════════════════════════════════════════════════════════');
  console.log('  REGENERAR BACKUP DESDE FIRESTORE');
  console.log('══════════════════════════════════════════════════════════');
  console.log('Conectando a Firestore...');

  const snap = await db.collection('noticias').limit(2000).get();
  console.log(`Noticias encontradas en Firestore: ${snap.size}`);

  const noticias = snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      slug: d.slug || doc.id,
      titulo: d.titulo || '',
      resumen: d.resumen || '',
      contenido: d.contenido || '',
      categoria: d.categoria || 'Actualidad',
      imagen: d.imagen || '',
      imagenDestacada: d.imagenDestacada || d.imagen || '',
      fecha: safeDate(d.fecha),
      fechaActualizacion: safeDate(d.fechaActualizacion),
      autor: d.autor || 'Redacción',
      autorFoto: d.autorFoto || '',
      destacada: d.destacada || false,
      vistas: d.vistas || 0,
      palabras: d.palabras || 0,
      nivel: d.nivel || '',
      tags: d.tags || [],
      pieFoto: d.pieFoto || '',
      metaDescription: d.metaDescription || d.metaDescripcion || '',
      keywords: d.keywords || '',
      noindex: d.noindex || false,
    };
  });

  // Ordenar por fecha descendente
  noticias.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Estadísticas
  const sinSlug = noticias.filter(n => !n.slug || n.slug === n.id).length;
  const sinImagen = noticias.filter(n => !n.imagenDestacada && !n.imagen).length;
  const porNivel = {};
  for (const n of noticias) {
    const nv = n.nivel || 'SIN_NIVEL';
    porNivel[nv] = (porNivel[nv] || 0) + 1;
  }

  writeFileSync(outputFile, JSON.stringify(noticias, null, 2), 'utf8');

  console.log('');
  console.log('RESUMEN:');
  console.log('  Total exportadas: ' + noticias.length);
  console.log('  Sin slug propio: ' + sinSlug);
  console.log('  Sin imagen: ' + sinImagen);
  console.log('  Por nivel: ' + JSON.stringify(porNivel));
  console.log('');
  console.log('Backup guardado: ' + outputFile);
  console.log('');
  console.log('NOTA: Para que los scripts de auditoria usen este backup,');
  console.log('  renombra o reemplaza backup-noticias-2026-06-14.json con este archivo.');

  process.exit(0);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
