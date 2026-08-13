/**
 * Set MENI perfiles for all articles via forensic-batch endpoint
 */
const fs = require('fs');
const https = require('https');

const HOST = 'nicaraguainformate.com';
const PATH = '/api/admin/forensic-batch';

function post(action, ids, dryRun = true) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ action, ids, dryRun });
    const req = https.request({
      hostname: HOST,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 45000,
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
  const dryRun = process.argv[2] !== 'exec';
  const inv = JSON.parse(fs.readFileSync('FORENSIC_CURRENT_INVENTORY.json', 'utf8'));
  const allIds = inv.articles.map(a => a.id);
  const batches = chunks(allIds, 40);
  const results = [];
  for (let i = 0; i < batches.length; i++) {
    const res = await post('set-perfil', batches[i], dryRun);
    console.log(`Lote ${i + 1}/${batches.length}: ${res.total} artículos, writes=${res.writes}`);
    results.push(res);
  }
  const all = results.flatMap(r => r.results || []);
  const perfiles = {};
  for (const r of all) {
    if (r.status === 'PERFIL_SET') {
      perfiles[r.perfil] = (perfiles[r.perfil] || 0) + 1;
    }
  }
  console.log('=== PERFILES ASIGNADOS ===');
  console.log(JSON.stringify(perfiles, null, 2));
  console.log('Total asignados:', all.filter(r => r.status === 'PERFIL_SET').length);
  console.log('Total sin cambio:', all.filter(r => r.status === 'PERFIL_UNCHANGED').length);
  console.log('Dry run:', dryRun);
  if (dryRun) console.log('Pasa "exec" como argumento para escribir.');
}

main().catch(e => { console.error(e); process.exit(1); });
