const d = require('../phase16-inventory.json');
d.articles.forEach(a => {
  if (a.error) return;
  const needsTitleFix = a.tituloLength > 60;
  const needsResumenFix = a.resumenLength > 160 || a.resumenLength < 120;
  const needsPWrap = a.pCount === 0;
  const needsBrFix = a.brCount > 5;
  const needsH2 = a.h2Count < 3;
  
  if (needsTitleFix || needsResumenFix || needsPWrap || needsBrFix || needsH2) {
    console.log('=== ' + a.id + ' (score=' + a.scoreMeni + ') ===');
    if (needsPWrap) console.log('  ISSUE: NO_P_TAGS (p=' + a.pCount + ')');
    if (needsBrFix) console.log('  ISSUE: BR_SPAM (' + a.brCount + ' <br> tags)');
    if (needsH2) console.log('  ISSUE: FEW_H2 (' + a.h2Count + ' h2 tags)');
    if (needsTitleFix) console.log('  TITLE (' + a.tituloLength + '): ' + a.titulo);
    if (needsResumenFix) console.log('  RESUMEN (' + a.resumenLength + '): ' + a.resumen);
    console.log('');
  }
});
