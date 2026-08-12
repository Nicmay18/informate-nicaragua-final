const https = require('https');
const fs = require('fs');

const url = 'https://nicaraguainformate.com/api/admin/phase15-2-dup-audit';

const req = https.get(url, { timeout: 120000 }, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      fs.writeFileSync('dup-audit-results.json', JSON.stringify(parsed, null, 2));
      console.log('Results saved to dup-audit-results.json');
      console.log('Summary:');
      for (const c of parsed.cases) {
        if (c.error) {
          console.log(`  ${c.id}: ERROR ${c.error}`);
          continue;
        }
        console.log(`  ${c.originalId}: ${c.originalMeta.titulo}`);
        console.log(`    Duplicates found: ${c.duplicateDetails.length}`);
        for (const d of c.duplicateDetails) {
          console.log(`      → ${d.meta.id} (${d.similarity}%): ${d.meta.titulo}`);
        }
      }
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw (first 500):', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('ERROR:', e.message));
req.on('timeout', () => { console.error('TIMEOUT'); req.destroy(); });
