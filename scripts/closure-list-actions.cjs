const c = JSON.parse(require('fs').readFileSync('CLOSURE_CLASSIFICATION.json', 'utf8'));
const non = c.classifications.filter(x => x.classification !== 'KEEP');
for (const a of non) {
  console.log(a.classification, a.id, 'score=' + a.scoreMeni, 'pub=' + a.publicado, 'est=' + a.estado, '|', a.titulo, '|', a.reasons.join('; '));
}
