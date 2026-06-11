const fs = require('fs');
const path = require('path');

const needs = JSON.parse(fs.readFileSync(path.join(__dirname, 'needs-content.json'), 'utf-8'));

function cleanTitle(t) {
  return (t || '').split('\\n\\n##')[0].split('\n\n##')[0].replace(/\\n/g, ' ').trim();
}

const clean = needs.map((a, i) => ({
  n: i + 1,
  id: a.id,
  titulo: cleanTitle(a.titulo),
  categoria: a.categoria,
  resumen: a.resumen,
}));

fs.writeFileSync(path.join(__dirname, 'clean-list.json'), JSON.stringify(clean, null, 2), 'utf-8');
console.log(`Total: ${clean.length} articles`);
clean.forEach(a => console.log(`${a.n}. [${a.categoria}] ${a.titulo}`));
