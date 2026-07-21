import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

function initDb() {
  if (getApps().length > 0) return getFirestore();
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 no definida');
}

const db = initDb();
const id = process.argv[2] || 'i9duvDflEon1d6yAhT0W';

const doc = await db.collection('noticias').doc(id).get();
if (!doc.exists) {
  console.log('No encontrado:', id);
  process.exit(1);
}

const d = doc.data();
const outDir = resolve(process.cwd(), 'scripts', 'output');
mkdirSync(outDir, { recursive: true });

const plain = (d.contenido || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const palabras = plain.split(/\s+/).filter(Boolean).length;
const siniestro = (d.contenido || '').toLowerCase().split('siniestro').length - 1 + (d.contenido || '').toLowerCase().split('siniestra').length - 1;
const telefonos = (plain.match(/\b\d{3,4}[- ]?\d{4}\b|\b\d{7,}\b/g) || []).length;

const reporte = {
  id,
  titulo: d.titulo,
  resumen: d.resumen,
  contenido: d.contenido,
  categoria: d.categoria,
  autor: d.autor,
  fecha: d.fecha,
  palabras,
  siniestro,
  telefonos,
};

writeFileSync(resolve(outDir, 'noticia-auditoria.json'), JSON.stringify(reporte, null, 2));

console.log(`📝 ${d.titulo}`);
console.log(`   ID: ${id}`);
console.log(`   Palabras: ${palabras}`);
console.log(`   Usos de siniestro/siniestra: ${siniestro}`);
console.log(`   Teléfonos/recursos: ${telefonos}`);
console.log(`   Guardado en: scripts/output/noticia-auditoria.json`);
