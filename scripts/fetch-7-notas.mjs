import { writeFileSync } from 'fs';
import { resolve } from 'path';
const SITE_URL = 'https://nicaraguainformate.com';

const slugs = [
  'nicaraguense-muere-en-costa-rica-tras-choque-y-fuga-vial',
  'madrugada-tragica-en-matagalpa-tras-presunto-robo-de',
  'una-falla-cambio-el-rumbo-de-un-viaje-familiar-en-chontales',
  'nicaragua-primera-autopista-de-peaje-de-su-historia',
  'costanera-agiliza-transporte-y-abre-playas-antes-aisladas',
  'beisbol-infantil-nicaragua-viaja-a-puerto-rico-y-ecuador',
  'turismo-en-nicaragua-crece-11-en-primer-trimestre-de-2026-segun-intur',
];

async function fetchArticle(slug) {
  const res = await fetch(`${SITE_URL}/noticias/${slug}`);
  const html = await res.text();
  // Extraer el contenido del article
  const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!match) {
    // Intentar con class article-body o similar
    const m2 = html.match(/class="article-body"[\s\S]*?>([\s\S]*?)<\/div>/i);
    return m2 ? m2[1] : html.substring(0, 5000);
  }
  return match[1];
}

async function run() {
  const out = [];
  for (const slug of slugs) {
    console.log(`[Fetch] ${slug}...`);
    try {
      const content = await fetchArticle(slug);
      out.push({ slug, content });
    } catch (e) {
      out.push({ slug, error: e.message });
    }
  }
  const outPath = resolve(process.cwd(), 'scripts', '7-notas-content.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log(`[Fetch] Guardado en ${outPath}`);
}

run().catch(e => { console.error(e); process.exit(1); });
