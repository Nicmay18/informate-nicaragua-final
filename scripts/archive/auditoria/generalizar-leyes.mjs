#!/usr/bin/env node
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

function initFirebase() {
  if (getApps().length > 0) return getFirestore(getApps()[0]);
  const keyPath = join(rootDir, 'scripts', 'firebase-admin-key.json');
  try { const sa = JSON.parse(readFileSync(keyPath, 'utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); } catch {}
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64 && b64.length > 10) { const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); const app = initializeApp({ credential: cert(sa) }); return getFirestore(app); }
  const projectId = process.env.FIREBASE_PROJECT_ID, clientEmail = process.env.FIREBASE_CLIENT_EMAIL, privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) throw new Error('Faltan credenciales');
  const privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return getFirestore(app);
}

const REEMPLAZOS_LEYES = [
  // Leyes genéricas sin número → normativa vigente
  { regex: /\bseg[úu]n\s+la\s+ley\s+vigente\b/gi, reemplazo: 'según la normativa vigente' },
  { regex: /\bseg[úu]n\s+la\s+legislaci[oó]n\s+vigente\b/gi, reemplazo: 'según la normativa vigente' },
  { regex: /\bseg[úu]n\s+la\s+normativa\s+aplicable\b/gi, reemplazo: 'según la normativa vigente' },
  { regex: /\bel\s+ordenamiento\s+jur[ií]dico\s+vigente\b/gi, reemplazo: 'la normativa vigente' },
  { regex: /\bel\s+marco\s+legal\s+actual\b/gi, reemplazo: 'la normativa vigente' },
  // Códigos genéricos sin referencia específica
  { regex: /\bel\s+C[oó]digo\s+Penal\s+establece\s+que[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bla\s+Ley\s+de\s+Tr[áa]nsito\s+establece\s+que[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bla\s+Ley\s+de\s+Contrataci[oó]n\s+Administrativa\s+establece[^.]{0,200}\./gi, reemplazo: '' },
  // Artículos genéricos
  { regex: /\bel\s+art[ií]culo\s+\d+\s+del\s+C[oó]digo\s+Penal[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\bel\s+art[ií]culo\s+\d+\s+de\s+la\s+Ley[^.]{0,200}\./gi, reemplazo: '' },
  // Frases de relleno legal
  { regex: /\b(?:se\s+espera\s+que|se\s+prev[eé]\s+que)\s+la\s+justicia\s+act[uú]e[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\blos\s+familiares\s+esperan\s+que\s+la\s+justicia\s+act[uú]e[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\b(?:la\s+comunidad|los\s+familiares)\s+espera\s+(?:una\s+)?(?:respuesta|r[eé]plica|acci[oó]n)\s+de\s+las\s+autoridades[^.]{0,200}\./gi, reemplazo: '' },
  // Ley 431 específica (comúnmente inventada)
  { regex: /\bla\s+Ley\s+431\b/gi, reemplazo: 'la normativa vigente' },
  { regex: /\bel\s+art[ií]culo\s+148\s+de\s+la\s+Ley\s+431/gi, reemplazo: 'la normativa vigente' },
  { regex: /\bel\s+art[ií]culo\s+148\b/gi, reemplazo: 'la normativa' },
  // Decretos genéricos
  { regex: /\bseg[úu]n\s+el\s+Decreto\s+\d+[^.]{0,100}\./gi, reemplazo: '' },
  { regex: /\bde\s+acuerdo\s+con\s+el\s+Decreto\s+\d+[^.]{0,100}\./gi, reemplazo: '' },
  // Frases de conclusiones genéricas
  { regex: /\b(?:la\s+justicia|el\s+Ministerio\s+P[úu]blico)\s+(?:deber[áa]|tiene\s+que)\s+(?:investigar|determinar|establecer)[^.]{0,200}\./gi, reemplazo: '' },
  { regex: /\b(?:se\s+espera|es\s+de\s+esperar)\s+que\s+(?:las\s+autoridades|la\s+justicia)[^.]{0,200}\./gi, reemplazo: '' },
  // "según la normativa" sin fuente → quitar si es relleno
  { regex: /[,;]?\s*seg[úu]n\s+la\s+normativa\s+vigente[,;:.]?\s*/gi, reemplazo: '' },
  { regex: /[,;]?\s*de\s+acuerdo\s+a\s+la\s+normativa[,;:.]?\s*/gi, reemplazo: '' },
];

async function main() {
  const db = initFirebase();
  const snap = await db.collection('noticias').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  let modificadas = 0;
  let totalLeyes = 0;
  const detalles = [];

  for (const doc of docs) {
    let contenido = doc.contenido || '';
    let cambios = 0;

    for (const { regex, reemplazo } of REEMPLAZOS_LEYES) {
      const matches = contenido.match(regex);
      if (matches) {
        contenido = contenido.replace(regex, reemplazo);
        cambios += matches.length;
      }
    }

    // Limpiar espacios
    contenido = contenido.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
    contenido = contenido.replace(/<p>\s*<\/p>/gi, '').replace(/<p>&nbsp;<\/p>/gi, '');

    if (cambios > 0) {
      await db.collection('noticias').doc(doc.id).update({
        contenido,
        leyesGeneralizadas: true,
        fechaLeyesGeneralizadas: new Date().toISOString(),
      });
      modificadas++;
      totalLeyes += cambios;
      detalles.push({ titulo: doc.titulo, cambios });
    }
  }

  console.log(`\n⚖️ GENERALIZACIÓN DE LEYES`);
  console.log(`═══════════════════════════════════════════════════`);
  console.log(`Noticias modificadas: ${modificadas}`);
  console.log(`Total referencias generalizadas: ${totalLeyes}`);
  console.log(`═══════════════════════════════════════════════════`);

  if (detalles.length > 0) {
    console.log(`\nPrimeras 20:`);
    detalles.slice(0, 20).forEach((d, i) => {
      console.log(`${i+1}. ${d.titulo} (${d.cambios} leyes)`);
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
