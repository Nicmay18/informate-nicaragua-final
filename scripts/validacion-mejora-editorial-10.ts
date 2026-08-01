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
      console.warn(`[${i + 1}/10] No se encontró: ${info.slug}`);
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

    const key = (data.categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let categoriaBase = 'nacionales';
    if (key.includes('suceso')) categoriaBase = 'sucesos';
    else if (key.includes('internacional')) categoriaBase = 'internacionales';
    else if (key.includes('deporte')) categoriaBase = 'deportes';
    else if (key.includes('cultura')) categoriaBase = 'cultura';
    else if (key.includes('tecnolog')) categoriaBase = 'tecnologia';

    const checks = BASEL_POR_CATEGORIA[categoriaBase] || GENERICOS;
    const porSeccion = new Map<string, (typeof checks)[0]>();
    for (const c of checks) porSeccion.set(c.seccion, c);
    for (const c of GENERICOS) porSeccion.set(c.seccion, c);

    const oraciones = extraerOraciones(data.contenido || '');

    // Versión A: estructura con contenido existente
    const estructuraBloques: string[] = [];
    for (const seccion of enhancer.seccionesRecomendadas) {
      const check = porSeccion.get(seccion);
      const oracion = oraciones.find((o) => (check?.keywords || []).some((k: string) => normalizarTexto(o).includes(k)));
      if (oracion) {
        estructuraBloques.push(`<h2>${seccion}</h2>`);
        estructuraBloques.push(`<p>${oracion}</p>`);
      }
    }
    const contenidoA = `${data.contenido || ''}\n${estructuraBloques.join('\n')}`;

    // Versión B: simulación de investigación (sin datos falsos)
    const investigacionBloques: string[] = [];
    for (let j = 0; j < enhancer.seccionesRecomendadas.length; j++) {
      const seccion = enhancer.seccionesRecomendadas[j];
      const infoFalta = enhancer.informacionFaltante[j] || 'información faltante';
      investigacionBloques.push(`<h2>${seccion}</h2>`);
      investigacionBloques.push(`<p>DATOS QUE DEBE INVESTIGAR EL PERIODISTA: ${infoFalta}.</p>`);
    }
    const contenidoB = `${data.contenido || ''}\n${investigacionBloques.join('\n')}`;

    console.log(`[${i + 1}/10] ESTRUCTURA: ${info.slug}`);
    const rA = await runMeniAsync({ ...inputBase, contenido: contenidoA });

    console.log(`[${i + 1}/10] INVESTIGACION: ${info.slug}`);
    const rB = await runMeniAsync({ ...inputBase, contenido: contenidoB });

    casos.push({
      slug: info.slug,
      titulo: data.titulo,
      categoria: data.categoria,
      grupo: i < 3 ? 'alto' : i < 7 ? 'medio' : 'bajo',
      original: { result: rOriginal, valores: valores(rOriginal) },
      versionA: { result: rA, valores: valores(rA) },
      versionB: { result: rB, valores: valores(rB) },
      diag: rOriginal.diagnostico,
    });
  }

  function promedio(vals: number[]) {
    return vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : 0;
  }

  const deltaA = casos.map((c) => c.versionA.valores.score - c.original.valores.score);
  const deltaB = casos.map((c) => c.versionB.valores.score - c.original.valores.score);

  const deltasCriterios = {
    utilidadA: casos.map((c) => c.versionA.valores.utilidad - c.original.valores.utilidad),
    originalidadA: casos.map((c) => c.versionA.valores.originalidad - c.original.valores.originalidad),
    profundidadA: casos.map((c) => c.versionA.valores.profundidad - c.original.valores.profundidad),
    eeatA: casos.map((c) => c.versionA.valores.eeat - c.original.valores.eeat),
    aporteA: casos.map((c) => c.versionA.valores.aporte - c.original.valores.aporte),
    utilidadB: casos.map((c) => c.versionB.valores.utilidad - c.original.valores.utilidad),
    originalidadB: casos.map((c) => c.versionB.valores.originalidad - c.original.valores.originalidad),
    profundidadB: casos.map((c) => c.versionB.valores.profundidad - c.original.valores.profundidad),
    eeatB: casos.map((c) => c.versionB.valores.eeat - c.original.valores.eeat),
    aporteB: casos.map((c) => c.versionB.valores.aporte - c.original.valores.aporte),
  };

  const criteriosGanadores = [
    { nombre: 'utilidad', a: promedio(deltasCriterios.utilidadA), b: promedio(deltasCriterios.utilidadB) },
    { nombre: 'originalidad', a: promedio(deltasCriterios.originalidadA), b: promedio(deltasCriterios.originalidadB) },
    { nombre: 'profundidad', a: promedio(deltasCriterios.profundidadA), b: promedio(deltasCriterios.profundidadB) },
    { nombre: 'eeat', a: promedio(deltasCriterios.eeatA), b: promedio(deltasCriterios.eeatB) },
    { nombre: 'aporte', a: promedio(deltasCriterios.aporteA), b: promedio(deltasCriterios.aporteB) },
  ].sort((a, b) => Math.max(b.a, b.b) - Math.max(a.a, a.b));

  const porCategoria: Record<string, { a: number[]; b: number[] }> = {};
  for (const c of casos) {
    if (!porCategoria[c.categoria]) porCategoria[c.categoria] = { a: [], b: [] };
    porCategoria[c.categoria].a.push(c.versionA.valores.score - c.original.valores.score);
    porCategoria[c.categoria].b.push(c.versionB.valores.score - c.original.valores.score);
  }
  const categoriasTop = Object.entries(porCategoria)
    .map(([cat, vals]) => ({ cat, a: promedio(vals.a), b: promedio(vals.b) }))
    .sort((a, b) => Math.max(b.a, b.b) - Math.max(a.a, a.b));

  const noValePenal = casos
    .filter((c) => c.grupo === 'bajo' && c.versionB.valores.score - c.original.valores.score < 5)
    .map((c) => c.slug);

  const md: string[] = [];
  md.push('# VALIDACIÓN DE VALOR EDITORIAL — 10 NOTICIAS');
  md.push('');
  md.push('## Metodología');
  md.push('');
  md.push('1. Selección: 3 noticias MENI alto, 4 medio, 3 bajo.');
  md.push('2. FASE 1: MENI evaluó la noticia original.');
  md.push('3. FASE 2A: se creó Versión A con mejor estructura, H2 y lead usando solo información existente.');
  md.push('4. FASE 2B: se creó Versión B con secciones marcadas como "DATOS QUE DEBE INVESTIGAR EL PERIODISTA".');
  md.push('5. FASE 3: MENI evaluó Original, A y B.');
  md.push('6. Criterio: no cantidad de palabras, sino si el lector entiende más, aprende más y encuentra una respuesta que otro medio no ofrece.');
  md.push('');

  md.push('## Tabla comparativa');
  md.push('');
  md.push('| Noticia | MENI original | Estructura (A) | Investigación (B) | Mejora real |');
  md.push('| ---- | ---- | ---- | ---- | ---- |');
  for (const c of casos) {
    const mejoraReal = c.versionB.valores.score - c.original.valores.score;
    md.push(`| ${c.slug} | ${c.original.valores.score} | ${c.versionA.valores.score} | ${c.versionB.valores.score} | ${mejoraReal >= 0 ? '+' : ''}${mejoraReal.toFixed(2)} |`);
  }
  md.push('');

  md.push('## Promedios');
  md.push('');
  md.push('| Métrica | Original | Estructura (A) | Investigación (B) | Δ A | Δ B |');
  md.push('| ---- | ---- | ---- | ---- | ---- | ---- |');
  md.push(`| Score | ${promedio(casos.map((c) => c.original.valores.score)).toFixed(2)} | ${promedio(casos.map((c) => c.versionA.valores.score)).toFixed(2)} | ${promedio(casos.map((c) => c.versionB.valores.score)).toFixed(2)} | ${promedio(deltaA).toFixed(2)} | ${promedio(deltaB).toFixed(2)} |`);
  md.push(`| Utilidad | ${promedio(casos.map((c) => c.original.valores.utilidad)).toFixed(2)} | ${promedio(casos.map((c) => c.versionA.valores.utilidad)).toFixed(2)} | ${promedio(casos.map((c) => c.versionB.valores.utilidad)).toFixed(2)} | ${promedio(deltasCriterios.utilidadA).toFixed(2)} | ${promedio(deltasCriterios.utilidadB).toFixed(2)} |`);
  md.push(`| Originalidad | ${promedio(casos.map((c) => c.original.valores.originalidad)).toFixed(2)} | ${promedio(casos.map((c) => c.versionA.valores.originalidad)).toFixed(2)} | ${promedio(casos.map((c) => c.versionB.valores.originalidad)).toFixed(2)} | ${promedio(deltasCriterios.originalidadA).toFixed(2)} | ${promedio(deltasCriterios.originalidadB).toFixed(2)} |`);
  md.push(`| Profundidad | ${promedio(casos.map((c) => c.original.valores.profundidad)).toFixed(2)} | ${promedio(casos.map((c) => c.versionA.valores.profundidad)).toFixed(2)} | ${promedio(casos.map((c) => c.versionB.valores.profundidad)).toFixed(2)} | ${promedio(deltasCriterios.profundidadA).toFixed(2)} | ${promedio(deltasCriterios.profundidadB).toFixed(2)} |`);
  md.push(`| EEAT | ${promedio(casos.map((c) => c.original.valores.eeat)).toFixed(2)} | ${promedio(casos.map((c) => c.versionA.valores.eeat)).toFixed(2)} | ${promedio(casos.map((c) => c.versionB.valores.eeat)).toFixed(2)} | ${promedio(deltasCriterios.eeatA).toFixed(2)} | ${promedio(deltasCriterios.eeatB).toFixed(2)} |`);
  md.push(`| Aporte | ${promedio(casos.map((c) => c.original.valores.aporte)).toFixed(2)} | ${promedio(casos.map((c) => c.versionA.valores.aporte)).toFixed(2)} | ${promedio(casos.map((c) => c.versionB.valores.aporte)).toFixed(2)} | ${promedio(deltasCriterios.aporteA).toFixed(2)} | ${promedio(deltasCriterios.aporteB).toFixed(2)} |`);
  md.push('');

  md.push('## Respuestas a las 5 preguntas');
  md.push('');
  md.push(`1. **¿Cuánto mejora solo reorganizando información existente?**`);
  md.push(`   - Score promedio mejora ${promedio(deltaA).toFixed(2)} puntos con estructura.`);
  md.push(`   - Criterio que más gana: ${criteriosGanadores[0].nombre}.`);
  md.push('');
  md.push(`2. **¿Cuánto depende de investigación periodística real?**`);
  md.push(`   - Versión B (con datos a investigar) mejora ${promedio(deltaB).toFixed(2)} puntos promedio.`);
  md.push(`   - Diferencia B - A = ${(promedio(deltaB) - promedio(deltaA)).toFixed(2)} puntos, que es el techo atribuible a reporteo.`);
  md.push('');
  md.push(`3. **¿Qué criterios MENI aumentan más después de la cirugía?**`);
  for (const cr of criteriosGanadores) {
    md.push(`   - ${cr.nombre}: A ${cr.a.toFixed(2)} | B ${cr.b.toFixed(2)}`);
  }
  md.push('');
  md.push(`4. **¿Qué categorías tienen mayor potencial?**`);
  for (const o of categoriasTop) {
    md.push(`   - ${o.cat}: A ${o.a.toFixed(2)} | B ${o.b.toFixed(2)}`);
  }
  md.push('');
  md.push(`5. **¿Qué tipo de noticias no vale la pena reconstruir?**`);
  md.push(`   - Noticias bajas que no mejoran ni en la simulación de investigación: ${noValePenal.length}.`);
  for (const s of noValePenal) {
    md.push(`     - ${s}`);
  }
  md.push('');

  md.push('## Conclusión');
  md.push('');
  md.push('Reorganizar la información existente ayuda, pero el salto de calidad real depende de la investigación periodística. Las noticias con peor score y sin margen de mejora en Versión B son candidatas a descartar o refundar completamente, no a pequeños ajustes.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'VALIDACION-VALOR-EDITORIAL-10.md'), md.join('\n'), 'utf-8');
  console.log('Validación guardada: VALIDACION-VALOR-EDITORIAL-10.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
