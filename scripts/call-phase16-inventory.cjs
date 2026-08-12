const https = require('https');
const fs = require('fs');

const url = 'https://nicaraguainformate.com/api/admin/phase16-inventory';

const req = https.get(url, { timeout: 120000 }, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      fs.writeFileSync('phase16-inventory.json', JSON.stringify(parsed, null, 2));
      console.log(`Saved ${parsed.articles.length} articles to phase16-inventory.json`);
      for (const a of parsed.articles) {
        if (a.error) {
          console.log(`  ${a.id}: ERROR ${a.error}`);
        } else {
          console.log(`  ${a.id}: score=${a.scoreMeni} aprobado=${a.aprobadoMeni} pal=${a.contenidoPalabras} h2=${a.h2Count} | ${a.titulo}`);
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
