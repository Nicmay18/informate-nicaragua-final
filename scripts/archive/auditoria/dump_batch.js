const fs = require('fs');
const path = require('path');

const needs = JSON.parse(fs.readFileSync(path.join(__dirname, 'needs-content.json'), 'utf-8'));

function cleanTitle(t) {
  return (t || '').split('\\n\\n##')[0].split('\n\n##')[0].replace(/\\n/g, ' ').trim();
}

const start = parseInt(process.argv[2] || '0', 10);
const end = parseInt(process.argv[3] || '20', 10);

const batch = needs.slice(start, end);
batch.forEach((a, i) => {
  console.log(`\n=== ${start + i + 1}. [${a.categoria}] ===`);
  console.log(`ID: ${a.id}`);
  console.log(`TITULO: ${cleanTitle(a.titulo)}`);
  console.log(`RESUMEN: ${a.resumen}`);
});
