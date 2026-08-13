/**
 * FORENSIC CURRENT INVENTORY — Read-only.
 * Resuelve la discrepancia 281 vs 283 y produce FORENSIC_CURRENT_INVENTORY.{json,csv}.
 * NO escribe a Firestore. NO modifica nada.
 */
const fs = require('fs');
const path = require('path');

// Load .env.local
try {
  const e = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(e)) {
    for (const l of fs.readFileSync(e, 'utf8').split('\n')) {
      const l2 = l.replace(/\r$/, '');
      const m = l2.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      }
    }
  }
} catch {}

const admin = require('firebase-admin');
let sa;
const saPath = 'g:\\RESPALDO\\informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
try { sa = JSON.parse(fs.readFileSync(saPath, 'utf8')); } catch {
  let pk = process.env.FIREBASE_PRIVATE_KEY;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
  } else if (pk) {
    sa = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'informate-instant-nicaragua',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: pk,
    };
  } else {
    console.error('FALTA KEY');
    process.exit(1);
  }
}
if (sa.privateKey && sa.privateKey.includes('\\n')) sa.privateKey = sa.privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function stripHtml(h) { return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cw(t) { return t.split(/\s+/).filter(Boolean).length; }
function toDate(v) {
  if (!v) return null;
  if (v.toDate && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v._seconds) return new Date(v._seconds * 1000).toISOString();
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  return null;
}

async function main() {
  console.log('=== FORENSIC CURRENT INVENTORY (read-only) ===\n');
  const snap = await db.collection('noticias').get();
  console.log('Total docs en "noticias":', snap.size);

  const records = [];
  const counts = {
    total: snap.size,
    conMeni: 0,
    sinMeni: 0,
    aprobados: 0,
    rechazados: 0,
    publicados: 0,
    noPublicados: 0,
    archived: 0,
    scoreFromCalidad: 0,
    sinProvenance: 0,
    sinPerfil: 0,
    sinCategoria: 0,
    sinResumen: 0,
    sinContenido: 0,
    resumenIncoherente: 0,
  };

  for (const doc of snap.docs) {
    const d = doc.data();
    const id = doc.id;
    const contenido = typeof d.contenido === 'string' ? d.contenido : String(d.contenido || '');
    const textoPlano = stripHtml(contenido);
    const palabras = cw(textoPlano);
    const scoreMeni = d.scoreMeni ?? null;
    const scoreCalidad = d.scoreCalidad ?? null;
    const aprobadoMeni = d.aprobadoMeni ?? null;
    const perfil = d.editorialTier ?? d.perfil ?? d.profile ?? d.profile_used ?? null;
    const categoria = d.categoria ?? null;
    const resumen = d.resumen ?? null;
    const titulo = d.titulo ?? null;
    const publicado = d.publicado ?? false;
    const archived = d.archived ?? d.estado === 'archivado' ?? false;
    const provenance = d.meniProvenance ?? d.provenance ?? d.meniExecuted ?? null;

    if (scoreMeni !== null) counts.conMeni++; else counts.sinMeni++;
    if (aprobadoMeni === true) counts.aprobados++;
    if (aprobadoMeni === false) counts.rechazados++;
    if (publicado) counts.publicados++; else counts.noPublicados++;
    if (archived) counts.archived++;
    if (scoreMeni !== null && scoreMeni === scoreCalidad) counts.scoreFromCalidad++;
    if (!provenance) counts.sinProvenance++;
    if (!perfil) counts.sinPerfil++;
    if (!categoria) counts.sinCategoria++;
    if (!resumen) counts.sinResumen++;
    if (!textoPlano) counts.sinContenido++;

    // Resumen incoherente: comparte <3 palabras significativas con el contenido
    let resumenIncoherente = false;
    if (resumen && titulo && textoPlano) {
      const resumenWords = new Set(stripHtml(resumen).toLowerCase().split(/\s+/).filter(w => w.length > 4));
      const contenidoWords = new Set(textoPlano.toLowerCase().split(/\s+/).filter(w => w.length > 4));
      let comunes = 0;
      for (const w of resumenWords) if (contenidoWords.has(w)) comunes++;
      if (resumenWords.size > 4 && comunes < 2) resumenIncoherente = true;
    }
    if (resumenIncoherente) counts.resumenIncoherente++;

    records.push({
      id,
      titulo,
      resumen,
      contenido,
      contenidoPalabras: palabras,
      fecha: toDate(d.fecha),
      autor: d.autor ?? null,
      categoria,
      perfil,
      tags: d.tags ?? [],
      scoreMeni,
      scoreCalidad,
      aprobadoMeni,
      diagnosticoMeni: d.diagnosticoMeni ?? null,
      nivel: d.nivel ?? null,
      nivelScore: d.nivelScore ?? null,
      publicado,
      archived,
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
      provenance,
      scoreFromCalidad: scoreMeni !== null && scoreMeni === scoreCalidad,
      resumenIncoherente,
      estado: d.estado ?? null,
      slug: d.slug ?? null,
    });
  }

  // Sort by fecha desc (nulls last)
  records.sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return b.fecha.localeCompare(a.fecha);
  });

  const out = {
    timestamp: new Date().toISOString(),
    total: records.length,
    counts,
    articles: records,
  };

  const jsonPath = path.join(process.cwd(), 'FORENSIC_CURRENT_INVENTORY.json');
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2));
  console.log('✓ JSON:', jsonPath);

  // CSV
  const headers = ['id','titulo','categoria','perfil','scoreMeni','aprobadoMeni','publicado','archived','palabras','fecha','scoreFromCalidad','resumenIncoherente','provenance'];
  const rows = [headers.join(',')];
  for (const r of records) {
    rows.push([
      r.id,
      `"${(r.titulo || '').replace(/"/g,'""').slice(0,120)}"`,
      r.categoria || '',
      r.perfil || '',
      r.scoreMeni ?? '',
      r.aprobadoMeni ?? '',
      r.publicado ? 1 : 0,
      r.archived ? 1 : 0,
      r.contenidoPalabras,
      r.fecha || '',
      r.scoreFromCalidad ? 1 : 0,
      r.resumenIncoherente ? 1 : 0,
      r.provenance ? 1 : 0,
    ].join(','));
  }
  const csvPath = path.join(process.cwd(), 'FORENSIC_CURRENT_INVENTORY.csv');
  fs.writeFileSync(csvPath, rows.join('\n'));
  console.log('✓ CSV:', csvPath);

  console.log('\n--- RESUMEN ---');
  console.log('Total:', counts.total);
  console.log('Con MENI:', counts.conMeni, '| Sin MENI:', counts.sinMeni);
  console.log('Aprobados:', counts.aprobados, '| Rechazados:', counts.rechazados);
  console.log('Publicados:', counts.publicados, '| No publicados:', counts.noPublicados);
  console.log('Archived:', counts.archived);
  console.log('scoreMeni === scoreCalidad (sospechoso):', counts.scoreFromCalidad);
  console.log('Sin provenance:', counts.sinProvenance);
  console.log('Sin perfil:', counts.sinPerfil);
  console.log('Sin categoria:', counts.sinCategoria);
  console.log('Sin resumen:', counts.sinResumen);
  console.log('Sin contenido:', counts.sinContenido);
  console.log('Resumen incoherente (sospechoso):', counts.resumenIncoherente);

  // Discrepancia 281 vs 283
  console.log('\n--- DISCREPANCIA 281 vs 283 ---');
  console.log('Total real en Firestore:', counts.total);
  if (counts.total === 281) console.log('→ Coincide con 281 (los 283 pueden ser caché o snapshot antiguo)');
  else if (counts.total === 283) console.log('→ Coincide con 283 (los 281 eran un snapshot antiguo)');
  else console.log(`→ Ni 281 ni 283: ${counts.total}. Revisar manualmente.`);

  // Listar los más recientes y los más antiguos
  console.log('\n--- 5 MÁS RECIENTES ---');
  for (const r of records.slice(0, 5)) {
    console.log(`  ${r.fecha} | ${r.id} | ${r.titulo?.slice(0,60)}`);
  }
  console.log('\n--- 5 MÁS ANTIGUOS ---');
  for (const r of records.slice(-5).reverse()) {
    console.log(`  ${r.fecha} | ${r.id} | ${r.titulo?.slice(0,60)}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
