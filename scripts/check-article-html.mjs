// Verificación puntual del HTML renderizado de un artículo (solo lectura)
const url = process.argv[2] || 'https://nicaraguainformate.com/noticias/multiestadio-stanley-cayasso-asi-avanzan-sus-bases-en-managua';
const h = await (await fetch(url)).text();
console.log('len', h.length);
for (const p of ['Lea también', 'ni-related', 'Preguntas frecuentes', 'Puntos Clave', 'También te puede interesar', 'Foto: Nicaragua Informate', 'articleBody', 'Fuentes']) {
  console.log(JSON.stringify(p), '=>', h.includes(p));
}
const m = h.match(/aria-label="Lea también"[\s\S]{0,300}/);
console.log(m ? m[0].slice(0, 300) : 'no lea-tambien aside');
const cap = h.match(/<figcaption[\s\S]{0,300}/);
console.log(cap ? cap[0].slice(0, 300) : 'no figcaption');
