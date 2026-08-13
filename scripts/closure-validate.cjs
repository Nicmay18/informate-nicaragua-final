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

function chunks(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }

async function main() {
  console.log('=== FASE 4: VALIDAR PUBLICACION ===');

  // Get fresh list
  const listRes = await post('list-all', []);
  const allIds = listRes.ids || [];
  console.log('Total articles:', allIds.length);

  // Query all in batches
  const batches = chunks(allIds, 40);
  let publishedNotApproved = [];
  let approvedNotPublished = [];
  let archivedStillPublished = [];
  let scoreCalidadResidual = [];
  let totalPublished = 0;
  let totalArchived = 0;
  let totalApproved = 0;

  for (let i = 0; i < batches.length; i++) {
    const res = await post('query', batches[i]);
    for (const r of (res.results || [])) {
      if (r.status !== 'OK') continue;
      const d = r.data;
      if (d.publicado === true) totalPublished++;
      if (d.estado === 'archivado' || d.archived === true) totalArchived++;
      if (d.aprobadoMeni === true) totalApproved++;

      // Check violations
      if (d.publicado === true && d.aprobadoMeni === false) {
        publishedNotApproved.push({ id: r.id, titulo: d.titulo, score: d.scoreMeni });
      }
      if (d.aprobadoMeni === true && d.publicado === false && d.estado !== 'archivado') {
        approvedNotPublished.push({ id: r.id, titulo: d.titulo });
      }
      if ((d.estado === 'archivado' || d.archived === true) && d.publicado === true) {
        archivedStillPublished.push({ id: r.id, titulo: d.titulo });
      }
      if (d.scoreFromCalidad === true) {
        scoreCalidadResidual.push({ id: r.id, titulo: d.titulo });
      }
    }
    console.log('Batch ' + (i + 1) + '/' + batches.length + ' processed');
  }

  console.log('\n=== RESULTADOS ===');
  console.log('Total published:', totalPublished);
  console.log('Total archived:', totalArchived);
  console.log('Total approved:', totalApproved);
  console.log('\nViolations:');
  console.log('Published but NOT approved:', publishedNotApproved.length);
  for (const v of publishedNotApproved) console.log('  -', v.id, '| score=' + v.score, '|', v.titulo);
  console.log('Approved but NOT published (not archived):', approvedNotPublished.length);
  for (const v of approvedNotPublished) console.log('  -', v.id, '|', v.titulo);
  console.log('Archived but still published:', archivedStillPublished.length);
  for (const v of archivedStillPublished) console.log('  -', v.id, '|', v.titulo);
  console.log('scoreCalidad residual:', scoreCalidadResidual.length);
  for (const v of scoreCalidadResidual) console.log('  -', v.id, '|', v.titulo);

  // FASE 5: Mark fixed articles for MENI reeval
  console.log('\n=== FASE 5: MARCAR MENI REEVAL ===');
  const fixedIds = ['12vpZYJonwqLUyW1rlpl', '8eSX6XxOPVJbh9ILZ5ZS', '9c0bOgvhw4oxPOgy3gvl', 'BAcOCY6ZJ7XpDdzfRUZ1', 'HxsDqbeHSSO2MRyl1Cpu', 'JIRE98QbwrecUId3edcA', 'JOfOW7uTxkgDSIezo7Wn'];
  const reevalRes = await post('reeval-meni', fixedIds, { dryRun: false });
  console.log('Marked for reeval:', reevalRes.writes, 'articles');

  const allClean = publishedNotApproved.length === 0 && archivedStillPublished.length === 0 && scoreCalidadResidual.length === 0;
  console.log('\n=== ' + (allClean ? 'ALL CLEAN' : 'VIOLATIONS FOUND') + ' ===');
}

main().catch(e => { console.error(e); process.exit(1); });
