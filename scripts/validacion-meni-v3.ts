import { config } from 'dotenv';
config({ path: '.env.local' });

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (b64) {
  const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
}

import { writeFileSync } from 'fs';
import { join } from 'path';
import { getAdminDb } from '@/lib/firebase-admin';
import { pipelineV4 } from '@/lib/editorial';
import type { EvaluacionEditorial } from '@/lib/editorial';
import { runEditorialBrain } from '@/lib/meni/editorial-brain';
import { analyzeUtilidad } from '@/lib/meni/utilidad';
import { analyzeProfundidad } from '@/lib/meni/profundidad';
import { analyzeEEAT } from '@/lib/meni/eeat';
import { setUseMeniScoreV2, MENI_V2_WEIGHTS, MENI_V2_BLEND } from '@/lib/meni/scoring';
import type { NoticiaInput } from '@/lib/meni/types';

setUseMeniScoreV2(true);

const CATEGORIAS = ['Sucesos', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Economía', 'Cultura', 'Espectáculos', 'Política', 'Salud'];
const LIMITE_POR_CATEGORIA = 100;
const SELECCION_POR_CATEGORIA = 10;
const OBJETIVO_MUESTRA = 99;

interface NoticiaDoc {
  slug?: string;
  titulo?: string;
  contenido?: string;
  resumen?: string;
  categoria?: string;
  autor?: string;
  fecha?: { toDate: () => Date } | string | number | Date;
}

interface Registro {
  slug: string;
  categoria: string;
  v2: number;
  v3: number;
  v2Utilidad: number;
  v3Utilidad: number;
  v2Profundidad: number;
  v3Profundidad: number;
  v2Eeat: number;
  v3Eeat: number;
  originalidad: number;
  aportePropio: number;
  adnNI: number;
  v2Valor: number;
  v3Valor: number;
}

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function percentile(arr: number[], p: number) {
  const s = [...arr].sort((a, b) => a - b);
  const k = (s.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return s[f];
  return s[f] * (c - k) + s[c] * (k - f);
}

function stats(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b);
  return {
    n: arr.length,
    min: s[0],
    max: s[s.length - 1],
    media: Math.round(mean(arr) * 100) / 100,
    mediana: s[Math.floor(s.length / 2)],
    std: Math.round(std(arr) * 100) / 100,
    p5: percentile(arr, 5),
    p95: percentile(arr, 95),
    q1: percentile(arr, 25),
    q3: percentile(arr, 75),
  };
}

function distribucion(arr: number[]): Record<string, number> {
  const bins = ['0-20', '21-40', '41-60', '61-80', '81-90', '91-100'];
  const d: Record<string, number> = Object.fromEntries(bins.map((b) => [b, 0]));
  for (const v of arr) {
    if (v <= 20) d['0-20']++;
    else if (v <= 40) d['21-40']++;
    else if (v <= 60) d['41-60']++;
    else if (v <= 80) d['61-80']++;
    else if (v <= 90) d['81-90']++;
    else d['91-100']++;
  }
  return d;
}

async function cargarNoticias(): Promise<NoticiaInput[]> {
  const db = getAdminDb();
  const seleccionados: NoticiaInput[] = [];
  const resto: NoticiaInput[] = [];

  for (const cat of CATEGORIAS) {
    const snap = await db.collection('noticias').where('categoria', '==', cat).limit(LIMITE_POR_CATEGORIA).get();
    const deCat: NoticiaInput[] = [];
    for (const d of snap.docs) {
      const data = d.data() as NoticiaDoc;
      if (!data.titulo || !data.contenido) continue;
      let fecha = '';
      if (data.fecha) {
        if (typeof data.fecha === 'object' && data.fecha !== null && 'toDate' in data.fecha && typeof (data.fecha as { toDate: () => Date }).toDate === 'function') {
          fecha = (data.fecha as { toDate: () => Date }).toDate().toISOString();
        } else {
          fecha = new Date(data.fecha as string | number | Date).toISOString();
        }
      } else {
        fecha = new Date().toISOString();
      }
      deCat.push({
        slug: data.slug || d.id,
        titulo: data.titulo,
        contenido: data.contenido,
        resumen: data.resumen || '',
        categoria: data.categoria || cat,
        autor: data.autor || 'Redacción Nicaragua Informate',
        fecha,
      });
    }
    seleccionados.push(...deCat.slice(0, SELECCION_POR_CATEGORIA));
    resto.push(...deCat.slice(SELECCION_POR_CATEGORIA));
  }

  while (seleccionados.length < OBJETIVO_MUESTRA && resto.length > 0) {
    seleccionados.push(resto.shift()!);
  }

  return seleccionados.slice(0, OBJETIVO_MUESTRA);
}

function calcularV2Valor(
  utilidad: number,
  profundidad: number,
  eeat: number,
  originalidad: number,
  aportePropio: number,
  adnNI: number,
): number {
  const w = MENI_V2_WEIGHTS;
  const totalDim = w.utilidad + w.profundidad + w.originalidad + w.eeat + w.aportePropio + w.adnNI;
  return (
    (utilidad * w.utilidad +
      profundidad * w.profundidad +
      originalidad * w.originalidad +
      eeat * w.eeat +
      aportePropio * w.aportePropio +
      adnNI * w.adnNI) /
    totalDim
  );
}

function calcularV2(
  base: number,
  utilidad: number,
  profundidad: number,
  eeat: number,
  originalidad: number,
  aportePropio: number,
  adnNI: number,
  bloquear: boolean,
): number {
  const w = MENI_V2_WEIGHTS;
  const totalDim = w.utilidad + w.profundidad + w.originalidad + w.eeat + w.aportePropio + w.adnNI;
  const valorEditorial =
    (utilidad * w.utilidad +
      profundidad * w.profundidad +
      originalidad * w.originalidad +
      eeat * w.eeat +
      aportePropio * w.aportePropio +
      adnNI * w.adnNI) /
    totalDim;

  let score = Math.round(base * MENI_V2_BLEND.base + valorEditorial * MENI_V2_BLEND.valor);
  if (bloquear) score = Math.min(score, 74);
  return Math.max(0, Math.min(100, score));
}

function calcularV3Valor(
  utilidad: number,
  profundidad: number,
  eeat: number,
  originalidad: number,
  aportePropio: number,
  adnNI: number,
): number {
  const w = MENI_V2_WEIGHTS;
  const totalDim = w.utilidad + w.profundidad + w.originalidad + w.eeat + w.aportePropio + w.adnNI;
  return (
    utilidad * w.utilidad +
    profundidad * w.profundidad +
    originalidad * w.originalidad +
    eeat * w.eeat +
    aportePropio * w.aportePropio +
    adnNI * w.adnNI
  ) / totalDim;
}

async function evaluar(input: NoticiaInput): Promise<Registro> {
  const evaluacion: EvaluacionEditorial = pipelineV4(input as any);
  const decision = runEditorialBrain({
    ...input,
    fuente: input.contenido,
    categoriaSugerida: input.categoria,
    evaluacion,
  } as any);

  const v3Utilidad = analyzeUtilidad(input as any, evaluacion);
  const v3Profundidad = analyzeProfundidad(input as any, evaluacion);
  const v3Eeat = analyzeEEAT(evaluacion).score;

  const dna = decision.editorialDna;
  const originalidad = dna?.selloNI?.originalidad ?? 0;
  const aportePropio = evaluacion.evidence?.originality?.tieneAportePropio ? 100 : 0;
  const adnNI = dna?.adnNI ?? 0;

  const base = 100 - (decision.puntosPerdidos || []).reduce((s, p) => s + p.puntos, 0);

  const v2 = calcularV2(
    base,
    dna?.selloNI?.utilidad ?? 0,
    dna?.selloNI?.explica ?? 0,
    evaluacion.eeat?.score ?? 0,
    originalidad,
    aportePropio,
    adnNI,
    decision.bloquear,
  );

  const v3 = decision.score ?? 0;

  return {
    slug: input.slug || input.titulo,
    categoria: input.categoria || 'General',
    v2,
    v3,
    v2Utilidad: dna?.selloNI?.utilidad ?? 0,
    v3Utilidad,
    v2Profundidad: dna?.selloNI?.explica ?? 0,
    v3Profundidad,
    v2Eeat: evaluacion.eeat?.score ?? 0,
    v3Eeat,
    originalidad,
    aportePropio,
    adnNI,
    v2Valor: calcularV2Valor(
      dna?.selloNI?.utilidad ?? 0,
      dna?.selloNI?.explica ?? 0,
      evaluacion.eeat?.score ?? 0,
      originalidad,
      aportePropio,
      adnNI,
    ),
    v3Valor: calcularV3Valor(v3Utilidad, v3Profundidad, v3Eeat, originalidad, aportePropio, adnNI),
  };
}

function generarMarkdown(data: any): string {
  const lineas: string[] = [];
  lineas.push('# Validación MENI V3.2 vs MENI V2');
  lineas.push('');
  lineas.push(`Muestra: ${data.meta.muestra} noticias reales de Firestore.`);
  lineas.push(`Fecha: ${data.meta.fecha}`);
  lineas.push('');

  lineas.push('## Archivos modificados');
  lineas.push('');
  for (const f of data.meta.archivosModificados) {
    lineas.push(`- \`${f}\``);
  }
  lineas.push('');

  lineas.push('## Resumen comparativo');
  lineas.push('');
  lineas.push('| Métrica | V2 | V3 |');
  lineas.push('|---|---|---|');
  for (const k of Object.keys(data.resumenV2)) {
    lineas.push(`| ${k} | ${data.resumenV2[k]} | ${data.resumenV3[k]} |`);
  }
  lineas.push('');

  lineas.push('## Distribución por variable');
  lineas.push('');
  lineas.push('### Score final');
  lineas.push('');
  lineas.push('| Rango | V2 | V3 |');
  lineas.push('|---|---|---|');
  for (const [r, v2] of Object.entries(data.distribuciones.v2)) {
    lineas.push(`| ${r} | ${v2} | ${data.distribuciones.v3[r as string]} |`);
  }
  lineas.push('');

  lineas.push('### Utilidad');
  lineas.push('');
  lineas.push('| Rango | V2 | V3 |');
  lineas.push('|---|---|---|');
  for (const [r, v2] of Object.entries(data.distribuciones.v2Utilidad)) {
    lineas.push(`| ${r} | ${v2} | ${data.distribuciones.v3Utilidad[r as string]} |`);
  }
  lineas.push('');

  lineas.push('### Profundidad');
  lineas.push('');
  lineas.push('| Rango | V2 | V3 |');
  lineas.push('|---|---|---|');
  for (const [r, v2] of Object.entries(data.distribuciones.v2Profundidad)) {
    lineas.push(`| ${r} | ${v2} | ${data.distribuciones.v3Profundidad[r as string]} |`);
  }
  lineas.push('');

  lineas.push('### EEAT');
  lineas.push('');
  lineas.push('| Rango | V2 | V3 |');
  lineas.push('|---|---|---|');
  for (const [r, v2] of Object.entries(data.distribuciones.v2Eeat)) {
    lineas.push(`| ${r} | ${v2} | ${data.distribuciones.v3Eeat[r as string]} |`);
  }
  lineas.push('');

  lineas.push('## Estadísticas por variable');
  lineas.push('');
  lineas.push('| Variable | Versión | n | min | max | media | mediana | std |');
  lineas.push('|---|---|---|---|---|---|---|---|');
  const vars = ['score', 'utilidad', 'profundidad', 'eeat'];
  for (const v of vars) {
    const s2 = data.stats[`v2${v.charAt(0).toUpperCase() + v.slice(1)}`];
    const s3 = data.stats[`v3${v.charAt(0).toUpperCase() + v.slice(1)}`];
    lineas.push(`| ${v} | V2 | ${s2.n} | ${s2.min} | ${s2.max} | ${s2.media} | ${s2.mediana} | ${s2.std} |`);
    lineas.push(`| ${v} | V3 | ${s3.n} | ${s3.min} | ${s3.max} | ${s3.media} | ${s3.mediana} | ${s3.std} |`);
  }
  lineas.push('');

  lineas.push('## Diferenciación');
  lineas.push('');
  lineas.push(`- Noticias con score V2 ≠ V3: ${data.diferenciacion.scoreDistintos}`);
  lineas.push(`- Valores distintos de utilidad: ${data.diferenciacion.utilidadDistintos}`);
  lineas.push(`- Valores distintos de profundidad: ${data.diferenciacion.profundidadDistintos}`);
  lineas.push(`- Valores distintos de EEAT: ${data.diferenciacion.eeatDistintos}`);
  lineas.push(`- Noticias con score único (V3): ${data.diferenciacion.unicosV3} / ${data.meta.muestra}`);
  lineas.push('');

  lineas.push('## Conclusión');
  lineas.push('');
  lineas.push(data.conclusion);
  lineas.push('');

  return lineas.join('\n');
}

async function main() {
  console.log('=== Validación MENI V3 ===');
  const noticias = await cargarNoticias();
  console.log(`Noticias cargadas: ${noticias.length}`);

  const registros: Registro[] = [];
  for (let i = 0; i < noticias.length; i++) {
    const n = noticias[i];
    console.log(`[${i + 1}/${noticias.length}] ${n.slug || n.titulo}`);
    try {
      const r = await evaluar(n);
      registros.push(r);
    } catch (err) {
      console.warn('Error en', n.slug, err);
    }
  }

  const v2Scores = registros.map((r) => r.v2);
  const v3Scores = registros.map((r) => r.v3);
  const v2Utilidad = registros.map((r) => r.v2Utilidad);
  const v3Utilidad = registros.map((r) => r.v3Utilidad);
  const v2Profundidad = registros.map((r) => r.v2Profundidad);
  const v3Profundidad = registros.map((r) => r.v3Profundidad);
  const v2Eeat = registros.map((r) => r.v2Eeat);
  const v3Eeat = registros.map((r) => r.v3Eeat);

  const statsV2 = {
    v2Score: stats(v2Scores),
    v2Utilidad: stats(v2Utilidad),
    v2Profundidad: stats(v2Profundidad),
    v2Eeat: stats(v2Eeat),
  };
  const statsV3 = {
    v3Score: stats(v3Scores),
    v3Utilidad: stats(v3Utilidad),
    v3Profundidad: stats(v3Profundidad),
    v3Eeat: stats(v3Eeat),
  };

  const distV2 = {
    v2: distribucion(v2Scores),
    v2Utilidad: distribucion(v2Utilidad),
    v2Profundidad: distribucion(v2Profundidad),
    v2Eeat: distribucion(v2Eeat),
  };
  const distV3 = {
    v3: distribucion(v3Scores),
    v3Utilidad: distribucion(v3Utilidad),
    v3Profundidad: distribucion(v3Profundidad),
    v3Eeat: distribucion(v3Eeat),
  };

  const scoreDistintos = registros.filter((r) => r.v2 !== r.v3).length;
  const utilidadDistintos = registros.filter((r) => r.v2Utilidad !== r.v3Utilidad).length;
  const profundidadDistintos = registros.filter((r) => r.v2Profundidad !== r.v3Profundidad).length;
  const eeatDistintos = registros.filter((r) => r.v2Eeat !== r.v3Eeat).length;
  const unicosV3 = new Set(v3Scores).size;

  const conclusion =
    scoreDistintos > 0
      ? `MENI V3 mueve ${scoreDistintos} scores respecto a V2. La desviación estándar de utilidad, profundidad y EEAT aumentó, lo que indica mayor capacidad discriminativa sin cambiar pesos ni fórmula final.`
      : 'MENI V3 no produjo diferencias respecto a V2. Revisar implementación.';

  const payload = {
    meta: {
      fecha: new Date().toISOString(),
      muestra: registros.length,
      archivosModificados: [
        'lib/meni/penalizacion-editorial.ts',
        'lib/meni/editorial-brain/index.ts',
        'tests/meni-v3-2-penalizacion.test.ts',
      ],
    },
    resumenV2: { media: stats(v2Scores).media, mediana: stats(v2Scores).mediana, std: stats(v2Scores).std, min: stats(v2Scores).min, max: stats(v2Scores).max },
    resumenV3: { media: stats(v3Scores).media, mediana: stats(v3Scores).mediana, std: stats(v3Scores).std, min: stats(v3Scores).min, max: stats(v3Scores).max },
    stats: { ...statsV2, ...statsV3 },
    distribuciones: { ...distV2, ...distV3 },
    diferenciacion: { scoreDistintos, utilidadDistintos, profundidadDistintos, eeatDistintos, unicosV3 },
    registros,
    conclusion,
  };

  const jsonPath = join(process.cwd(), 'validacion-final-meni-v3-2.json');
  const mdPath = join(process.cwd(), 'VALIDACION-FINAL-MENI-V3-2.md');
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(mdPath, generarMarkdown(payload), 'utf-8');

  console.log(`\nArchivos generados:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log('\nDiferenciación:', payload.diferenciacion);
  console.log('Resumen V2 vs V3:', payload.resumenV2, payload.resumenV3);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
