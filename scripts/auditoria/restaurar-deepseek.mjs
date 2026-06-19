import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

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

async function main() {
  const deepseek = JSON.parse(readFileSync('e:/PROYECTO/informate-nicaragua-final/scripts/output/deepseek-resultados.json', 'utf8'));
  const resultados = Array.isArray(deepseek) ? deepseek : (deepseek.resultados || []);
  
  console.log('Noticias en DeepSeek resultados:', resultados.length);
  
  const snap = await db.collection('noticias').get();
  let restauradas = 0;
  let sinContenidoDeepSeek = 0;
  
  for (const doc of snap.docs) {
    const docId = doc.id;
    const data = doc.data();
    
    // Buscar en DeepSeek por ID
    const ds = resultados.find(r => r.id === docId);
    
    if (!ds || !(ds.contenidoNuevo || ds.contenido)) {
      sinContenidoDeepSeek++;
      continue;
    }
    
    const contenido = ds.contenidoNuevo || ds.contenido;
    
    // Solo actualizar si está vacío o tiene placeholder
    const actual = (data.contenido || '').trim();
    if (actual.length > 100 && !actual.includes('Contenido ORO genérico') && !actual.includes('Lead de 40 palabras')) {
      // Ya tiene contenido real, saltar
      continue;
    }
    
    await db.collection('noticias').doc(docId).update({
      titulo: ds.titulo || data.titulo,
      contenido: contenido,
      resumen: ds.resumen || data.resumen || '',
      reescritaPorDeepSeek: true
    });
    
    console.log(`✅ [${docId}] Restaurado: ${(ds.titulo || data.titulo).substring(0, 50)}...`);
    restauradas++;
  }
  
  console.log('\n=== RESUMEN ===');
  console.log(`Total noticias en Firestore: ${snap.docs.length}`);
  console.log(`Restauradas desde DeepSeek: ${restauradas}`);
  console.log(`Sin contenido en DeepSeek: ${sinContenidoDeepSeek}`);
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
