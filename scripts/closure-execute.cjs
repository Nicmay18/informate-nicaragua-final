const fs = require('fs');
const https = require('https');
const HOST = 'nicaraguainformate.com';
const PATH = '/api/admin/forensic-batch';

function post(action, ids, extra) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(Object.assign({ action, ids }, extra || {}));
    const req = https.request({ hostname: HOST, path: PATH, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }, timeout: 55000 }, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d.substring(0, 500) }); } }); });
    req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload); req.end();
  });
}

async function main() {
  const exec = process.argv[2] === 'exec';
  console.log('=== FASE 3: EJECUTAR CORRECCIONES ===');
  console.log('Mode:', exec ? 'EXECUTE' : 'DRY-RUN');

  // 1. ARCHIVE obsolete articles
  const archiveIds = ['ckgtTyw5JZx2lMhWYdiL', 's3JrANBvskSO61lPqPrv'];
  console.log('\n--- ARCHIVE ' + archiveIds.length + ' articles ---');
  const archRes = await post('set-estado', archiveIds, { estado: 'archivado', publicado: false, dryRun: !exec });
  console.log(JSON.stringify(archRes.results, null, 2));

  // 2. FIX empty_p in TECHNICAL_FIX articles
  const s = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
  const snap = {};
  for (const a of s.articles) snap[a.id] = a;

  const fixIds = ['12vpZYJonwqLUyW1rlpl', '8eSX6XxOPVJbh9ILZ5ZS', '9c0bOgvhw4oxPOgy3gvl', 'BAcOCY6ZJ7XpDdzfRUZ1', 'HxsDqbeHSSO2MRyl1Cpu', 'JIRE98QbwrecUId3edcA', 'JOfOW7uTxkgDSIezo7Wn'];
  console.log('\n--- FIX empty_p in ' + fixIds.length + ' articles ---');

  for (const id of fixIds) {
    const a = snap[id];
    if (!a) { console.log(id, 'NOT FOUND'); continue; }
    let content = a.contenido || '';
    const before = content;
    // Remove empty paragraphs
    content = content.replace(/<p>\s*<\/p>/gi, '');
    // Clean up extra whitespace between tags
    content = content.replace(/>\s+<\//g, '></');
    content = content.replace(/\s+<\//g, ' </');
    if (content !== before) {
      const res = await post('fix-content', [id], { updates: { contenido: content, motivo: 'Closure: removed empty <p> tags' }, dryRun: !exec });
      console.log(id, res.results[0]?.status, '|', a.titulo.substring(0, 60));
    } else {
      console.log(id, 'NO_CHANGE needed |', a.titulo.substring(0, 60));
    }
  }

  console.log('\n=== DONE ===');
  console.log('Archived:', archiveIds.length);
  console.log('Fixed:', fixIds.length);
  if (!exec) console.log('Run with "exec" to apply changes.');
}

main().catch(e => { console.error(e); process.exit(1); });
