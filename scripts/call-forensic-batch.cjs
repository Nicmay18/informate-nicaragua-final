/**
 * Call forensic-batch endpoint
 */
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
      timeout: 25000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

async function main() {
  const action = process.argv[2] || 'add-provenance';
  const ids = process.argv[3] ? process.argv[3].split(',') : ['1HmobwfngxeXoUofqosD'];
  const dryRun = process.argv[4] !== 'exec';
  const res = await post(action, ids, dryRun);
  console.log(JSON.stringify(res, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
