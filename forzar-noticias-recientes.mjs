/**
 * forzar-noticias-recientes.mjs
 * Busca las noticias que el usuario menciono y les asigna la fecha correcta
 * para que aparezcan al principio del feed.
 */
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';
config({ path: './.env.local' });

function initDb() {
  if (getApps().length > 0) return getFirestore(getApp());
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (b64?.trim().length > 10) {
    initializeApp({ credential: cert(JSON.parse(Buffer.from(b64,'base64').toString())) });
    return getFirestore();
  }
  const pKey = pk.trim().replace(/^["']|["']$/g,'').replace(/\\n/g,'\n');
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: pKey }) });
  return getFirestore();
}

const NOTICIAS_A_REPARAR = [
  { titulo: 'Nicaraguense fallece en accidente laboral en Wisconsin', fecha: '2026-06-13T23:00:00Z' },
  { titulo: 'De Arjona a Aventura: conciertos anunciados para Nicaragua', fecha: '2026-06-10T17:01:00Z' },
  { titulo: 'Masaya: Análisis del fatal accidente vial en Villa Bosco', fecha: '2026-06-15T11:21:00Z' },
  { titulo: 'Comerciante fallece tras altercado en terminal de Rosita', fecha: '2026-06-13T23:08:00Z' },
  { titulo: 'Guarda de seguridad fallece en complejo fabril de Managua', fecha: '2026-06-13T23:45:00Z' },
  { titulo: 'Amanda Miguel ofrece concierto internacional en Managua', fecha: '2026-06-14T00:51:00Z' },
  { titulo: 'Dos fallecidos en accidentes de motocicleta en Nicaragua', fecha: '2026-06-13T23:29:00Z' },
  { titulo: 'Juzgado de Masaya dicta prision preventiva por caso penal', fecha: '2026-06-13T22:39:00Z' }
];

async function main() {
  const db = initDb();
  console.log('🚀 REPARANDO POSICIONAMIENTO DE NOTICIAS RECIENTES\n');
  
  for (const n of NOTICIAS_A_REPARAR) {
    // Buscar por aproximación de título
    const snap = await db.collection('noticias')
      .where('titulo', '>=', n.titulo.substring(0, 20))
      .where('titulo', '<=', n.titulo.substring(0, 20) + '\uf8ff')
      .get();
    
    if (snap.empty) {
      console.log(`❌ No encontrada: ${n.titulo}`);
      continue;
    }

    for (const doc of snap.docs) {
      const d = doc.data();
      const nuevaFecha = new Date(n.fecha);
      
      await db.collection('noticias').doc(doc.id).update({
        fecha: Timestamp.fromDate(nuevaFecha),
        fechaActualizacion: Timestamp.fromDate(new Date()),
        publicado: true
      });
      
      console.log(`✅ ACTUALIZADA: ${d.titulo.substring(0, 50)}...`);
      console.log(`   Nueva fecha: ${nuevaFecha.toISOString()}\n`);
    }
  }
  
  console.log('Done.');
  process.exit(0);
}

main().catch(console.error);
