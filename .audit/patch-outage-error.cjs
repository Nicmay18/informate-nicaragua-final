const fs = require('fs');
const file = 'lib/data.ts';
let t = fs.readFileSync(file, 'utf8');
const rep = (o, n, label) => {
  const oc = o.replace(/\n/g, '\r\n'), nc = n.replace(/\n/g, '\r\n');
  if (t.includes(o)) t = t.replace(o, n);
  else if (t.includes(oc)) t = t.replace(oc, nc);
  else { console.log('MISS: ' + label); process.exit(1); }
  console.log(label + ' OK');
};

// 1) Error tipado exportado (los callers pueden distinguir apagón de vacío)
rep("import { isToxicSlug } from './seo-toxic';",
`import { isToxicSlug } from './seo-toxic';

/** Todas las sub-queries de Firestore fallaron: es un apagón, no un corpus vacío. */
export class FirestoreOutageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirestoreOutageError';
  }
}`,
'FirestoreOutageError class');

// 2) Lanzar el tipo tipado
rep("throw new Error(`[data.ts] fetchPublishedDocs: ${queryErrors}/${queriesRun} queries fallaron",
"throw new FirestoreOutageError(`[data.ts] fetchPublishedDocs: ${queryErrors}/${queriesRun} queries fallaron",
'throw typed');

// 3) Re-lanzar en todos los catches (err / err2 / catch vacío)
t = t.replace(/catch \(err\) \{/g, 'catch (err) {\n    if (err instanceof FirestoreOutageError) throw err;');
t = t.replace(/catch \(err2\) \{/g, 'catch (err2) {\n      if (err2 instanceof FirestoreOutageError) throw err2;');
t = t.replace(/\} catch \{\n(\s*)return \[\];/g, '} catch (e) {\n$1if (e instanceof FirestoreOutageError) throw e;\n$1return [];');

fs.writeFileSync(file, t);
console.log('done');
