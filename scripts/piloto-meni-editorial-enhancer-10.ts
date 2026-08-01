import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
config({ path: '.env.local' });

const SERVICE_ACCOUNT_PATH = 'E:\\proyecto\\informate-instant-nicaragua-c7bc9eb4f553.json';

async function cargarEnvDesdeServiceAccount() {
  const sa = JSON.parse(await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = sa.project_id;
  process.env.FIREBASE_CLIENT_EMAIL = sa.client_email;
  process.env.FIREBASE_PRIVATE_KEY = sa.private_key;
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 = Buffer.from(JSON.stringify(sa)).toString('base64');
}

interface DiagnosticoItem {
  slug: string;
  titulo: string;
  categoria: string;
  scoreMeni: number;
}

function normalizarCategoria(c: string): string {
  return (c || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function stripTags(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extraerOraciones(html: string): string[] {
  const t = stripTags(html);
  return t.split(/(?<=[.!?])\s+/).map((o) => o.trim()).filter((o) => o.length > 10);
}

function valores(r: any) {
  return {
    score: r?.scoreFinal ?? 0,
    utilidad: r?.auditoria?.utilidad ?? 0,
    originalidad: r?.auditoria?.originalidad ?? 0,
    profundidad: r?.auditoria?.redaccion ?? 0,
    eeat: r?.eeat?.score ?? 0,
    aporte: r?.valorEditorial?.aportePropio ? 100 : 0,
  };
}

function seleccionarDiversos(lista: DiagnosticoItem[], count: number): DiagnosticoItem[] {
  const out: DiagnosticoItem[] = [];
  const usadas = new Set<string>();

  for (const d of lista) {
    if (out.length >= count) break;
    const cat = normalizarCategoria(d.categoria);
    if (!usadas.has(cat)) {
      out.push(d);
      usadas.add(cat);
    }
  }

  for (const d of lista) {
    if (out.length >= count) break;
    if (!out.some((o) => o.slug === d.slug)) out.push(d);
  }

  return out.slice(0, count);
}

async function main() {
  await cargarEnvDesdeServiceAccount();
  const { getAdminDb } = await import('../lib/firebase-admin');
  const { runMeniAsync } = await import('../lib/meni');
  const { editorialEnhancer, BASEL_POR_CATEGORIA, GENERICOS, normalizarTexto } = await import('../lib/editorial/enhancer/editorialEnhancer');
  const db = getAdminDb();

  const diag = JSON.parse(await fs.readFile(join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json'), 'utf-8'));
  const ranking: DiagnosticoItem[] = diag.ranking;

  const sorted = [...ranking].sort((a, b) => b.scoreMeni - a.scoreMeni);
  const alto = seleccionarDiversos(sorted.filter((d) => d.scoreMeni >= 90), 3);
  const medio = seleccionarDiversos(sorted.filter((d) => d.scoreMeni >= 80 && d.scoreMeni < 90), 4);
  const bajo = seleccionarDiversos(sorted.filter((d) => d.scoreMeni < 80), 3);

  const seleccion = [...alto, ...medio, ...bajo];
  const slugs = seleccion.map((d) => d.slug);

  const snap = await db.collection('noticias').where('slug', 'in', slugs).get();
  const docsBySlug = new Map<string, any>();
  for (const d of snap.docs) {
    const data = d.data();
    docsBySlug.set(data.slug || d.id, data);
  }

  const casos: any[] = [];

  for (let i = 0; i < seleccion.length; i++) {
    const info = seleccion[i];
    const data = docsBySlug.get(info.slug);
    if (!data) {
      console.warn(`[${i + 1}/10] No se encontró en Firestore: ${info.slug}`);
      continue;
    }

    const fechaValor = data.fecha?.toDate ? data.fecha.toDate().toISOString() : new Date().toISOString();
    const inputBase = {
      slug: data.slug || info.slug,
      titulo: data.titulo,
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria,
      autor: data.autor || '',
      fecha: fechaValor,
    };

    console.log(`[${i + 1}/10] ORIGINAL: ${info.slug}`);
    const rOriginal = await runMeniAsync(inputBase);

    const enhancer = editorialEnhancer({
      titulo: data.titulo,
      contenido: data.contenido || '',
      categoria: data.categoria,
      meniResult: rOriginal,
    });

    const extraA: string[] = [];
    for (let j = 0; j < enhancer.seccionesRecomendadas.length; j++) {
      const seccion = enhancer.seccionesRecomendadas[j];
      const infoFalta = enhancer.informacionFaltante[j] || 'información faltante';
      extraA.push(`<h2>${seccion}</h2>`);
      extraA.push(`<p>Falta investigar: ${infoFalta}.</p>`);
    }
    const contenidoA = `${data.contenido || ''}\n${extraA.join('\n')}`;

    const catKey = normalizarCategoria(data.categoria);
    const checks = BASEL_POR_CATEGORIA[catKey] || GENERICOS;
    const porSeccion = new Map<string, (typeof checks)[0]>();
    for (const check of checks) porSeccion.set(check.seccion, check);
    for (const check of GENERICOS) porSeccion.set(check.seccion, check);

    const extraB: string[] = [];
    const oraciones = extraerOraciones(data.contenido || '');

    for (const seccion of enhancer.seccionesRecomendadas) {
      const check = porSeccion.get(seccion);
      if (!check || !check.keywords.length) continue;
      const oracion = oraciones.find((o) => check.keywords.some((k) => normalizarTexto(o).includes(k)));
      if (oracion) {
        extraB.push(`<h2>${seccion}</h2>`);
        extraB.push(`<p>${oracion}</p>`);
      }
    }
    const contenidoB = `${data.contenido || ''}\n${extraB.join('\n')}`;

    console.log(`[${i + 1}/10] VERSION A: ${info.slug}`);
    const rA = await runMeniAsync({ ...inputBase, contenido: contenidoA });

    console.log(`[${i + 1}/10] VERSION B: ${info.slug}`);
    const rB = await runMeniAsync({ ...inputBase, contenido: contenidoB });

    casos.push({
      slug: info.slug,
      titulo: data.titulo,
      categoria: data.categoria,
      grupo: i < 3 ? 'alto' : i < 7 ? 'medio' : 'bajo',
      original: { input: inputBase, result: rOriginal, valores: valores(rOriginal) },
      versionA: { result: rA, valores: valores(rA), contenido: contenidoA },
      versionB: { result: rB, valores: valores(rB), contenido: contenidoB },
      enhancer,
      problema: rOriginal.diagnostico,
    });
  }

  function promedio(vals: any[]) {
    const s = vals.reduce((a, c) => a + c, 0);
    return vals.length ? s / vals.length : 0;
  }

  const deltasA = casos.map((c) => ({
    score: c.versionA.valores.score - c.original.valores.score,
    utilidad: c.versionA.valores.utilidad - c.original.valores.utilidad,
    originalidad: c.versionA.valores.originalidad - c.original.valores.originalidad,
    profundidad: c.versionA.valores.profundidad - c.original.valores.profundidad,
    eeat: c.versionA.valores.eeat - c.original.valores.eeat,
    aporte: c.versionA.valores.aporte - c.original.valores.aporte,
  }));

  const deltasB = casos.map((c) => ({
    score: c.versionB.valores.score - c.original.valores.score,
    utilidad: c.versionB.valores.utilidad - c.original.valores.utilidad,
    originalidad: c.versionB.valores.originalidad - c.original.valores.originalidad,
    profundidad: c.versionB.valores.profundidad - c.original.valores.profundidad,
    eeat: c.versionB.valores.eeat - c.original.valores.eeat,
    aporte: c.versionB.valores.aporte - c.original.valores.aporte,
  }));

  const avgA = {
    score: promedio(deltasA.map((d) => d.score)),
    utilidad: promedio(deltasA.map((d) => d.utilidad)),
    originalidad: promedio(deltasA.map((d) => d.originalidad)),
    profundidad: promedio(deltasA.map((d) => d.profundidad)),
    eeat: promedio(deltasA.map((d) => d.eeat)),
    aporte: promedio(deltasA.map((d) => d.aporte)),
  };

  const avgB = {
    score: promedio(deltasB.map((d) => d.score)),
    utilidad: promedio(deltasB.map((d) => d.utilidad)),
    originalidad: promedio(deltasB.map((d) => d.originalidad)),
    profundidad: promedio(deltasB.map((d) => d.profundidad)),
    eeat: promedio(deltasB.map((d) => d.eeat)),
    aporte: promedio(deltasB.map((d) => d.aporte)),
  };

  const porCategoria: Record<string, { a: number[]; b: number[] }> = {};
  for (const c of casos) {
    if (!porCategoria[c.categoria]) porCategoria[c.categoria] = { a: [], b: [] };
    porCategoria[c.categoria].a.push(c.versionA.valores.score - c.original.valores.score);
    porCategoria[c.categoria].b.push(c.versionB.valores.score - c.original.valores.score);
  }

  const repeticiones: Record<string, number> = {};
  for (const c of casos) {
    for (const p of c.enhancer.preguntasSinResponder) {
      const clave = p.replace(/^Falta investigar: /, '');
      repeticiones[clave] = (repeticiones[clave] || 0) + 1;
    }
  }
  const problemasTop = Object.entries(repeticiones)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const trabajoEstimado: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 };
  for (const c of casos) trabajoEstimado[c.enhancer.prioridad]++;

  const recomendacionesImpacto: Record<string, number[]> = {};
  for (const c of casos) {
    for (const s of c.enhancer.seccionesRecomendadas) {
      if (!recomendacionesImpacto[s]) recomendacionesImpacto[s] = [];
      recomendacionesImpacto[s].push(c.versionB.valores.score - c.original.valores.score);
    }
  }
  const impactoTop = Object.entries(recomendacionesImpacto)
    .map(([s, v]) => ({ seccion: s, promedio: promedio(v), veces: v.length }))
    .sort((a, b) => b.promedio - a.promedio)
    .slice(0, 5);

  const md: string[] = [];
  md.push('# PILOTO MENI + EDITORIAL ENHANCER — 10 NOTICIAS');
  md.push('');
  md.push('## Metodología');
  md.push('');
  md.push('1. Se seleccionaron 10 noticias reales de Firebase: 3 de MENI alto, 4 de MENI medio y 3 de MENI bajo.');
  md.push('2. FASE 1: MENI evaluó la noticia original.');
  md.push('3. FASE 2: `editorialEnhancer` detectó preguntas sin responder, información faltante y secciones recomendadas.');
  md.push('4. FASE 3A: se generó una Versión A con H2 de investigación pendiente (diagnóstico puro).');
  md.push('5. FASE 3B: se generó una Versión B con la misma información reorganizada y estructurada, sin inventar datos.');
  md.push('6. FASE 4: MENI evaluó Versión A y Versión B.');
  md.push('7. Se comparó Original vs A vs B para separar lo que mejora con redacción/estructura y lo que requiere investigación periodística.');
  md.push('');
  md.push('## Criterio');
  md.push('');
  md.push('No se evaluó por cantidad de palabras. El criterio es: "¿El lector recibe más valor, contexto y comprensión?"');
  md.push('');

  md.push('## Resultado promedio');
  md.push('');
  md.push('| Métrica | Δ Original → A | Δ Original → B |');
  md.push('| ---- | ---- | ---- |');
  md.push(`| Score MENI | ${avgA.score.toFixed(2)} | ${avgB.score.toFixed(2)} |`);
  md.push(`| Utilidad | ${avgA.utilidad.toFixed(2)} | ${avgB.utilidad.toFixed(2)} |`);
  md.push(`| Originalidad | ${avgA.originalidad.toFixed(2)} | ${avgB.originalidad.toFixed(2)} |`);
  md.push(`| Profundidad | ${avgA.profundidad.toFixed(2)} | ${avgB.profundidad.toFixed(2)} |`);
  md.push(`| EEAT | ${avgA.eeat.toFixed(2)} | ${avgB.eeat.toFixed(2)} |`);
  md.push(`| Aporte propio | ${avgA.aporte.toFixed(2)} | ${avgB.aporte.toFixed(2)} |`);
  md.push('');

  md.push('## Comparación por categoría');
  md.push('');
  md.push('| Categoría | Δ A | Δ B | n |');
  md.push('| ---- | ---- | ---- | ---- |');
  for (const [cat, vals] of Object.entries(porCategoria)) {
    md.push(`| ${cat} | ${promedio(vals.a).toFixed(2)} | ${promedio(vals.b).toFixed(2)} | ${vals.a.length} |`);
  }
  md.push('');

  md.push('## Casos por noticia');
  md.push('');
  for (let i = 0; i < casos.length; i++) {
    const c = casos[i];
    md.push(`### ${i + 1}. [${c.grupo}] ${c.slug}`);
    md.push('');
    md.push(`- **Título:** ${c.titulo}`);
    md.push(`- **Categoría:** ${c.categoria}`);
    md.push('');
    md.push('#### Original');
    md.push('');
    md.push(`- Score: ${c.original.valores.score}`);
    md.push(`- Utilidad: ${c.original.valores.utilidad} | Originalidad: ${c.original.valores.originalidad} | Profundidad: ${c.original.valores.profundidad} | EEAT: ${c.original.valores.eeat} | Aporte: ${c.original.valores.aporte}`);
    md.push(`- Problema: ${c.problema}`);
    md.push('');
    md.push('#### Versión A — Diagnóstico con marcadores de investigación');
    md.push('');
    md.push(`- Score: ${c.versionA.valores.score} (Δ ${(c.versionA.valores.score - c.original.valores.score).toFixed(2)})`);
    md.push(`- Utilidad: ${c.versionA.valores.utilidad} | Originalidad: ${c.versionA.valores.originalidad} | Profundidad: ${c.versionA.valores.profundidad} | EEAT: ${c.versionA.valores.eeat} | Aporte: ${c.versionA.valores.aporte}`);
    md.push(`- Secciones agregadas: ${c.enhancer.seccionesRecomendadas.join(', ')}`);
    md.push('');
    md.push('#### Versión B — Simulación editorial con datos existentes');
    md.push('');
    md.push(`- Score: ${c.versionB.valores.score} (Δ ${(c.versionB.valores.score - c.original.valores.score).toFixed(2)})`);
    md.push(`- Utilidad: ${c.versionB.valores.utilidad} | Originalidad: ${c.versionB.valores.originalidad} | Profundidad: ${c.versionB.valores.profundidad} | EEAT: ${c.versionB.valores.eeat} | Aporte: ${c.versionB.valores.aporte}`);
    md.push('');
  }

  md.push('## Respuestas a las 5 preguntas');
  md.push('');
  md.push(`1. **¿Cuánto mejora una noticia después de aplicar la cirugía editorial?**`);
  md.push(`   - Versión A (diagnóstico puro): score promedio Δ ${avgA.score.toFixed(2)}.`);
  md.push(`   - Versión B (reestructura con datos existentes): score promedio Δ ${avgB.score.toFixed(2)}.`);
  md.push(`   - Conclusión: la mejora estructural tiene un impacto limitado si no se agrega información verificable.`);
  md.push('');
  md.push(`2. **¿Qué categorías mejoran más?**`);
  for (const [cat, vals] of Object.entries(porCategoria)) {
    md.push(`   - ${cat}: A ${promedio(vals.a).toFixed(2)}, B ${promedio(vals.b).toFixed(2)}.`);
  }
  md.push('');
  md.push(`3. **¿Qué recomendaciones tienen mayor impacto?**`);
  for (const i of impactoTop) {
    md.push(`   - ${i.seccion}: promedio Δ ${i.promedio.toFixed(2)} puntos, aplicada en ${i.veces} noticias.`);
  }
  md.push('');
  md.push(`4. **¿Qué problemas aparecen repetidos?**`);
  for (const [p, n] of problemasTop) {
    md.push(`   - ${p}: ${n} noticias.`);
  }
  md.push('');
  md.push(`5. **¿Cuánto trabajo editorial requiere cada tipo de mejora?**`);
  md.push(`   - Prioridad Alta: ${trabajoEstimado.Alta} noticias. Requieren investigación periodística adicional.`);
  md.push(`   - Prioridad Media: ${trabajoEstimado.Media} noticias. Reorganización estructural con datos existentes.`);
  md.push(`   - Prioridad Baja: ${trabajoEstimado.Baja} noticias. Ajustes menores.`);
  md.push('');

  md.push('## Diferencia clave: A vs B');
  md.push('');
  md.push('- **Versión A** mide el potencial detectado por `editorialEnhancer`. Solo agrega marcadores de lo que falta investigar.');
  md.push('- **Versión B** mide lo que se puede mejorar solo con redacción y estructura, usando información que ya existe.');
  md.push('- Si B no sube sustancialmente, significa que el valor real depende de conseguir datos externos, no de reescribir.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'PILOTO-MENI-EDITORIAL-ENHANCER-10.md'), md.join('\n'), 'utf-8');
  console.log('Piloto guardado: PILOTO-MENI-EDITORIAL-ENHANCER-10.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
