const d = require('../phase16-inventory.json');
d.articles.forEach(a => {
  if (a.error) { console.log(a.id + ': ERROR'); return; }
  const issues = [];
  if (a.pCount === 0) issues.push('NO_P_TAGS');
  if (a.brCount > 5) issues.push('BR_SPAM(' + a.brCount + ')');
  if (a.h2Count < 3) issues.push('FEW_H2(' + a.h2Count + ')');
  if (a.contenidoPalabras < 350) issues.push('SHORT(' + a.contenidoPalabras + ')');
  if (a.tituloLength > 60) issues.push('LONG_TITLE(' + a.tituloLength + ')');
  if (a.resumenLength > 160) issues.push('LONG_RESUMEN(' + a.resumenLength + ')');
  if (a.resumenLength < 120) issues.push('SHORT_RESUMEN(' + a.resumenLength + ')');
  if (a.emptyPCount > 0) issues.push('EMPTY_P(' + a.emptyPCount + ')');
  if (a.hasNestedP) issues.push('NESTED_P');
  if (a.hasWrapperDiv) issues.push('WRAPPER_DIV');
  if (a.hasFont) issues.push('FONT_TAG');
  if (a.hasCenter) issues.push('CENTER_TAG');
  if (a.hasSpan) issues.push('SPAN_TAG');
  
  const recs = (a.recomendacionesMeni || []).map(r => r.substring(0, 60)).join('; ');
  
  console.log(a.id + ' | score=' + a.scoreMeni + ' | pal=' + a.contenidoPalabras + ' | issues=[' + issues.join(', ') + '] | recs: ' + recs);
});
