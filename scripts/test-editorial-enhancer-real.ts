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
  const { editorialEnhancerAction } = await import('../lib/editorial/editorialEnhancerAction');
  const { BASEL_POR_CATEGORIA, GENERICOS, normalizarTexto } = await import('../lib/editorial/enhancer/editorialEnhancer');
  const db = getAdminDb();

  const diag = JSON.parse(await fs.readFile(join(process.cwd(), 'DIAGNOSTICO-RANKING-227.json'), 'utf-8'));
  const ranking: DiagnosticoItem[] = diag.ranking;

  const sorted = [...ranking].sort((a, b) => b.scoreMeni - a.scoreMeni);
  const alto = seleccionarDiversos(sorted.filter((d) => d.scoreMeni >= 90), 5);
  const medio = seleccionarDiversos(sorted.filter((d) => d.scoreMeni >= 80 && d.scoreMeni < 90), 10);
  const bajo = seleccionarDiversos(sorted.filter((d) => d.scoreMeni < 80), 5);

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
      console.warn(`[${i + 1}/20] No se encontró en Firestore: ${info.slug}`);
      continue;
    }

    const fechaValor = data.fecha?.toDate ? data.fecha.toDate().toISOString() : new Date().toISOString();
    const input = {
      slug: data.slug || info.slug,
      titulo: data.titulo,
      contenido: data.contenido || '',
      resumen: data.resumen || '',
      categoria: data.categoria,
      autor: data.autor || '',
      fecha: fechaValor,
    };

    console.log(`[${i + 1}/20] MENI: ${info.slug}`);
    const meniResult = await runMeniAsync(input);

    const action = editorialEnhancerAction({
      noticiaOriginal: {
        titulo: data.titulo,
        resumen: data.resumen || '',
        contenido: data.contenido || '',
        categoria: data.categoria,
      },
      meniResult,
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

    const textoNormal = normalizarTexto(data.contenido || '');
    let seccionesConDatos = 0;
    let seccionesSinDatos = 0;
    for (const s of action.seccionesRecomendadas) {
      const check = porSeccion.get(s);
      if (check && check.keywords.some((k: string) => textoNormal.includes(k))) seccionesConDatos++;
      else seccionesSinDatos++;
    }

    const mejoraSoloEstructura = action.seccionesRecomendadas.length > 0 && seccionesConDatos > seccionesSinDatos;
    const requiereInvestigacion = action.datosFaltantes.length > 0 || seccionesSinDatos > 0;

    casos.push({
      slug: info.slug,
      titulo: data.titulo,
      categoria: data.categoria,
      scoreMeni: meniResult.scoreFinal,
      action,
      seccionesConDatos,
      seccionesSinDatos,
      mejoraSoloEstructura,
      requiereInvestigacion,
      prioridad: action.prioridad,
    });
  }

  const total = casos.length;
  const soloEstructura = casos.filter((c) => c.mejoraSoloEstructura && !c.requiereInvestigacion).length;
  const conEstructuraEInvestigacion = casos.filter((c) => c.mejoraSoloEstructura && c.requiereInvestigacion).length;
  const soloInvestigacion = casos.filter((c) => !c.mejoraSoloEstructura && c.requiereInvestigacion).length;
  const listas = casos.filter((c) => c.action.seccionesRecomendadas.length === 0).length;

  const datosFrecuencia: Record<string, number> = {};
  for (const c of casos) {
    for (const d of c.action.datosFaltantes) {
      const clave = d.replace(/^Falta conseguir: /, '');
      datosFrecuencia[clave] = (datosFrecuencia[clave] || 0) + 1;
    }
  }
  const datosTop = Object.entries(datosFrecuencia).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const seccionFrecuencia: Record<string, number> = {};
  const categoriaFrecuencia: Record<string, number> = {};
  for (const c of casos) {
    categoriaFrecuencia[c.categoria] = (categoriaFrecuencia[c.categoria] || 0) + 1;
    for (const s of c.action.seccionesRecomendadas) {
      seccionFrecuencia[s] = (seccionFrecuencia[s] || 0) + 1;
    }
  }
  const seccionTop = Object.entries(seccionFrecuencia).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const oportunidadCategorias = Object.entries(categoriaFrecuencia)
    .map(([cat, n]) => ({ cat, n, secciones: Object.entries(seccionFrecuencia).filter(([s]) => casos.some((c) => c.categoria === cat && c.action.seccionesRecomendadas.includes(s))).length }))
    .sort((a, b) => b.secciones - a.secciones);

  const potencialesGoogle = casos
    .filter((c) => c.scoreMeni >= 80 && c.action.seccionesRecomendadas.length <= 4)
    .sort((a, b) => b.scoreMeni - a.scoreMeni)
    .slice(0, 5);

  const md: string[] = [];
  md.push('# PRUEBA EDITORIAL ENHANCER — 20 NOTICIAS REALES');
  md.push('');
  md.push('## Metodología');
  md.push('');
  md.push('1. Se seleccionaron 20 noticias reales de Firebase: 5 de MENI alto, 10 de MENI medio y 5 de MENI bajo.');
  md.push('2. Se ejecutó `runMeniAsync` para obtener el diagnóstico técnico.');
  md.push('3. Se aplicó `editorialEnhancerAction` para generar un asistente editorial práctico.');
  md.push('4. Se clasificó cada noticia según si mejora solo con estructura o requiere investigación periodística.');
  md.push('5. No se inventaron datos. No se evaluó por cantidad de palabras.');
  md.push('');

  md.push('## Distribución de la muestra');
  md.push('');
  md.push(`- Total: ${total}`);
  md.push(`- Alto: ${alto.length} | Medio: ${medio.length} | Bajo: ${bajo.length}`);
  md.push(`- Categorías: ${Object.keys(categoriaFrecuencia).join(', ')}`);
  md.push('');

  md.push('## Pregunta 1 — ¿Qué porcentaje mejora solo con estructura?');
  md.push('');
  md.push(`- ${((soloEstructura / total) * 100).toFixed(1)}% mejora solo con estructura (${soloEstructura} de ${total}).`);
  md.push(`- ${((conEstructuraEInvestigacion / total) * 100).toFixed(1)}% necesita estructura e investigación (${conEstructuraEInvestigacion} de ${total}).`);
  md.push(`- ${((listas / total) * 100).toFixed(1)}% está lista sin cirugía (${listas} de ${total}).`);
  md.push('');

  md.push('## Pregunta 2 — ¿Qué porcentaje requiere investigación real?');
  md.push('');
  md.push(`- ${(((conEstructuraEInvestigacion + soloInvestigacion) / total) * 100).toFixed(1)}% requiere investigación periodística adicional (${conEstructuraEInvestigacion + soloInvestigacion} de ${total}).`);
  md.push(`- ${((soloInvestigacion / total) * 100).toFixed(1)}% requiere solo investigación, sin estructura suficiente (${soloInvestigacion} de ${total}).`);
  md.push('');

  md.push('## Pregunta 3 — ¿Qué faltantes aparecen más?');
  md.push('');
  for (const [dato, n] of datosTop) {
    md.push(`- ${dato}: ${n} noticias`);
  }
  md.push('');

  md.push('## Pregunta 4 — ¿Qué categorías tienen más oportunidad?');
  md.push('');
  md.push('| Categoría | Noticias | Oportunidades de estructura |');
  md.push('| ---- | ---- | ---- |');
  for (const o of oportunidadCategorias) {
    md.push(`| ${o.cat} | ${o.n} | ${o.secciones} |`);
  }
  md.push('');

  md.push('## Pregunta 5 — ¿Cuáles tienen potencial para Google?');
  md.push('');
  md.push('Criterio: score MENI >= 80 y pocas secciones pendientes (<= 4).');
  md.push('');
  for (const c of potencialesGoogle) {
    md.push(`- **${c.slug}** — score ${c.scoreMeni}, categoría ${c.categoria}, prioridad ${c.prioridad}.`);
  }
  md.push('');

  md.push('## Secciones recomendadas más frecuentes');
  md.push('');
  for (const [s, n] of seccionTop) {
    md.push(`- ${s}: ${n} noticias`);
  }
  md.push('');

  md.push('## Ejemplos de asistencia editorial');
  md.push('');
  for (let i = 0; i < Math.min(3, casos.length); i++) {
    const c = casos[i];
    md.push(`### Caso ${i + 1}: ${c.slug}`);
    md.push('');
    md.push(`- **Categoría:** ${c.categoria}`);
    md.push(`- **Score MENI:** ${c.scoreMeni}`);
    md.push(`- **Diagnóstico:** ${c.action.diagnosticoValor}`);
    md.push(`- **Prioridad:** ${c.action.prioridad}`);
    md.push('');
    md.push('**Acciones editoriales:**');
    for (const a of c.action.accionesEditor) md.push(`- ${a}`);
    md.push('');
    md.push('**Mejora de lead:**');
    md.push('```text');
    md.push(c.action.ejemploMejoraLead);
    md.push('```');
    md.push('');
    md.push('**Mejora de estructura:**');
    md.push('```html');
    md.push(c.action.ejemploMejoraEstructura);
    md.push('```');
    md.push('');
  }
  md.push('');

  md.push('## Conclusión');
  md.push('');
  md.push('`editorialEnhancerAction` no escribe noticias largas. Detecta qué preguntas no responde el texto y propone una estructura para que el periodista complete con información verificable. La mejora real depende de investigación, no de palabras vacías.');
  md.push('');

  await fs.writeFile(join(process.cwd(), 'PRUEBA-EDITORIAL-ENHANCER-20.md'), md.join('\n'), 'utf-8');
  console.log('Prueba guardada: PRUEBA-EDITORIAL-ENHANCER-20.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
