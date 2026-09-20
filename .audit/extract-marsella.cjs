const fs = require('fs');
const html = fs.readFileSync('baseline-marsella.html', 'utf8');
const t = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
const m = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
const art = (html.match(/<article[^>]*>([\s\S]*?)<\/article>/) || [])[1] || '';
// Find where the body starts: look for the first <p> after the byline/meta area.
// Heuristic: body = everything inside <div class="...contenido..."> or paragraphs.
const divs = art.match(/<div[^>]*class="[^"]*(?:contenido|article-body|entry-content|post-content|texto)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
let body = divs ? divs[1] : art;
// Keep only structural tags: p, h2, h3, ul, li, strong, blockquote
const keep = body.match(/<(p|h2|h3|ul|ol|li|blockquote)[^>]*>[\s\S]*?<\/\1>/g) || [];
const contenido = keep.join('\n');
console.log('TITLE:', t.replace(/<[^>]+>/g, '').trim());
console.log('DESC:', m);
console.log('CONTENIDO blocks:', keep.length, 'len:', contenido.length);
fs.writeFileSync('marsella-contenido.html', contenido);
console.log('--- CONTENIDO (first 1500) ---');
console.log(contenido.slice(0, 1500));
