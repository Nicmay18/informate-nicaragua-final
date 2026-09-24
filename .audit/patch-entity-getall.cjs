const fs = require('fs');
const f = 'lib/meni/knowledge-base/entity-page.ts';
let t = fs.readFileSync(f, 'utf8');

const anchor = `  // Batch read all related entities in a single call (fixes N+1)
  const relatedDocs = await db.getAll(
    ...relatedEntityIdArr.map((id) => db.collection('kb_entities').doc(id))
  );`;

const rep = `  // Batch read all related entities in a single call (fixes N+1).
  // getAll() con cero refs no es válido — entidad sin relaciones devuelve [].
  const relatedDocs = relatedEntityIdArr.length > 0
    ? await db.getAll(
        ...relatedEntityIdArr.map((id) => db.collection('kb_entities').doc(id))
      )
    : [];`;

const anchorCrlf = anchor.replace(/\n/g, '\r\n');
if (t.includes(anchor)) t = t.replace(anchor, rep);
else if (t.includes(anchorCrlf)) t = t.replace(anchorCrlf, rep.replace(/\n/g, '\r\n'));
else { console.log('anchor not found'); process.exit(1); }

fs.writeFileSync(f, t);
console.log('entity-page getAll guard OK');
