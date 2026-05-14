/**
 * Script para actualizar títulos de noticias en Firestore
 * Ejecutar: node scripts/update-titles.mjs
 *
 * Requiere: serviceAccountKey.json en la raíz del proyecto
 * Descargar desde: Firebase Console → Configuración → Cuentas de servicio → Generar clave privada
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer service account
let serviceAccount;
try {
  const raw = readFileSync(join(__dirname, '..', '..', 'serviceAccountKey.json'), 'utf8');
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error('ERROR: No se encontró serviceAccountKey.json');
  console.error('Descarga la clave privada desde Firebase Console → Configuración → Cuentas de servicio → Generar clave privada');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const UPDATES = [
  { slug: 'homicidio-jinotega', titulo: 'Colisión en Jinotega deja víctima fatal; Policía investiga' },
  { slug: 'incendio-mercado-oriental', titulo: 'Incendio afecta tramos de ropa en Mercado Oriental' },
  { slug: 'shakira-brasil', titulo: 'Shakira convoca a dos millones de fans en Brasil' },
  { slug: 'berman-espinoza', titulo: 'Berman Espinoza alcanza récord de 1,450 ponches' },
  { slug: 'muertes-accidentes-abril', titulo: '70 fallecimientos por accidentes de tránsito en abril' },
];

async function main() {
  for (const u of UPDATES) {
    try {
      const snap = await db.collection('noticias').where('slug', '==', u.slug).limit(1).get();
      if (snap.empty) {
        console.log(`⚠️  No encontrado: ${u.slug}`);
        continue;
      }
      await snap.docs[0].ref.update({ titulo: u.titulo });
      console.log(`✅ Actualizado: ${u.slug} → "${u.titulo}"`);
    } catch (err) {
      console.error(`❌ Error en ${u.slug}:`, err.message);
    }
  }
  console.log('\n🎉 Listo. Espera 1 minuto y recarga el sitio en incógnito.');
  process.exit(0);
}

main();
