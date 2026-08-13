/**
 * FORENSIC REFRESH INVENTORY
 * Usa el endpoint forensic-batch/query para reconstruir el inventario real.
 */
const fs = require('fs');
const https = require('https');

const HOST = 'nicaraguainformate.com';
const PATH = '/api/admin/forensic-batch';

function post(action, ids) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ action, ids, dryRun: true });
    const req = https.request({
      hostname: HOST,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 35000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
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
  const old = JSON.parse(fs.readFileSync('FORENSIC_CURRENT_INVENTORY.json', 'utf8'));
  const allIds = old.articles.map(a => a.id);
  const batches = chunks(allIds, 40);
  const results = [];
  let i = 0;

  for (const batch of batches) {
    i++;
    const res = await post('query', batch);
    if (!res.results) {
      console.error(`Error en lote ${i}:`, res);
      continue;
    }
    results.push(...res.results);
    console.log(`Lote ${i}/${batches.length}: ${res.results.length} artículos`);
  }

  const now = new Date().toISOString();
  const articles = results
    .filter(r => r.status === 'OK')
    .map(r => ({ id: r.id, ...r.data }));

  const dist = {
    total: articles.length,
    aprobados: articles.filter(a => a.aprobadoMeni).length,
    rechazados: articles.filter(a => !a.aprobadoMeni).length,
    publicados: articles.filter(a => a.publicado && a.aprobadoMeni).length,
    archivados: articles.filter(a => a.archived).length,
    conScoreCalidad: articles.filter(a => a.scoreFromCalidad).length,
    conProvenance: articles.filter(a => a.provenance).length,
  };

  const out = { timestamp: now, dist, articles };
  fs.writeFileSync('FORENSIC_CURRENT_INVENTORY.json', JSON.stringify(out, null, 2));
  fs.writeFileSync('FORENSIC_CURRENT_INVENTORY_REFRESHED', now);

  console.log('=== INVENTARIO ACTUALIZADO ===');
  console.log(JSON.stringify(dist, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
