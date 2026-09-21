// Diff v2: calcula disciplina vía classifySports y mide fútbol-en-no-fútbol.
const fs = require('fs');
const { execSync } = require('child_process');
const before = JSON.parse(fs.readFileSync('.audit/meni-regression-BEFORE.json', 'utf8'));
const after = JSON.parse(fs.readFileSync('.audit/meni-regression-AFTER.json', 'utf8'));
const snap = JSON.parse(fs.readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));

// clasificar disciplina por artículo vía tsx una sola vez
const dump = snap.articles.map((a, i) => ({ i, titulo: a.titulo, contenido: (a.contenido || '').slice(0, 3000), resumen: a.resumen || '', categoria: a.categoria }));
fs.writeFileSync('.audit/_arts.json', JSON.stringify(dump));

console.log('escrito _arts.json con', dump.length);
