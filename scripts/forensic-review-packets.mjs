import { readFileSync, writeFileSync } from 'node:fs';
const docs = JSON.parse(readFileSync('.audit/corpus.json', 'utf8')).filter(d => d.estado === 'publicado');
const fields = ['id', 'slug', 'titulo', 'resumen', 'contenido', 'fecha', 'categoria', 'autor', 'fuente', 'fuentesComplementarias', 'scoreMeni', 'noindex'];
for (let n = 0; n < 6; n++) {
  const packet = docs.slice(n * 100, (n + 1) * 100).map(d => Object.fromEntries(fields.map(k => [k, d[k] ?? null])));
  writeFileSync(`reports/forensic-review-input-${n + 1}.json`, JSON.stringify(packet, null, 2));
}
console.log(`Prepared 6 review packets: ${docs.length} published articles, editorial fields only.`);
