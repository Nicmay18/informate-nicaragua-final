import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

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
  const snap = await db.collection('noticias').get();
  const noticias = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      titulo: data.titulo || '',
      contenido: (data.contenido || '').substring(0, 500),
      fecha: data.fecha?.toDate ? data.fecha.toDate().toISOString() : data.fecha,
    };
  });
  
  // Generar archivo CSV para búsqueda manual
  let csv = 'ID,Titulo,Fecha,Palabras Clave para Google\n';
  for (const n of noticias) {
    // Extraer nombre de persona si existe
    const nombres = n.contenido.match(/[A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/g) || [];
    const nombreVictima = nombres.slice(0, 2).join(' ');
    
    // Extraer lugar
    const lugares = n.contenido.match(/(?:Managua|Jinotega|Estelí|León|Granada|Masaya|Rivas|Chinandega|Madriz|Nueva Segovia|Boaco|Chontales|Río San Juan|Costa Caribe Norte|Costa Caribe Sur)/g) || [];
    const lugar = lugares[0] || '';
    
    // Crear query de búsqueda
    const query = nombreVictima 
      ? `${nombreVictima} ${lugar} accidente` 
      : n.titulo.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/gi, '').substring(0, 60);
    
    csv += `"${n.id}","${n.titulo.replace(/"/g, '""')}","${n.fecha || ''}","${query}"\n`;
  }
  
  writeFileSync('e:/PROYECTO/informate-nicaragua-final/noticias-a-verificar.csv', csv);
  console.log(`✅ Generado: noticias-a-verificar.csv (${noticias.length} noticias)`);
  console.log('Abre el CSV y usa la columna "Palabras Clave para Google" para buscar cada noticia');
  console.log('Si encuentras la noticia original, copia el enlace y el contenido real');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
