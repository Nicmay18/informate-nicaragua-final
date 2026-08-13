/**
 * FASE 1 — Snapshot inmutable de todos los artículos en Firestore
 * Obtiene contenido completo via forensic-batch full-query
 */
const fs = require('fs');
const https = require('https');

const HOST = 'nicaraguainformate.com';
const PATH = '/api/admin/forensic-batch';

function post(action, ids, extra = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ action, ids, ...extra });
    const req = https.request({
      hostname: HOST,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 55000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log('=== FASE 1: SNAPSHOT INMUTABLE ===');

  // Get all IDs first
  console.log('Obteniendo lista completa de IDs...');
  const listRes = await post('list-all', []);
  const allIds = listRes.ids || [];
  console.log(`Total artículos: ${allIds.length}`);

  // Fetch full content in batches
  const batches = chunks(allIds, 30);
  const allArticles = [];

  for (let i = 0; i < batches.length; i++) {
    const res = await post('full-query', batches[i]);
    const items = (res.results || []).filter(r => r.status === 'OK');
    for (const item of items) {
      allArticles.push({ id: item.id, ...item.data });
    }
    console.log(`Lote ${i + 1}/${batches.length}: ${items.length} artículos`);
  }

  // Build snapshot
  const snapshot = {
    timestamp: new Date().toISOString(),
    total: allArticles.length,
    articles: allArticles,
  };

  const filename = 'CLOSURE_SNAPSHOT.json';
  fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
  console.log(`\nSnapshot guardado: ${filename}`);
  console.log(`Total artículos: ${allArticles.length}`);

  // Summary stats
  const stats = {
    publicados: allArticles.filter(a => a.publicado === true).length,
    archivados: allArticles.filter(a => a.estado === 'archivado' || a.archived === true).length,
    aprobadosMeni: allArticles.filter(a => a.aprobadoMeni === true).length,
    rechazadosMeni: allArticles.filter(a => a.aprobadoMeni === false).length,
    sinMeni: allArticles.filter(a => a.scoreMeni === null).length,
    conScoreCalidad: allArticles.filter(a => a.scoreCalidad !== null && a.scoreCalidad !== undefined).length,
    sinResumen: allArticles.filter(a => !a.resumen || a.resumen.trim() === '').length,
    sinContenido: allArticles.filter(a => !a.contenido || a.contenido.trim() === '').length,
    palabrasBajas: allArticles.filter(a => a.palabras > 0 && a.palabras < 350).length,
  };

  console.log('\n=== ESTADÍSTICAS ===');
  console.log(JSON.stringify(stats, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
