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

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  // Buscar exactamente la de Jinotegana
  const jinoteganas = snapshot.docs.filter(d => {
    const t = (d.data().titulo || '').toLowerCase();
    return t.includes('jinotegana') && t.includes('wisconsin');
  });

  if (jinoteganas.length === 0) {
    console.log('❌ No encontrada la noticia de Jinotegana en Wisconsin');
    process.exit(1);
  }

  const doc = jinoteganas[0];
  const data = doc.data();
  let contenido = data.contenido || '';

  console.log('=== NOTICIA ENCONTRADA ===');
  console.log(`Título: ${data.titulo}`);
  console.log(`Palabras: ${contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length}`);

  // Verificar qué transiciones IA quedan
  const transiciones = [
    'asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar',
    'resulta fundamental', 'se espera que', 'continúan las investigaciones',
    'las autoridades reiteraron', 'por su parte', 'en última instancia',
    'a fin de cuentas', 'en el marco de', 'desde esta perspectiva',
    'en el contexto de', 'de igual manera', 'vale la pena mencionar',
    'es importante destacar', 'no cabe duda', 'en conclusión',
    'en resumen', 'se mantienen operativos'
  ];

  const textoLower = contenido.toLowerCase();
  const encontradas = transiciones.filter(t => textoLower.includes(t.toLowerCase()));
  console.log(`\nTransiciones IA encontradas: ${encontradas.length}`);
  if (encontradas.length > 0) {
    console.log(`  ${encontradas.join(', ')}`);
  }

  // Verificar antecedentes
  const tieneAntecedentes = /<h2>\s*(?:Antecedentes|Antecedentes o contexto|Contexto)\s*<\/h2>/i.test(contenido);
  console.log(`Tiene antecedentes: ${tieneAntecedentes ? 'SÍ ❌' : 'NO ✅'}`);

  // Verificar URLs
  const tieneURLs = /https?:\/\//.test(contenido);
  console.log(`Tiene URLs: ${tieneURLs ? 'SÍ ✅' : 'NO ❌'}`);

  // Verificar imagenDestacada
  console.log(`imagenDestacada: ${data.imagenDestacada ? 'true ✅' : 'false ❌'}`);

  // Verificar fechaActualizacion
  console.log(`fechaActualizacion: ${data.fechaActualizacion ? '✅' : '❌'}`);

  // Verificar resumen/meta
  const resumen = data.resumen || '';
  console.log(`Meta length: ${resumen.length} chars`);

  // Verificar slug
  console.log(`Slug: ${data.slug || '(vacío)'}`);

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
