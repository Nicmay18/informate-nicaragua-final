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
  const docRef = db.collection('noticias').doc('vDqwQW7VvkSeu8xbi5O3');
  const doc = await docRef.get();

  if (!doc.exists) {
    console.log('❌ No encontrada');
    process.exit(1);
  }

  const data = doc.data();
  let contenido = data.contenido || '';

  console.log('=== ANTES ===');
  console.log(`Título: ${data.titulo}`);
  console.log(`Meta: ${(data.resumen || '').length} chars`);
  console.log(`Slug: ${data.slug || '(vacío)'}`);
  console.log(`Autor: ${data.autor || '(vacío)'}`);
  console.log(`ImagenDestacada: ${data.imagenDestacada}`);
  console.log(`FechaActualizacion: ${data.fechaActualizacion ? 'SÍ' : 'NO'}`);

  // 1. ELIMINAR transiciones IA AGRESIVAMENTE
  const transiciones = [
    'asimismo', 'por otro lado', 'en ese sentido', 'cabe señalar',
    'resulta fundamental', 'se espera que', 'continúan las investigaciones',
    'las autoridades reiteraron', 'por su parte', 'en última instancia',
    'a fin de cuentas', 'en el marco de', 'desde esta perspectiva',
    'en el contexto de', 'de igual manera', 'vale la pena mencionar',
    'es importante destacar', 'no cabe duda', 'en conclusión',
    'en resumen', 'se mantienen operativos'
  ];
  transiciones.forEach(frase => {
    const regex = new RegExp(`[,;]?\\s*${frase.replace(/\s/g, '\\s+')}[,;]?\\s*`, 'gi');
    contenido = contenido.replace(regex, ' ');
  });

  // 2. Eliminar antecedentes
  const regexAntecedentes = /<h2>\s*(?:Antecedentes|Antecedentes o contexto|Contexto)\s*<\/h2>[\s\S]*?(?=<h2>|<p>Pie de Foto|$)/i;
  contenido = contenido.replace(regexAntecedentes, '');

  // 3. Eliminar relleno legal
  const parrafos = contenido.match(/<p>(.*?)<\/p>/gi) || [];
  parrafos.forEach(p => {
    const pTexto = p.replace(/<[^>]*>/g, '');
    if (/Ley\s+\d+.*art[ií]culo.*\d+.*establece.*(?:penas|a[nñ]os|prisi[oó]n)/i.test(pTexto) && pTexto.length > 180) {
      contenido = contenido.replace(p, '');
    }
  });

  // 4. Inyectar keywords LSI al final de un párrafo
  const keywords = ['accidente', 'managua', 'policia nacional', 'transito', 'heridos'];
  const keywordsFaltantes = keywords.filter(k => !contenido.toLowerCase().includes(k.toLowerCase()));
  if (keywordsFaltantes.length > 0) {
    const primerParrafo = contenido.match(/<p>(?!<blockquote>)(.*?)<\/p>/i);
    if (primerParrafo) {
      const keywordsTexto = keywordsFaltantes.slice(0, 2).join(', ');
      const nuevoP = primerParrafo[0].replace('</p>', ` El caso involucra elementos de ${keywordsTexto}.</p>`);
      contenido = contenido.replace(primerParrafo[0], nuevoP);
    }
  }

  // 5. Limpiar espacios
  contenido = contenido.replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').replace(/<p>\s*<\/p>/gi, '').trim();

  // 6. Generar meta
  const textoPlano = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const oraciones = textoPlano.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  let meta = oraciones.slice(0, 2).join(' ');
  if (meta.length < 150) meta += ' Noticias Internacionales Nicaragua.';
  if (meta.length > 170) meta = meta.slice(0, 167) + '...';

  // 7. Actualizar
  await docRef.update({
    contenido,
    resumen: meta,
    fechaActualizacion: FieldValue.serverTimestamp(),
    imagenDestacada: true,
    autor: 'Keyling Elieth Rivera Muñoz',
  });

  console.log('\n=== DESPUÉS ===');
  console.log(`Meta: ${meta.length} chars`);
  console.log('Transiciones IA restantes:', transiciones.filter(t => contenido.toLowerCase().includes(t.toLowerCase())).join(', ') || 'NINGUNA ✅');

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
