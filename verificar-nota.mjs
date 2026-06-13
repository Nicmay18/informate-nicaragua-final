#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(__dirname, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  const titulosBuscar = [
    'Nicaragüense fallece en accidente laboral en Wisconsin',
    'Policía captura a sospechosos de asalto en Bonanza',
    'El pueblo Rama inicia el ciclo tradicional de Kartuk Tukan',
    'Prisión preventiva para acusado de feminicidio en Masaya',
    'Tatiana Guzmán debuta en el VAR',
    'Dos árbitros nicaragüenses representarán',
    'España Francia y Argentina llegan como favoritas'
  ];

  for (const tituloBuscar of titulosBuscar) {
    const palabrasBuscar = tituloBuscar.toLowerCase().split(' ').filter(w => w.length > 3);
    const docs = snapshot.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return palabrasBuscar.some(p => t.includes(p));
    }).sort((a, b) => {
      const ta = (a.data().titulo || '').toLowerCase();
      const tb = (b.data().titulo || '').toLowerCase();
      const ca = palabrasBuscar.filter(p => ta.includes(p)).length;
      const cb = palabrasBuscar.filter(p => tb.includes(p)).length;
      return cb - ca;
    });

    if (docs.length > 0) {
      const data = docs[0].data();
      const contenido = data.contenido || '';

      // Buscar secciones
      const h2s = [...contenido.matchAll(/<h2>(.*?)<\/h2>/gi)].map(m => m[1]);
      const tieneAntecedentes = /antecedentes|contexto/i.test(contenido);

      console.log(`\n=== ${data.titulo} ===`);
      console.log(`H2s: ${h2s.join(' | ')}`);
      console.log(`Tiene antecedentes: ${tieneAntecedentes}`);

      // Mostrar párrafos que contienen "Antecedentes"
      const parrafos = contenido.match(/<p>(.*?)<\/p>/gi) || [];
      parrafos.forEach((p, i) => {
        const pTexto = p.replace(/<[^>]*>/g, '');
        if (/antecedente|contexto|Ley \d+|estad[ií]stica|porcentaje|presupuesto|marco legal/i.test(pTexto)) {
          console.log(`  Párrafo ${i}: ${pTexto.slice(0, 100)}...`);
        }
      });
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
