import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const data = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts', '7-notas-content.json'), 'utf8'));

function extractArticleBody(html) {
  // Buscar el div con class que contenga el contenido del articulo
  // Intentar varios patrones
  let body = html;

  // Extraer solo los <p> y <h2> del contenido
  const paragraphs = [];
  const pMatches = body.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  for (const p of pMatches) {
    const clean = p.replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
    if (clean.length > 20) paragraphs.push(clean);
  }

  const h2Matches = body.match(/<h2[^>]*>[\s\S]*?<\/h2>/gi) || [];
  const h2s = h2Matches.map(h => h.replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'").trim()).filter(t => t.length > 5);

  return { h2s, paragraphs };
}

const out = [];
for (const item of data) {
  if (item.error) { out.push({ slug: item.slug, error: item.error }); continue; }
  const { h2s, paragraphs } = extractArticleBody(item.content);
  const wordCount = paragraphs.join(' ').split(/\s+/).filter(w => /[a-záéíóúñA-ZÁÉÍÓÚÑ]/.test(w)).length;
  out.push({
    slug: item.slug,
    wordCountRegex: wordCount,
    h2s,
    paragraphs,
    paragraphCount: paragraphs.length,
  });
}

const outPath = resolve(process.cwd(), 'scripts', '7-notas-extracted.json');
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Guardado en scripts/7-notas-extracted.json');
for (const o of out) {
  if (o.error) { console.log(`${o.slug}: ERROR ${o.error}`); continue; }
  console.log(`\n=== ${o.slug} ===`);
  console.log(`Palabras (regex): ${o.wordCountRegex} | Párrafos: ${o.paragraphCount} | H2s: ${o.h2s.length}`);
  console.log(`H2s: ${o.h2s.join(' | ')}`);
  console.log(`Último párrafo: ${(o.paragraphs[o.paragraphs.length-1] || '').substring(0, 200)}...`);
}
