import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
  const notas = JSON.parse(readFileSync('e:/PROYECTO/informate-nicaragua-final/notas-nuevas-junio12.json', 'utf8'));
  
  console.log('=== REINSERTANDO NOTAS NUEVAS ===\n');
  
  for (const nota of notas) {
    try {
      const docRef = db.collection('noticias').doc(nota.id);
      
      // Mantener fecha original del 12 de junio
      const fecha = new Date(nota.fecha);
      const fechaActualizacion = nota.fechaActualizacion ? new Date(nota.fechaActualizacion) : fecha;
      
      await docRef.set({
        titulo: nota.titulo,
        contenido: nota.contenido,
        resumen: nota.resumen,
        categoria: nota.categoria,
        autor: nota.autor,
        fecha: Timestamp.fromDate(fecha),
        fechaActualizacion: Timestamp.fromDate(fechaActualizacion),
        slug: nota.slug,
        imagen: nota.imagen,
        pieFoto: nota.pieFoto,
        destacada: nota.destacada,
        publicado: nota.publicado,
        vistas: nota.vistas || 0,
      });
      
      console.log(`✅ [${nota.id}] Reinsertada: ${nota.titulo.substring(0, 60)}`);
      console.log(`   Fecha preservada: ${nota.fecha}`);
      console.log(`   Vistas preservadas: ${nota.vistas}`);
    } catch (e) {
      console.error(`❌ Error con ${nota.id}:`, e.message);
    }
  }
  
  console.log('\n=== RESUMEN ===');
  console.log(`Total notas reinsertadas: ${notas.length}`);
  console.log('Fechas y vistas preservadas como estaban el 12 de junio.');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
