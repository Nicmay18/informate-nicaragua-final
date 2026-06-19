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

const PROBLEMAS = {
  fechasFuturas: /\b\d{1,2}\s+de\s+(julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026\b/gi,
  placasGenericas: /\bplacas?\s+(?:456|M\s*\d{1,3}|desconocidas|no identificadas)\b/gi,
  frasesIA: /\b(asimismo|por otro lado|en ese sentido|cabe señalar|resulta fundamental|se espera que|contin[uú]an las investigaciones|las autoridades reiteraron|por su parte|en [uú]ltima instancia|a fin de cuentas|en el marco de|desde esta perspectiva|en el contexto de|de igual manera|vale la pena mencionar|es importante destacar|no cabe duda|en conclusi[oó]n|en resumen|se mantienen operativos|a fin de cuentas)\b/gi,
  cifrasGenericas: /\b\d{3,}\s*(?:personas|habitantes|ciudadanos|afectados|damnificados|involucrados)\b.*\bsin\s+especificar\b/gi,
  citasDudosas: /"[^"]{10,80}"[^"]*\binformaron\s+fuentes?\s+(?:cercanas|an[oó]nimas|no identificadas)/gi,
  datosInventados: /seg[uú]n\s+(?:estudios|expertos|analistas)\s+ consulted from/,
};

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  let total = 0;
  let conProblemas = 0;
  const problemas = [];

  snapshot.forEach(doc => {
    total++;
    const data = doc.data();
    const contenido = data.contenido || '';
    const titulo = data.titulo || '';
    const texto = contenido + ' ' + titulo;
    const notaProblemas = [];

    for (const [tipo, regex] of Object.entries(PROBLEMAS)) {
      const matches = texto.match(regex);
      if (matches) {
        notaProblemas.push({ tipo, matches: matches.length, ejemplos: matches.slice(0, 2).join(' | ') });
      }
    }

    if (notaProblemas.length > 0) {
      conProblemas++;
      problemas.push({ titulo: titulo.slice(0, 60), id: doc.id, problemas: notaProblemas });
    }
  });

  console.log('=== AUDITORÍA DE BASURA ===\n');
  console.log(`Total noticias: ${total}`);
  console.log(`Con problemas: ${conProblemas}`);
  console.log(`Limpias: ${total - conProblemas}\n`);

  if (problemas.length === 0) {
    console.log('✅ NO SE ENCONTRÓ BASURA en ninguna noticia.');
    console.log('Las noticias están limpias de:');
    console.log('  • Fechas futuras 2026');
    console.log('  • Placas genéricas');
    console.log('  • Frases IA');
    console.log('  • Cifras genéricas');
    console.log('  • Citas dudosas');
  } else {
    console.log(`❌ ${problemas.length} NOTICIAS CON PROBLEMAS:\n`);
    problemas.forEach(p => {
      console.log(`[${p.titulo}]`);
      p.problemas.forEach(pr => {
        console.log(`  ${pr.tipo}: ${pr.ejemplos}`);
      });
    });
  }

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
