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
import { setUseMeniScoreV2, MENI_V2_WEIGHTS, MENI_V2_BLEND } from '@/lib/meni/scoring';
import { runMeni } from '@/lib/meni/core';
import { getAdminDb } from '@/lib/firebase-admin';
import type { MeniResult, NoticiaInput } from '@/lib/meni/types';

const CATEGORIAS = ['Sucesos', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Economía', 'Cultura', 'Espectáculos', 'Política', 'Salud'];
const LIMITE_POR_CATEGORIA = 20;
const OBJETIVO_MUESTRA = 100;

interface NoticiaDoc {
  slug?: string;
  titulo?: string;
  contenido?: string;
  resumen?: string;
  categoria?: string;
  autor?: string;
  fecha?: { toDate: () => Date } | string | number | Date;
}

interface ResultadoNoticia {
  slug: string;
  categoria: string;
  v1: number;
  v2: number;
  delta: number;
  utilidad: number;
  profundidad: number;
  originalidad: number;
  eeat: number;
  adnNI: number;
  aportePropio: number;
  puntosPerdidos: number;
  problemas: number;
  originalidadPct: number;
  exclusividadPct: number;
  wowPct: number;
  transcripcionPct: number;
  adnDetalle: { exclusividad: number; wow: number; selloNI: number; transcripcion: number; memoria: number } | null;
  motivosBloqueo: string[];
}

interface Caso {
  slug: string;
  categoria: string;
  v1: number;
  v2: number;
  delta: number;
  razon: string;
  variables: Record<string, number | boolean>;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  if (n % 2 === 0) return (s[n / 2 - 1] + s[n / 2]) / 2;
  return s[Math.floor(n / 2)];
}

function percentile(arr: number[], p: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const k = (s.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return s[f];
  return s[f] * (c - k) + s[c] * (k - f);
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  if (n === 0) return 0;
  const ma = mean(a);
  const mb = mean(b);
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function cargarNoticias(): Promise<NoticiaInput[]> {
  const db = getAdminDb();
  const porCat: NoticiaInput[] = [];
  const vistos = new Set<string>();

  for (const cat of CATEGORIAS) {
    const snap = await db
      .collection('noticias')
      .where('categoria', '==', cat)
      .limit(LIMITE_POR_CATEGORIA)
      .get();

    for (const d of snap.docs) {
      const data = d.data() as NoticiaDoc;
      const slug = data.slug || d.id;
      if (vistos.has(slug)) continue;
      vistos.add(slug);
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

      porCat.push({
        slug,
        titulo: data.titulo || '',
        contenido: data.contenido || '',
        resumen: data.resumen || '',
        categoria: data.categoria || 'General',
        autor: data.autor || 'Redacción Nicaragua Informate',
        fecha,
      });
    }
  }

  // Equilibrar: hasta 13 por categoría para acercarse a 100
  const seleccionados: NoticiaInput[] = [];
  const resto: NoticiaInput[] = [];
  for (const cat of CATEGORIAS) {
    const deCat = porCat.filter((n) => n.categoria === cat);
    seleccionados.push(...deCat.slice(0, 10));
    resto.push(...deCat.slice(10));
  }

  while (seleccionados.length < OBJETIVO_MUESTRA && resto.length > 0) {
    seleccionados.push(resto.shift()!);
  }

  return seleccionados.slice(0, OBJETIVO_MUESTRA);
}

async function evaluarNoticias(noticias: NoticiaInput[]): Promise<ResultadoNoticia[]> {
  const resultados: ResultadoNoticia[] = [];

  // V1
  setUseMeniScoreV2(false);
  const v1: MeniResult[] = [];
  for (const n of noticias) {
    try {
      v1.push(runMeni(n));
    } catch (err) {
      v1.push({ scoreFinal: -1, categoria: n.categoria } as unknown as MeniResult);
    }
  }

  // V2
  setUseMeniScoreV2(true);
  const v2: MeniResult[] = [];
  for (const n of noticias) {
    try {
      v2.push(runMeni(n));
    } catch (err) {
      v2.push({ scoreFinal: -1, categoria: n.categoria } as unknown as MeniResult);
    }
  }

  for (let i = 0; i < noticias.length; i++) {
    const r2 = v2[i];
    const dna = r2.editorialDna;
    const puntos = (r2.puntosPerdidos || []).reduce((s, p) => s + p.puntos, 0);
    const problemas = (r2.blockingIssues?.length || 0) + (r2.warnings?.length || 0);
    const motivos: string[] = [];
    if (r2.blockingIssues?.length) {
      for (const b of r2.blockingIssues.slice(0, 3)) {
        motivos.push(`${b.code}: ${b.title}`);
      }
    }
    if (r2.warnings?.length) {
      for (const w of r2.warnings.slice(0, 2)) {
        motivos.push(`${w.code}: ${w.title}`);
      }
    }

    resultados.push({
      slug: noticias[i].slug || noticias[i].titulo,
      categoria: noticias[i].categoria || 'General',
      v1: v1[i].scoreFinal,
      v2: r2.scoreFinal,
      delta: r2.scoreFinal - v1[i].scoreFinal,
      utilidad: dna?.selloNI?.utilidad ?? 0,
      profundidad: dna?.selloNI?.explica ?? 0,
      originalidad: dna?.selloNI?.originalidad ?? 0,
      eeat: r2.eeat?.score ?? 0,
      adnNI: dna?.adnNI ?? 0,
      aportePropio: r2.valorEditorial?.aportePropio ? 100 : 0,
      puntosPerdidos: puntos,
      problemas,
      originalidadPct: dna?.selloNI?.originalidad ?? 0,
      exclusividadPct: dna?.exclusividad?.score ?? 0,
      wowPct: dna?.wow?.score ?? 0,
      transcripcionPct: dna?.transcripcion?.score ?? 0,
      adnDetalle: dna
        ? {
            exclusividad: dna.exclusividad?.score ?? 0,
            wow: dna.wow?.score ?? 0,
            selloNI: dna.selloNI
              ? Object.values(dna.selloNI).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0) /
                Object.values(dna.selloNI).filter((v) => typeof v === 'number').length
              : 0,
            transcripcion: dna.transcripcion?.score ?? 0,
            memoria: dna.memoria?.score ?? 0,
          }
        : null,
      motivosBloqueo: motivos,
    });
  }

  return resultados.filter((r) => r.v1 >= 0 && r.v2 >= 0);
}

function estadisticas(arr: number[]) {
  return {
    n: arr.length,
    media: round2(mean(arr)),
    mediana: round2(median(arr)),
    std: round2(std(arr)),
    p5: round2(percentile(arr, 5)),
    p25: round2(percentile(arr, 25)),
    p75: round2(percentile(arr, 75)),
    p95: round2(percentile(arr, 95)),
    min: Math.min(...arr),
    max: Math.max(...arr),
  };
}

function correlaciones(lista: ResultadoNoticia[]) {
  const v1s = lista.map((r) => r.v1);
  const v2s = lista.map((r) => r.v2);
  const variables = ['utilidad', 'profundidad', 'originalidad', 'eeat', 'adnNI', 'aportePropio'] as const;
  const pearsonV1: Record<string, number> = {};
  const pearsonV2: Record<string, number> = {};
  const spearmanV1: Record<string, number> = {};
  const spearmanV2: Record<string, number> = {};

  for (const v of variables) {
    const vals = lista.map((r) => r[v as keyof ResultadoNoticia] as number);
    pearsonV1[v] = round2(pearson(v1s, vals));
    pearsonV2[v] = round2(pearson(v2s, vals));
    spearmanV1[v] = round2(spearman(v1s, vals));
    spearmanV2[v] = round2(spearman(v2s, vals));
  }

  return { pearsonV1, pearsonV2, spearmanV1, spearmanV2 };
}

function matrizInfluencia(lista: ResultadoNoticia[]) {
  const v1s = lista.map((r) => r.v1);
  const v2s = lista.map((r) => r.v2);
  const w = MENI_V2_WEIGHTS;

  const variables: { key: keyof ResultadoNoticia; label: string; peso: number }[] = [
    { key: 'utilidad', label: 'utilidad', peso: w.utilidad },
    { key: 'profundidad', label: 'profundidad', peso: w.profundidad },
    { key: 'originalidad', label: 'originalidad', peso: w.originalidad },
    { key: 'eeat', label: 'EEAT', peso: w.eeat },
    { key: 'aportePropio', label: 'aporte propio', peso: w.aportePropio },
    { key: 'adnNI', label: 'ADN', peso: w.adnNI },
  ];

  const tecnicaV1 = std(lista.map((r) => r.puntosPerdidos));
  const tecnicaV2 = tecnicaV1 * MENI_V2_BLEND.base;

  const filas = variables.map(({ key, label, peso }) => {
    const vals = lista.map((r) => r[key] as number);
    const desv = std(vals);
    const corrV1 = Math.abs(round2(pearson(v1s, vals)));
    const corrV2 = Math.abs(round2(pearson(v2s, vals)));
    const influenciaV2 = round2(desv * peso * MENI_V2_BLEND.valor);
    return {
      variable: label,
      influenciaV1: corrV1,
      influenciaV2,
      correlacionV1: corrV1,
      correlacionV2: corrV2,
      desviacion: round2(desv),
      peso,
    };
  });

  filas.push({
    variable: 'técnica',
    influenciaV1: round2(tecnicaV1 / 100),
    influenciaV2: round2(tecnicaV2),
    correlacionV1: round2(Math.abs(pearson(v1s, lista.map((r) => r.puntosPerdidos)))),
    correlacionV2: round2(Math.abs(pearson(v2s, lista.map((r) => r.puntosPerdidos)))),
    desviacion: round2(tecnicaV1),
    peso: MENI_V2_BLEND.base,
  });

  return filas;
}

function casosFase3(lista: ResultadoNoticia[]) {
  const penalizados = lista
    .filter((r) => r.v1 >= 90 && (r.originalidad < 70 || r.eeat < 70 || r.profundidad < 70 || r.aportePropio < 50))
    .sort((a, b) => a.v2 - b.v2)
    .slice(0, 5)
    .map((r) => ({
      slug: r.slug,
      categoria: r.categoria,
      v1: r.v1,
      v2: r.v2,
      delta: r.delta,
      originalidad: r.originalidad,
      eeat: r.eeat,
      profundidad: r.profundidad,
      aportePropio: r.aportePropio,
    }));

  const recompensados = lista
    .filter((r) => r.v1 >= 70 && r.v1 <= 85 && r.originalidad >= 80 && r.eeat >= 80 && r.profundidad >= 80 && r.aportePropio >= 80)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map((r) => ({
      slug: r.slug,
      categoria: r.categoria,
      v1: r.v1,
      v2: r.v2,
      delta: r.delta,
      originalidad: r.originalidad,
      eeat: r.eeat,
      profundidad: r.profundidad,
      aportePropio: r.aportePropio,
    }));

  return { penalizados, recompensados };
}

function casosAnomalos(lista: ResultadoNoticia[]): { excelentesBajan: Caso[]; malasSuben: Caso[] } {
  const excelentesBajan: Caso[] = [];
  const malasSuben: Caso[] = [];

  for (const r of lista) {
    if (r.v1 >= 95 && r.v2 <= 80) {
      const variables: Record<string, number | boolean> = {
        originalidad: r.originalidad,
        eeat: r.eeat,
        profundidad: r.profundidad,
        aportePropio: r.aportePropio,
        adnNI: r.adnNI,
      };
      const bajas = Object.entries(variables).filter(([, v]) => typeof v === 'number' && v < 70).map(([k]) => k);
      excelentesBajan.push({
        slug: r.slug,
        categoria: r.categoria,
        v1: r.v1,
        v2: r.v2,
        delta: r.delta,
        razon: `V1 excelente pero dimensiones bajas: ${bajas.join(', ') || 'ninguna clara'}`,
        variables,
      });
    }
    if (r.v1 < 70 && r.v2 > 90) {
      const variables: Record<string, number | boolean> = {
        originalidad: r.originalidad,
        eeat: r.eeat,
        profundidad: r.profundidad,
        aportePropio: r.aportePropio,
        adnNI: r.adnNI,
      };
      malasSuben.push({
        slug: r.slug,
        categoria: r.categoria,
        v1: r.v1,
        v2: r.v2,
        delta: r.delta,
        razon: `V1 bajo pero V2 alto; dimensiones altas`,
        variables,
      });
    }
  }

  return {
    excelentesBajan: excelentesBajan.sort((a, b) => a.delta - b.delta).slice(0, 10),
    malasSuben: malasSuben.sort((a, b) => b.delta - a.delta).slice(0, 10),
  };
}

function recomendacionesPesos(lista: ResultadoNoticia[]) {
  const w = MENI_V2_WEIGHTS;
  const variables = [
    { key: 'utilidad', label: 'utilidad', peso: w.utilidad },
    { key: 'profundidad', label: 'profundidad', peso: w.profundidad },
    { key: 'originalidad', label: 'originalidad', peso: w.originalidad },
    { key: 'eeat', label: 'EEAT', peso: w.eeat },
    { key: 'aportePropio', label: 'aporte propio', peso: w.aportePropio },
    { key: 'adnNI', label: 'ADN NI', peso: w.adnNI },
  ] as const;

  const sens: { label: string; peso: number; desviacion: number; sensibilidad: number }[] = [];
  for (const { key, label, peso } of variables) {
    const vals = lista.map((r) => r[key] as number);
    const desv = std(vals);
    const sensibilidad = desv * peso * MENI_V2_BLEND.valor;
    sens.push({ label, peso, desviacion: desv, sensibilidad });
  }

  const total = sens.reduce((s, v) => s + v.sensibilidad, 0);
  const recs: { variable: string; razon: string; accion: 'reducir' | 'mantener' | 'redistribuir' }[] = [];

  for (const s of sens) {
    const ratio = total > 0 ? s.sensibilidad / total : 0;
    if (s.sensibilidad < 0.5) {
      recs.push({ variable: s.label, razon: `desviación baja (${round2(s.desviacion)}) y sensibilidad ${round2(s.sensibilidad)} (< 0.5)`, accion: 'reducir' });
    } else if (ratio > 0.35) {
      recs.push({ variable: s.label, razon: `domina el ${round2(ratio * 100)}% del movimiento del score`, accion: 'reducir' });
    } else {
      recs.push({ variable: s.label, razon: `aporta proporcionalmente (${round2(ratio * 100)}%)`, accion: 'mantener' });
    }
  }

  return { sensibilidades: sens.map((s) => ({ ...s, sensibilidad: round2(s.sensibilidad) })), recomendaciones: recs };
}

function generarMarkdown(payload: unknown): string {
  const data = payload as any;
  const lineas: string[] = [];
  lineas.push('# Validación Final MENI Score V2');
  lineas.push('');
  lineas.push(`Muestra: ${data.meta.muestra} noticias reales de Firestore.`);
  lineas.push(`Fecha: ${data.meta.fecha}`);
  lineas.push('');

  lineas.push('## 1. Distribución de scores');
  lineas.push('');
  lineas.push('| Métrica | V1 | V2 |');
  lineas.push('|---|---|---|');
  const d1 = data.estadisticas.v1;
  const d2 = data.estadisticas.v2;
  for (const k of Object.keys(d1)) {
    lineas.push(`| ${k} | ${d1[k]} | ${d2[k]} |`);
  }
  lineas.push('');

  lineas.push('## 2. Correlaciones');
  lineas.push('');
  lineas.push('| Variable | Pearson V1 | Pearson V2 | Spearman V1 | Spearman V2 |');
  lineas.push('|---|---|---|---|---|');
  const variables = ['utilidad', 'profundidad', 'originalidad', 'eeat', 'adnNI', 'aportePropio'];
  for (const v of variables) {
    lineas.push(`| ${v} | ${data.correlaciones.pearsonV1[v]} | ${data.correlaciones.pearsonV2[v]} | ${data.correlaciones.spearmanV1[v]} | ${data.correlaciones.spearmanV2[v]} |`);
  }
  lineas.push('');

  lineas.push('## 3. Matriz de influencia');
  lineas.push('');
  lineas.push('| Variable | Influencia V1 | Influencia V2 | Desviación | Peso |');
  lineas.push('|---|---|---|---|---|');
  for (const f of data.influencia) {
    lineas.push(`| ${f.variable} | ${f.influenciaV1} | ${f.influenciaV2} | ${f.desviacion} | ${f.peso} |`);
  }
  lineas.push('');

  lineas.push('## 4. Casos V1 alto / dimensiones bajas (V2 penaliza)');
  lineas.push('');
  for (const c of data.fase3.penalizados) {
    lineas.push(`- **${c.slug}** (${c.categoria}): V1=${c.v1} → V2=${c.v2} (Δ${c.delta}). orig=${c.originalidad} eeat=${c.eeat} prof=${c.profundidad} aporte=${c.aportePropio}`);
  }
  lineas.push('');

  lineas.push('## 5. Casos V1 medio / dimensiones altas (V2 recompensa)');
  lineas.push('');
  for (const c of data.fase3.recompensados) {
    lineas.push(`- **${c.slug}** (${c.categoria}): V1=${c.v1} → V2=${c.v2} (Δ${c.delta}). orig=${c.originalidad} eeat=${c.eeat} prof=${c.profundidad} aporte=${c.aportePropio}`);
  }
  lineas.push('');

  lineas.push('## 6. Casos anómalos');
  lineas.push('');
  lineas.push(`Excelentes que bajan demasiado: ${data.anomalias.excelentesBajan.length}`);
  for (const c of data.anomalias.excelentesBajan) {
    lineas.push(`- ${c.slug} (${c.categoria}): V1=${c.v1} → V2=${c.v2}. ${c.razon}`);
  }
  lineas.push(`Malas que suben demasiado: ${data.anomalias.malasSuben.length}`);
  for (const c of data.anomalias.malasSuben) {
    lineas.push(`- ${c.slug} (${c.categoria}): V1=${c.v1} → V2=${c.v2}. ${c.razon}`);
  }
  lineas.push('');

  lineas.push('## 7. Recomendaciones de pesos (FASE 7)');
  lineas.push('');
  for (const r of data.recomendacionesPesos.recomendaciones) {
    lineas.push(`- **${r.variable}**: ${r.accion} — ${r.razon}`);
  }
  lineas.push('');

  lineas.push('## 8. Conclusión');
  lineas.push('');
  lineas.push(data.conclusion);
  lineas.push('');

  return lineas.join('\n');
}

async function main() {
  console.log('=== Validación Final MENI Score V2 ===');
  console.log('Cargando noticias reales de Firestore...');
  const noticias = await cargarNoticias();
  console.log(`Noticias cargadas: ${noticias.length}`);

  console.log('Evaluando V1 y V2...');
  const resultados = await evaluarNoticias(noticias);
  console.log(`Resultados válidos: ${resultados.length}`);

  const statsV1 = estadisticas(resultados.map((r) => r.v1));
  const statsV2 = estadisticas(resultados.map((r) => r.v2));
  const corr = correlaciones(resultados);
  const influencia = matrizInfluencia(resultados);
  const fase3 = casosFase3(resultados);
  const anomalias = casosAnomalos(resultados);
  const pesos = recomendacionesPesos(resultados);

  const mejoraOriginalidad = corr.pearsonV2.originalidad - corr.pearsonV1.originalidad;
  const mejoraEEAT = corr.pearsonV2.eeat - corr.pearsonV1.eeat;
  const conclusion =
    `V2 mejora la correlación con originalidad (Δ${round2(mejoraOriginalidad)}) y EEAT (Δ${round2(mejoraEEAT)}). ` +
    `Promedio V1=${statsV1.media}, V2=${statsV2.media}. ` +
    `Anomalías: ${anomalias.excelentesBajan.length} excelentes bajan demasiado, ${anomalias.malasSuben.length} malas suben demasiado.`;

  const payload = {
    meta: {
      fecha: new Date().toISOString(),
      muestra: resultados.length,
      categorias: [...new Set(resultados.map((r) => r.categoria))],
      versiones: { v1: 'MENI Score V1', v2: 'MENI Score V2' },
    },
    perNoticia: resultados,
    estadisticas: { v1: statsV1, v2: statsV2 },
    correlaciones: corr,
    influencia,
    fase3,
    anomalias,
    recomendacionesPesos: pesos,
    conclusion,
  };

  const md = generarMarkdown(payload);
  const jsonPath = join(process.cwd(), 'validacion-final-meni-v2.json');
  const mdPath = join(process.cwd(), 'VALIDACION-FINAL-MENI-V2.md');

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(mdPath, md, 'utf-8');

  console.log(`\nArchivos generados:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log('\nResumen:');
  console.log(`  Muestra: ${resultados.length}`);
  console.log(`  V1 media/mediana: ${statsV1.media} / ${statsV1.mediana}`);
  console.log(`  V2 media/mediana: ${statsV2.media} / ${statsV2.mediana}`);
  console.log(`  Suben: ${resultados.filter((r) => r.delta > 0).length}`);
  console.log(`  Bajan: ${resultados.filter((r) => r.delta < 0).length}`);
  console.log(`  Iguales: ${resultados.filter((r) => r.delta === 0).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
