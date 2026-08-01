import { promises as fs } from 'fs';
import { config } from 'dotenv';
config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

async function cargarEnvDesdeServiceAccount() {
  const sa = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(sa)).toString('base64');
}

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const db = getAdminDb();

  const fragmentos = [
    'buscan a hombre acusado',
    'hallan sin vida a profesor',
    'españa regulariza',
    'nicaragua en santo domingo 2026',
  ];

  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(300).get();

  for (const d of snap.docs) {
    const data = d.data();
    const titulo: string = data.titulo || '';
    const tLower = titulo.toLowerCase();
    for (const f of fragmentos) {
      if (tLower.includes(f)) {
        console.log(`\nslug: ${data.slug || d.id}`);
        console.log(`titulo: "${titulo}"`);
        console.log(`caracteres: ${titulo.length}`);
        break;
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
