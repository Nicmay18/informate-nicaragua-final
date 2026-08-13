const d = require('../phase16-inventory.json');
const ids = ['1HmobwfngxeXoUofqosD', 'ic2YGP8NQAc6r3VMvy9K', 'H25VVBdDntQpmy13uxdP', 'JOfOW7uTxkgDSIezo7Wn', 'zkdDsejAb5hLCpCaEbMR'];
d.articles.forEach(a => {
  if (!ids.includes(a.id)) return;
  console.log('=== ' + a.id + ' ===');
  console.log('TITLE: ' + a.titulo);
  console.log('RESUMEN: ' + a.resumen);
  console.log('SCORE: ' + a.scoreMeni + ' | PAL: ' + a.contenidoPalabras + ' | P: ' + a.pCount + ' | H2: ' + a.h2Count + ' | BR: ' + a.brCount);
  console.log('HTML (first 2000):');
  console.log(a.contenidoHtml.substring(0, 2000));
  console.log('\n---\n');
});
