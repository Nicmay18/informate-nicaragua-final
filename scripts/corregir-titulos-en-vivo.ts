import { promises as fs } from 'fs';
import { config } from 'dotenv';
config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

interface Correccion {
  buscar: (t: string) => boolean;
  nuevo: string | ((t: string) => string);
  descripcion: string;
}

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

  const reglas: Correccion[] = [
    {
      buscar: (t) => t.toLowerCase().includes('soldador de casa blanca'),
      nuevo: 'Soldador de Casa Blanca sufrió descarga eléctrica durante trabajo',
      descripcion: 'Completar titulo truncado (tr -> trabajo)',
    },
    {
      buscar: (t) => t.toLowerCase().includes('buscan a hombre acusado de herir de bala'),
      nuevo: 'Buscan a hombre acusado de herir de bala a niña en Rivas',
      descripcion: 'Quitar - M',
    },
    {
      buscar: (t) => t.toLowerCase().includes('hallan sin vida a profesor desaparecido'),
      nuevo: 'Hallan sin vida a profesor desaparecido en cementerio de Boaco',
      descripcion: 'Poner Boaco',
    },
    {
      buscar: (t) => t.toLowerCase().includes('españa regulariza a más de un millón de extranjeros'),
      nuevo: (t) => t.replace(/\s*[-–—]\s*Manag\s*$/i, '').trim(),
      descripcion: 'Quitar - Manag',
    },
    {
      buscar: (t) =>
        t.toLowerCase().includes('nicaragua en santo domingo 2026') && t.toLowerCase().includes('retos'),
      nuevo: (t) => {
        if (t.endsWith(' - Fe')) return t;
        const base = t.replace(/\s*[.–—-]\s*$/, '').trim();
        return `${base} - Fe`;
      },
      descripcion: 'Agregar Fe al final',
    },
  ];

  const snap = await db.collection('noticias').orderBy('fecha', 'desc').limit(300).get();
  const actualizados: { slug: string; antes: string; despues: string }[] = [];

  for (const d of snap.docs) {
    const data = d.data();
    const titulo: string = data.titulo || '';
    for (const regla of reglas) {
      if (regla.buscar(titulo)) {
        const nuevo: string = typeof regla.nuevo === 'function' ? regla.nuevo(titulo) : regla.nuevo;
        if (nuevo !== titulo) {
          await d.ref.update({ titulo: nuevo });
          actualizados.push({ slug: data.slug || d.id, antes: titulo, despues: nuevo });
        } else {
          console.log(`Sin cambios (${regla.descripcion}): ${data.slug || d.id}`);
        }
        break;
      }
    }
  }

  console.log(`\nTotal actualizados: ${actualizados.length}`);
  for (const a of actualizados) {
    console.log(`- ${a.slug}`);
    console.log(`  ANTES: ${a.antes}`);
    console.log(`  DESPUÉS: ${a.despues}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
