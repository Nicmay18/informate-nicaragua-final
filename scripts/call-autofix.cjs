const https = require('https');

const url = 'https://nicaraguainformate.com/api/admin/phase15-1-auto-fix';

const req = https.get(url, { timeout: 120000 }, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.on('timeout', () => {
  console.error('TIMEOUT after 120s');
  req.destroy();
});
