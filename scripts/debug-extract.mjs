// Debug: inspecciona extracción de resumen/entrada/cierre en un artículo real
const slug = process.argv[2] || 'investigan-a-funcionaria-por-tramite-irregular-para-nicaraguense';
const r = await fetch(`https://nicaraguainformate.com/noticias/${slug}`);
const b = await r.text();

// ¿Cuántos itemProp="description" hay y dónde?
const descMatches = [...b.matchAll(/itemProp="description"/g)];
console.log('itemProp=description count:', descMatches.length, 'posiciones:', descMatches.map(m => m.index));

// Contexto de cada uno
for (const m of descMatches.slice(0, 5)) {
  console.log('---', m.index, ':', JSON.stringify(b.slice(m.index - 60, m.index + 120)));
}

// articleBody
const i = b.indexOf('itemProp="articleBody"');
const e = b.indexOf('Lea también');
console.log('\narticleBody idx:', i, '| Lea también idx:', e);
const h = b.slice(i, e > i ? e : i + 80000);
const ps = [...h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
  .filter(p => p.length > 30);
console.log('paras extraídos:', ps.length);
console.log('FIRST:', ps[0]?.slice(0, 160));
console.log('LAST :', JSON.stringify(ps[ps.length - 1]));
console.log('LAST-1:', JSON.stringify(ps[ps.length - 2]?.slice(0, 160)));

// ¿Qué hay justo antes de "Lea también"?
console.log('\nAntes de Lea también:', JSON.stringify(b.slice(e - 400, e).replace(/<[^>]+>/g, '|').slice(-300)));
