import { readFileSync } from 'fs';
import { join } from 'path';
import { runMeni } from '@/lib/meni/core';
import { setUseMeniScoreV2, MENI_V2_WEIGHTS, MENI_V2_BLEND } from '@/lib/meni/scoring';
import type { MeniResult, NoticiaInput } from '@/lib/meni/types';

interface FixtureItem {
  input: NoticiaInput;
}

const FIXTURES_PATH = join(process.cwd(), 'tests', 'fixtures', 'canonical-noticias.json');
const fixtures = JSON.parse(readFileSync(FIXTURES_PATH, 'utf-8'));
const items = (fixtures as FixtureItem[]).filter((x) => x && x.input);

interface AnalisisFila {
  slug: string;
  v1: number;
  v2: number;
  delta: number;
  utilidad: number;
  profundidad: number;
  originalidad: number;
  eeat: number;
  aportePropio: number;
  adnNI: number;
  puntosPerdidos: number;
  valorEditorial: number;
}

const w = MENI_V2_WEIGHTS;
const b = MENI_V2_BLEND;

function calcularValorEditorial(f: AnalisisFila): number {
  const total =
    f.utilidad * w.utilidad +
    f.profundidad * w.profundidad +
    f.originalidad * w.originalidad +
    f.eeat * w.eeat +
    f.aportePropio * w.aportePropio +
    f.adnNI * w.adnNI;
  const totalPeso = w.utilidad + w.profundidad + w.originalidad + w.eeat + w.aportePropio + w.adnNI;
  return total / totalPeso;
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da) * Math.sqrt(db);
  return den === 0 ? 0 : num / den;
}

function rank(vals: number[]): number[] {
  const sorted = [...vals].map((v, i) => ({ v, i })).sort((x, y) => x.v - y.v);
  const r: number[] = new Array(vals.length);
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    const group: number[] = [];
    while (j < sorted.length && sorted[j].v === sorted[i].v) {
      group.push(sorted[j].i);
      j++;
    }
    const avgRank = (i + 1 + j) / 2;
    for (const idx of group) r[idx] = avgRank;
    i = j;
  }
  return r;
}

function spearman(a: number[], b: number[]): number {
  return pearson(rank(a), rank(b));
}

function runForAll(v2: boolean): MeniResult[] {
  setUseMeniScoreV2(v2);
  const out: MeniResult[] = [];
  for (const item of items) {
    try {
      out.push(runMeni(item.input));
    } catch (err) {
      out.push({ scoreFinal: -1, slug: item.input.slug || item.input.titulo } as unknown as MeniResult);
    }
  }
  return out;
}

function printTabla(titulo: string, filas: AnalisisFila[]) {
  console.log(`\n=== ${titulo} ===`);
  console.log('slug | V1 | V2 | Δ | Util | Prof | Orig | EEAT | ADN | Aporte | Puntos');
  for (const f of filas) {
    console.log(
      `${f.slug.slice(0, 45)} | ${f.v1} | ${f.v2} | ${f.delta > 0 ? '+' + f.delta : f.delta} | ` +
      `${f.utilidad} | ${f.profundidad} | ${f.originalidad} | ${f.eeat} | ${f.adnNI} | ${f.aportePropio} | ${f.puntosPerdidos}`
    );
  }
}

function printContribuciones(f: AnalisisFila) {
  const base = f.v1 * b.base;
  const valor = f.valorEditorial * b.valor;
  console.log(`  Cambio: ${f.delta > 0 ? '+' + f.delta : f.delta} (V2 = ${b.base}*V1 + ${b.valor}*valorEditorial)`);
  console.log(`  base penalizaciones: ${base.toFixed(2)} pts`);
  console.log(`  valor editorial:     ${valor.toFixed(2)} pts`);
  console.log(`  contribuciones:`);
  console.log(`    utilidad     ${(f.utilidad * w.utilidad * b.valor).toFixed(2)}`);
  console.log(`    profundidad  ${(f.profundidad * w.profundidad * b.valor).toFixed(2)}`);
  console.log(`    originalidad ${(f.originalidad * w.originalidad * b.valor).toFixed(2)}`);
  console.log(`    EEAT         ${(f.eeat * w.eeat * b.valor).toFixed(2)}`);
  console.log(`    aportePropio ${(f.aportePropio * w.aportePropio * b.valor).toFixed(2)}`);
  console.log(`    ADN NI       ${(f.adnNI * w.adnNI * b.valor).toFixed(2)}`);
}

async function main() {
  console.log('=== MENI Score V2 — validación científica ===');
  console.log(`Muestra: ${items.length} noticias`);

  const v1 = runForAll(false);
  const v2 = runForAll(true);

  const filas: AnalisisFila[] = v1.map((r1, i) => {
    const r2 = v2[i];
    const dna = r2.editorialDna!;
    const puntos = (r2.puntosPerdidos || []).reduce((s, p) => s + p.puntos, 0);
    const f: AnalisisFila = {
      slug: (items[i].input.slug || items[i].input.titulo).toString(),
      v1: r1.scoreFinal,
      v2: r2.scoreFinal,
      delta: r2.scoreFinal - r1.scoreFinal,
      utilidad: dna.selloNI.utilidad,
      profundidad: dna.selloNI.explica,
      originalidad: dna.selloNI.originalidad,
      eeat: r2.eeat?.score ?? 0,
      aportePropio: r2.valorEditorial?.aportePropio ? 100 : 0,
      adnNI: dna.adnNI,
      puntosPerdidos: puntos,
      valorEditorial: 0,
    };
    f.valorEditorial = calcularValorEditorial(f);
    return f;
  });

  const suben = [...filas].filter((f) => f.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 10);
  const bajan = [...filas].filter((f) => f.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 10);
  const iguales = [...filas].filter((f) => f.delta === 0).sort((a, b) => Math.abs(b.v2 - b.v1) - Math.abs(a.v2 - a.v1)).slice(0, 10);

  printTabla('10 MAYORES SUBIDAS', suben);
  printTabla('10 MAYORES BAJADAS', bajan);
  printTabla('10 CASI IGUALES', iguales);

  console.log('\n=== TRAZABILIDAD POR DIFERENCIA (muestra) ===');
  for (const f of [...suben.slice(0, 3), ...bajan.slice(0, 3), ...iguales.slice(0, 3)]) {
    console.log(`\n${f.slug}`);
    printContribuciones(f);
  }

  const v1s = filas.map((f) => f.v1);
  const v2s = filas.map((f) => f.v2);
  const util = filas.map((f) => f.utilidad);
  const prof = filas.map((f) => f.profundidad);
  const orig = filas.map((f) => f.originalidad);
  const eeat = filas.map((f) => f.eeat);
  const adn = filas.map((f) => f.adnNI);

  console.log('\n=== CORRELACIONES PEARSON ===');
  console.log(`V1 vs utilidad:     ${pearson(v1s, util).toFixed(3)}`);
  console.log(`V2 vs utilidad:     ${pearson(v2s, util).toFixed(3)}`);
  console.log(`V1 vs originalidad: ${pearson(v1s, orig).toFixed(3)}`);
  console.log(`V2 vs originalidad: ${pearson(v2s, orig).toFixed(3)}`);
  console.log(`V1 vs profundidad:  ${pearson(v1s, prof).toFixed(3)}`);
  console.log(`V2 vs profundidad:  ${pearson(v2s, prof).toFixed(3)}`);
  console.log(`V1 vs EEAT:         ${pearson(v1s, eeat).toFixed(3)}`);
  console.log(`V2 vs EEAT:         ${pearson(v2s, eeat).toFixed(3)}`);
  console.log(`V1 vs ADN:          ${pearson(v1s, adn).toFixed(3)}`);
  console.log(`V2 vs ADN:          ${pearson(v2s, adn).toFixed(3)}`);

  console.log('\n=== CORRELACIONES SPEARMAN ===');
  console.log(`V1 vs utilidad:     ${spearman(v1s, util).toFixed(3)}`);
  console.log(`V2 vs utilidad:     ${spearman(v2s, util).toFixed(3)}`);
  console.log(`V1 vs originalidad: ${spearman(v1s, orig).toFixed(3)}`);
  console.log(`V2 vs originalidad: ${spearman(v2s, orig).toFixed(3)}`);
  console.log(`V1 vs profundidad:  ${spearman(v1s, prof).toFixed(3)}`);
  console.log(`V2 vs profundidad:  ${spearman(v2s, prof).toFixed(3)}`);
  console.log(`V1 vs EEAT:         ${spearman(v1s, eeat).toFixed(3)}`);
  console.log(`V2 vs EEAT:         ${spearman(v2s, eeat).toFixed(3)}`);
  console.log(`V1 vs ADN:          ${spearman(v1s, adn).toFixed(3)}`);
  console.log(`V2 vs ADN:          ${spearman(v2s, adn).toFixed(3)}`);

  console.log('\n=== CASOS INCORRECTOS ===');
  const excelentesBajan = filas.filter((f) => f.v1 >= 95 && f.v2 < 95);
  const mediocresSuben = filas.filter((f) => f.v1 < 85 && f.v2 > 90);
  console.log(`Excelentes (V1>=95) que bajaron de rango: ${excelentesBajan.length}`);
  for (const f of excelentesBajan.slice(0, 5)) {
    console.log(`  ${f.slug}: V1=${f.v1} V2=${f.v2} Δ=${f.delta}`);
    printContribuciones(f);
  }
  console.log(`Mediocres (V1<85) que subieron por encima de 90: ${mediocresSuben.length}`);
  for (const f of mediocresSuben.slice(0, 5)) {
    console.log(`  ${f.slug}: V1=${f.v1} V2=${f.v2} Δ=${f.delta}`);
    printContribuciones(f);
  }

  const promedioV1 = v1s.reduce((s, v) => s + v, 0) / v1s.length;
  const promedioV2 = v2s.reduce((s, v) => s + v, 0) / v2s.length;
  console.log('\n=== RESUMEN ===');
  console.log(`Promedio V1: ${promedioV1.toFixed(2)}`);
  console.log(`Promedio V2: ${promedioV2.toFixed(2)}`);
  console.log(`Suben: ${filas.filter((f) => f.delta > 0).length} | Bajan: ${filas.filter((f) => f.delta < 0).length} | Iguales: ${filas.filter((f) => f.delta === 0).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
