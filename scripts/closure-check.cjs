const s = JSON.parse(require('fs').readFileSync('CLOSURE_SNAPSHOT.json', 'utf8'));
const snap = {};
for (const a of s.articles) snap[a.id] = a;

// Check ARCHIVE candidates
const ids = ['8p1gDsWo0i41nsJH4QTo', 'ckgtTyw5JZx2lMhWYdiL', 's3JrANBvskSO61lPqPrv'];
for (const id of ids) {
  const a = snap[id];
  if (!a) { console.log(id, 'NOT FOUND'); continue; }
  console.log('=== ' + id + ' ===');
  console.log('Title:', a.titulo);
  console.log('Date:', a.fecha);
  console.log('Score:', a.scoreMeni, 'Published:', a.publicado);
  const text = (a.contenido || '').replace(/<[^>]+>/g, ' ').substring(0, 600);
  console.log('Content (first 600 chars):', text);
  console.log('');
}
