const d = require('../phase16-inventory.json');
const a = d.articles.find(x => x.id === '1HmobwfngxeXoUofqosD');
console.log('=== ' + a.id + ' ===');
console.log('TITLE: ' + a.titulo);
console.log('SCORE: ' + a.scoreMeni + ' | P: ' + a.pCount + ' | H2: ' + a.h2Count);
console.log('HTML:');
console.log(a.contenidoHtml);
