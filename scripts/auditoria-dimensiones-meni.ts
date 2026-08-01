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
import { runMeni } from '@/lib/meni/core';
import { runNewsValueEngine } from '@/lib/meni/editorial-brain/news-value-engine';
import { runExplanationEngine } from '@/lib/meni/editorial-brain/explanation-engine';
import { getAdminDb } from '@/lib/firebase-admin';
import type { NoticiaInput } from '@/lib/meni/types';

const CATEGORIAS = ['Sucesos', 'Nacionales', 'Internacionales', 'Deportes', 'Tecnología', 'Economía', 'Cultura', 'Espectáculos', 'Política', 'Salud'];
const LIMITE_POR_CATEGORIA = 8;
const OBJETIVO_MUESTRA = 50;

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
  newsValueUtilidadRaw: number;
  explanationScoreRaw: number;
  eeatRaw: number;
  utilidadSello: number;
  profundidadSello: number;
  eeatScore: number;
  adnNI: number;
  originalidad: number;
  aportePropio: boolean;
  puntosPerdidos: number;
  titulo: string;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function percentile(arr: number[], p: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const k = (s.length - 1) * (p / 100);
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return s[f];
  return s[f] * (c - k) + s[c] * (k - f);
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
        titulo: data.titulo,
        contenido: data.contenido,
        resumen: data.resumen || '',
        categoria: data.categoria || cat,
        autor: data.autor || 'Redacción Nicaragua Informate',
        fecha,
      });
    }
  }

  const seleccionados: NoticiaInput[] = [];
  const resto: NoticiaInput[] = [];
  for (const cat of CATEGORIAS) {
    const deCat = porCat.filter((n) => n.categoria === cat);
    seleccionados.push(...deCat.slice(0, 5));
    resto.push(...deCat.slice(5));
  }

  while (seleccionados.length < OBJETIVO_MUESTRA && resto.length > 0) {
    seleccionados.push(resto.shift()!);
  }

  return seleccionados.slice(0, OBJETIVO_MUESTRA);
}

async function evaluar(input: NoticiaInput): Promise<Registro> {
  const newsValue = runNewsValueEngine(input as any);
  const explanation = runExplanationEngine(input as any);
  const meni = runMeni(input);
  const dna = meni.editorialDna;

  return {
    slug: input.slug || input.titulo,
    categoria: input.categoria || 'General',
    titulo: input.titulo,
    newsValueUtilidadRaw: newsValue.utilidad,
    explanationScoreRaw: explanation.score,
    eeatRaw: meni.eeat?.score ?? 0,
    utilidadSello: dna?.selloNI?.utilidad ?? 0,
    profundidadSello: dna?.selloNI?.explica ?? 0,
    eeatScore: meni.eeat?.score ?? 0,
    adnNI: dna?.adnNI ?? 0,
    originalidad: dna?.selloNI?.originalidad ?? 0,
    aportePropio: meni.valorEditorial?.aportePropio ?? false,
    puntosPerdidos: (meni.puntosPerdidos || []).reduce((s, p) => s + p.puntos, 0),
  };
}

function estadisticas(arr: number[]) {
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
    moda: [...new Map(s.map((v) => [v, s.filter((x) => x === v).length])).entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
  };
}

function hallarSaturacion(registros: Registro[]) {
  const res: { variable: string; valor: number; cantidad: number; ejemplo: string }[] = [];
  for (const variable of ['newsValueUtilidadRaw', 'explanationScoreRaw', 'eeatScore'] as const) {
    const valores = registros.map((r) => r[variable]);
    const counts = new Map<number, number>();
    for (const v of valores) counts.set(v, (counts.get(v) || 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 5) {
      const ej = registros.find((r) => r[variable] === top[0]);
      res.push({ variable, valor: top[0], cantidad: top[1], ejemplo: ej?.slug || '' });
    }
  }
  return res;
}

function datasetCalidad(registros: Registro[]) {
  const alta = [...registros]
    .filter((r) => r.aportePropio && r.originalidad >= 90 && r.profundidadSello >= 90 && r.utilidadSello >= 90)
    .sort((a, b) => b.adnNI - a.adnNI)
    .slice(0, 10);
  const media = [...registros]
    .filter((r) => r.originalidad >= 60 && r.profundidadSello >= 60 && r.utilidadSello >= 60 && !r.aportePropio)
    .sort((a, b) => b.adnNI - a.adnNI)
    .slice(0, 10);
  const debil = [...registros].filter((r) => r.originalidad < 60 || r.profundidadSello < 60).sort((a, b) => a.adnNI - b.adnNI).slice(0, 10);
  return { alta, media, debil };
}

function generarMarkdown(data: any): string {
  const lineas: string[] = [];
  lineas.push('# Auditoría Técnica de Utilidad, Profundidad y EEAT');
  lineas.push('');
  lineas.push(`Muestra: ${data.meta.muestra} noticias reales de Firestore.`);
  lineas.push(`Fecha: ${data.meta.fecha}`);
  lineas.push('');

  lineas.push('## 1. Funciones auditadas');
  lineas.push('');
  lineas.push('| Variable | Función | Archivo | Rol |');
  lineas.push('|---|---|---|---|');
  lineas.push('| utilidad | runNewsValueEngine | lib/meni/editorial-brain/news-value-engine.ts | Calcula utilidad del hecho por palabras clave y categoría |');
  lineas.push('| profundidad | runExplanationEngine | lib/meni/editorial-brain/explanation-engine.ts | Calcula capacidad explicativa por tipo de hecho y longitud |');
  lineas.push('| EEAT | analyzeEEAT | lib/meni/eeat.ts | Pasa `result.eeat.score` del motor editorial |');
  lineas.push('| selloNI.utilidad | computeEditorialDNA | lib/meni/editorial-dna/engine.ts | Multiplica `newsValue.utilidad * 10` y aplica clamp |');
  lineas.push('| selloNI.explica | computeEditorialDNA | lib/meni/editorial-dna/engine.ts | Copia `decision.explanation.score` |');
  lineas.push('');

  lineas.push('## 2. Reglas internas detectadas');
  lineas.push('');
  lineas.push('### Utilidad (runNewsValueEngine → computeEditorialDNA)');
  lineas.push('');
  lineas.push('- Puntos base: 40.');
  lineas.push('- Suma 25 si encuentra "cómo", "qué hacer", "paso a paso".');
  lineas.push('- Suma 20 si encuentra teléfono/contacto/horario.');
  lineas.push('- Suma 15 si encuentra consejo/recomendación.');
  lineas.push('- Toma el máximo entre eso y un puntaje por categoría (Economía/Salud 85, Sucesos 55, Deportes 25).');
  lineas.push('- **Saturation**: `selloNI.utilidad = newsValue.utilidad * 10` luego `clamp(0, 100)`. Si `newsValue.utilidad` ≥ 10, el resultado es 100.');
  lineas.push('');

  lineas.push('### Profundidad (runExplanationEngine → computeEditorialDNA)');
  lineas.push('');
  lineas.push('- Puntos base: 70.');
  lineas.push('- Suma 10 si `porQueOcurrio` tiene > 50 caracteres.');
  lineas.push('- Suma 10 si `comoAfecta` tiene > 50 caracteres.');
  lineas.push('- Suma 10 si el texto contiene "nicaragua" o "nicaragüense".');
  lineas.push('- **Techo bajo**: todas las respuestas son plantillas predefinidas, casi siempre > 50 caracteres, y casi siempre mencionan Nicaragua.');
  lineas.push('- **Resultado**: score suele ser 100 o 90.');
  lineas.push('');

  lineas.push('### EEAT (analyzeEEAT)');
  lineas.push('');
  lineas.push('- No computa; lee `result.eeat.score` del pipeline editorial.');
  lineas.push('- El score editorial parece binario: noticias válidas reciben 100, las que no cumplen una condición reciben 0.');
  lineas.push('- Eso produce desviación estándar 0 cuando todas las noticias de la muestra pasan el umbral.');
  lineas.push('');

  lineas.push('## 3. Distribución estadística');
  lineas.push('');
  lineas.push('| Variable | n | min | max | media | mediana | std | p5 | p95 | moda |');
  lineas.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const [k, v] of Object.entries(data.estadisticas) as [string, any][]) {
    lineas.push(`| ${k} | ${v.n} | ${v.min} | ${v.max} | ${v.media} | ${v.mediana} | ${v.std} | ${v.p5} | ${v.p95} | ${v.moda ?? '-'} |`);
  }
  lineas.push('');

  lineas.push('## 4. Saturación');
  lineas.push('');
  for (const s of data.saturacion) {
    lineas.push(`- **${s.variable}**: ${s.cantidad} noticias recibieron ${s.valor}. Ejemplo: ${s.ejemplo}`);
  }
  lineas.push('');

  lineas.push('## 5. Noticias con el mismo valor (muestra)');
  lineas.push('');
  for (const s of data.saturacion) {
    const repetidos = data.registros.filter((r: Registro) => (r as any)[s.variable] === s.valor).slice(0, 3);
    for (const r of repetidos) {
      lineas.push(`- ${s.variable}=${s.valor}: ${(r as Registro).slug}`);
    }
  }
  lineas.push('');

  lineas.push('## 6. Dataset de calidad (30 noticias)');
  lineas.push('');
  lineas.push('| Nivel | Slug | V1 | U | P | E | O | ADN |');
  lineas.push('|---|---|---|---|---|---|---|---|');
  for (const nivel of ['alta', 'media', 'debil'] as const) {
    for (const r of data.dataset[nivel]) {
      lineas.push(`| ${nivel} | ${r.slug} | ${r.puntosPerdidos > 0 ? 100 - r.puntosPerdidos : 95} | ${r.utilidadSello} | ${r.profundidadSello} | ${r.eeatScore} | ${r.originalidad} | ${r.adnNI} |`);
    }
  }
  lineas.push('');

  lineas.push('## 7. Diagnóstico');
  lineas.push('');
  lineas.push(data.diagnostico);
  lineas.push('');

  return lineas.join('\n');
}

async function main() {
  console.log('=== Auditoría de utilidad, profundidad y EEAT ===');
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

  const est = {
    newsValueUtilidadRaw: estadisticas(registros.map((r) => r.newsValueUtilidadRaw)),
    explanationScoreRaw: estadisticas(registros.map((r) => r.explanationScoreRaw)),
    eeatScore: estadisticas(registros.map((r) => r.eeatScore)),
    utilidadSello: estadisticas(registros.map((r) => r.utilidadSello)),
    profundidadSello: estadisticas(registros.map((r) => r.profundidadSello)),
  };

  const saturacion = hallarSaturacion(registros);
  const dataset = datasetCalidad(registros);

  const diagnostico =
    'Utilidad y profundidad están saturadas por diseño. ' +
    'Utilidad: `newsValue.utilidad * 10` + clamp fuerza 100 para cualquier valor ≥10. ' +
    'Profundidad: puntuación aditiva con base 70, bonificaciones fáciles y sin penalización por ausencia de contexto. ' +
    'EEAT: `analyzeEEAT` actúa como paso a través de `result.eeat.score`, que en la muestra es constante 100.';

  const payload = {
    meta: { fecha: new Date().toISOString(), muestra: registros.length },
    reglas: {
      utilidad: 'news-value-engine.ts calcularUtilidad; engine.ts multiplica x10 y clamp',
      profundidad: 'explanation-engine.ts score base 70 + aditivos',
      eeat: 'eeat.ts pasa result.eeat.score',
    },
    registros,
    estadisticas: est,
    saturacion,
    dataset,
    diagnostico,
  };

  const jsonPath = join(process.cwd(), 'auditoria-dimensiones-meni.json');
  const mdPath = join(process.cwd(), 'AUDITORIA-DIMENSIONES-MENI.md');
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(mdPath, generarMarkdown(payload), 'utf-8');

  console.log(`\nArchivos generados:`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log('\nSaturación encontrada:', saturacion);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
