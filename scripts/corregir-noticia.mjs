import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

function initDb() {
  if (getApps().length > 0) return getFirestore();
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.trim().length > 10) {
    const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(sa) });
    return getFirestore();
  }
  throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 no definida');
}

const db = initDb();
const id = process.argv[2] || 'i9duvDflEon1d6yAhT0W';

const doc = await db.collection('noticias').doc(id).get();
if (!doc.exists) {
  console.log('No encontrado:', id);
  process.exit(1);
}

const d = doc.data();
let contenido = d.contenido || '';

contenido = contenido.replace(
  'habría sido el factor determinante del siniestro.',
  'habría sido el factor determinante del accidente.'
);

contenido = contenido.replace(
  'mayor índice de siniestralidad en el país.',
  'mayor índice de accidentalidad en el país.'
);

contenido = contenido.replace(
  '<h2>Familia devastada por la pérdida</h2>',
  '<h2>Familia afronta la pérdida</h2>'
);

const recursos = `
<h2>Recursos útiles</h2>
<ul>
  <li><strong>Emergencias:</strong> Policía Nacional 118, Bomberos 115, Cruz Roja 128, MINSA Ambulancias 102.</li>
  <li><strong>Conducción segura:</strong> evite manejar con sueño, use casco certificado, respete los límites de velocidad y revise el estado de frenos y luces de su motocicleta.</li>
</ul>`;

contenido = contenido.trimEnd() + '\n' + recursos;

await doc.ref.update({ contenido });
console.log('✅ Noticia corregida:', id);

const revalidateBody = JSON.stringify({ slug: d.slug, category: d.categoria });
const resp = await fetch('https://nicaraguainformate.com/api/revalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: revalidateBody,
});
const text = await resp.text();
console.log('🔄 Revalidación:', text);
