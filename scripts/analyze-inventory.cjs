const d = require('../phase16-inventory.json');
d.articles.forEach(a => {
  if (a.error) { console.log(a.id + ': ERROR'); return; }
  console.log([
    a.id,
    'score=' + a.scoreMeni,
    'p=' + a.pCount,
    'h2=' + a.h2Count,
    'emptyP=' + a.emptyPCount,
    'nested=' + a.hasNestedP,
    'div=' + a.hasWrapperDiv,
    'br=' + a.brCount,
    'font=' + a.hasFont,
    'center=' + a.hasCenter,
    'span=' + a.hasSpan,
    'pal=' + a.contenidoPalabras,
    'titulo=' + a.tituloLength,
    'resumen=' + a.resumenLength,
    'diag=' + (a.diagnosticoMeni || '').substring(0, 100),
  ].join(' | '));
});
