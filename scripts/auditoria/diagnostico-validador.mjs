#!/usr/bin/env node
// Diagnóstico exacto de por qué falla el validador

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

// Replicar EXACTAMENTE la lógica del validador
const ADJETIVOS_EMOCIONALES = [
  'tragico', 'terrible', 'impactante', 'conmociono', 'devastador',
  'horrible', 'alarmante', 'desgarrador', 'lamentable', 'dramatico',
  'critico', 'escalofriante', 'espeluznante', 'increible', 'inimaginable',
  'indignante', 'escandaloso', 'vergonzoso', 'aterrador', 'mortifero',
  'sangriento', 'brutal', 'salvaje', 'violento', 'agresivo',
  'tragedia', 'fatal', 'horror', 'impactante', 'desgarrador',
];

const CLICKBAIT_PATTERNS = [
  /no vas a creer/i, /esto cambiara todo/i, /la verdad sobre/i,
  /exclusiva/i, /bomba/i, /escandalo/i, /filtran/i, /se filtra/i,
  /\.{3,}$/, /¡.*!/, /urgente/i, /ultima hora/i, /alerta/i,
  /revelan/i, /destapan/i, /exclusivo/i, /increible/i, /sorprendente/i,
];

const TRANSICIONES_IA = [
  'en conclusion', 'en resumen', 'es importante destacar',
  'vale la pena mencionar', 'no hay que olvidar', 'en el contexto de',
  'desde esta perspectiva', 'en ultima instancia', 'a fin de cuentas',
  'en el marco de', 'resulta fundamental', 'resulta evidente',
  'no cabe duda', 'es indiscutible', 'resulta innegable',
  'en definitiva', 'para concluir', 'como se menciono anteriormente',
  'es relevante senalar', 'no se puede ignorar', 'es crucial', 'es vital',
];

function analizar(data) {
  const textoPlano = (data.contenido || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabraCount = textoPlano.split(/\s+/).filter(p => p.length > 0).length;

  // 1. Thin content
  const thinContent = palabraCount >= 350 ? 'PASS' : 'FAIL';
  console.log(`Thin content: ${thinContent} (${palabraCount} palabras)`);

  // 2. Clickbait
  const tieneClickbait = CLICKBAIT_PATTERNS.some(p => p.test(data.titulo || ''));
  console.log(`Clickbait: ${!tieneClickbait ? 'PASS' : 'FAIL'} (título: "${data.titulo}")`);

  // 3. Valor añadido
  const palabrasUnicas = new Set(textoPlano.toLowerCase().split(/\s+/)).size;
  const ratio = palabrasUnicas / palabraCount;
  console.log(`Valor añadido: ${ratio >= 0.4 ? 'PASS' : 'WARN'} (${(ratio*100).toFixed(1)}% - ${palabrasUnicas} únicas / ${palabraCount} total)`);

  // 4. Revisión editorial
  const contenidoLower = textoPlano.toLowerCase();
  const patronesIA = TRANSICIONES_IA.filter(t => contenidoLower.includes(t.toLowerCase()));
  console.log(`Revisión editorial: ${patronesIA.length === 0 ? 'PASS' : 'FAIL'} (${patronesIA.length} patrones)`);
  if (patronesIA.length > 0) console.log(`  Patrones: ${patronesIA.join(', ')}`);

  // 5. Imagen destacada
  console.log(`Imagen destacada: ${data.imagenDestacada ? 'PASS' : 'FAIL'} (valor: ${data.imagenDestacada})`);

  // 6. Frescura
  console.log(`Frescura: ${data.fechaActualizacion ? 'PASS' : 'WARN'} (fechaActualizacion: ${data.fechaActualizacion ? 'SÍ' : 'NO'})`);

  // 7. SEO Título
  const tituloLen = (data.titulo || '').length;
  console.log(`Título SEO: ${tituloLen >= 50 && tituloLen <= 60 ? 'PASS' : 'WARN'} (${tituloLen} chars)`);

  // 8. Meta description
  const resumenLen = (data.resumen || '').length;
  console.log(`Meta SEO: ${resumenLen >= 150 && resumenLen <= 170 ? 'PASS' : 'WARN'} (${resumenLen} chars)`);

  // 9. Autor
  console.log(`Autor: ${data.autor ? 'PASS' : 'FAIL'} (${data.autor || 'VACÍO'})`);

  // 10. URLs
  const tieneURLs = /https?:\/\//.test(data.contenido || '');
  console.log(`Fuentes URLs: ${tieneURLs ? 'PASS' : 'WARN'}`);
}

async function main() {
  const db = initFirebase();
  const doc = await db.collection('noticias').doc('vDqwQW7VvkSeu8xbi5O3').get();

  if (!doc.exists) {
    console.log('❌ No encontrada');
    process.exit(1);
  }

  console.log('=== DIAGNÓSTICO COMPLETO ===\n');
  analizar(doc.data());
  process.exit(0);
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
