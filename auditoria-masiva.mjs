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
  const snap = await db.collection('noticias').where('estado', '==', 'publicado').get();
  const docs = [];
  snap.forEach(d => docs.push({ id: d.id, ...d.data() }));

  const leyes = ['ley 431', 'ley 618', 'ley 423', 'ley 779', 'ley 531', 'código penal', 'artículo 78', 'artículo 148', 'decreto'];
  const basura = ['estadísticas', 'indicadores', 'multas', 'sanciones', 'obligatoriedad', 'normativa', 'marco jurídico', 'recomendaciones técnicas', 'análisis normativo', 'regulaciones', 'prevención de riesgos', 'seguridad ocupacional'];
  const transicionesIA = ['en conclusión', 'en resumen', 'es importante destacar', 'vale la pena mencionar', 'es vital', 'resulta fundamental', 'es indiscutible', 'no cabe duda', 'resulta evidente', 'resulta innegable'];
  const fechasFuturas = /2026|2027|2028/;

  const categorias = {};
  const problemas = [];
  const limpias = [];

  for (const n of docs) {
    const c = (n.contenido || '').toLowerCase();
    const issues = [];

    if (fechasFuturas.test(n.contenido || '')) issues.push('FECHA_FUTURA');
    for (const ley of leyes) { if (c.includes(ley)) issues.push(ley.toUpperCase().replace(/\s+/g, '_')); }
    for (const b of basura) { if (c.includes(b)) issues.push(b.toUpperCase().replace(/\s+/g, '_')); }
    for (const t of transicionesIA) { if (c.includes(t)) issues.push('TRANSICION_IA'); }
    if (!n.autor || n.autor === '') issues.push('SIN_AUTOR');

    const cat = n.categoria || 'Sin categoría';
    if (!categorias[cat]) categorias[cat] = { total: 0, problemas: 0, limpias: 0 };
    categorias[cat].total++;

    if (issues.length > 0) {
      problemas.push({
        id: n.id,
        titulo: n.titulo || '(sin título)',
        categoria: cat,
        slug: n.slug || '',
        issues: [...new Set(issues)].join(', ')
      });
      categorias[cat].problemas++;
    } else {
      limpias.push({
        id: n.id,
        titulo: n.titulo || '(sin título)',
        categoria: cat,
        slug: n.slug || ''
      });
      categorias[cat].limpias++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`AUDITORÍA FORENSE MASIVA — ${docs.length} NOTICIAS PUBLICADAS`);
  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log(`\nRESUMEN POR CATEGORÍA:`);
  for (const cat in categorias) {
    const c = categorias[cat];
    console.log(`  ${cat}: ${c.total} total | 🔴 ${c.problemas} con basura | ✅ ${c.limpias} limpias`);
  }
  console.log(`\n───────────────────────────────────────────────────────────────`);
  console.log(`TOTAL: ${docs.length} noticias`);
  console.log(`🔴 CON BASURA: ${problemas.length}`);
  console.log(`✅ LIMPIAS: ${limpias.length}`);
  console.log(`───────────────────────────────────────────────────────────────`);

  if (problemas.length > 0) {
    console.log(`\n=== PRIMERAS 30 NOTICIAS CON BASURA (para procesar) ===\n`);
    problemas.slice(0, 30).forEach((p, i) => {
      console.log(`${i+1}. ${p.titulo}`);
      console.log(`   Categoría: ${p.categoria}`);
      console.log(`   Problemas: ${p.issues}`);
      console.log(`   ID: ${p.id}`);
      console.log('');
    });

    if (problemas.length > 30) {
      console.log(`... y ${problemas.length - 30} más con basura.`);
    }
  }

  process.exit(0);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
