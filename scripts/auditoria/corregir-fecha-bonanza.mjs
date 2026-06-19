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
  try {
    const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    const app = initializeApp({ credential: cert(sa) });
    return getFirestore(app);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();

  // 1. Corregir nota Bonanza
  const docRef = db.collection('noticias').doc('56CAzAZp09D9cXiCCHIS');
  const doc = await docRef.get();
  const data = doc.data();

  let contenido = data.contenido || '';

  // Reemplazar fechas de octubre por junio (según el usuario: evento fue jueves 11, captura viernes 12)
  // La nota dice "15 de octubre" pero debería ser "12 de junio" (fecha de la captura)
  contenido = contenido.replace(/15 de octubre de 2026/g, '12 de junio de 2026');
  contenido = contenido.replace(/14 de octubre de 2026/g, '11 de junio de 2026');
  contenido = contenido.replace(/17 de octubre de 2026/g, '13 de junio de 2026');

  await docRef.update({
    contenido,
    fechaActualizacion: FieldValue.serverTimestamp(),
  });

  console.log('✅ Nota Bonanza corregida:');
  console.log('   15 de octubre → 12 de junio (captura)');
  console.log('   14 de octubre → 11 de junio (asalto)');
  console.log('   17 de octubre → 13 de junio');

  // 2. Buscar otras noticias con fechas futuras (julio-diciembre 2026 cuando estamos en junio)
  const snapshot = await db.collection('noticias').get();
  let fechasRaras = 0;

  snapshot.forEach(d => {
    const contenido = d.data().contenido || '';
    const matches = contenido.match(/\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026/gi);
    if (matches) {
      const mesesFuturos = matches.filter(m => {
        const lower = m.toLowerCase();
        return lower.includes('julio') || lower.includes('agosto') ||
               lower.includes('septiembre') || lower.includes('octubre') ||
               lower.includes('noviembre') || lower.includes('diciembre');
      });
      if (mesesFuturos.length > 0) {
        fechasRaras++;
        console.log(`\n⚠️  [${d.id}] ${(d.data().titulo || '').slice(0, 50)}`);
        console.log(`   Fechas futuras: ${mesesFuturos.join(', ')}`);
      }
    }
  });

  console.log(`\nNotas con fechas futuras detectadas: ${fechasRaras}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
