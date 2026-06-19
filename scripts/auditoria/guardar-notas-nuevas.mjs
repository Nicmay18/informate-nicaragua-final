import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { writeFileSync, readFileSync } from 'fs';

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
  const backup = JSON.parse(readFileSync('e:/PROYECTO/informate-nicaragua-final/firestore-current-backup-1781106719360.json', 'utf8'));
  const snap = await db.collection('noticias').get();
  
  const notasNuevas = [];
  
  for (const doc of snap.docs) {
    const id = doc.id;
    const data = doc.data();
    
    if (!backup[id]) {
      // Esta noticia está en Firestore pero NO en el backup del 12 = es nueva
      const nota = {
        id: id,
        titulo: data.titulo || '',
        contenido: data.contenido || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        autor: data.autor || 'Nicaragua Informate',
        fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha,
        fechaActualizacion: data.fechaActualizacion?.toDate ? data.fechaActualizacion.toDate().toISOString() : data.fechaActualizacion,
        slug: data.slug || '',
        imagen: data.imagen || '',
        pieFoto: data.pieFoto || '',
        destacada: !!data.destacada,
        publicado: data.publicado !== false,
        vistas: data.vistas || 0,
      };
      notasNuevas.push(nota);
    }
  }
  
  writeFileSync('e:/PROYECTO/informate-nicaragua-final/notas-nuevas-junio12.json', JSON.stringify(notasNuevas, null, 2));
  
  console.log('=== NOTAS NUEVAS GUARDADAS ===');
  console.log('Total notas nuevas (no en backup del 12):', notasNuevas.length);
  notasNuevas.forEach((n, i) => {
    console.log(`${i+1}. ${n.titulo}`);
    console.log(`   Fecha: ${n.fecha}`);
    console.log(`   Vistas: ${n.vistas}`);
    console.log(`   Contenido: ${n.contenido.length} chars`);
  });
  
  console.log('\n✅ Guardado en: notas-nuevas-junio12.json');
  console.log('Ahora podés restaurar al 11 de junio sin perder estas notas.');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
