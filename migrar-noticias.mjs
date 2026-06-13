import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: 'e:/PROYECTO/informate-nicaragua-final/.env.local' });

function initDb(databaseId) {
  const name = databaseId || '[DEFAULT]';
  const existing = getApps().find(a => a.name === name);
  if (existing) return getFirestore(existing);
  
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  
  const config2 = { projectId };
  if (databaseId && databaseId !== '(default)') {
    config2.databaseId = databaseId;
  }
  
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    config2.credential = cert(sa);
  } else if (privateKeyRaw && projectId && clientEmail) {
    const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
    config2.credential = cert({ projectId, clientEmail, privateKey });
  }
  
  const app = initializeApp(config2, name);
  return getFirestore(app);
}

async function main() {
  console.log('=== MIGRANDO NOTICIAS ===');
  console.log('Origen: backup-junio-10-2026');
  console.log('Destino: (default)\n');
  
  try {
    const dbOrigen = initDb('backup-junio-10-2026');
    const dbDestino = initDb('(default)');
    
    // Leer noticias del backup del 10
    const snapOrigen = await dbOrigen.collection('noticias').get();
    console.log(`Noticias en backup del 10: ${snapOrigen.docs.length}`);
    
    if (snapOrigen.docs.length === 0) {
      console.log('❌ No hay noticias en la base restaurada');
      process.exit(1);
    }
    
    // Borrar noticias actuales en (default)
    console.log('Borrando noticias actuales en (default)...');
    const snapDestino = await dbDestino.collection('noticias').get();
    const batch = dbDestino.batch();
    let borradas = 0;
    for (const doc of snapDestino.docs) {
      batch.delete(doc.ref);
      borradas++;
      if (borradas % 500 === 0) {
        await batch.commit();
        console.log(`  Borradas ${borradas}...`);
      }
    }
    await batch.commit();
    console.log(`✅ Borradas ${borradas} noticias de (default)`);
    
    // Copiar noticias del backup
    console.log('\nCopiando noticias desde backup...');
    let copiadas = 0;
    const batch2 = dbDestino.batch();
    
    for (const doc of snapOrigen.docs) {
      const data = doc.data();
      const newRef = dbDestino.collection('noticias').doc(doc.id);
      batch2.set(newRef, data);
      copiadas++;
      
      if (copiadas % 500 === 0) {
        await batch2.commit();
        console.log(`  Copiadas ${copiadas}...`);
      }
    }
    await batch2.commit();
    console.log(`✅ Copiadas ${copiadas} noticias a (default)`);
    
    console.log('\n=== MIGRACIÓN COMPLETA ===');
    console.log('Ahora ejecutá: node reinsertar-notas-nuevas.mjs');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
