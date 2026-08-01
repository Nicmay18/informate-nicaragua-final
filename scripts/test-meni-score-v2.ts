import { readFileSync } from 'fs';
import { join } from 'path';
import { runMeni } from '@/lib/meni/core';
import { setUseMeniScoreV2 } from '@/lib/meni/scoring';
import type { NoticiaInput } from '@/lib/meni/types';

interface FixtureItem {
  input: NoticiaInput;
}

const FIXTURES_PATH = join(process.cwd(), 'tests', 'fixtures', 'canonical-noticias.json');
const fixtures = JSON.parse(readFileSync(FIXTURES_PATH, 'utf-8'));
const items = (fixtures as FixtureItem[]).filter((x) => x && x.input);

interface ResultadoSimple {
  scoreFinal: number;
  slug: string;
}

function runForAll(v2: boolean): ResultadoSimple[] {
  setUseMeniScoreV2(v2);
  const out: ResultadoSimple[] = [];
  for (const item of items) {
    try {
      const r = runMeni(item.input);
      out.push({ scoreFinal: r.scoreFinal, slug: item.input.slug || item.input.titulo });
    } catch (err) {
      out.push({ scoreFinal: -1, slug: item.input.slug || item.input.titulo });
    }
  }
  return out;
}

async function main() {
  console.log('=== MENI Score V2 — comparación sobre noticias locales ===');
  console.log(`Muestra: ${items.length} noticias`);

  const v1 = runForAll(false);
  const v2 = runForAll(true);

  let suben = 0;
  let bajan = 0;
  let iguales = 0;
  let cambioNeto = 0;

  console.log('\n# | slug | viejo | nuevo | Δ');
  for (let i = 0; i < v1.length; i++) {
    const a = v1[i].scoreFinal;
    const b = v2[i].scoreFinal;
    const delta = b - a;
    cambioNeto += delta;
    if (delta > 0) suben++;
    else if (delta < 0) bajan++;
    else iguales++;
    if (i < 20) {
      const slug = items[i].input.slug || items[i].input.titulo.slice(0, 40);
      console.log(`${i + 1} | ${slug} | ${a} | ${b} | ${delta > 0 ? '+' + delta : delta}`);
    }
  }

  const rankingViejo = v1
    .map((r, i) => ({ score: r.scoreFinal, slug: items[i].input.slug }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 10)
    .map((r) => r.slug);

  const rankingNuevo = v2
    .map((r, i) => ({ score: r.scoreFinal, slug: items[i].input.slug }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 10)
    .map((r) => r.slug);

  const promedioViejo = v1.reduce((s, r) => s + r.scoreFinal, 0) / v1.length;
  const promedioNuevo = v2.reduce((s, r) => s + r.scoreFinal, 0) / v2.length;

  console.log('\n=== ESTADÍSTICAS ===');
  console.log(`Promedio V1: ${promedioViejo.toFixed(2)}`);
  console.log(`Promedio V2: ${promedioNuevo.toFixed(2)}`);
  console.log(`Suben: ${suben} | Bajan: ${bajan} | Iguales: ${iguales}`);
  console.log(`Cambio neto: ${cambioNeto > 0 ? '+' + cambioNeto : cambioNeto} pts`);
  console.log('\nTop 10 V1:', rankingViejo.slice(0, 5).join(', '));
  console.log('Top 10 V2:', rankingNuevo.slice(0, 5).join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
