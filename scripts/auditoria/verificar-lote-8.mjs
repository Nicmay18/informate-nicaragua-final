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

function validarORO(contenido) {
  const texto = contenido || '';
  const textoSinHtml = texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoSinHtml.split(/\s+/).filter(w => w.length > 0).length;
  const h2s = (texto.match(/<h2>/gi) || []).length;
  const strongs = (texto.match(/<strong>/gi) || []).length;
  const blockquotes = (texto.match(/<blockquote>/gi) || []).length;
  const parrafos = texto.match(/<p>(.*?)<\/p>/g) || [];
  let lead = 0;
  for (const p of parrafos) {
    const pt = p.replace(/<[^>]*>/g, '').trim();
    const c = pt.split(/\s+/).filter(w => w.length > 0).length;
    if (c > 3) { lead = c; break; }
  }
  return { palabras, h2s, strongs, blockquotes, lead };
}

async function main() {
  const db = initFirebase();
  const snapshot = await db.collection('noticias').get();

  const titulosBuscar = [
    'Fuerte oleaje por tormenta Cristina',
    'Depresión tropical Three-E',
    'Ocho personas fallecen en accidentes viales',
    'El tres leches nicaragüense',
    'Nicaragua conquista medalla de oro',
    'Depósitos del público en el sistema financiero'
  ];

  console.log('=== VERIFICACIÓN NOTICIAS DEL ÚLTIMO LOTE ===\n');

  for (const buscar of titulosBuscar) {
    const docs = snapshot.docs.filter(d => {
      const t = (d.data().titulo || '').toLowerCase();
      return t.includes(buscar.toLowerCase().split(' ').slice(0, 3).join(' '));
    });

    if (docs.length === 0) {
      console.log(`❌ NO ENCONTRADA: ${buscar}`);
      continue;
    }

    const doc = docs[0];
    const data = doc.data();
    const contenido = data.contenido || '';
    const v = validarORO(contenido);

    const tieneAntecedentes = /<h2>\s*(?:Antecedentes|Antecedentes o contexto|Contexto)\s*<\/h2>/i.test(contenido);
    const tieneFechasFuturas = /\d{1,2}\s+de\s+(julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+2026/i.test(contenido);
    const tieneFrasesIA = /asimismo|por otro lado|en ese sentido|cabe señalar|resulta fundamental|se espera que|continúan las investigaciones/i.test(contenido);
    const tieneRellenoLegal = /Ley\s+\d+.*art[ií]culo.*\d+.*establece.*(?:penas|a[nñ]os)/i.test(contenido);

    const esORO = v.palabras >= 500 && v.lead >= 35 && v.h2s >= 1 && v.strongs >= 1 && v.blockquotes >= 1;
    const problemas = [];
    if (tieneAntecedentes) problemas.push('TIENE antecedentes/contexto');
    if (tieneFechasFuturas) problemas.push('TIENE fechas futuras 2026');
    if (tieneFrasesIA) problemas.push('TIENE frases IA');
    if (tieneRellenoLegal) problemas.push('TIENE relleno legal');
    if (v.palabras < 500) problemas.push(`Muy corta (${v.palabras} pal)`);
    if (v.lead < 35) problemas.push(`Lead corto (${v.lead} pal)`);
    if (v.h2s < 1) problemas.push('Sin H2');
    if (v.strongs < 1) problemas.push('Sin STRONG');
    if (v.blockquotes < 1) problemas.push('Sin BLOCKQUOTE');

    console.log(`${esORO && problemas.length === 0 ? '🥇' : '⚠️'} ${(data.titulo || '').slice(0, 55)}`);
    console.log(`   ${v.palabras} pal | lead:${v.lead} | h2:${v.h2s} | strong:${v.strongs} | bq:${v.blockquotes}`);
    if (problemas.length > 0) {
      problemas.forEach(p => console.log(`   ❌ ${p}`));
    } else {
      console.log(`   ✅ Limpia y ORO`);
    }
    console.log();
  }

  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
